const { metadata, courses, courseByCode } = require("../../../../data/catalog");
const { documentRoutes } = require("../../../../data/document-routes");
const {
  DAY_NAMES,
  makeDefaultSelection,
  makeInitialSelections,
  makeSelectionForPrimary,
  sanitizeSelections,
  sectionKey
} = require("../../../../utils/planner");
const {
  getActiveTerm,
  getEligibilityConfirmations,
  getStoredSelections,
  initializeStoredSelections,
  normalizeCourseCode,
  saveSelections,
  setActiveTerm,
  setEligibilityConfirmation
} = require("../../../../utils/storage");
const {
  TERM_CODES,
  allowsUnscheduledSelection,
  courseForTerm,
  courseOfferedInTerm,
  findInvalidatedDependent,
  findProjectConflict,
  getSelectionEligibility,
  isProjectCourse,
  isUnscheduledSelection,
  makeUnscheduledSelection,
  normalizeTerm,
  termLabel,
  termOptions
} = require("../../../../utils/course-terms");

function textOrNone(value) {
  return value && value !== "Nil" ? value : "无";
}

function unique(values) {
  return values.filter((value, index) => value && values.indexOf(value) === index);
}

function selectionSnapshot(activeTerm, activeSelections) {
  return Object.fromEntries(TERM_CODES.map((term) => [
    term,
    term === activeTerm ? activeSelections : getStoredSelections(term)
  ]));
}

function sectionView(section) {
  const available = Number(section.available);
  const capacity = Number(section.capacity);
  const seatText = capacity > 0 && Number.isFinite(available) ? `${available}/${capacity}` : "以 AIMS 为准";
  const dayLabel = DAY_NAMES[section.day] || section.day || "日期待定";
  const timeLabel = section.time || "时间待定";
  const location = [section.building, section.room].filter(Boolean).join(" ") || "地点待定";
  return {
    ...section,
    key: sectionKey(section),
    dayLabel,
    timeLabel,
    typeLabel: Number(section.credits) === 0 ? "Tutorial · 0 学分" : `${section.credits} 学分`,
    location,
    webLabel: section.web === "Y" ? "可网页注册" : "WEB=N，请联系课程单位",
    seatText,
    waitlistText: textOrNone(section.waitlist_available),
    campusText: textOrNone(section.campus),
    levelText: textOrNone(section.level),
    mediumText: textOrNone(section.medium),
    pickerLabel: `${section.section} · ${dayLabel} ${timeLabel}`
  };
}

function indexForKey(sections, key, fallback = 0) {
  const index = sections.findIndex((section) => section.key === String(key || ""));
  return index >= 0 ? index : fallback;
}

