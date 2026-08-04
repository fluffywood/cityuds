(function () {
  "use strict";

  const STORAGE_KEY = "MSDS-planner-selections-v1";
  const DAY_NAMES = { M: "周一", T: "周二", W: "周三", R: "周四", F: "周五", S: "周六", U: "周日" };
  let courseDataPromise;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function loadCourseData() {
    if (!courseDataPromise) {
      const getJson = (url) => fetch(url).then((response) => {
        if (!response.ok) throw new Error(`数据读取失败：${url}`);
        return response.json();
      });
      courseDataPromise = Promise.all([
        getJson("data/courses/index.json"),
        getJson("data/sources.json")
      ]).then(([index, sources]) => Promise.all([
        Promise.all(index.courses.map((course) => Promise.all([
          getJson(`data/sections/${encodeURIComponent(course.code)}.json`),
          getJson(`data/reviews/${encodeURIComponent(course.code)}.json`)
        ]).then(([eligibleSections, recommendation]) => ({
          ...course,
          eligible_sections: eligibleSections,
          recommendation
        })))),
        Promise.all(Object.keys(sources).map((sourceId) =>
          getJson(`data/source-reviews/${encodeURIComponent(sourceId)}.json`)
            .then((sourceReview) => [sourceId, sourceReview])
        ))
      ]).then(([courses, sourceReviewEntries]) => ({
        ...index,
        sources,
        sourceReviews: Object.fromEntries(sourceReviewEntries),
        courses
      })));
    }
    return courseDataPromise;
  }

  function getRecommendation(course) {
    return course?.recommendation || {
      level: "unknown",
      verdict: "暂无评价",
      summary: "本地资料没有足够信息，暂不作判断。",
      tags: [],
      source_ids: [],
      sourceIds: []
    };
  }

  function getStoredSelections() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveSelections(selections) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
  }

  function sectionKey(section) {
    return String(section.crn || `${section.section}-${section.day}-${section.time}`);
  }

  function pickTutorial(primary, tutorials) {
    if (!tutorials.length) return null;
    const suffix = primary?.section?.match(/(\d+)$/)?.[1];
    if (suffix) {
      const exact = tutorials.find((item) => item.section.endsWith(suffix));
      if (exact) return exact;
      const family = tutorials.find((item) => item.section.slice(1, 2) === primary.section.slice(1, 2));
      if (family) return family;
    }
    return tutorials[0];
  }

  function makeDefaultSelection(course) {
    const primaries = course.eligible_sections.filter((section) => Number(section.credits) > 0);
    const tutorials = course.eligible_sections.filter((section) => Number(section.credits) === 0);
    const primary = primaries[0] || course.eligible_sections[0];
    const tutorial = pickTutorial(primary, tutorials);
    return {
      primaryCrn: primary ? sectionKey(primary) : null,
      tutorialCrn: tutorial ? sectionKey(tutorial) : null
    };
  }

  function findSection(course, key) {
    return course.eligible_sections.find((section) => sectionKey(section) === String(key));
  }

  function formatSection(section) {
    if (!section) return "";
    return `${section.section} · ${DAY_NAMES[section.day] || section.day} ${section.time}`;
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function recommendationBadge(rec, small = false) {
    const className = small ? "mini-badge" : "verdict-badge";
    return `<span class="${className} ${escapeHtml(rec.level)}">${escapeHtml(rec.verdict)}</span>`;
  }

  window.MSDS = {
    DAY_NAMES,
    STORAGE_KEY,
    escapeHtml,
    findSection,
    formatSection,
    getRecommendation,
    getStoredSelections,
    loadCourseData,
    makeDefaultSelection,
    recommendationBadge,
    saveSelections,
    sectionKey,
    showToast
  };
})();
