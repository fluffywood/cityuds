(function () {
  "use strict";

  const DAYS = ["M", "T", "W", "R", "F", "S"];
  const START_HOUR = 9;
  const END_HOUR = 22;
  const INITIALIZED_KEY = "MSDS-planner-initialized-v1";
  const COLORS = [
    ["#dceee6", "#145f49", "#0e4938"],
    ["#e1ecf4", "#275b83", "#204c6c"],
    ["#f8e9d7", "#a45b16", "#81440d"],
    ["#ebe6f3", "#65508d", "#514071"],
    ["#edf0d9", "#6d7b25", "#526018"],
    ["#f2e4e8", "#984a63", "#77364c"]
  ];

  // 首次访问时默认选中的核心课程班次
  const DEFAULT_SELECTIONS = [
    { code: "DSC5003", section: "C62" },
    { code: "DSC5001", section: "C61" },
    { code: "DSC5002", section: "C62" }
  ];

  let courses = [];
  let selections = MSDS.getStoredSelections();
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

  function filterCourses() {
    return courses.filter((course) => {
      const haystack = `${course.code} ${course.programme_title}`.toLowerCase();
      const matchesSearch = haystack.includes(searchTerm.toLowerCase());
      const matchesFilter = activeFilter === "all"
        || course.requirement_type === activeFilter;
      const primaryDays = course.eligible_sections
        .filter((section) => Number(section.credits) > 0)
        .map((section) => section.day);
      const matchesDay = activeDay === "all" || primaryDays.includes(activeDay);
      return matchesSearch && matchesFilter && matchesDay;
    });
  }

  function renderCourseList() {
    const filtered = filterCourses();
    document.getElementById("course-result-status").textContent = `显示 ${filtered.length} 门课程`;
    if (!filtered.length) {
      listElement.innerHTML = '<div class="empty-list">没有符合条件的课程</div>';
      return;
    }

    listElement.innerHTML = filtered.map((course) => {
      const rec = MSDS.getRecommendation(course);
      const isOffered = course.offered_this_year !== false;
      const isAdded = isOffered && Boolean(selections[course.code]);
      const primaries = course.eligible_sections.filter((item) => Number(item.credits) > 0);
      const scheduleText = isOffered
        ? primaries.map((item) => `${MSDS.DAY_NAMES[item.day]} ${item.time}`).join(" / ")
        : "本学年不开设";
      const selectedPrimary = selections[course.code]?.primaryCrn;
      return `
        <article class="course-row ${isAdded ? "is-selected" : ""}">
          <div class="course-row-main">
            <div class="course-code-line">
              <span class="course-code">${MSDS.escapeHtml(course.code)}</span>
              ${course.requirement_type === "core" ? '<span class="mini-badge core">核心</span>' : MSDS.recommendationBadge(rec, true)}
            </div>
            <a class="course-title-link" href="course.html?code=${encodeURIComponent(course.code)}">${MSDS.escapeHtml(course.programme_title)}</a>
            <div class="course-meta"><span>${course.credits} 学分</span><span>${primaries.length} 个主课班次</span></div>
            <div class="course-schedule" title="${MSDS.escapeHtml(scheduleText)}">${MSDS.escapeHtml(scheduleText)}</div>
            <p class="course-insight">${MSDS.escapeHtml(rec.summary)}</p>
            ${primaries.length > 1 ? `<label class="quick-section-picker"><span>选择时间</span><select data-quick-section="${MSDS.escapeHtml(course.code)}" aria-label="选择 ${MSDS.escapeHtml(course.code)} 上课时间">${sectionOptions(primaries, selectedPrimary || MSDS.sectionKey(primaries[0]))}</select></label>` : ""}
          </div>
          ${!isOffered
            ? `<button class="add-course is-unavailable" type="button" disabled title="本学年不开设" aria-label="${MSDS.escapeHtml(course.code)} 本学年不开设，无法加入课表"><span aria-hidden="true">×</span><span>不开设</span></button>`
            : isAdded
              ? `<button class="add-course is-added" type="button" data-code="${MSDS.escapeHtml(course.code)}" aria-label="从课表移除 ${MSDS.escapeHtml(course.code)}"><span aria-hidden="true">−</span><span>移除</span></button>`
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
      const primaries = course.eligible_sections.filter((section) => Number(section.credits) > 0);
      const tutorials = course.eligible_sections.filter((section) => Number(section.credits) === 0);
      const hasConflict = currentConflictPairs.some((pair) => pair.some((event) => event.course.code === course.code));
      return `
        <article class="selected-course ${hasConflict ? "has-conflict" : ""}">
          <div class="selected-course-head">
            <div><a href="course.html?code=${encodeURIComponent(course.code)}">${MSDS.escapeHtml(course.code)}</a><small>${MSDS.escapeHtml(course.programme_title)}</small></div>
            <button class="remove-course" type="button" data-selected-remove="${MSDS.escapeHtml(course.code)}" aria-label="移除 ${MSDS.escapeHtml(course.code)}">移除</button>
          </div>
          <p class="section-selects-title">更改班次和时间${hasConflict ? '<span class="selected-conflict-label">时间冲突</span>' : ""}</p>
          <div class="section-selects">
            <label>主课<select data-code="${MSDS.escapeHtml(course.code)}" data-kind="primary">${sectionOptions(primaries, selected.primaryCrn)}</select></label>
            ${tutorials.length ? `<label>Tutorial<select data-code="${MSDS.escapeHtml(course.code)}" data-kind="tutorial"><option value="">不选择</option>${sectionOptions(tutorials, selected.tutorialCrn)}</select></label>` : ""}
          </div>
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
        <a href="course.html?code=${encodeURIComponent(course.code)}">${MSDS.escapeHtml(course.code)}</a>
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
          <a class="event-main-link" href="course.html?code=${encodeURIComponent(event.course.code)}" data-event-link aria-label="查看 ${MSDS.escapeHtml(eventDescription(event) + conflictNote)} 的课程详情">
            <span class="event-label"><strong>${MSDS.escapeHtml(event.course.code)} · ${MSDS.escapeHtml(event.section.section)}</strong>
              <span>${MSDS.escapeHtml(event.section.time)}</span>
              <span>${MSDS.escapeHtml(room)}</span>
            </span>
          </a>
          <span class="event-overlay">
            <span class="event-overlay-content"><strong>${MSDS.escapeHtml(event.course.programme_title)}</strong><span>${MSDS.escapeHtml(MSDS.DAY_NAMES[event.section.day])} · ${MSDS.escapeHtml(event.section.time)}</span><span>${MSDS.escapeHtml(room || "地点待定")}</span><span class="event-tooltip-tags">${tooltipTags || `<span class="event-tooltip-tag">${MSDS.escapeHtml(recommendation.verdict)}</span>`}</span></span>
            <span class="event-overlay-actions"><a href="course.html?code=${encodeURIComponent(event.course.code)}" data-event-link>详情</a><button type="button" data-event-remove="${MSDS.escapeHtml(event.course.code)}">删除</button></span>
          </span>
        </article>`;
      }).join("");
      return `<div class="day-column" data-day-column="${day}">${blocks}</div>`;
    }).join("");

    document.getElementById("empty-timetable").hidden = events.length > 0;
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
    const selectedCourses = courses.filter((course) => selections[course.code]);
    const coreCourses = selectedCourses.filter((course) => course.requirement_type === "core");
    const electiveCourses = selectedCourses.filter((course) => course.requirement_type === "elective");
    const sumCredits = (items) => items.reduce((sum, course) => sum + Number(course.credits || 0), 0);

    document.getElementById("core-count").textContent = coreCourses.length;
    document.getElementById("core-credit-count").textContent = sumCredits(coreCourses);
    document.getElementById("elective-count").textContent = electiveCourses.length;
    document.getElementById("elective-credit-count").textContent = sumCredits(electiveCourses);
    document.getElementById("selected-count").textContent = selectedCourses.length;
    document.getElementById("selected-tab-count").textContent = selectedCourses.length;
    document.getElementById("mobile-selected-count").textContent = selectedCourses.length;
    document.getElementById("credit-count").textContent = sumCredits(selectedCourses);
    document.getElementById("clear-selection").disabled = selectedCourses.length === 0;
  }

  function restoreFocus(selector) {
    if (!selector) return;
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus());
  }

  function renderAll(focusSelector) {
    MSDS.saveSelections(selections);
    renderCourseList();
    renderTimetable();
    renderSelectedList();
    renderSelectedChips();
    updateSummary();
    restoreFocus(focusSelector);
  }

  function applyDefaultSelections() {
    const hasStoredState = localStorage.getItem(MSDS.STORAGE_KEY) !== null;
    const wasInitialized = localStorage.getItem(INITIALIZED_KEY) === "1";
    if (hasStoredState || wasInitialized) {
      localStorage.setItem(INITIALIZED_KEY, "1");
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
    MSDS.saveSelections(selections);
    localStorage.setItem(INITIALIZED_KEY, "1");
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

  function removeCourse(code, focusSelector) {
    if (!selections[code]) return;
    const removedSelection = { ...selections[code] };
    delete selections[code];
    renderAll(focusSelector || `button[data-code="${code}"]`);
    MSDS.showToast(`已移除 ${code}`, {
      actionLabel: "撤销",
      onAction: () => {
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
    } else if (course.offered_this_year === false) {
      MSDS.showToast(`${code} 本学年不开设`);
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
      const previousSelections = Object.fromEntries(Object.entries(selections).map(([code, value]) => [code, { ...value }]));
      selections = {};
      localStorage.setItem(INITIALIZED_KEY, "1");
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
    courses = data.courses;
    applyDefaultSelections();
    renderTimeAxis();
    bindEvents();
    renderAll();
  }).catch((error) => {
    listElement.innerHTML = `<div class="empty-list">${MSDS.escapeHtml(error.message)}<br>请通过本地服务器打开网站。</div>`;
  });
})();
