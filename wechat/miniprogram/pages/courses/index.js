const { metadata, courses, courseByCode } = require("../../data/catalog");
const {
  filterCourses,
  makeDefaultSelection,
  makeInitialSelections,
  makeSelectionForPrimary,
  sectionKey,
  sanitizeSelections
} = require("../../utils/planner");
const {
  getActiveTerm,
  getEligibilityConfirmations,
  getStoredSelections,
  initializeStoredSelections,
  saveSelections,
  setActiveTerm,
  setEligibilityConfirmation
} = require("../../utils/storage");
const {
  TERM_CODES,
  allowsUnscheduledSelection,
  courseForTerm,
  courseOfferedInTerm,
  findInvalidatedDependent,
  findProjectConflict,
  getSelectionEligibility,
  isProjectCourse,
  makeUnscheduledSelection,
  sectionsForTerm,
  termLabel,
  termOptions
} = require("../../utils/course-terms");

const DAY_NAMES = Object.freeze({
  M: "周一",
  T: "周二",
  W: "周三",
  R: "周四",
  F: "周五",
  S: "周六",
  U: "周日"
});

const REQUIREMENT_FILTERS = Object.freeze([
  { value: "all", label: "全部" },
  { value: "core", label: "核心" },
  { value: "elective", label: "选修" },
  { value: "project", label: "项目" }
]);

const DAY_FILTERS = Object.freeze([
  { value: "all", label: "全部日期" },
  { value: "M", label: "周一" },
  { value: "T", label: "周二" },
  { value: "W", label: "周三" },
  { value: "R", label: "周四" },
  { value: "F", label: "周五" },
  { value: "S", label: "周六" },
  { value: "U", label: "周日" }
]);

function displaySnapshot(value) {
  return String(value || "").replace(" Asia/Beijing", "（Asia/Beijing）");
}

function termSelections() {
  return Object.fromEntries(TERM_CODES.map((term) => [term, getStoredSelections(term)]));
}

function primarySections(course) {
  return (course.eligible_sections || []).filter((section) => Number(section.credits) > 0);
}

function scheduleText(sections) {
  const schedules = [];
  sections.forEach((section) => {
    const day = DAY_NAMES[section.day] || section.day || "日期待定";
    const time = section.time || "时间待定";
    const value = `${day} ${time}`;
    if (!schedules.includes(value)) schedules.push(value);
  });
  return schedules.join(" / ");
}

function primaryChoice(section) {
  const day = DAY_NAMES[section.day] || section.day || "日期待定";
  const time = section.time || "时间待定";
  return {
    key: sectionKey(section),
    label: `${section.section || "班次待定"} · ${day} ${time}`
  };
}

function displayCourse(course, term, selections, eligibility, pendingSelections) {
  const primary = primarySections(course);
  const offered = courseOfferedInTerm(course, term);
  const project = isProjectCourse(course);
  const unscheduled = allowsUnscheduledSelection(course, term);
  const addable = offered && (unscheduled || primary.length > 0);
  const recommendation = course.recommendation || {
    level: "unknown",
    verdict: "暂无评价",
    summary: "暂时没有可展示的课程评价。",
    tags: []
  };
  const summary = course.summary || {};
  const addedSelection = selections[course.code];
  const preferredPrimaryKey = String(
    addedSelection && addedSelection.primaryCrn
      || pendingSelections && pendingSelections[course.code]
      || ""
  );
  const primaryChoices = primary.map(primaryChoice);
  const preferredIndex = primaryChoices.findIndex((choice) => choice.key === preferredPrimaryKey);
  const primaryIndex = preferredIndex >= 0 ? preferredIndex : 0;
  const selectedPrimary = primaryChoices[primaryIndex];
  const hasPendingPrimary = !addedSelection && Boolean(
    pendingSelections && pendingSelections[course.code]
  );
  const requirementLabel = project ? "项目" : course.requirement_type === "core" ? "核心" : "选修";
  const sectionLabel = unscheduled ? "无需班次" : `${primary.length} 个主课班次`;
  const displaySchedule = unscheduled
    ? project
      ? "项目课无需选择班次，不在周课表显示"
      : "该学期无固定班次；可加入课表并按核心课计入学分"
    : addable
      ? selectedPrimary
        ? selectedPrimary.label
        : scheduleText(primary)
      : "该学期开设，但暂无可选班次";

  return {
    code: course.code,
    title: course.programme_title || course.schedule_title || course.code,
    credits: course.credits,
    requirementType: project ? "project" : course.requirement_type,
    requirementLabel,
    offered,
    addable,
    canAdd: addable && eligibility.eligible,
    primaryCount: primary.length,
    primaryChoices,
    primaryIndex,
    scheduleActionLabel: addedSelection
      ? "更换班次"
      : hasPendingPrimary
        ? "已选班次"
        : "选择班次",
    sectionLabel,
    webLabel: unscheduled
      ? "无需在工具内选班"
      : offered
        ? (summary.web === "N" ? "非网页注册" : "可网页注册")
        : "该学期未开设",
    scheduleText: displaySchedule,
    recommendation,
    displayTags: (recommendation.tags || []).slice(0, 3),
    added: offered && Boolean(selections[course.code]),
    eligibilityNote: [
      eligibility.audienceNote,
      eligibility.hasRequirement
        ? `${eligibility.eligible ? "条件已满足" : "选课条件"}：${eligibility.requirementText}`
        : ""
    ].filter(Boolean).join("；"),
    eligibilityMet: eligibility.eligible,
    requiresConfirmation: eligibility.confirmationItems.length > 0,
    confirmationItems: eligibility.confirmationItems
  };
}

