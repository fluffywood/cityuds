(function () {
  "use strict";

  const DAYS = ["M", "T", "W", "R", "F", "S"];
  const START_HOUR = 9;
  const END_HOUR = 22;
  const LEGACY_INITIALIZED_KEY = "MSDS-planner-initialized-v1";
  const INITIALIZED_KEY_PREFIX = "MSDS-planner-initialized-v2";
  const COLORS = [
    ["#dceee6", "#145f49", "#0e4938"],
    ["#e1ecf4", "#275b83", "#204c6c"],
    ["#f8e9d7", "#a45b16", "#81440d"],
    ["#ebe6f3", "#65508d", "#514071"],
    ["#edf0d9", "#6d7b25", "#526018"],
    ["#f2e4e8", "#984a63", "#77364c"]
  ];
  const MAX_IMPORT_FILE_BYTES = 1024 * 1024;
  const SCHEDULE_TRANSFER = window.MSDS_SCHEDULE_TRANSFER;

  // 首次访问时默认选中的核心课程班次
  const DEFAULT_SELECTIONS = [
    { code: "DSC5003", section: "C62" },
    { code: "DSC5001", section: "C61" },
    { code: "DSC5002", section: "C62" }
  ];

  let courseData;
  let activeTerm = MSDS.getActiveTerm();
  let courses = [];
  let selections = {};
  let searchTerm = "";
  let activeFilter = "all";
  let activeDay = "all";
  let currentConflictPairs = [];

  const listElement = document.getElementById("course-list");
  const selectedListElement = document.getElementById("selected-list");
  const plannerElement = document.getElementById("planner-shell");

  function courseByCode(code) {
    return courses.find((course) => course.code === code);
  }

  function initializedKey(term) {
    return `${INITIALIZED_KEY_PREFIX}-${MSDS.normalizeTerm(term) || MSDS.DEFAULT_TERM}`;
  }

  function detailHref(code) {
    return MSDS.courseHref(code, activeTerm);
  }

  function coursesForTerm(data, term) {
    return data.courses
      .filter((course) => MSDS.courseOfferedInTerm(course, term))
      .map((course) => ({
        ...course,
        active_term: term,
        eligible_sections: MSDS.sectionsForTerm(course, term)
      }));
  }

  function courseFilterType(course) {
    return MSDS.isProjectCourse(course) ? "project" : course.requirement_type;
  }

  function findProjectConflict(course) {
    if (!MSDS.isProjectCourse(course)) return null;
    const conflictCodes = MSDS.projectConflictCodes(course);
    for (const term of MSDS.TERM_CODES) {
      const termSelections = term === activeTerm ? selections : MSDS.getStoredSelections(term);
      for (const conflictCode of conflictCodes) {
        if (term === activeTerm && conflictCode === course.code) continue;
        if (MSDS.isUnscheduledSelection(termSelections[conflictCode])) {
          const conflictCourse = courseData.courses.find((item) => item.code === conflictCode);
          if (conflictCourse && !MSDS.courseOfferedInTerm(conflictCourse, term)) continue;
          if (conflictCourse && !MSDS.getSelectionEligibility(courseData, conflictCourse).eligible) continue;
          return { code: conflictCode, term };
        }
      }
    }
    return null;
  }

  function showProjectConflict(course, conflict) {
    const conflictCourse = courseData.courses.find((item) => item.code === conflict.code);
    const termLabel = MSDS.getTermLabel(courseData, conflict.term, false);
    const conflictTitle = conflictCourse?.programme_title || conflict.code;
    const message = conflict.code === course.code
      ? `${conflictTitle} 已加入 ${termLabel}，请先在该学期移除。`
      : `${conflictTitle} 已加入 ${termLabel}；${course.code} 与 ${conflict.code} 只能选一门，请先移除。`;
    MSDS.showToast(message, { duration: 5200 });
  }

  function sanitizeSelectionsForTerm(value) {
    const sanitized = {};
    Object.entries(value || {}).forEach(([code, selection]) => {
      const course = courseByCode(code);
      if (!course) return;
      if (MSDS.allowsUnscheduledSelection(course, activeTerm)) {
        if (MSDS.isUnscheduledSelection(selection)) {
          sanitized[code] = MSDS.makeUnscheduledSelection();
        }
        return;
      }
      const primary = MSDS.findSection(course, selection?.primaryCrn);
      if (!primary || Number(primary.credits) <= 0) return;
      const tutorial = MSDS.findSection(course, selection?.tutorialCrn);
      sanitized[code] = {
        primaryCrn: MSDS.sectionKey(primary),
        tutorialCrn: tutorial && Number(tutorial.credits) === 0 ? MSDS.sectionKey(tutorial) : null
      };
    });
    return sanitized;
  }

  function scheduleSnapshot() {
    return Object.fromEntries(MSDS.TERM_CODES.map((term) => [
      term,
      term === activeTerm ? selections : MSDS.getStoredSelections(term)
    ]));
  }

  function scheduleTransferOptions() {
    return { eligibilityConfirmations: MSDS.getEligibilityConfirmations() };
  }

  function announceScheduleFile(message, toastOptions = {}) {
    document.getElementById("schedule-file-announcement").textContent = message;
    MSDS.showToast(message, toastOptions);
  }

  function exportSchedule() {
    try {
      const result = SCHEDULE_TRANSFER.serializeSchedule(
        courseData,
        scheduleSnapshot(),
        scheduleTransferOptions()
      );
      if (!result.courseCount) {
        announceScheduleFile("A、B、S 三学期暂无可导出的课程。");
        return;
      }

      const academicYear = String(courseData.academic_year || "course-plan")
        .replace(/[^0-9A-Za-z]+/g, "-")
        .replace(/^-|-$/g, "");
      const blob = new Blob(["\uFEFF", result.text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const download = document.createElement("a");
      download.href = url;
      download.download = `cityuds-course-plan-${academicYear || "backup"}.txt`;
      download.hidden = true;
      document.body.append(download);
      download.click();
      download.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      announceScheduleFile(`已导出 ${result.courseCount} 门课程、${result.sectionCount} 个班次。`);
    } catch (error) {
      announceScheduleFile(`导出失败：${error.message}`, { duration: 6000 });
    }
  }

  async function importScheduleFile(file) {
    if (!file) return;
    const importButton = document.getElementById("import-schedule");
    const toolbar = importButton.closest(".toolbar-actions");
    const originalLabel = importButton.textContent;
    importButton.disabled = true;
    importButton.textContent = "正在导入…";
    toolbar.setAttribute("aria-busy", "true");

    try {
      if (!/\.txt$/i.test(file.name || "")) {
        throw new Error("请选择 .txt 格式的课表文件。");
      }
      if (file.size > MAX_IMPORT_FILE_BYTES) {
        throw new Error("文件超过 1 MB，无法作为课表备份导入。");
      }
      const text = await file.text();
      if (text.includes("\uFFFD")) {
        throw new Error("文件不是有效的 UTF-8 文本，请重新导出后再试。");
      }
      const result = SCHEDULE_TRANSFER.parseSchedule(
        text,
        courseData,
        scheduleTransferOptions()
      );
      const confirmed = window.confirm(
        `将用文件中的 ${result.courseCount} 门课程覆盖当前 A、B、S 三份课表。此操作不会修改课程数据，是否继续？`
      );
      if (!confirmed) {
        announceScheduleFile("已取消导入，当前课表没有变化。");
        return;
      }

      SCHEDULE_TRANSFER.replaceStoredSelections(localStorage, result.selectionsByTerm, {
        selectionKeyForTerm: MSDS.selectionStorageKey,
        initializedKeyForTerm: initializedKey
      });
      selections = sanitizeSelectionsForTerm(result.selectionsByTerm[activeTerm]);
      renderAll("#import-schedule");
      announceScheduleFile(
        `已导入 ${result.courseCount} 门课程、${result.sectionCount} 个班次，A、B、S 三学期课表已更新。`,
        { duration: 5200 }
      );
    } catch (error) {
      announceScheduleFile(`导入失败：${error.message}`, { duration: 7000 });
    } finally {
      importButton.disabled = false;
      importButton.textContent = originalLabel;
      toolbar.removeAttribute("aria-busy");
    }
  }

  function filterCourses() {
    return courses.filter((course) => {
      const haystack = `${course.code} ${course.programme_title}`.toLowerCase();
      const matchesSearch = haystack.includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === "all"
        || courseFilterType(course) === activeFilter;
      const primaryDays = course.eligible_sections
        .filter((section) => Number(section.credits) > 0)
        .map((section) => section.day);
      const matchesDay = activeDay === "all" || primaryDays.includes(activeDay);
      return matchesSearch && matchesFilter && matchesDay;
    });
  }

  function renderCourseList() {
    const filtered = filterCourses();
    const termLabel = MSDS.getTermLabel(courseData, activeTerm, false);
    document.getElementById("course-result-status").textContent = `${termLabel}：显示 ${filtered.length} 门课程`;
    if (!filtered.length) {
      listElement.innerHTML = '<div class="empty-list">没有符合条件的课程</div>';
      return;
    }

    listElement.innerHTML = filtered.map((course) => {
      const rec = MSDS.getRecommendation(course);
      const isProject = MSDS.isProjectCourse(course);
      const allowsUnscheduled = MSDS.allowsUnscheduledSelection(course, activeTerm);
      const isAdded = Boolean(selections[course.code]);
      const primaries = course.eligible_sections.filter((item) => Number(item.credits) > 0);
      const eligibility = MSDS.getSelectionEligibility(courseData, course);
      const hasAddableCourse = allowsUnscheduled || primaries.length > 0;
      const canAdd = hasAddableCourse && eligibility.eligible;
      const scheduleText = isProject
        ? "项目课 · 无需选择班次，不在周课表显示"
        : allowsUnscheduled
          ? `无需选择班次 · 按必修课计 ${course.credits} 学分，不在周课表显示`
        : hasAddableCourse
          ? primaries.map((item) => [MSDS.DAY_NAMES[item.day] || item.day, item.time].filter(Boolean).join(" ") || "时间待定").join(" / ")
          : "该学期开设，但暂无可选班次";
      const availabilityId = `course-availability-${course.code}`;
      const eligibilityId = `course-eligibility-${course.code}`;
      const eligibilityText = [
        eligibility.audienceNote,
        eligibility.hasRequirement
          ? `${eligibility.eligible ? "条件已满足" : "选课条件"}：${eligibility.requirementText}`
          : ""
      ].filter(Boolean).join("；");
      const eligibilityConfirmations = [
        eligibility.confirmationKey
          ? {
              key: eligibility.confirmationKey,
              checked: eligibility.confirmationMet,
              label: `我确认：${eligibility.audienceNote}`,
              toastLabel: "学生身份"
            }
          : null,
        eligibility.minimumCreditsConfirmationKey
          ? {
              key: eligibility.minimumCreditsConfirmationKey,
              checked: eligibility.minimumCreditsConfirmationMet,
              label: eligibility.minimumCreditsConfirmationLabel,
              toastLabel: "15 学分修读情况"
            }
          : null
      ].filter(Boolean);
      const selectedPrimary = selections[course.code]?.primaryCrn;
      return `
        <article class="course-row ${isAdded ? "is-selected" : ""} ${isProject ? "is-project" : ""} ${!hasAddableCourse ? "is-awaiting-sections" : !eligibility.eligible ? "is-ineligible" : ""}">
          <div class="course-row-main">
            <div class="course-code-line">
              <span class="course-code">${MSDS.escapeHtml(course.code)}</span>
              ${isProject ? '<span class="mini-badge project">项目</span>' : course.requirement_type === "core" ? '<span class="mini-badge core">核心</span>' : MSDS.recommendationBadge(rec, true)}
            </div>
            <a class="course-title-link" href="${MSDS.escapeHtml(detailHref(course.code))}">${MSDS.escapeHtml(course.programme_title)}</a>
            <div class="course-meta"><span>${course.credits} 学分</span><span>${allowsUnscheduled ? "无需班次" : `${primaries.length} 个主课班次`}</span></div>
            <div id="${MSDS.escapeHtml(availabilityId)}" class="course-schedule${isProject ? " course-project-note" : hasAddableCourse ? "" : " course-availability-note"}" title="${MSDS.escapeHtml(scheduleText)}">${MSDS.escapeHtml(scheduleText)}</div>
            ${eligibilityText ? `<p id="${MSDS.escapeHtml(eligibilityId)}" class="course-eligibility ${eligibility.eligible ? "is-met" : "is-unmet"}" title="${MSDS.escapeHtml(eligibility.statusText)}">${MSDS.escapeHtml(eligibilityText)}</p>` : ""}
            ${eligibilityConfirmations.length ? `<div class="course-eligibility-confirmations">${eligibilityConfirmations.map((confirmation) => `<label class="course-eligibility-confirmation"><input type="checkbox" data-eligibility-confirm="${MSDS.escapeHtml(confirmation.key)}" data-eligibility-confirm-label="${MSDS.escapeHtml(confirmation.toastLabel)}"${confirmation.checked ? " checked" : ""}${isAdded && confirmation.checked ? " disabled" : ""} aria-describedby="${MSDS.escapeHtml(eligibilityId)}"><span>${MSDS.escapeHtml(confirmation.label)}</span></label>`).join("")}</div>` : ""}
            <p class="course-insight">${MSDS.escapeHtml(rec.summary)}</p>
            ${primaries.length > 1 ? `<label class="quick-section-picker"><span>选择时间</span><select data-quick-section="${MSDS.escapeHtml(course.code)}" aria-label="选择 ${MSDS.escapeHtml(course.code)} 上课时间">${sectionOptions(primaries, selectedPrimary || MSDS.sectionKey(primaries[0]))}</select></label>` : ""}
          </div>
          ${!hasAddableCourse
            ? `<button class="add-course is-awaiting-sections" type="button" disabled aria-describedby="${MSDS.escapeHtml(availabilityId)}"><span aria-hidden="true">…</span><span>待班次</span></button>`
            : isAdded
              ? `<button class="add-course is-added" type="button" data-code="${MSDS.escapeHtml(course.code)}" aria-label="从课表移除 ${MSDS.escapeHtml(course.code)}"><span aria-hidden="true">−</span><span>移除</span></button>`
              : !canAdd
                ? `<button class="add-course is-ineligible" type="button" disabled aria-describedby="${MSDS.escapeHtml(eligibilityId)}"><span aria-hidden="true">!</span><span>未满足</span></button>`
              : `<button class="add-course" type="button" data-code="${MSDS.escapeHtml(course.code)}" aria-label="加入 ${MSDS.escapeHtml(course.code)}"><span aria-hidden="true">+</span><span>加入</span></button>`}
        </article>`;
    }).join("");
  }

  function sectionOptions(sections, selectedKey) {
    return sections.map((section) => {
      const key = MSDS.sectionKey(section);
      const webNote = section.web === "N" ? " · 非网页注册" : "";
      return `<option value="${MSDS.escapeHtml(key)}" ${String(selectedKey) === key ? "selected" : ""}>${MSDS.escapeHtml(MSDS.formatSection(section) + webNote)}</option>`;
    }).join("");
  }

  function renderSelectedList() {
    const selectedCourses = courses.filter((course) => selections[course.code]);
    if (!selectedCourses.length) {
      selectedListElement.innerHTML = '<div class="empty-list"><strong>还没有课程</strong><br>回到“浏览课程”开始排课</div>';
      return;
    }

    selectedListElement.innerHTML = selectedCourses.map((course) => {
      const selected = selections[course.code];
      const isProject = MSDS.isProjectCourse(course);
      const isUnscheduled = MSDS.allowsUnscheduledSelection(course, activeTerm)
        && MSDS.isUnscheduledSelection(selected);
      const eligibility = MSDS.getSelectionEligibility(courseData, course);
      const primaries = course.eligible_sections.filter((section) => Number(section.credits) > 0);
      const tutorials = course.eligible_sections.filter((section) => Number(section.credits) === 0);
      const hasConflict = currentConflictPairs.some((pair) => pair.some((event) => event.course.code === course.code));
      return `
        <article class="selected-course ${isProject ? "is-project" : ""} ${hasConflict ? "has-conflict" : ""}">
          <div class="selected-course-head">
            <div><a href="${MSDS.escapeHtml(detailHref(course.code))}">${MSDS.escapeHtml(course.code)}</a><small>${MSDS.escapeHtml(course.programme_title)}</small></div>
            <button class="remove-course" type="button" data-selected-remove="${MSDS.escapeHtml(course.code)}" aria-label="移除 ${MSDS.escapeHtml(course.code)}">移除</button>
          </div>
          ${isUnscheduled
            ? `<p class="section-selects-title">无需选择班次</p><p class="${isProject ? "selected-project-note" : "selected-unscheduled-note"}">不在周课表显示；${isProject ? "计入三学期总门数和总学分" : `按必修课计入 1 门 ${course.credits} 学分`}。</p>`
            : `<p class="section-selects-title">更改班次和时间${hasConflict ? '<span class="selected-conflict-label">时间冲突</span>' : ""}</p>
              <div class="section-selects">
                <label>主课<select data-code="${MSDS.escapeHtml(course.code)}" data-kind="primary">${sectionOptions(primaries, selected.primaryCrn)}</select></label>
                ${tutorials.length ? `<label>Tutorial<select data-code="${MSDS.escapeHtml(course.code)}" data-kind="tutorial"><option value="">不选择</option>${sectionOptions(tutorials, selected.tutorialCrn)}</select></label>` : ""}
              </div>`}
          ${!eligibility.eligible ? `<p class="selected-eligibility-warning">资格条件已不满足：${MSDS.escapeHtml(eligibility.statusText.replace(/^当前排课记录未满足：/, ""))}</p>` : ""}
        </article>`;
    }).join("");
  }

  function renderSelectedChips() {
    const selectedCourses = courses.filter((course) => selections[course.code]);
    const container = document.getElementById("selected-chips");
    if (!selectedCourses.length) {
      container.innerHTML = '<span class="selected-chips-empty">加入课程后，可点击课表块查看详情</span>';
      return;
    }
    container.innerHTML = selectedCourses.map((course) => `
      <span class="selected-chip">
        <a href="${MSDS.escapeHtml(detailHref(course.code))}">${MSDS.escapeHtml(course.code)}</a>
        <button type="button" data-chip-remove="${MSDS.escapeHtml(course.code)}" aria-label="移除 ${MSDS.escapeHtml(course.code)}">×</button>
      </span>`).join("");
  }

  function minutes(time) {
    const [hours, mins] = time.split(":").map(Number);
    return hours * 60 + mins;
  }

  function selectedEvents() {
    const events = [];
    courses.forEach((course, courseIndex) => {
      const selected = selections[course.code];
      if (!selected) return;
      if (MSDS.isUnscheduledSelection(selected)) return;
      [selected.primaryCrn, selected.tutorialCrn].filter(Boolean).forEach((key) => {
        const section = MSDS.findSection(course, key);
        if (!section || !section.time || !DAYS.includes(section.day)) return;
        const [startText, endText] = section.time.split(" - ");
        events.push({
          id: `${course.code}-${key}`,
          course,
          section,
          start: minutes(startText),
          end: minutes(endText),
          color: COLORS[courseIndex % COLORS.length],
          conflict: false,
          lane: 0,
          laneCount: 1
        });
      });
    });

    DAYS.forEach((day) => {
      const dayEvents = events.filter((event) => event.section.day === day).sort((a, b) => a.start - b.start || a.end - b.end);
      const laneEnds = [];
      dayEvents.forEach((event) => {
        let lane = laneEnds.findIndex((end) => end <= event.start);
        if (lane === -1) lane = laneEnds.length;
        laneEnds[lane] = event.end;
        event.lane = lane;
      });
      const count = Math.max(1, laneEnds.length);
      dayEvents.forEach((event) => { event.laneCount = count; });
    });
    return events;
  }

  function findConflictPairs(events) {
    const pairs = [];
    events.forEach((event, index) => {
      events.slice(index + 1).forEach((other) => {
        if (event.section.day !== other.section.day || event.start >= other.end || other.start >= event.end) return;
        event.conflict = true;
        other.conflict = true;
        pairs.push([event, other]);
      });
    });
    return pairs;
  }

  function eventDescription(event) {
    return `${event.course.code} ${event.section.section}，${MSDS.DAY_NAMES[event.section.day]} ${event.section.time}`;
  }

  function renderTimeAxis() {
    const axis = document.getElementById("time-axis");
    axis.innerHTML = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => {
      const hour = START_HOUR + index;
      return `<span class="time-label" style="top:${index * 60}px">${String(hour).padStart(2, "0")}:00</span>`;
    }).join("");
  }

  function renderTimetable() {
    const events = selectedEvents();
    currentConflictPairs = findConflictPairs(events);
    const columns = document.getElementById("day-columns");
    columns.innerHTML = DAYS.map((day) => {
      const blocks = events.filter((event) => event.section.day === day).map((event) => {
        const top = ((event.start - START_HOUR * 60) / 60) * 60;
        const height = Math.max(34, ((event.end - event.start) / 60) * 60);
        const width = 100 / event.laneCount;
        const left = event.lane * width;
        const room = [event.section.building, event.section.room].filter(Boolean).join(" ");
        const recommendation = MSDS.getRecommendation(event.course);
        const tooltipTags = recommendation.tags.slice(0, 3).map((tag) => `<span class="event-tooltip-tag">${MSDS.escapeHtml(tag)}</span>`).join("");
        const conflictNote = event.conflict ? "，与其他课程时间冲突" : "";
        return `<article class="course-event ${event.conflict ? "is-conflict" : ""} ${event.start >= 19 * 60 ? "tooltip-up" : ""} ${["F", "S"].includes(event.section.day) ? "tooltip-left" : ""}"
          data-event-id="${MSDS.escapeHtml(event.id)}"
          data-event-code="${MSDS.escapeHtml(event.course.code)}"
          style="top:${top}px;height:${height}px;left:calc(${left}% + 3px);width:calc(${width}% - 6px);--event-bg:${event.color[0]};--event-accent:${event.color[1]};--event-ink:${event.color[2]}">
          <a class="event-main-link" href="${MSDS.escapeHtml(detailHref(event.course.code))}" data-event-link aria-label="查看 ${MSDS.escapeHtml(eventDescription(event) + conflictNote)} 的课程详情">
            <span class="event-label"><strong>${MSDS.escapeHtml(event.course.code)} · ${MSDS.escapeHtml(event.section.section)}</strong>
              <span>${MSDS.escapeHtml(event.section.time)}</span>
              <span>${MSDS.escapeHtml(room)}</span>
            </span>
          </a>
          <span class="event-overlay">
            <span class="event-overlay-content"><strong>${MSDS.escapeHtml(event.course.programme_title)}</strong><span>${MSDS.escapeHtml(MSDS.DAY_NAMES[event.section.day])} · ${MSDS.escapeHtml(event.section.time)}</span><span>${MSDS.escapeHtml(room || "地点待定")}</span><span class="event-tooltip-tags">${tooltipTags || `<span class="event-tooltip-tag">${MSDS.escapeHtml(recommendation.verdict)}</span>`}</span></span>
            <span class="event-overlay-actions"><a href="${MSDS.escapeHtml(detailHref(event.course.code))}" data-event-link>详情</a><button type="button" data-event-remove="${MSDS.escapeHtml(event.course.code)}">删除</button></span>
          </span>
        </article>`;
      }).join("");
      return `<div class="day-column" data-day-column="${day}">${blocks}</div>`;
    }).join("");

    const emptyTimetable = document.getElementById("empty-timetable");
    const selectedCourseCount = courses.filter((course) => selections[course.code]).length;
    emptyTimetable.hidden = events.length > 0;
    if (!events.length) {
      emptyTimetable.innerHTML = selectedCourseCount
        ? '<span class="empty-plus">…</span><strong>已选课程暂无排课时间</strong><p>请在“已选”中查看班次，最终时间以 AIMS 为准</p>'
        : '<span class="empty-plus">+</span><strong>从左侧加入课程</strong><p>班次可在“已选”中切换</p>';
    }
    const status = document.getElementById("conflict-status");
    const details = document.getElementById("conflict-details");
    const announcement = document.getElementById("conflict-announcement");
    if (currentConflictPairs.length) {
      const wasExpanded = status.getAttribute("aria-expanded") === "true";
      status.className = "conflict-status has-conflict";
      status.textContent = `${currentConflictPairs.length} 处时间冲突`;
      status.disabled = false;
      status.setAttribute("aria-expanded", String(wasExpanded));
      status.setAttribute("aria-label", `${currentConflictPairs.length} 处时间冲突，点击查看详情`);
      announcement.textContent = `检测到 ${currentConflictPairs.length} 处课程时间冲突`;
      details.innerHTML = `
        <div class="conflict-details-head"><strong>需要调整的课程</strong><span>点击一组冲突可在课表中定位</span></div>
        <div class="conflict-pair-list">${currentConflictPairs.map((pair, index) => `
          <button type="button" data-conflict-index="${index}">
            <span>${MSDS.escapeHtml(eventDescription(pair[0]))}</span>
            <strong>与</strong>
            <span>${MSDS.escapeHtml(eventDescription(pair[1]))}</span>
          </button>`).join("")}</div>`;
      details.hidden = !wasExpanded;
    } else {
      status.className = "conflict-status is-clear";
      status.textContent = "暂无冲突";
      status.disabled = true;
      status.setAttribute("aria-expanded", "false");
      status.setAttribute("aria-label", "暂无课程时间冲突");
      announcement.textContent = "当前课表没有时间冲突";
      details.hidden = true;
      details.replaceChildren();
    }
  }

  function updateSummary() {
    const currentTermSelectedCourses = courses.filter((course) => {
      const selection = selections[course.code];
      if (MSDS.allowsUnscheduledSelection(course, activeTerm)) {
        return MSDS.isUnscheduledSelection(selection);
      }
      return Number(MSDS.findSection(course, selection?.primaryCrn)?.credits) > 0;
    });
    const selectedEntries = MSDS.TERM_CODES.flatMap((term) => {
      const termCourses = coursesForTerm(courseData, term);
      const termSelections = term === activeTerm ? selections : MSDS.getStoredSelections(term);
      return termCourses.flatMap((course) => {
        if (!MSDS.getSelectionEligibility(courseData, course).eligible) return [];
        if (MSDS.allowsUnscheduledSelection(course, term)) {
          return MSDS.isUnscheduledSelection(termSelections[course.code]) ? [{ course, term }] : [];
        }
        const selectedPrimary = MSDS.findSection(course, termSelections[course.code]?.primaryCrn);
        return Number(selectedPrimary?.credits) > 0 ? [{ course, term }] : [];
      });
    });
    const regularCourses = selectedEntries
      .map((entry) => entry.course)
      .filter((course) => !MSDS.isProjectCourse(course));
    const projectsByKey = new Map();
    selectedEntries.forEach(({ course }) => {
      if (!MSDS.isProjectCourse(course)) return;
      const key = MSDS.projectSelectionKey(course);
      if (!projectsByKey.has(key)) projectsByKey.set(key, course);
    });
    const projectCourses = [...projectsByKey.values()];
    const selectedCourses = [...regularCourses, ...projectCourses];
    const coreCourses = regularCourses.filter((course) => course.requirement_type === "core");
    const electiveCourses = regularCourses.filter((course) => course.requirement_type === "elective");
    const sumCredits = (items) => items.reduce((sum, course) => sum + Number(course.credits || 0), 0);

    document.getElementById("core-count").textContent = coreCourses.length;
    document.getElementById("core-credit-count").textContent = sumCredits(coreCourses);
    document.getElementById("elective-count").textContent = electiveCourses.length;
    document.getElementById("elective-credit-count").textContent = sumCredits(electiveCourses);
    document.getElementById("selected-count").textContent = selectedCourses.length;
    document.getElementById("selected-tab-count").textContent = currentTermSelectedCourses.length;
    document.getElementById("mobile-selected-count").textContent = currentTermSelectedCourses.length;
    document.getElementById("credit-count").textContent = sumCredits(selectedCourses);
    document.getElementById("project-summary-parts").innerHTML = projectCourses.map((course) => `
      <span class="selection-summary-plus" aria-hidden="true">+</span>
      <span class="selection-summary-part project-summary-part">${MSDS.escapeHtml(course.programme_title)} <strong>${MSDS.escapeHtml(course.credits)}</strong>分</span>`).join("");
    document.getElementById("clear-selection").disabled = currentTermSelectedCourses.length === 0;
  }

  function restoreFocus(selector) {
    if (!selector) return;
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function renderAll(focusSelector) {
    MSDS.saveSelections(activeTerm, selections);
    renderCourseList();
    renderTimetable();
    renderSelectedList();
    renderSelectedChips();
    updateSummary();
    restoreFocus(focusSelector);
  }

  function applyDefaultSelections() {
    const termInitializedKey = initializedKey(activeTerm);
    const hasStoredState = localStorage.getItem(MSDS.selectionStorageKey(activeTerm)) !== null;
    const wasInitialized = localStorage.getItem(termInitializedKey) === "1";
    const wasLegacyInitialized = activeTerm === MSDS.DEFAULT_TERM
      && localStorage.getItem(LEGACY_INITIALIZED_KEY) === "1";
    if (activeTerm !== MSDS.DEFAULT_TERM) {
      localStorage.setItem(termInitializedKey, "1");
      return;
    }
    if (hasStoredState || wasInitialized || wasLegacyInitialized) {
      localStorage.setItem(termInitializedKey, "1");
      return;
    }
    DEFAULT_SELECTIONS.forEach(({ code, section }) => {
      const course = courseByCode(code);
      if (!course || selections[code]) return;
      const primary = course.eligible_sections.find(
        (s) => s.section === section && Number(s.credits) > 0
      );
      if (primary) {
        selections[code] = selectionForPrimary(course, MSDS.sectionKey(primary));
      }
    });
    MSDS.saveSelections(activeTerm, selections);
    localStorage.setItem(termInitializedKey, "1");
  }

  function selectionForPrimary(course, primaryCrn) {
    const selection = MSDS.makeDefaultSelection(course);
    if (!primaryCrn) return selection;
    selection.primaryCrn = primaryCrn;
    const tutorials = course.eligible_sections.filter((section) => Number(section.credits) === 0);
    const matching = MSDS.makeDefaultSelection({
      ...course,
      eligible_sections: [MSDS.findSection(course, primaryCrn), ...tutorials].filter(Boolean)
    });
    selection.tutorialCrn = matching.tutorialCrn;
    return selection;
  }

  function findInvalidatedDependent(nextSelections) {
    const selectionOverrides = { [activeTerm]: nextSelections };
    for (const term of MSDS.TERM_CODES) {
      const termSelections = term === activeTerm ? nextSelections : MSDS.getStoredSelections(term);
      const termCourses = coursesForTerm(courseData, term);
      for (const dependent of termCourses) {
        if (!dependent.selection_requirement) continue;
        if (MSDS.selectedCreditsInTerm(dependent, termSelections[dependent.code], term) <= 0) continue;
        const before = MSDS.getSelectionEligibility(courseData, dependent);
        const after = MSDS.getSelectionEligibility(courseData, dependent, selectionOverrides);
        if (before.eligible && !after.eligible) return { course: dependent, term, after };
      }
    }
    return null;
  }

  function showDependentBlock(action, dependent) {
    const termLabel = MSDS.getTermLabel(courseData, dependent.term, false);
    MSDS.showToast(
      `无法${action}：会使 ${termLabel} 的 ${dependent.course.code} 不再满足选课条件。请先移除 ${dependent.course.code}。`,
      { duration: 6000 }
    );
  }

  function removeCourse(code, focusSelector) {
    if (!selections[code]) return;
    const nextSelections = { ...selections };
    delete nextSelections[code];
    const invalidatedDependent = findInvalidatedDependent(nextSelections);
    if (invalidatedDependent) {
      showDependentBlock(`移除 ${code}`, invalidatedDependent);
      return;
    }
    const removedSelection = { ...selections[code] };
    delete selections[code];
    renderAll(focusSelector || `button[data-code="${code}"]`);
    MSDS.showToast(`已移除 ${code}`, {
      actionLabel: "撤销",
      onAction: () => {
        const course = courseByCode(code);
        const conflict = course && findProjectConflict(course);
        if (conflict) {
          showProjectConflict(course, conflict);
          return;
        }
        selections[code] = removedSelection;
        renderAll(`button[data-code="${code}"]`);
        MSDS.showToast(`已恢复 ${code}`);
      }
    });
  }

  function toggleCourse(code, primaryCrn) {
    const course = courseByCode(code);
    if (!course) return;
    if (selections[code]) {
      removeCourse(code);
      return;
    }
    const eligibility = MSDS.getSelectionEligibility(courseData, course);
    if (!eligibility.eligible) {
      MSDS.showToast(`${code} 暂不可选：${eligibility.statusText.replace(/^当前排课记录未满足：/, "")}`, { duration: 5200 });
      return;
    }
    const isProject = MSDS.isProjectCourse(course);
    const allowsUnscheduled = MSDS.allowsUnscheduledSelection(course, activeTerm);
    if (isProject) {
      const conflict = findProjectConflict(course);
      if (conflict) {
        showProjectConflict(course, conflict);
        return;
      }
    }
    if (allowsUnscheduled) {
      selections[code] = MSDS.makeUnscheduledSelection();
      MSDS.showToast(isProject
        ? `已加入 ${code}；无需选择班次，不在周课表显示`
        : `已加入 ${code}；按必修课计入 1 门 ${course.credits} 学分，不在周课表显示`);
    } else if (!course.eligible_sections.some((section) => Number(section.credits) > 0)) {
      MSDS.showToast(`${code} 该学期开设，但暂无可选班次`);
      return;
    } else {
      selections[code] = selectionForPrimary(course, primaryCrn);
      MSDS.showToast(`已加入 ${code}`);
    }
    renderAll(`button[data-code="${code}"]`);
  }

  function activateSidebarTab(button, moveFocus = false) {
    const selectedPanel = button.dataset.panel;
    document.querySelectorAll(".segment").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    document.getElementById("browse-panel").hidden = selectedPanel !== "browse";
    document.getElementById("selected-panel").hidden = selectedPanel !== "selected";
    if (moveFocus) button.focus();
  }

  function setMobileWorkspace(value) {
    plannerElement.dataset.mobileWorkspace = value;
    document.querySelectorAll("[data-mobile-workspace]").forEach((button) => {
      if (button === plannerElement) return;
      const active = button.dataset.mobileWorkspace === value;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function updateTermContext(announce = false) {
    const termLabel = MSDS.getTermLabel(courseData, activeTerm, false);
    const fullTermLabel = MSDS.getTermLabel(courseData, activeTerm, true);
    const termConfig = courseData.terms.find((item) => item.code === activeTerm) || {};
    const scheduleAsOf = termConfig.schedule_as_of || courseData.schedule_as_of || "";

    document.getElementById("term-select").value = activeTerm;
    document.getElementById("site-term-label").textContent = fullTermLabel;
    document.getElementById("timetable-term-label").textContent = termLabel;
    document.title = `MSDS 选课板 · ${fullTermLabel}`;
    document.querySelector(".brand").href = MSDS.plannerHref(activeTerm);
    document.querySelector('.main-nav a[href^="index.html"]').href = MSDS.plannerHref(activeTerm);
    document.querySelector(".intro-stat-guide").href = `aims-fields.html?term=${encodeURIComponent(activeTerm)}`;
    document.getElementById("schedule-data-note").textContent = scheduleAsOf
      ? `${termLabel} 课表快照：${scheduleAsOf}，数据采集自 CityU AIMS 系统。名额和注册状态会变化，请以 CityU 系统为准。`
      : `${termLabel} 课表数据采集自 CityU AIMS 系统。名额和注册状态会变化，请以 CityU 系统为准。`;

    if (announce) {
      const selectedCount = courses.filter((course) => selections[course.code]).length;
      document.getElementById("term-announcement").textContent = `已切换到 ${fullTermLabel}，显示 ${courses.length} 门课程，当前课表 ${selectedCount} 门。`;
    }
  }

  function activateTerm(term, announce = false) {
    activeTerm = MSDS.setActiveTerm(term);
    const canonicalUrl = new URL(window.location.href);
    canonicalUrl.searchParams.set("term", activeTerm);
    window.history.replaceState(null, "", canonicalUrl);
    plannerElement.setAttribute("aria-busy", "true");
    courses = coursesForTerm(courseData, activeTerm);
    selections = sanitizeSelectionsForTerm(MSDS.getStoredSelections(activeTerm));
    applyDefaultSelections();
    updateTermContext(announce);
    renderAll();
    plannerElement.setAttribute("aria-busy", "false");
  }

  function focusConflictPair(index) {
    const pair = currentConflictPairs[index];
    if (!pair) return;
    setMobileWorkspace("timetable");
    document.querySelectorAll(".course-event.is-emphasized").forEach((event) => event.classList.remove("is-emphasized"));
    const elements = pair.map((event) => document.querySelector(`[data-event-id="${event.id}"]`)).filter(Boolean);
    elements.forEach((element) => element.classList.add("is-emphasized"));
    elements[0]?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center",
      inline: "center"
    });
    window.clearTimeout(focusConflictPair.timer);
    focusConflictPair.timer = window.setTimeout(() => {
      elements.forEach((element) => element.classList.remove("is-emphasized"));
    }, 1800);
  }

  function bindEvents() {
    document.getElementById("term-select").addEventListener("change", (event) => {
      activateTerm(event.target.value, true);
    });

    document.getElementById("export-schedule").addEventListener("click", exportSchedule);

    const importInput = document.getElementById("import-schedule-file");
    document.getElementById("import-schedule").addEventListener("click", () => {
      importInput.value = "";
      importInput.click();
    });
    importInput.addEventListener("change", async () => {
      const [file] = importInput.files || [];
      await importScheduleFile(file);
      importInput.value = "";
    });

    document.getElementById("course-search").addEventListener("input", (event) => {
      searchTerm = event.target.value.trim();
      renderCourseList();
    });

    document.querySelectorAll(".filter-pill").forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        document.querySelectorAll(".filter-pill").forEach((item) => {
          const active = item === button;
          item.classList.toggle("active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        renderCourseList();
      });
    });

    document.querySelectorAll(".day-filter-pill").forEach((button) => {
      button.addEventListener("click", () => {
        activeDay = button.dataset.dayFilter;
        document.querySelectorAll(".day-filter-pill").forEach((item) => {
          const active = item === button;
          item.classList.toggle("active", active);
          item.setAttribute("aria-pressed", String(active));
        });
        renderCourseList();
      });
    });

    document.querySelectorAll(".segment").forEach((button) => {
      button.addEventListener("click", () => activateSidebarTab(button));
      button.addEventListener("keydown", (event) => {
        const tabs = Array.from(document.querySelectorAll(".segment"));
        const currentIndex = tabs.indexOf(button);
        let nextIndex;
        if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
        if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        if (nextIndex === undefined) return;
        event.preventDefault();
        activateSidebarTab(tabs[nextIndex], true);
      });
    });

    listElement.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-code]");
      if (!button) return;
      const row = button.closest(".course-row");
      const sectionSelect = row?.querySelector("[data-quick-section]");
      toggleCourse(button.dataset.code, sectionSelect?.value);
    });

    listElement.addEventListener("change", (event) => {
      const confirmationInput = event.target.closest("[data-eligibility-confirm]");
      if (confirmationInput) {
        MSDS.setEligibilityConfirmation(confirmationInput.dataset.eligibilityConfirm, confirmationInput.checked);
        renderAll(`[data-eligibility-confirm="${confirmationInput.dataset.eligibilityConfirm}"]`);
        const confirmationLabel = confirmationInput.dataset.eligibilityConfirmLabel || "资格条件";
        MSDS.showToast(confirmationInput.checked ? `已记录${confirmationLabel}确认` : `已取消${confirmationLabel}确认`);
        return;
      }
      const select = event.target.closest("[data-quick-section]");
      if (!select || !selections[select.dataset.quickSection]) return;
      const course = courseByCode(select.dataset.quickSection);
      selections[course.code] = selectionForPrimary(course, select.value);
      renderAll(`[data-quick-section="${course.code}"]`);
      MSDS.showToast(`已切换 ${course.code} 班次`);
    });

    selectedListElement.addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-selected-remove]");
      if (!removeButton) return;
      removeCourse(removeButton.dataset.selectedRemove, "#selected-tab");
    });

    selectedListElement.addEventListener("change", (event) => {
      const select = event.target.closest("select[data-code]");
      if (!select) return;
      const code = select.dataset.code;
      const course = courseByCode(code);
      if (!course || !selections[code]) return;
      if (select.dataset.kind === "primary") {
        selections[code] = selectionForPrimary(course, select.value);
      } else {
        selections[code].tutorialCrn = select.value || null;
      }
      renderAll(`select[data-code="${code}"][data-kind="${select.dataset.kind}"]`);
      MSDS.showToast(`已更新 ${code} 班次和时间`);
    });

    document.getElementById("selected-chips").addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-chip-remove]");
      if (!removeButton) return;
      removeCourse(removeButton.dataset.chipRemove, "#course-search");
    });

    document.getElementById("day-columns").addEventListener("click", (event) => {
      const removeButton = event.target.closest("[data-event-remove]");
      if (removeButton) {
        event.stopPropagation();
        removeCourse(removeButton.dataset.eventRemove, "#course-search");
      }
    });

    document.getElementById("conflict-status").addEventListener("click", (event) => {
      const details = document.getElementById("conflict-details");
      const expanded = event.currentTarget.getAttribute("aria-expanded") === "true";
      event.currentTarget.setAttribute("aria-expanded", String(!expanded));
      details.hidden = expanded;
    });

    document.getElementById("conflict-details").addEventListener("click", (event) => {
      const button = event.target.closest("[data-conflict-index]");
      if (button) focusConflictPair(Number(button.dataset.conflictIndex));
    });

    document.querySelectorAll(".mobile-workspace-switch [data-mobile-workspace]").forEach((button) => {
      button.addEventListener("click", () => setMobileWorkspace(button.dataset.mobileWorkspace));
    });

    document.getElementById("clear-selection").addEventListener("click", () => {
      if (!Object.keys(selections).length) return;
      const invalidatedDependent = findInvalidatedDependent({});
      if (invalidatedDependent) {
        showDependentBlock(`清空 ${MSDS.getTermLabel(courseData, activeTerm, false)} 课表`, invalidatedDependent);
        return;
      }
      const previousSelections = Object.fromEntries(Object.entries(selections).map(([code, value]) => [code, { ...value }]));
      selections = {};
      localStorage.setItem(initializedKey(activeTerm), "1");
      renderAll("#clear-selection");
      MSDS.showToast("课表已清空", {
        actionLabel: "撤销",
        onAction: () => {
          selections = previousSelections;
          renderAll("#clear-selection");
          MSDS.showToast("已恢复课表");
        }
      });
    });
  }

  MSDS.loadCourseData().then((data) => {
    courseData = data;
    document.getElementById("term-select").innerHTML = data.terms.map((term) => `
      <option value="${MSDS.escapeHtml(term.code)}">${MSDS.escapeHtml(MSDS.getTermLabel(data, term.code, true))}</option>`).join("");
    renderTimeAxis();
    bindEvents();
    activateTerm(activeTerm);
  }).catch((error) => {
    listElement.innerHTML = `<div class="empty-list">${MSDS.escapeHtml(error.message)}<br>请通过本地服务器打开网站。</div>`;
  });
})();
