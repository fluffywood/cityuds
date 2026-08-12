(function () {
  "use strict";

  const detail = document.getElementById("course-detail");
  const searchParams = new URLSearchParams(window.location.search);
  const rawCode = searchParams.get("code");
  const code = MSDS.normalizeCourseCode(rawCode);
  const activeTerm = MSDS.setActiveTerm(MSDS.getActiveTerm());
  if (code) {
    const canonicalUrl = new URL(window.location.href);
    canonicalUrl.searchParams.set("code", code);
    canonicalUrl.searchParams.set("term", activeTerm);
    window.history.replaceState(null, "", canonicalUrl);
  }
  document.querySelector(".brand").href = MSDS.plannerHref(activeTerm);
  document.querySelector('.main-nav a[href^="index.html"]').href = MSDS.plannerHref(activeTerm);

  function fact(label, value) {
    return `<div class="fact"><dt>${MSDS.escapeHtml(label)}</dt><dd>${MSDS.escapeHtml(value || "无")}</dd></div>`;
  }

  function sectionValue(value, fallback = "—") {
    return value === 0 || value ? String(value) : fallback;
  }

  function findProjectConflict(data, course) {
    if (!MSDS.isProjectCourse(course)) return null;
    for (const term of MSDS.TERM_CODES) {
      const termSelections = MSDS.getStoredSelections(term);
      for (const conflictCode of MSDS.projectConflictCodes(course)) {
        if (term === activeTerm && conflictCode === course.code) continue;
        if (MSDS.isUnscheduledSelection(termSelections[conflictCode])) {
          const conflictCourse = data.courses.find((item) => item.code === conflictCode);
          if (conflictCourse && !MSDS.courseOfferedInTerm(conflictCourse, term)) continue;
          if (conflictCourse && !MSDS.getSelectionEligibility(data, conflictCourse).eligible) continue;
          return { code: conflictCode, term };
        }
      }
    }
    return null;
  }

  function projectConflictMessage(data, course, conflict) {
    const conflictCourse = data.courses.find((item) => item.code === conflict.code);
    const conflictTitle = conflictCourse?.programme_title || conflict.code;
    const termLabel = MSDS.getTermLabel(data, conflict.term, false);
    return conflict.code === course.code
      ? `${conflictTitle} 已加入 ${termLabel}，请先在该学期移除。`
      : `${conflictTitle} 已加入 ${termLabel}；${course.code} 与 ${conflict.code} 只能选一门，请先移除。`;
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
    if (MSDS.allowsUnscheduledSelection(course, activeTerm)) return MSDS.makeUnscheduledSelection();
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
    if (MSDS.allowsUnscheduledSelection(course, activeTerm)) {
      return MSDS.isProjectCourse(course)
        ? `${prefix}：无需选择班次，不在周课表显示。`
        : `${prefix}：无需选择班次；按必修课计入 1 门 ${course.credits} 学分，不在周课表显示。`;
    }
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
    const termLabel = MSDS.getTermLabel(data, activeTerm, false);
    const fullTermLabel = MSDS.getTermLabel(data, activeTerm, true);
    const termConfig = data.terms.find((item) => item.code === activeTerm) || {};
    const scheduleAsOf = termConfig.schedule_as_of || data.schedule_as_of || "";
    const selections = MSDS.getStoredSelections(activeTerm);
    const isOffered = MSDS.courseOfferedInTerm(course, activeTerm);
    const isProject = MSDS.isProjectCourse(course);
    const allowsUnscheduled = isOffered && MSDS.allowsUnscheduledSelection(course, activeTerm);
    const primarySections = course.eligible_sections.filter((section) => Number(section.credits) > 0);
    const tutorialSections = course.eligible_sections.filter((section) => Number(section.credits) === 0);
    const storedSelection = selections[course.code];
    const storedPrimary = MSDS.findSection(course, storedSelection?.primaryCrn);
    const isAdded = isOffered && (allowsUnscheduled
      ? MSDS.isUnscheduledSelection(storedSelection)
      : Number(storedPrimary?.credits) > 0);
    if (selections[course.code] && !isAdded) {
      delete selections[course.code];
      MSDS.saveSelections(activeTerm, selections);
    }
    const eligibility = MSDS.getSelectionEligibility(data, course);
    const hasAddableCourse = isOffered && (allowsUnscheduled || primarySections.length > 0);
    const canAdd = hasAddableCourse && eligibility.eligible;
    const canUseAddButton = isAdded || canAdd;
    const activeSelection = normalizedSelection(
      course,
      isAdded ? selections[course.code] : MSDS.makeDefaultSelection(course)
    );
    if (isAdded && JSON.stringify(selections[course.code]) !== JSON.stringify(activeSelection)) {
      selections[course.code] = activeSelection;
      MSDS.saveSelections(activeTerm, selections);
    }
    const instructors = [...new Set(course.eligible_sections.map((section) => section.instructor).filter(Boolean))].join("；");
    const webStatus = !isOffered
      ? "该学期未开设"
      : allowsUnscheduled
        ? "无需在本工具选择班次"
      : !primarySections.length
        ? "班次尚未公布"
        : course.eligible_sections.some((section) => section.web === "Y")
        ? "有班次可网页注册"
        : "需联系课程单位注册";
    const titleNote = !isOffered
      ? `${termLabel} 未开设`
      : course.title_changed
        ? `本学期课表名称：${course.schedule_title}`
        : "课程名称与课表一致";
    const requirementLabel = isProject ? "项目课" : course.requirement_type === "core" ? "核心课" : "选修课";
    const offeredLabel = isOffered ? `${termLabel} 开设` : `${termLabel} 未开设`;
    const selectionPrefix = isAdded ? "当前已选" : "准备加入";
    const selectionControlsDisabled = isAdded || !canAdd;
    const decisionStatus = !isOffered
      ? `该课程在 ${fullTermLabel} 未开设，无法加入这学期的课表。`
      : !hasAddableCourse
        ? "该学期开设，但暂无可选班次，暂时无法加入课表。"
      : !eligibility.eligible
        ? eligibility.statusText
      : allowsUnscheduled
        ? isProject
          ? isAdded
            ? "已加入项目汇总；无需选择班次，不在周课表显示。"
            : "该项目课无需选择班次；加入后计入三学期总门数和总学分，不在周课表显示。"
          : isAdded
            ? `已加入课表；按必修课计入 1 门 ${course.credits} 学分，不在周课表显示。`
            : `${termLabel} 无可选班次，但可直接加入；按必修课计入 1 门 ${course.credits} 学分，不在周课表显示。`
        : isAdded
          ? "已加入课表；当前班次如下。"
          : "尚未加入课表，请先确认下方班次。";
    const decisionStatusClass = !isOffered
      ? "is-unavailable"
      : !hasAddableCourse
        ? "is-awaiting-sections"
      : !eligibility.eligible
        ? "is-ineligible"
      : isAdded
        ? "is-added"
        : "is-pending";
    const addButtonClass = !isOffered
      ? "button-unavailable"
      : !hasAddableCourse
        ? "button-awaiting-sections"
      : isAdded
        ? "button-quiet"
      : !eligibility.eligible
        ? "button-ineligible"
        : "button-primary";
    const addButtonText = !isOffered
      ? "该学期未开设"
      : !hasAddableCourse
        ? "暂无可选班次"
      : isAdded
        ? "已加入 · 查看课表"
      : !eligibility.eligible
        ? "暂不符合选课条件"
        : isProject
          ? "加入项目汇总"
          : allowsUnscheduled
            ? "加入课表（无需班次）"
          : "按上述班次加入课表";
    const addButtonLabel = isAdded ? `${course.code} 已加入课表，查看课表` : addButtonText;
    const personalConfirmationItem = eligibility.audienceNote
      ? `<li class="is-personal"><strong>学生身份</strong>${eligibility.confirmationKey
        ? `<label class="eligibility-confirmation-control"><input type="checkbox" data-eligibility-confirm="${MSDS.escapeHtml(eligibility.confirmationKey)}" data-eligibility-confirm-label="学生身份"${eligibility.confirmationMet ? " checked" : ""}${isAdded && eligibility.confirmationMet ? " disabled" : ""}><span>我确认：${MSDS.escapeHtml(eligibility.audienceNote)}</span></label>`
        : `<span>${MSDS.escapeHtml(eligibility.audienceNote)}（需本人确认）</span>`}</li>`
      : "";
    const minimumCreditsItem = eligibility.minimumCredits > 0
      ? eligibility.minimumCreditsConfirmationKey
        ? `<li class="${eligibility.minimumCreditsMet ? "is-met" : "is-unmet"}"><strong>修读学分</strong><label class="eligibility-confirmation-control"><input type="checkbox" data-eligibility-confirm="${MSDS.escapeHtml(eligibility.minimumCreditsConfirmationKey)}" data-eligibility-confirm-label="15 学分修读情况"${eligibility.minimumCreditsConfirmationMet ? " checked" : ""}${isAdded && eligibility.minimumCreditsConfirmationMet ? " disabled" : ""}><span>${MSDS.escapeHtml(eligibility.minimumCreditsConfirmationLabel)}</span></label></li>`
        : `<li class="${eligibility.minimumCreditsMet ? "is-met" : "is-unmet"}"><strong>${MSDS.escapeHtml(eligibility.termLabel)}学分</strong><span>${MSDS.escapeHtml(eligibility.selectedCredits)} / ${MSDS.escapeHtml(eligibility.minimumCredits)} 学分</span></li>`
      : "";
    const eligibilityItems = [
      personalConfirmationItem,
      minimumCreditsItem,
      eligibility.requiredCourses?.length
        ? `<li class="${eligibility.missingCourses.length ? "is-unmet" : "is-met"}"><strong>${eligibility.requiredCourses.length === 3 ? "三门必修" : `${MSDS.escapeHtml(eligibility.termLabel)}指定课程`}</strong><span>${MSDS.escapeHtml(eligibility.selectedRequiredCount)} / ${MSDS.escapeHtml(eligibility.requiredCourses.length)} · ${MSDS.escapeHtml(eligibility.requiredCourses.join("、"))}</span></li>`
        : ""
    ].filter(Boolean).join("");
    const eligibilityPanel = eligibilityItems
      ? `<div id="detail-eligibility" class="eligibility-panel ${eligibility.eligible ? "is-met" : "is-unmet"}" aria-labelledby="eligibility-heading">
          <div>
            <p class="eyebrow">选课资格</p>
            <h3 id="eligibility-heading">${eligibility.eligible ? "当前排课记录已满足条件" : "当前排课记录尚未满足条件"}</h3>
          </div>
          <ul class="eligibility-checklist">${eligibilityItems}</ul>
          <p class="eligibility-guidance">本工具仅按当前排课记录检查；修读记录、学生身份与最终资格请以 AIMS 及课程审批为准。</p>
        </div>`
      : "";
    const sectionRows = course.eligible_sections.length
      ? course.eligible_sections.map((section) => `
          <tr>
            <td><strong>${MSDS.escapeHtml(sectionValue(section.crn))}</strong></td>
            <td><strong>${MSDS.escapeHtml(sectionValue(section.section))}</strong></td>
            <td>${MSDS.escapeHtml(sectionValue(section.credits))}</td>
            <td>${MSDS.escapeHtml(sectionValue(section.campus))}</td>
            <td>${MSDS.escapeHtml(sectionValue(section.web))}</td>
            <td>${MSDS.escapeHtml(sectionValue(section.level))}</td>
            <td>${MSDS.escapeHtml(sectionValue(section.available))}</td>
            <td>${MSDS.escapeHtml(sectionValue(section.capacity))}</td>
            <td>${MSDS.escapeHtml(sectionValue(section.waitlist_available ?? section.waitlist_avail ?? section.waitlist))}</td>
            <td>${MSDS.escapeHtml(sectionValue(section.date))}</td>
            <td>${MSDS.escapeHtml(sectionValue(MSDS.DAY_NAMES[section.day] || section.day))}</td>
            <td>${MSDS.escapeHtml(sectionValue(section.time))}</td>
            <td>${MSDS.escapeHtml(sectionValue(section.building))}</td>
            <td>${MSDS.escapeHtml(sectionValue(section.room))}</td>
            <td>${MSDS.escapeHtml(sectionValue(section.instructor, "待定"))}</td>
            <td>${MSDS.escapeHtml(sectionValue(section.medium || course.summary?.medium))}</td>
          </tr>`).join("")
      : `<tr class="section-empty-row"><td colspan="16"><strong>${!isOffered ? "该学期未开设" : allowsUnscheduled ? "无需选择班次" : "该学期开设，但暂无可选班次"}</strong><span>${!isOffered ? "请返回课表选择其他学期" : isProject ? "不在周课表显示，加入后计入三学期汇总" : allowsUnscheduled ? `可直接加入；按必修课计入 1 门 ${course.credits} 学分，不在周课表显示` : "班次尚未公布，暂时无法加入课表"}</span></td></tr>`;

    document.getElementById("site-term-label").textContent = fullTermLabel;

    document.title = `${course.code} ${course.programme_title} · ${fullTermLabel}`;
    detail.innerHTML = `
      <a class="back-link" href="${MSDS.escapeHtml(MSDS.plannerHref(activeTerm))}">← 返回 ${MSDS.escapeHtml(termLabel)} 课程表</a>
      <section class="detail-hero" aria-labelledby="course-title">
        <div>
          <div class="detail-code-row">
            <span class="detail-code">${MSDS.escapeHtml(course.code)}</span>
            <span class="verdict-badge ${isProject ? "project" : course.requirement_type === "core" ? "core" : "elective"}">${requirementLabel}</span>
            <span class="status-badge course-status ${isOffered ? "is-offered" : "is-unavailable"}">${offeredLabel}</span>
          </div>
          <h1 id="course-title" lang="en">${MSDS.escapeHtml(course.programme_title)}</h1>
          <p>${MSDS.escapeHtml([`${course.credits} 学分`, course.remarks, titleNote].filter(Boolean).join(" · "))}</p>
        </div>
        <div class="detail-actions" role="group" aria-label="课程详情操作">
          <a class="button button-quiet" href="${MSDS.escapeHtml(MSDS.plannerHref(activeTerm))}">查看课表</a>
          ${courseDocument ? `<a class="button button-document" href="syllabus.html?code=${encodeURIComponent(course.code)}&term=${encodeURIComponent(activeTerm)}">查看详细课程介绍</a>` : ""}
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
              ${fact("授课教师", instructors || (isOffered ? "待公布" : "该学期未开设"))}
              ${fact("授课语言", course.summary?.medium)}
              ${fact("先修要求", course.prerequisites === "Nil" ? "无" : course.prerequisites)}
              ${fact("互斥课程", course.exclusive_course === "Nil" ? "无" : course.exclusive_course)}
            </dl>

            ${eligibilityPanel}

            <div class="decision-toolbar" role="group" aria-labelledby="selection-heading">
              <div class="decision-toolbar-copy">
                <p class="eyebrow">加入前确认</p>
                <h3 id="selection-heading">${allowsUnscheduled ? isProject ? isAdded ? "已加入项目汇总" : "项目课无需选择班次" : isAdded ? "已加入课表" : "无需选择班次" : isAdded ? "当前课表班次" : "默认加入班次"}</h3>
                <p>${allowsUnscheduled ? isProject ? "项目课不生成周课表事件；加入后仍计入三学期总门数和总学分。" : `该必修课不生成周课表事件；加入后计入必修 1 门 ${course.credits} 学分。` : isAdded ? "如需换班，请前往课程表的“已选”面板。" : "页面不会静默选班；下方显示并保存你确认的主课与导修课。"}</p>
              </div>
              <div class="decision-controls">
                ${allowsUnscheduled ? `<p class="notice${isProject ? " decision-project" : ""}">无需选择班次，不在周课表显示。</p>` : primarySections.length ? `
                  <div class="section-selects decision-section-selects">
                    <label for="detail-primary-section"><span>主课</span><select id="detail-primary-section" data-kind="primary"${selectionControlsDisabled ? " disabled" : ""} aria-describedby="default-selection-summary">${sectionOptions(primarySections, activeSelection.primaryCrn)}</select></label>
                    ${tutorialSections.length ? `<label for="detail-tutorial-section"><span>导修课</span><select id="detail-tutorial-section" data-kind="tutorial"${selectionControlsDisabled ? " disabled" : ""} aria-describedby="default-selection-summary"><option value=""${activeSelection.tutorialCrn ? "" : " selected"}>不选择导修课</option>${sectionOptions(tutorialSections, activeSelection.tutorialCrn)}</select></label>` : ""}
                  </div>` : `<p class="notice decision-empty">${isOffered ? "该学期开设，但暂无可选班次。" : "该学期未开设。"}</p>`}
                <p id="default-selection-summary" class="default-selection-summary">${MSDS.escapeHtml(selectionSummary(course, activeSelection, selectionPrefix))}</p>
                <p id="detail-status" class="decision-status ${decisionStatusClass}" role="status" aria-live="polite" aria-atomic="true">${MSDS.escapeHtml(decisionStatus)}</p>
                <button id="detail-add" class="button ${addButtonClass}" type="button" aria-label="${MSDS.escapeHtml(addButtonLabel)}" aria-describedby="${eligibilityItems ? "detail-eligibility " : ""}default-selection-summary detail-status"${!canUseAddButton ? " disabled" : ""}>${MSDS.escapeHtml(addButtonText)}</button>
              </div>
            </div>

            <div class="section-heading">
              <h3 id="section-table-heading">${MSDS.escapeHtml(termLabel)} 班次详情</h3>
              <p>表格按 AIMS 的 16 个常见字段展示；“—”表示当前数据未提供，可横向滚动查看。</p>
            </div>
            <div class="section-table-wrap" role="region" aria-labelledby="section-table-heading" tabindex="0">
              <table class="section-table course-section-table">
                <caption class="section-table-caption">${MSDS.escapeHtml(course.code)} ${MSDS.escapeHtml(termLabel)} 班次的 16 项选课字段</caption>
                <thead><tr><th scope="col">CRN</th><th scope="col">Section</th><th scope="col">Credit</th><th scope="col">Campus</th><th scope="col">WEB</th><th scope="col">Level</th><th scope="col">Avail</th><th scope="col">Cap</th><th scope="col">Waitlist Avail</th><th scope="col">Date</th><th scope="col">Day</th><th scope="col">Time</th><th scope="col">Bldg</th><th scope="col">Room</th><th scope="col">Instructor</th><th scope="col">Medium</th></tr></thead>
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
            <div class="notice source-notice"><strong>阅读提示：</strong>学生经验对应往届课程，考核方式、教师与难度可能变化。${scheduleAsOf ? `当前班次事实来自 ${MSDS.escapeHtml(scheduleAsOf)} 的 AIMS 课表快照。` : "当前班次事实来自 AIMS 课表数据。"}</div>
          </section>
        </div>
      </div>`;
    detail.setAttribute("aria-busy", "false");

    const eligibilityConfirmations = [...document.querySelectorAll("[data-eligibility-confirm]")];
    eligibilityConfirmations.forEach((eligibilityConfirmation) => eligibilityConfirmation.addEventListener("change", () => {
      const confirmationKey = eligibilityConfirmation.dataset.eligibilityConfirm;
      MSDS.setEligibilityConfirmation(confirmationKey, eligibilityConfirmation.checked);
      renderCourse(data, course, courseDocument);
      window.requestAnimationFrame(() => document.querySelector(`[data-eligibility-confirm="${confirmationKey}"]`)?.focus());
      const confirmationLabel = eligibilityConfirmation.dataset.eligibilityConfirmLabel || "资格条件";
      MSDS.showToast(eligibilityConfirmation.checked ? `已记录${confirmationLabel}确认` : `已取消${confirmationLabel}确认`);
    }));

    if (!canUseAddButton) return;

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
      const current = MSDS.getStoredSelections(activeTerm);
      if (current[course.code]) {
        window.location.href = MSDS.plannerHref(activeTerm);
        return;
      }

      const latestEligibility = MSDS.getSelectionEligibility(data, course);
      if (!latestEligibility.eligible) {
        status.className = "decision-status is-ineligible";
        status.textContent = latestEligibility.statusText;
        MSDS.showToast(`${course.code} 暂不可选：${latestEligibility.statusText.replace(/^当前排课记录未满足：/, "")}`, { duration: 5200 });
        addButton.focus({ preventScroll: true });
        return;
      }

      if (isProject) {
        const conflict = findProjectConflict(data, course);
        if (conflict) {
          const message = projectConflictMessage(data, course, conflict);
          status.className = "decision-status is-unavailable";
          status.textContent = message;
          MSDS.showToast(message, { duration: 5200 });
          addButton.focus({ preventScroll: true });
          return;
        }
      }

      const nextSelection = allowsUnscheduled ? MSDS.makeUnscheduledSelection() : selectionFromControls();
      if (!allowsUnscheduled && !nextSelection.primaryCrn) {
        status.className = "decision-status is-unavailable";
        status.textContent = "请先选择主课班次。";
        primarySelect?.focus();
        return;
      }

      current[course.code] = nextSelection;
      MSDS.saveSelections(activeTerm, current);
      if (primarySelect) primarySelect.disabled = true;
      if (tutorialSelect) tutorialSelect.disabled = true;
      summary.textContent = selectionSummary(course, nextSelection, "已加入");
      status.className = "decision-status is-added";
      status.textContent = allowsUnscheduled
        ? isProject
          ? "已加入项目汇总；无需选择班次，不在周课表显示。"
          : `已加入课表；按必修课计入 1 门 ${course.credits} 学分，不在周课表显示。`
        : "已加入课表。请查看课表确认是否与其他课程冲突。";
      addButton.textContent = "已加入 · 查看课表";
      addButton.className = "button button-quiet";
      addButton.setAttribute("aria-label", `${course.code} 已加入课表，查看课表`);
      addButton.focus({ preventScroll: true });
      const primary = MSDS.findSection(course, nextSelection.primaryCrn);
      MSDS.showToast(allowsUnscheduled
        ? isProject
          ? `已加入 ${course.code}；无需选择班次，不在周课表显示`
          : `已加入 ${course.code}；按必修课计入 1 门 ${course.credits} 学分，不在周课表显示`
        : `已加入 ${course.code}${primary ? `：${MSDS.formatSection(primary)}` : ""}`);
    });
  }

  if (!code) {
    renderError("缺少课程编号。", MSDS.plannerHref(activeTerm), "返回课程表");
    return;
  }

  Promise.all([
    MSDS.loadCourseData(),
    fetch("data/course-documents/index.json?v=20260812c").then((response) => {
      if (!response.ok) throw new Error("课程介绍索引读取失败");
      return response.json();
    })
  ]).then(([data, courseDocuments]) => {
    const catalogCourse = data.courses.find((item) => item.code === code);
    if (!catalogCourse) throw new Error("没有找到这门课程");
    const course = {
      ...catalogCourse,
      active_term: activeTerm,
      eligible_sections: MSDS.sectionsForTerm(catalogCourse, activeTerm)
    };
    renderCourse(data, course, courseDocuments[course.code]);
  }).catch((error) => {
    renderError(error.message, MSDS.plannerHref(activeTerm), "返回课程表");
  });
})();
