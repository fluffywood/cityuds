(function () {
  "use strict";

  const detail = document.getElementById("course-detail");
  const code = new URLSearchParams(window.location.search).get("code")?.toUpperCase();

  function fact(label, value) {
    return `<div class="fact"><span>${MSDS.escapeHtml(label)}</span><strong>${MSDS.escapeHtml(value || "无")}</strong></div>`;
  }

  function renderCourse(data, course, courseDocument) {
    const rec = MSDS.getRecommendation(course);
    const sourceStore = data.sources || {};
    const sourceReviewStore = data.sourceReviews || {};
    const sources = (rec.source_ids || rec.sourceIds || []).map((id) => {
      const source = sourceStore[id];
      if (!source) return null;
      return {
        ...source,
        id,
        review: sourceReviewStore[id]?.course_reviews?.[course.code] || ""
      };
    }).filter(Boolean);
    const selections = MSDS.getStoredSelections();
    const isAdded = Boolean(selections[course.code]);
    const instructors = [...new Set(course.eligible_sections.map((section) => section.instructor).filter(Boolean))].join("；");
    const webStatus = course.eligible_sections.some((section) => section.web === "Y") ? "有班次可网页注册" : "不可正常网页注册，请联系课程单位";
    const titleNote = course.title_changed ? `本学期课表名称：${course.schedule_title}` : "课程名称与课表一致";

    document.title = `${course.code} ${course.programme_title} · MSDS 选课板`;
    detail.innerHTML = `
      <a class="back-link" href="index.html">← 返回课程表</a>
      <section class="detail-hero">
        <div>
          <div class="detail-code-row">
            <span class="detail-code">${MSDS.escapeHtml(course.code)}</span>
            ${course.requirement_type === "core" ? '<span class="verdict-badge core">核心课</span>' : MSDS.recommendationBadge(rec)}
          </div>
          <h1>${MSDS.escapeHtml(course.programme_title)}</h1>
          <p>${course.credits} 学分 · ${MSDS.escapeHtml(course.remarks)} · ${MSDS.escapeHtml(titleNote)}</p>
        </div>
        <div class="detail-actions">
          <button id="detail-add" class="button ${isAdded ? "button-quiet" : "button-primary"}" type="button">${isAdded ? "已加入课表" : "加入课表"}</button>
          <a class="button button-quiet" href="index.html">查看课表</a>
          ${courseDocument ? `<a class="button button-document" href="syllabus.html?code=${encodeURIComponent(course.code)}">查看详细课程介绍</a>` : ""}
        </div>
      </section>

      <div class="detail-layout">
        <div>
          <section class="detail-section">
            <h2>学生经验摘要</h2>
            <div class="review-lead ${MSDS.escapeHtml(rec.level)}">
              <strong>${MSDS.escapeHtml(rec.verdict)}</strong>
              <p>${MSDS.escapeHtml(rec.summary)}</p>
              ${rec.tags.length ? `<div class="tag-list detail-tags">${rec.tags.map((tag) => `<span class="tag">${MSDS.escapeHtml(tag)}</span>`).join("")}</div>` : ""}
            </div>
          </section>

          <section class="detail-section">
            <h2>课程事实</h2>
            <div class="fact-grid">
              ${fact("课程类型", course.requirement_type === "core" ? "核心课" : "选修课")}
              ${fact("先修要求", course.prerequisites === "Nil" ? "无" : course.prerequisites)}
              ${fact("互斥课程", course.exclusive_course === "Nil" ? "无" : course.exclusive_course)}
              ${fact("授课语言", course.summary?.medium)}
              ${fact("授课教师", instructors)}
              ${fact("注册状态", webStatus)}
            </div>
          </section>

          <section class="detail-section">
            <h2>可选班次</h2>
            <div class="section-table-wrap">
              <table class="section-table">
                <thead><tr><th>班次</th><th>时间</th><th>地点</th><th>教师</th><th>CRN / 注册</th></tr></thead>
                <tbody>${course.eligible_sections.map((section) => `
                  <tr>
                    <td><strong>${MSDS.escapeHtml(section.section)}</strong><span>${Number(section.credits) === 0 ? "Tutorial · 0 学分" : `${section.credits} 学分`}</span></td>
                    <td><strong>${MSDS.escapeHtml(MSDS.DAY_NAMES[section.day] || section.day)} ${MSDS.escapeHtml(section.time)}</strong><span>${MSDS.escapeHtml(section.date)}</span></td>
                    <td><strong>${MSDS.escapeHtml([section.building, section.room].filter(Boolean).join(" "))}</strong></td>
                    <td><strong>${MSDS.escapeHtml(section.instructor)}</strong></td>
                    <td><strong>${MSDS.escapeHtml(section.crn)}</strong><span>${section.web === "Y" ? "可网页注册" : "WEB=N"}</span></td>
                  </tr>`).join("")}</tbody>
              </table>
            </div>
          </section>

          <section class="detail-section source-section">
            <h2>原始来源与评价原文</h2>
            <p class="source-section-intro">以下内容按课程从原始帖子中摘录，保留原作者信息与措辞，仅整理换行和标点；无关课程、话题标签和无关评论未收录。</p>
            ${sources.length ? `<div class="source-list">${sources.map((source) => `
              <article class="source-review">
                <div class="source-review-header">
                  <div>
                    <strong>${MSDS.escapeHtml(source.title)}</strong>
                    <span>${MSDS.escapeHtml(source.platform)} · 学生经验</span>
                  </div>
                  <a class="source-review-link" href="${MSDS.escapeHtml(source.url)}" target="_blank" rel="noreferrer">查看原文</a>
                </div>
                <p>${MSDS.escapeHtml(source.review)}</p>
              </article>`).join("")}</div>` : '<div class="notice source-empty">本地资料暂未找到可核对的学生评价来源。</div>'}
            <div class="notice source-notice"><strong>阅读提示：</strong>学生经验对应往届课程，考核方式、教师与难度可能变化。当前班次事实来自 2026-08-02 的 AIMS 课表快照。</div>
          </section>
        </div>
      </div>`;

    document.getElementById("detail-add").addEventListener("click", () => {
      const current = MSDS.getStoredSelections();
      if (current[course.code]) {
        window.location.href = "index.html";
        return;
      }
      current[course.code] = MSDS.makeDefaultSelection(course);
      MSDS.saveSelections(current);
      const button = document.getElementById("detail-add");
      button.textContent = "已加入课表";
      button.className = "button button-quiet";
      MSDS.showToast(`已加入 ${course.code}`);
    });
  }

  if (!code) {
    detail.innerHTML = '<div class="error-state">缺少课程编号。<br><a class="text-link" href="index.html">返回课程表</a></div>';
    return;
  }

  Promise.all([
    MSDS.loadCourseData(),
    fetch("data/course-documents/index.json").then((response) => {
      if (!response.ok) throw new Error("课程介绍索引读取失败");
      return response.json();
    })
  ]).then(([data, courseDocuments]) => {
    const course = data.courses.find((item) => item.code === code);
    if (!course) throw new Error("没有找到这门课程");
    renderCourse(data, course, courseDocuments[course.code]);
  }).catch((error) => {
    detail.innerHTML = `<div class="error-state">${MSDS.escapeHtml(error.message)}<br><a class="text-link" href="index.html">返回课程表</a></div>`;
  });
})();