Page({
  data: {
    activeTerm: "A",
    activeTermLabel: "Semester A",
    termOptions: termOptions(metadata),
    course: null,
    sections: [],
    primaryOptions: [],
    tutorialOptions: [],
    primaryIndex: 0,
    tutorialIndex: 0,
    facts: [],
    recommendation: null,
    sources: [],
    added: false,
    canAdd: false,
    allowsUnscheduled: false,
    eligibility: null,
    documentRoute: ""
  },

  onLoad(options) {
    const code = normalizeCourseCode(options.code);
    const course = courseByCode[code];
    if (!course) {
      wx.showToast({ title: "没有找到这门课程", icon: "none" });
      return;
    }

    this.sourceCourse = course;
    this.activeTerm = normalizeTerm(options.term) || getActiveTerm();
    setActiveTerm(this.activeTerm);
    this.setData({
      documentRoute: documentRoutes[code] || "",
      recommendation: course.recommendation || {
        level: "unknown",
        verdict: "暂无评价",
        summary: "暂时没有可展示的课程评价。",
        tags: []
      },
      sources: course.sourceReviews || []
    });
    this.refreshCourse();
    wx.setNavigationBarTitle({ title: `${code} 课程详情` });
  },

  onShow() {
    if (!this.sourceCourse) return;
    this.refreshCourse();
  },

  refreshCourse() {
    const term = this.activeTerm;
    const sourceCourse = this.sourceCourse;
    const course = courseForTerm(sourceCourse, term);
    const termCourses = courses
      .filter((item) => courseOfferedInTerm(item, term))
      .map((item) => courseForTerm(item, term));
    const storedSelections = initializeStoredSelections(term, makeInitialSelections(courses, term));
    const selections = sanitizeSelections(termCourses, storedSelections, term);
    saveSelections(term, selections);
    this.selections = selections;

    const stored = selections[sourceCourse.code];
    const offered = courseOfferedInTerm(sourceCourse, term);
    const project = isProjectCourse(sourceCourse);
    const allowsUnscheduled = allowsUnscheduledSelection(sourceCourse, term);
    const primaryOptions = course.eligible_sections
      .filter((section) => Number(section.credits) > 0)
      .map(sectionView);
    const tutorialSections = course.eligible_sections
      .filter((section) => Number(section.credits) === 0)
      .map(sectionView);
    const tutorialOptions = [{ key: "", pickerLabel: "不选择 Tutorial" }, ...tutorialSections];
    const defaultSelection = allowsUnscheduled
      ? makeUnscheduledSelection()
      : makeDefaultSelection(course, term);
    if (stored) {
      this.pendingSelection = null;
      this.pendingTerm = "";
    }
    const pendingSelection = !stored && this.pendingTerm === term
      ? this.pendingSelection
      : null;
    const selection = stored || pendingSelection || defaultSelection || {};
    const snapshot = selectionSnapshot(term, selections);
    const eligibility = getSelectionEligibility(
      courses,
      sourceCourse,
      snapshot,
      getEligibilityConfirmations()
    );
    const instructors = unique(course.eligible_sections.map((section) => section.instructor)).join("；");
    const webAvailable = course.eligible_sections.some((section) => section.web === "Y");
    const requirementLabel = project ? "项目课" : sourceCourse.requirement_type === "core" ? "核心课" : "选修课";
    const selectionStatus = !offered
      ? "该学期未开设，不能加入当前课表。"
      : allowsUnscheduled
        ? project
          ? "无需选择班次；加入后计入项目学分，不在周课表显示。"
          : "该学期无固定班次；可直接加入，并按核心课计入学分。"
        : primaryOptions.length
          ? stored ? "已加入当前学期课表。点击下方班次卡，或在课表页调整班次。" : "可选择主课班次；未选择时按第一班次加入。"
          : "该学期开设，但暂无可选班次，暂时不能加入。";
    const selectedLabel = stored ? "当前班次" : pendingSelection ? "待加入班次" : "默认班次";
    const sections = course.eligible_sections.map(sectionView).map((section) => {
      const kind = Number(section.credits) === 0 ? "tutorial" : "primary";
      const selectedKey = kind === "tutorial" ? selection.tutorialCrn : selection.primaryCrn;
      const selected = section.key === String(selectedKey || "");
      return {
        ...section,
        kind,
        selectable: offered && !allowsUnscheduled && primaryOptions.length > 0,
        selected,
        selectionLabel: selected ? selectedLabel : "点击选择"
      };
    });

    this.setData({
      activeTerm: term,
      activeTermLabel: termLabel(metadata, term, true),
      course: {
        ...sourceCourse,
        offered,
        project,
        requirementLabel,
        titleNote: sourceCourse.title_changed
          ? `本学期课表名称：${sourceCourse.schedule_title}`
          : "课程名称与课表一致",
        selectionStatus
      },
      sections,
      primaryOptions,
      tutorialOptions,
      primaryIndex: indexForKey(primaryOptions, selection.primaryCrn),
      tutorialIndex: indexForKey(tutorialOptions, selection.tutorialCrn),
      facts: [
        { label: "课程类型", value: requirementLabel },
        { label: "学分", value: `${sourceCourse.credits} 学分` },
        { label: "开课状态", value: offered ? `${termLabel(metadata, term)} 开设` : `${termLabel(metadata, term)} 未开设` },
        { label: "先修要求", value: textOrNone(sourceCourse.prerequisites) },
        { label: "互斥课程", value: textOrNone(sourceCourse.exclusive_course) },
        { label: "授课语言", value: textOrNone(sourceCourse.summary && sourceCourse.summary.medium) },
        { label: "授课教师", value: instructors || (offered ? "待公布" : "该学期未开设") },
        {
          label: "注册状态",
          value: !offered
            ? "该学期未开设"
            : allowsUnscheduled
              ? "无需在本工具内选择班次"
              : webAvailable ? "有班次可网页注册" : "请联系课程单位注册"
        }
      ],
      added: Boolean(stored),
      canAdd: offered && (allowsUnscheduled || primaryOptions.length > 0) && eligibility.eligible,
      allowsUnscheduled,
      eligibility
    });
  },

  onTermChange(event) {
    const term = normalizeTerm(event.currentTarget.dataset.term);
    if (!term || term === this.activeTerm) return;
    this.activeTerm = setActiveTerm(term);
    this.pendingSelection = null;
    this.pendingTerm = "";
    this.refreshCourse();
  },

  onPrimaryChange(event) {
    const primary = this.data.primaryOptions[Number(event.detail.value) || 0];
    if (primary) this.applySectionChoice("primary", primary.key);
  },

  onTutorialChange(event) {
    const tutorial = this.data.tutorialOptions[Number(event.detail.value) || 0];
    if (tutorial) this.applySectionChoice("tutorial", tutorial.key);
  },

  onSectionCardTap(event) {
    this.applySectionChoice(
      event.currentTarget.dataset.kind,
      event.currentTarget.dataset.key
    );
  },

  applySectionChoice(kind, key) {
    const sourceCourse = this.sourceCourse;
    const term = this.activeTerm;
    if (!sourceCourse || !courseOfferedInTerm(sourceCourse, term)) return;

    const course = courseForTerm(sourceCourse, term);
    if (allowsUnscheduledSelection(sourceCourse, term)) return;

    const normalizedKey = String(key || "");
    const section = course.eligible_sections.find((item) => sectionKey(item) === normalizedKey);
    if (kind === "primary" && (!section || Number(section.credits) <= 0)) return;
    if (kind === "tutorial" && normalizedKey && (!section || Number(section.credits) !== 0)) return;

    const selections = { ...(this.selections || {}) };
    const stored = selections[sourceCourse.code];
    if (stored) {
      const currentKey = kind === "tutorial" ? stored.tutorialCrn : stored.primaryCrn;
      if (String(currentKey || "") === normalizedKey) {
        wx.showToast({ title: `当前已是 ${section ? section.section : "不选 Tutorial"}`, icon: "none" });
        return;
      }
    }

    let nextSelection;
    if (kind === "primary") {
      nextSelection = makeSelectionForPrimary(course, normalizedKey, term);
    } else {
      const baseSelection = stored
        || (this.pendingTerm === term && this.pendingSelection)
        || makeDefaultSelection(course, term);
      if (!baseSelection || isUnscheduledSelection(baseSelection)) return;
      nextSelection = { ...baseSelection, tutorialCrn: normalizedKey || null };
    }
    if (!nextSelection) return;

    const choiceLabel = section ? section.section : "不选 Tutorial";
    if (!stored) {
      this.pendingSelection = nextSelection;
      this.pendingTerm = term;
      this.refreshCourse();
      wx.showToast({ title: `已选择 ${choiceLabel}`, icon: "none" });
      return;
    }

    selections[sourceCourse.code] = nextSelection;
    saveSelections(term, selections);
    this.pendingSelection = null;
    this.pendingTerm = "";
    this.refreshCourse();
    wx.showToast({ title: `已切换至 ${choiceLabel}`, icon: "success" });
  },

  onEligibilityConfirm(event) {
    const eligibility = this.data.eligibility;
    if (!eligibility || !eligibility.confirmationKey) return;
    const selected = (event.detail.value || []).includes(eligibility.confirmationKey);
    setEligibilityConfirmation(eligibility.confirmationKey, selected);
    this.refreshCourse();
    wx.showToast({ title: selected ? "已记录身份确认" : "已取消身份确认", icon: "none" });
  },

  toggleCourse() {
    const sourceCourse = this.sourceCourse;
    const term = this.activeTerm;
    if (!sourceCourse || !courseOfferedInTerm(sourceCourse, term)) return;
    const course = courseForTerm(sourceCourse, term);
    const selections = { ...(this.selections || {}) };
    const beforeSnapshot = selectionSnapshot(term, selections);

    if (selections[sourceCourse.code]) {
      delete selections[sourceCourse.code];
      const afterSnapshot = { ...beforeSnapshot, [term]: selections };
      const dependent = findInvalidatedDependent(
        courses,
        beforeSnapshot,
        afterSnapshot,
        getEligibilityConfirmations()
      );
      if (dependent) {
        wx.showToast({ title: `请先移除 ${dependent.course.code}`, icon: "none", duration: 3200 });
        return;
      }
      saveSelections(term, selections);
      this.refreshCourse();
      wx.showToast({ title: `已移除 ${sourceCourse.code}`, icon: "none" });
      return;
    }

    const eligibility = getSelectionEligibility(
      courses,
      sourceCourse,
      beforeSnapshot,
      getEligibilityConfirmations()
    );
    if (!eligibility.eligible) {
      wx.showToast({ title: eligibility.statusText.replace(/^当前课表未满足：/, ""), icon: "none", duration: 3200 });
      return;
    }

    if (isProjectCourse(sourceCourse)) {
      const conflict = findProjectConflict(courses, sourceCourse, beforeSnapshot, term);
      if (conflict) {
        wx.showToast({ title: `${conflict.code} 已在 ${conflict.term} 学期加入`, icon: "none", duration: 3200 });
        return;
      }
    }

    let selection;
    if (allowsUnscheduledSelection(sourceCourse, term)) {
      selection = makeUnscheduledSelection();
    } else {
      const primary = this.data.primaryOptions[this.data.primaryIndex];
      selection = primary ? makeSelectionForPrimary(course, primary.key, term) : null;
      if (selection && this.data.tutorialOptions.length > 1) {
        selection.tutorialCrn = this.data.tutorialOptions[this.data.tutorialIndex].key || null;
      }
    }
    if (!selection) {
      wx.showToast({ title: "该学期开设，但暂无可选班次", icon: "none" });
      return;
    }

    selections[sourceCourse.code] = selection;
    saveSelections(term, selections);
    this.pendingSelection = null;
    this.pendingTerm = "";
    this.refreshCourse();
    wx.showToast({
      title: isUnscheduledSelection(selection) ? "已加入（无需班次）" : `已加入 ${sourceCourse.code}`,
      icon: "success"
    });
  },

  openTimetable() {
    setActiveTerm(this.activeTerm);
    wx.switchTab({ url: "/pages/timetable/index" });
  },

  openDocument() {
    if (!this.data.documentRoute) return;
    wx.navigateTo({ url: this.data.documentRoute });
  },

  copySource(event) {
    const url = event.currentTarget.dataset.url;
    if (!url) return;
    wx.setClipboardData({
      data: url,
      success() {
        wx.showToast({ title: "原文链接已复制", icon: "success" });
      }
    });
  },

  onShareAppMessage() {
    const course = this.sourceCourse;
    return course
      ? {
          title: `${course.code} ${course.programme_title}`,
          path: `/packages/course/pages/detail/index?code=${course.code}&term=${this.activeTerm}`
        }
      : { title: "课程详情" };
  }
});