Page({
  data: {
    semester: metadata.semester,
    activeTerm: "A",
    activeTermLabel: "Semester A",
    termOptions: termOptions(metadata),
    scheduleAsOf: displaySnapshot(metadata.schedule_as_of),
    searchTerm: "",
    requirementType: "all",
    day: "all",
    requirementFilters: REQUIREMENT_FILTERS,
    dayFilters: DAY_FILTERS,
    displayCourses: [],
    resultCount: 0,
    selectedCount: 0
  },

  onLoad() {
    this.pendingPrimarySelections = Object.fromEntries(TERM_CODES.map((term) => [term, {}]));
    this.activeTerm = getActiveTerm();
    this.refreshSelections();
  },

  onShow() {
    const storedTerm = getActiveTerm();
    if (storedTerm !== this.activeTerm) this.activeTerm = storedTerm;
    this.refreshSelections();
  },

  refreshSelections() {
    const term = this.activeTerm || "A";
    const termCourses = courses
      .filter((course) => courseOfferedInTerm(course, term))
      .map((course) => courseForTerm(course, term));
    const stored = initializeStoredSelections(term, makeInitialSelections(courses, term));
    this.selections = sanitizeSelections(termCourses, stored, term);
    saveSelections(term, this.selections);
    this.refreshCourses();
  },

  refreshCourses() {
    const term = this.activeTerm || "A";
    const availableCourses = courses
      .filter((course) => courseOfferedInTerm(course, term))
      .map((course) => courseForTerm(course, term));
    const filtered = filterCourses(availableCourses, {
      searchTerm: this.data.searchTerm,
      requirementType: this.data.requirementType,
      day: this.data.day,
      term
    });
    const selections = this.selections || {};
    const pendingSelections = this.pendingPrimarySelections && this.pendingPrimarySelections[term] || {};
    const snapshot = termSelections();
    snapshot[term] = selections;
    const confirmations = getEligibilityConfirmations();

    this.setData({
      activeTerm: term,
      activeTermLabel: termLabel(metadata, term, true),
      displayCourses: filtered.map((course) => displayCourse(
        course,
        term,
        selections,
        getSelectionEligibility(courses, course, snapshot, confirmations),
        pendingSelections
      )),
      resultCount: filtered.length,
      selectedCount: Object.keys(selections).length
    });
  },

  onTermChange(event) {
    const term = event.currentTarget.dataset.term;
    if (!TERM_CODES.includes(term) || term === this.activeTerm) return;
    this.activeTerm = setActiveTerm(term);
    this.setData({ day: "all" }, () => this.refreshSelections());
  },

  onSearchInput(event) {
    this.setData({ searchTerm: event.detail.value }, () => this.refreshCourses());
  },

  onClearSearch() {
    this.setData({ searchTerm: "" }, () => this.refreshCourses());
  },

  onRequirementFilter(event) {
    this.setData({ requirementType: event.currentTarget.dataset.value }, () => this.refreshCourses());
  },

  onDayFilter(event) {
    this.setData({ day: event.currentTarget.dataset.value }, () => this.refreshCourses());
  },

  openAimsFields() {
    wx.navigateTo({ url: "/pages/aims-fields/index" });
  },

  onEligibilityConfirm(event) {
    const key = event.detail.key;
    if (!key) return;
    setEligibilityConfirmation(key, event.detail.value === true);
    this.refreshCourses();
    wx.showToast({ title: event.detail.value ? "已记录选课确认" : "已取消选课确认", icon: "none" });
  },

  onOpenCourse(event) {
    const code = event.detail.code;
    if (!courseByCode[code]) return;
    wx.navigateTo({
      url: `/packages/course/pages/detail/index?code=${encodeURIComponent(code)}&term=${this.activeTerm}`
    });
  },

  onSectionChange(event) {
    const code = event.detail.code;
    const primaryKey = String(event.detail.key || "");
    const sourceCourse = courseByCode[code];
    const term = this.activeTerm;
    if (!sourceCourse || !primaryKey || !courseOfferedInTerm(sourceCourse, term)) return;

    const course = courseForTerm(sourceCourse, term);
    const selection = makeSelectionForPrimary(course, primaryKey, term);
    if (!selection) return;

    if (!this.pendingPrimarySelections) {
      this.pendingPrimarySelections = Object.fromEntries(TERM_CODES.map((item) => [item, {}]));
    }
    this.pendingPrimarySelections[term][code] = selection.primaryCrn;

    if (!this.selections || !this.selections[code]) {
      this.refreshCourses();
      return;
    }

    this.selections = saveSelections(term, {
      ...this.selections,
      [code]: selection
    });
    this.refreshCourses();
    wx.showToast({ title: "班次和时间已更新", icon: "none" });
  },

  onToggleCourse(event) {
    const code = event.detail.code;
    const sourceCourse = courseByCode[code];
    const term = this.activeTerm;
    if (!sourceCourse || !courseOfferedInTerm(sourceCourse, term)) return;
    const course = courseForTerm(sourceCourse, term);
    const beforeSnapshot = termSelections();
    beforeSnapshot[term] = { ...(this.selections || {}) };
    const nextSelections = { ...(this.selections || {}) };

    if (nextSelections[code]) {
      const removedSelection = nextSelections[code];
      delete nextSelections[code];
      const afterSnapshot = { ...beforeSnapshot, [term]: nextSelections };
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
      if (removedSelection.primaryCrn) {
        if (!this.pendingPrimarySelections) {
          this.pendingPrimarySelections = Object.fromEntries(TERM_CODES.map((item) => [item, {}]));
        }
        this.pendingPrimarySelections[term][code] = removedSelection.primaryCrn;
      }
      this.selections = saveSelections(term, nextSelections);
      this.refreshCourses();
      wx.showToast({ title: "已从课表移除", icon: "none" });
      return;
    }

    const eligibility = getSelectionEligibility(
      courses,
      course,
      beforeSnapshot,
      getEligibilityConfirmations()
    );
    if (!eligibility.eligible) {
      wx.showToast({ title: eligibility.statusText.replace(/^当前课表未满足：/, ""), icon: "none", duration: 3200 });
      return;
    }

    if (isProjectCourse(course)) {
      const conflict = findProjectConflict(courses, course, beforeSnapshot, term);
      if (conflict) {
        wx.showToast({ title: `${conflict.code} 已在 ${conflict.term} 学期加入`, icon: "none", duration: 3200 });
        return;
      }
    }

    const pendingPrimaryKey = this.pendingPrimarySelections
      && this.pendingPrimarySelections[term]
      && this.pendingPrimarySelections[term][code];
    const selection = allowsUnscheduledSelection(course, term)
      ? makeUnscheduledSelection()
      : makeSelectionForPrimary(course, pendingPrimaryKey, term)
        || makeDefaultSelection(course, term);
    if (!selection) {
      wx.showToast({ title: "该学期开设，但暂无可选班次", icon: "none" });
      return;
    }

    nextSelections[code] = selection;
    this.selections = saveSelections(term, nextSelections);
    this.refreshCourses();
    wx.showToast({
      title: selection.unscheduled ? "已加入（无需班次）" : "已加入课表",
      icon: "success"
    });
  }
});
