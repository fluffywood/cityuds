(function () {
  "use strict";

  const LEGACY_STORAGE_KEY = "MSDS-planner-selections-v1";
  const STORAGE_KEY_PREFIX = "MSDS-planner-selections-v2";
  const ACTIVE_TERM_KEY = "MSDS-planner-active-term-v1";
  const ELIGIBILITY_CONFIRMATIONS_KEY = "MSDS-student-eligibility-confirmations-v1";
  const DEFAULT_TERM = "A";
  const TERM_CODES = ["A", "B", "S"];
  const TERM_FALLBACK_LABELS = { A: "Semester A", B: "Semester B", S: "Summer Term" };
  const PROJECT_MUTEX = { DSC6017: "DSC6032", DSC6032: "DSC6017" };
  const DATA_VERSION = "20260812c";
  const LEGACY_COURSE_CODE_PATTERN = /^SDSC(?=\d{4}$)/;
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
      const getJson = (url, optional = false) => {
        const requestUrl = `${url}${url.includes("?") ? "&" : "?"}v=${DATA_VERSION}`;
        return fetch(requestUrl).then((response) => {
          if (optional && response.status === 404) return null;
          if (!response.ok) throw new Error(`数据读取失败：${requestUrl}`);
          return response.json();
        });
      };
      courseDataPromise = Promise.all([
        getJson("data/courses/index.json"),
        getJson("data/sources.json")
      ]).then(([index, sources]) => Promise.all([
        Promise.all(index.courses.map((course) => Promise.all([
          getJson(`data/sections/${encodeURIComponent(course.code)}.json`),
          getJson(`data/reviews/${encodeURIComponent(course.code)}.json`, true)
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
        default_term: normalizeTerm(index.default_term) || DEFAULT_TERM,
        terms: normalizeTerms(index),
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

  function normalizeCourseCode(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(LEGACY_COURSE_CODE_PATTERN, "DSC");
  }

  function normalizeTerm(value) {
    const term = String(value || "").trim().toUpperCase();
    return TERM_CODES.includes(term) ? term : "";
  }

  function normalizeTerms(index) {
    const supplied = Array.isArray(index?.terms) ? index.terms : [];
    const byCode = new Map(supplied.map((term) => {
      const entry = typeof term === "string" ? { code: term } : term;
      return [normalizeTerm(entry?.code), entry];
    }));
    return TERM_CODES.map((code) => ({
      ...(byCode.get(code) || {}),
      code,
      label: byCode.get(code)?.label || TERM_FALLBACK_LABELS[code]
    }));
  }

  function getActiveTerm() {
    const urlTerm = normalizeTerm(new URLSearchParams(window.location.search).get("term"));
    if (urlTerm) return urlTerm;
    try {
      return normalizeTerm(localStorage.getItem(ACTIVE_TERM_KEY)) || DEFAULT_TERM;
    } catch {
      return DEFAULT_TERM;
    }
  }

  function setActiveTerm(term) {
    const normalized = normalizeTerm(term) || DEFAULT_TERM;
    try {
      localStorage.setItem(ACTIVE_TERM_KEY, normalized);
    } catch {
      // The selected term still works for this page when storage is unavailable.
    }
    return normalized;
  }

  function getTermLabel(data, term, includeYear = true) {
    const normalized = normalizeTerm(term) || DEFAULT_TERM;
    const label = data?.terms?.find((item) => item.code === normalized)?.label
      || TERM_FALLBACK_LABELS[normalized];
    const academicYear = data?.academic_year;
    return includeYear && academicYear && !label.includes(academicYear)
      ? `${label} · ${academicYear}`
      : label;
  }

  function courseOfferedInTerm(course, term) {
    const normalized = normalizeTerm(term) || DEFAULT_TERM;
    if (Array.isArray(course?.offered_terms)) {
      return course.offered_terms.some((item) => normalizeTerm(item) === normalized);
    }
    return normalized === DEFAULT_TERM && course?.offered_this_year !== false;
  }

  function isProjectCourse(course) {
    return course?.allow_without_section === true;
  }

  function allowsUnscheduledSelection(course, term) {
    const normalized = normalizeTerm(term || course?.active_term) || DEFAULT_TERM;
    return isProjectCourse(course)
      || (course?.allow_without_section_terms || []).some((item) => normalizeTerm(item) === normalized);
  }

  function makeUnscheduledSelection() {
    return { unscheduled: true };
  }

  function isUnscheduledSelection(selection) {
    return selection?.unscheduled === true;
  }

  function projectSelectionKey(courseOrCode) {
    const code = normalizeCourseCode(typeof courseOrCode === "string" ? courseOrCode : courseOrCode?.code);
    return code === "DSC6017" || code === "DSC6032" ? "INTERNSHIP_PROJECT" : code;
  }

  function projectConflictCodes(courseOrCode) {
    const code = normalizeCourseCode(typeof courseOrCode === "string" ? courseOrCode : courseOrCode?.code);
    return [...new Set([code, PROJECT_MUTEX[code]].filter(Boolean))];
  }

  function sectionsForTerm(course, term) {
    const normalized = normalizeTerm(term) || DEFAULT_TERM;
    return (course?.eligible_sections || []).filter((section) => {
      const sectionTerm = normalizeTerm(section.term);
      return sectionTerm ? sectionTerm === normalized : normalized === DEFAULT_TERM;
    });
  }

  function selectedCreditsInTerm(course, selection, term) {
    if (!courseOfferedInTerm(course, term)) return 0;
    if (allowsUnscheduledSelection(course, term)) {
      return isUnscheduledSelection(selection) ? Number(course.credits || 0) : 0;
    }
    const selectedKey = String(selection?.primaryCrn || "");
    const primary = sectionsForTerm(course, term).find((section) => (
      Number(section.credits) > 0 && sectionKey(section) === selectedKey
    ));
    return Number(primary?.credits || 0);
  }

  function getSelectionEligibility(data, course, selectionOverrides = {}) {
    const requirement = course?.selection_requirement;
    const audienceNote = String(course?.eligibility_note || "");
    if (!requirement) {
      return {
        audienceNote,
        confirmationKey: "",
        confirmationMet: true,
        minimumCreditsConfirmationKey: "",
        minimumCreditsConfirmationLabel: "",
        minimumCreditsConfirmationMet: true,
        minimumCreditsMet: true,
        eligible: true,
        hasRequirement: false,
        missingCourses: [],
        requiredCourses: [],
        requirementText: "",
        selectedCredits: 0,
        selectedRequiredCount: 0,
        statusText: "",
        termLabel: ""
      };
    }

    const terms = [...new Set((requirement.terms || []).map(normalizeTerm).filter(Boolean))];
    const minimumCredits = Math.max(0, Number(requirement.minimum_credits || 0));
    const requiredCourses = [...new Set((requirement.required_courses || []).map(normalizeCourseCode).filter(Boolean))];
    const confirmationKey = String(requirement.confirmation_key || "").trim();
    const confirmationMet = !confirmationKey || getEligibilityConfirmations()[confirmationKey] === true;
    const minimumCreditsConfirmationKey = String(requirement.minimum_credits_confirmation_key || "").trim();
    const minimumCreditsConfirmationLabel = String(
      requirement.minimum_credits_confirmation_label || `我已修满${minimumCredits}学分`
    ).trim();
    const minimumCreditsConfirmationMet = !minimumCreditsConfirmationKey
      || getEligibilityConfirmations()[minimumCreditsConfirmationKey] === true;
    const selectedCodes = new Set();
    let selectedCredits = 0;

    terms.forEach((term) => {
      const termSelections = Object.prototype.hasOwnProperty.call(selectionOverrides, term)
        ? normalizeSelections(selectionOverrides[term])
        : getStoredSelections(term);
      (data?.courses || []).forEach((candidate) => {
        const credits = selectedCreditsInTerm(candidate, termSelections[candidate.code], term);
        if (credits <= 0) return;
        if (selectedCodes.has(candidate.code)) return;
        selectedCredits += credits;
        selectedCodes.add(candidate.code);
      });
    });

    const missingCourses = requiredCourses.filter((code) => !selectedCodes.has(code));
    const termLabel = terms.length === 1 ? `${terms[0]} 学期` : `${terms.join("+")} 两学期`;
    const requiredCourseText = requiredCourses.length === 3
      && requiredCourses.every((code) => ["DSC5001", "DSC5002", "DSC5003"].includes(code))
      ? `包含三门必修（${requiredCourses.join("、")}）`
      : requiredCourses.length
        ? `${termLabel}需包含 ${requiredCourses.join("、")}`
        : "";
    const requirementText = [
      minimumCredits > 0
        ? minimumCreditsConfirmationKey
          ? `选课前修满${minimumCredits}学分`
          : `${termLabel}${terms.length > 1 ? "合计" : ""}至少 ${minimumCredits} 学分`
        : "",
      requiredCourseText
    ].filter(Boolean).join("，且");
    const minimumCreditsMet = minimumCredits <= 0 || (minimumCreditsConfirmationKey
      ? minimumCreditsConfirmationMet
      : selectedCredits >= minimumCredits);
    const unmetParts = [
      !confirmationMet ? "尚未确认学生身份" : "",
      !minimumCreditsMet
        ? minimumCreditsConfirmationKey
          ? `尚未确认已修满 ${minimumCredits} 学分`
          : `${termLabel}当前 ${selectedCredits}/${minimumCredits} 学分`
        : "",
      missingCourses.length ? `${termLabel}缺少 ${missingCourses.join("、")}` : ""
    ].filter(Boolean);
    const eligible = confirmationMet && minimumCreditsMet && missingCourses.length === 0;
    const satisfiedParts = [
      confirmationKey ? "学生身份已确认" : "",
      minimumCreditsConfirmationKey ? `已确认选课前修满 ${minimumCredits} 学分` : "",
      requirementText
    ].filter(Boolean);

    return {
      audienceNote,
      confirmationKey,
      confirmationMet,
      eligible,
      hasRequirement: true,
      minimumCredits,
      minimumCreditsConfirmationKey,
      minimumCreditsConfirmationLabel,
      minimumCreditsConfirmationMet,
      minimumCreditsMet,
      missingCourses,
      requiredCourses,
      requirementText,
      selectedCredits,
      selectedRequiredCount: requiredCourses.length - missingCourses.length,
      statusText: eligible
        ? `当前排课记录已满足：${satisfiedParts.join("；")}。`
        : `当前排课记录未满足：${unmetParts.join("；")}。`,
      termLabel,
      terms
    };
  }

  function plannerHref(term) {
    return `index.html?term=${encodeURIComponent(normalizeTerm(term) || DEFAULT_TERM)}`;
  }

  function courseHref(code, term) {
    return `course.html?code=${encodeURIComponent(normalizeCourseCode(code))}&term=${encodeURIComponent(normalizeTerm(term) || DEFAULT_TERM)}`;
  }

  function normalizeSelections(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const normalized = {};
    Object.entries(value).forEach(([courseCode, selection]) => {
      const normalizedCode = normalizeCourseCode(courseCode);
      if (!normalizedCode) return;
      const isCanonicalKey = normalizedCode === String(courseCode).trim().toUpperCase();
      if (!(normalizedCode in normalized) || isCanonicalKey) {
        normalized[normalizedCode] = selection;
      }
    });
    return normalized;
  }

  function selectionStorageKey(term) {
    return `${STORAGE_KEY_PREFIX}-${normalizeTerm(term) || DEFAULT_TERM}`;
  }

  function getStoredSelections(term = DEFAULT_TERM) {
    const normalizedTerm = normalizeTerm(term) || DEFAULT_TERM;
    const storageKey = selectionStorageKey(normalizedTerm);
    try {
      let raw = localStorage.getItem(storageKey);
      let migrated = false;
      if (raw === null && normalizedTerm === DEFAULT_TERM) {
        const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacyRaw !== null) {
          raw = legacyRaw;
          migrated = true;
        }
      }
      const parsed = JSON.parse(raw || "{}");
      const normalized = normalizeSelections(parsed);
      if (raw !== null && (migrated || JSON.stringify(parsed) !== JSON.stringify(normalized))) {
        localStorage.setItem(storageKey, JSON.stringify(normalized));
      }
      return normalized;
    } catch {
      try {
        localStorage.setItem(storageKey, "{}");
      } catch {
        // Ignore storage failures and keep the planner usable in memory.
      }
      return {};
    }
  }

  function getEligibilityConfirmations() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ELIGIBILITY_CONFIRMATIONS_KEY) || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
      return Object.fromEntries(Object.entries(parsed).filter(([, confirmed]) => confirmed === true));
    } catch {
      return {};
    }
  }

  function setEligibilityConfirmation(key, confirmed) {
    const normalizedKey = String(key || "").trim();
    if (!normalizedKey) return getEligibilityConfirmations();
    const confirmations = getEligibilityConfirmations();
    if (confirmed) confirmations[normalizedKey] = true;
    else delete confirmations[normalizedKey];
    localStorage.setItem(ELIGIBILITY_CONFIRMATIONS_KEY, JSON.stringify(confirmations));
    return confirmations;
  }

  function saveSelections(term, selections) {
    const normalized = normalizeSelections(selections);
    localStorage.setItem(selectionStorageKey(term), JSON.stringify(normalized));
    return normalized;
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
    const when = [DAY_NAMES[section.day] || section.day, section.time].filter(Boolean).join(" ");
    return `${section.section}${when ? ` · ${when}` : " · 时间待定"}`;
  }

  function showToast(message, options = {}) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    const { actionLabel, onAction, duration = actionLabel ? 5000 : 2600 } = options;
    toast.replaceChildren();

    const messageElement = document.createElement("span");
    messageElement.textContent = message;
    toast.append(messageElement);

    if (actionLabel && typeof onAction === "function") {
      const actionButton = document.createElement("button");
      actionButton.type = "button";
      actionButton.textContent = actionLabel;
      actionButton.addEventListener("click", () => {
        window.clearTimeout(showToast.timer);
        toast.classList.remove("show");
        onAction();
      }, { once: true });
      toast.append(actionButton);
    }

    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), duration);
  }

  function recommendationBadge(rec, small = false) {
    const className = small ? "mini-badge" : "verdict-badge";
    return `<span class="${className} ${escapeHtml(rec.level)}">${escapeHtml(rec.verdict)}</span>`;
  }

  window.MSDS = {
    ACTIVE_TERM_KEY,
    DAY_NAMES,
    DEFAULT_TERM,
    LEGACY_STORAGE_KEY,
    TERM_CODES,
    allowsUnscheduledSelection,
    courseHref,
    courseOfferedInTerm,
    escapeHtml,
    findSection,
    formatSection,
    getActiveTerm,
    getEligibilityConfirmations,
    getRecommendation,
    getSelectionEligibility,
    getStoredSelections,
    getTermLabel,
    isProjectCourse,
    isUnscheduledSelection,
    loadCourseData,
    makeUnscheduledSelection,
    makeDefaultSelection,
    normalizeCourseCode,
    normalizeTerm,
    plannerHref,
    projectConflictCodes,
    projectSelectionKey,
    recommendationBadge,
    saveSelections,
    selectedCreditsInTerm,
    sectionKey,
    sectionsForTerm,
    selectionStorageKey,
    setActiveTerm,
    setEligibilityConfirmation,
    showToast
  };
})();
