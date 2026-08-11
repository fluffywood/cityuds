(function () {
  "use strict";

  const detail = document.getElementById("course-detail");
  const code = MSDS.normalizeCourseCode(new URLSearchParams(window.location.search).get("code"));

  function fact(label, value) {
    return `<div class="fact"><dt>${MSDS.escapeHtml(label)}</dt><dd>${MSDS.escapeHtml(value || "无")}</dd></div>`;
  }

  function selectionForPrimary(course, primaryKey) {
    const primary = MSDS.findSection(course, primaryKey);
    if (!primary) return MSDS.makeDefaultSelection(course);
    const tutorials = course.eligible_sections.filter((section) => Number(section.credits) === 0);
    return MSDS.makeDefaultSelection({
      ...course,
      eligible_sections: [primary, ...tutorials]
    });
  }

  function normalizedSelection(course, selection) {
    const fallback = MSDS.makeDefaultSelection(course);
    const primary = MSDS.findSection(course, selection?.primaryCrn)
      || MSDS.findSection(course, fallback.primaryCrn);
    const hasTutorialChoice = selection && Object.prototype.hasOwnProperty.call(selection, "tutorialCrn");
    const tutorial = hasTutorialChoice
      ? MSDS.findSection(course, selection.tutorialCrn)
      : MSDS.findSection(course, fallback.tutorialCrn);
    return {
      primaryCrn: primary ? MSDS.sectionKey(primary) : null,
      tutorialCrn: tutorial ? MSDS.sectionKey(tutorial) : null
    };
  }

  function sectionChoiceText(section) {
    const room = [section.building, section.room].filter(Boolean).join(" ");
    const registration = section.web === "Y" ? "可网页注册" : "需联系课程单位注册";
    return [MSDS.formatSection(section), section.instructor, room, registration].filter(Boolean).join(" · ");
  }

  function sectionOptions(sections, selectedKey) {
    return sections.map((section) => {
      const key = MSDS.sectionKey(section);
      return `<option value="${MSDS.escapeHtml(key)}"${key === String(selectedKey || "") ? " selected" : ""}>${MSDS.escapeHtml(sectionChoiceText(section))}</option>`;
    }).join("");
  }

  function selectionSummary(course, selection, prefix) {
    const primary = MSDS.findSection(course, selection?.primaryCrn);
    const tutorial = MSDS.findSection(course, selection?.tutorialCrn);
    const describe = (label, section) => {
      if (!section) return "";
      const room = [section.building, section.room].filter(Boolean).join(" ");
      return `${label} ${MSDS.formatSection(section)}${room ? ` · ${room}` : ""}`;
    };
    const parts = [describe("主课", primary), describe("导修课", tutorial)].filter(Boolean);
    return parts.length ? `${prefix}：${parts.join("；")}` : "暂无可加入的主课班次。";
  }

  function renderError(message, backUrl, backLabel) {
    detail.setAttribute("aria-busy", "false");
    detail.innerHTML = `<div class="error-state" role="alert" tabindex="-1">${MSDS.escapeHtml(message)}<br><a class="text-link" href="${MSDS.escapeHtml(backUrl)}">${MSDS.escapeHtml(backLabel)}</a></div>`;
    detail.querySelector(".error-state")?.focus();
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
    const isOffered = course.offered_this_year !== false;
    const isAdded = isOffered && Boolean(selections[course.code]);
    const primarySections = course.eligible_sections.filter((section) => Number(section.credits) > 0);
    const tutorialSections = course.eligible_sections.filter((section) => Number(section.credits) === 0);
    const canAdd = isOffered && primarySections.length > 0;
    const activeSelection = normalizedSelection(
      course,
      isAdded ? selections[course.code] : MSDS.makeDefaultSelection(course)
    );
    const instructors = [...new Set(course.eligible_sections.map((section) => section.instructor).filter(Boolean))].join("；");
    const webStatus = !isOffered
      ? "本学年不开设"
      : course.eligible_sections.some((section) => section.web === "Y")
        ? "有班次可网页注册"
        : "需联系课程单位注册";
    const titleNote = !isOffered
      ? "本学年不开设"
      : course.title_changed
        ? `本学期课表名称：${course.schedule_title}`
        : "课程名称与课表一致";
    const requirementLabel = course.requirement_type === "core" ? "核心课" : "选修课";
    const offeredLabel = isOffered ? "本学年开设" : "本学年不开设";
    const selectionPrefix = isAdded ? "当前已选" : "准备加入";
    const selectionControlsDisabled = isAdded || !canAdd;
    const decisionStatus = !isOffered
      ? "本学年不开设，无法加入课表。"
      : !primarySections.length
        ? "暂无可加入的主课班次。"
        : isAdded
          ? "已加入课表；当前班次如下。"
          : "尚未加入课表，请先确认下方班次。";
    const decisionStatusClass = !canAdd
      ? "is-unavailable"
      : isAdded
        ? "is-added"
        : "is-pending";
    const addButtonClass = !canAdd ? "button-unavailable" : isAdded ? "button-quiet" : "button-primary";
    const addButtonText = !canAdd ? "暂无可加入班次" : isAdded ? "已加入 · 查看课表" : "按上述班次加入课表";
    const addButtonLabel = isAdded ? `${course.code} 已加入课表，查看课表` : addButtonText;
    const sectionRows = course.eligible_sections.length
      ? course.eligible_sections.map((section) => `
          <tr>
            <td><strong>${MSDS.escapeHtml(section.section)}</strong><span>${Number(section.credits) === 0 ? "导修课（Tutorial） · 0 学分" : `${section.credits} 学分`}</span></td>
            <td><strong>${MSDS.escapeHtml(MSDS.DAY_NAMES[section.day] || section.day)} ${MSDS.escapeHtml(section.time)}</strong><span>${MSDS.escapeHtml(section.date)}</span></td>
            <td><strong>${MSDS.escapeHtml([section.building, section.room].filter(Boolean).join(" ") || "待定")}</strong></td>
            <td><strong>${MSDS.escapeHtml(section.instructor || "待定")}</strong></td>
            <td><strong>${MSDS.escapeHtml(section.crn)}</strong><span>${section.web === "Y" ? "可网页注册" : "需联系课程单位注册"}</span></td>
          </tr>`).join("")
      : '<tr class="section-empty-row"><td colspan="5"><strong>本学年不开设</strong><span>暂无可选班次</span></td></tr>';

    document.title = `${course.code} ${course.programme_title} · MSDS 选课板`;
    detail.innerHTML = `
      <a class="back-link" href="index.html">← 返回课程表</a>
      <section class="detail-hero" aria-labelledby="course-title">
        <div>
          <div class="detail-code-row">
            <span class="detail-code">${MSDS.escapeHtml(course.code)}</span>
            <span class="verdict-badge ${course.requirement_type === "core" ? "core" : "elective"}">${requirementLabel}</span>
            <span class="status-badge course-status ${isOffered ? "is-offered" : "is-unavailable"}">${offeredLabel}</span>
          </div>
          <h1 id="course-title" lang="en">${MSDS.escapeHtml(course.programme_title)}</h1>
          <p>${MSDS.escapeHtml([`${course.credits} 学分`, course.remarks, titleNote].filter(Boolean).join(" · "))}</p>
        </div>
        <div class="detail-actions" role="group" aria-label="课程详情操作">
          <a class="button button-quiet" href="index.html">查看课表</a>
          ${courseDocument ? `<a class="button button-document" href="syllabus.html?code=${encodeURIComponent(course.code)}">查看详细课程介绍</a>` : ""}
        </div>
      </section>

      <div class="detail-layout">
        <div>
          <section class="detail-section course-decision" aria-labelledby="course-decision-heading">
            <div class="detail-section-heading">
              <div>
                <p class="eyebrow">排课决策</p>
                <h2 id="course-decision-heading">先看事实，再确认班次</h2>
              </div>
            </div>

            <dl class="fact-grid decision-facts">
              ${fact("课程类型", requirementLabel)}
              ${fact("学分", `${course.credits} 学分`)}
              ${fact("开课状态", offeredLabel)}
              ${fact("注册状态", webStatus)}
              ${fact("授课教师", instructors)}
              ${fact("授课语言", course.summary?.medium)}
              ${fact("先修要求", course.prerequisites === "Nil" ? "无" : course.prerequisites)}
              ${fact("互斥课程", course.exclusive_course === "Nil" ? "无" : course.exclusive_course)}
            </dl>

            <div class="decision-toolbar" role="group" aria-labelledby="selection-heading">
              <div class="decision-toolbar-copy">
                <p class="eyebrow">加入前确认</p>
                <h3 id="selection-heading">${isAdded ? "当前课表班次" : "默认加入班次"}</h3>
                <p>${isAdded ? "如需换班，请前往课程表的“已选”面板。" : "页面不会静默选班；下方显示并保存你确认的主课与导修课。"}</p>
              </div>
              <div class="decision-controls">
                ${primarySections.length ? `
                  <div class="section-selects decision-section-selects">
                    <label for="detail-primary-section"><span>主课</span><select id="detail-primary-section" data-kind="primary"${selectionControlsDisabled ? " disabled" : ""} aria-describedby="default-selection-summary">${sectionOptions(primarySections, activeSelection.primaryCrn)}</select></label>
                    ${tutorialSections.length ? `<label for="detail-tutorial-section"><span>导修课</span><select id="detail-tutorial-section" data-kind="tutorial"${selectionControlsDisabled ? " disabled" : ""} aria-describedby="default-selection-summary"><option value=""${activeSelection.tutorialCrn ? "" : " selected"}>不选择导修课</option>${sectionOptions(tutorialSections, activeSelection.tutorialCrn)}</select></label>` : ""}
                  </div>` : '<p class="notice decision-empty">暂无可加入的主课班次。</p>'}
                <p id="default-selection-summary" class="default-selection-summary">${MSDS.escapeHtml(selectionSummary(course, activeSelection, selectionPrefix))}</p>
                <p id="detail-status" class="decision-status ${decisionStatusClass}" role="status" aria-live="polite" aria-atomic="true">${MSDS.escapeHtml(decisionStatus)}</p>
                <button id="detail-add" class="button ${addButtonClass}" type="button" aria-label="${MSDS.escapeHtml(addButtonLabel)}" aria-describedby="default-selection-summary detail-status"${!canAdd ? " disabled" : ""}>${MSDS.escapeHtml(addButtonText)}</button>
              </div>
            </div>

            <div class="section-heading">
              <h3 id="section-table-heading">所有可选班次</h3>
              <p>主课与 0 学分导修课分列展示；注册状态以 CityU 系统为准。</p>
            </div>
            <div class="section-table-wrap" role="region" aria-labelledby="section-table-heading" tabindex="0">
              <table class="section-table">
                <caption class="section-table-caption">${MSDS.escapeHtml(course.code)} 本学年班次、上课时间、地点、教师与注册方式</caption>
                <thead><tr><th scope="col">班次</th><th scope="col">时间</th><th scope="col">地点</th><th scope="col">教师</th><th scope="col">CRN / 注册</th></tr></thead>
                <tbody>${sectionRows}</tbody>
              </table>
            </div>
          </section>

          <section class="detail-section" aria-labelledby="student-review-heading">
            <h2 id="student-review-heading">学生经验摘要</h2>
            <div class="review-lead ${MSDS.escapeHtml(rec.level)}">
              <strong>${MSDS.escapeHtml(rec.verdict)}</strong>
              <p>${MSDS.escapeHtml(rec.summary)}</p>
              ${rec.tags.length ? `<div class="tag-list detail-tags">${rec.tags.map((tag) => `<span class="tag">${MSDS.escapeHtml(tag)}</span>`).join("")}</div>` : ""}
            </div>
          </section>

          <section class="detail-section source-section" aria-labelledby="source-review-heading">
            <h2 id="source-review-heading">原始来源与评价原文</h2>
            <p class="source-section-intro">以下内容按课程从原始帖子中摘录，保留原作者信息与措辞，仅整理换行和标点；无关课程、话题标签和无关评论未收录。</p>
            ${sources.length ? `<div class="source-list">${sources.map((source) => `
              <article class="source-review">
                <div class="source-review-header">
                  <div>
                    <strong>${MSDS.escapeHtml(source.title)}</strong>
                    <span>${MSDS.escapeHtml(source.platform)} · 学生经验</span>
                  </div>
                  <a class="source-review-link" href="${MSDS.escapeHtml(source.url)}" target="_blank" rel="noreferrer" aria-label="查看《${MSDS.escapeHtml(source.title)}》原文（新窗口）">查看原文 ↗</a>
                </div>
                <p>${MSDS.escapeHtml(source.review)}</p>
              </article>`).join("")}</div>` : '<div class="notice source-empty">本地资料暂未找到可核对的学生评价来源。</div>'}
            <div class="notice source-notice"><strong>阅读提示：</strong>学生经验对应往届课程，考核方式、教师与难度可能变化。当前班次事实来自 2026-08-04 16:48（Asia/Beijing）的 AIMS 课表快照。</div>
          </section>
        </div>
      </div>`;
    detail.setAttribute("aria-busy", "false");

    if (!canAdd) return;

    const addButton = document.getElementById("detail-add");
    const primarySelect = document.getElementById("detail-primary-section");
    const tutorialSelect = document.getElementById("detail-tutorial-section");
    const summary = document.getElementById("default-selection-summary");
    const status = document.getElementById("detail-status");

    function selectionFromControls() {
      return {
        primaryCrn: primarySelect?.value || null,
        tutorialCrn: tutorialSelect?.value || null
      };
    }

    function updateSelectionSummary() {
      summary.textContent = selectionSummary(course, selectionFromControls(), "准备加入");
    }

    primarySelect?.addEventListener("change", () => {
      const matchedSelection = selectionForPrimary(course, primarySelect.value);
      if (tutorialSelect) tutorialSelect.value = matchedSelection.tutorialCrn || "";
      updateSelectionSummary();
    });
    tutorialSelect?.addEventListener("change", updateSelectionSummary);

    addButton.addEventListener("click", () => {
      const current = MSDS.getStoredSelections();
      if (current[course.code]) {
        window.location.href = "index.html";
        return;
      }

      const nextSelection = selectionFromControls();
      if (!nextSelection.primaryCrn) {
        status.className = "decision-status is-unavailable";
        status.textContent = "请先选择主课班次。";
        primarySelect?.focus();
        return;
      }

      current[course.code] = nextSelection;
      MSDS.saveSelections(current);
      primarySelect.disabled = true;
      if (tutorialSelect) tutorialSelect.disabled = true;
      summary.textContent = selectionSummary(course, nextSelection, "已加入");
      status.className = "decision-status is-added";
      status.textContent = "已加入课表。请查看课表确认是否与其他课程冲突。";
      addButton.textContent = "已加入 · 查看课表";
      addButton.className = "button button-quiet";
      addButton.setAttribute("aria-label", `${course.code} 已加入课表，查看课表`);
      addButton.focus({ preventScroll: true });
      const primary = MSDS.findSection(course, nextSelection.primaryCrn);
      MSDS.showToast(`已加入 ${course.code}${primary ? `：${MSDS.formatSection(primary)}` : ""}`);
    });
  }

  if (!code) {
    renderError("缺少课程编号。", "index.html", "返回课程表");
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
    renderError(error.message, "index.html", "返回课程表");
  });
})();
