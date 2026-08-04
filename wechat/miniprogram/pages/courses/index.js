const { metadata, courses, courseByCode } = require("../../data/catalog");
const {
  filterCourses,
  makeDefaultSelection,
  sanitizeSelections
} = require("../../utils/planner");
const { getStoredSelections, saveSelections } = require("../../utils/storage");

const DAY_NAMES = {
  M: "周一",
  T: "周二",
  W: "周三",
  R: "周四",
  F: "周五",
  S: "周六",
  U: "周日"
};

const REQUIREMENT_FILTERS = [
  { value: "all", label: "全部" },
  { value: "core", label: "核心" },
  { value: "elective", label: "选修" }
];

const DAY_FILTERS = [
  { value: "all", label: "全部日期" },
  { value: "M", label: "周一" },
  { value: "T", label: "周二" },
  { value: "W", label: "周三" },
  { value: "R", label: "周四" },
  { value: "F", label: "周五" },
  { value: "S", label: "周六" },
  { value: "U", label: "周日" }
];

function displaySnapshot(value) {
  return String(value || "").replace(" Asia/Beijing", "（Asia/Beijing）");
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

function displayCourse(course, selections) {
  const primary = primarySections(course);
  const recommendation = course.recommendation || {
    level: "unknown",
    verdict: "暂无评价",
    summary: "暂时没有可展示的课程评价。",
    tags: []
  };
  const summary = course.summary || {};

  return {
    code: course.code,
    title: course.programme_title || course.schedule_title || course.code,
    credits: course.credits,
    requirementType: course.requirement_type,
    requirementLabel: course.requirement_type === "core" ? "核心" : "选修",
    primaryCount: primary.length,
    webLabel: summary.web === "N" ? "非网页注册" : "可网页注册",
    scheduleText: scheduleText(primary),
    recommendation,
    displayTags: (recommendation.tags || []).slice(0, 3),
    added: Boolean(selections[course.code])
  };
}

Page({
  data: {
    semester: metadata.semester,
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
    this.selections = {};
    this.refreshSelections();
  },

  onShow() {
    this.refreshSelections();
  },

  refreshSelections() {
    this.selections = sanitizeSelections(courses, getStoredSelections());
    saveSelections(this.selections);
    this.refreshCourses();
  },

  refreshCourses() {
    const filtered = filterCourses(courses, {
      searchTerm: this.data.searchTerm,
      requirementType: this.data.requirementType,
      day: this.data.day
    });
    const selections = this.selections || {};

    this.setData({
      displayCourses: filtered.map((course) => displayCourse(course, selections)),
      resultCount: filtered.length,
      selectedCount: Object.keys(selections).length
    });
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

  onOpenCourse(event) {
    const code = event.detail.code;
    if (!courseByCode[code]) return;
    wx.navigateTo({
      url: `/packages/course/pages/detail/index?code=${encodeURIComponent(code)}`
    });
  },

  onToggleCourse(event) {
    const code = event.detail.code;
    const course = courseByCode[code];
    if (!course) return;

    const nextSelections = Object.assign({}, this.selections || {});
    if (nextSelections[code]) {
      delete nextSelections[code];
      this.selections = saveSelections(nextSelections);
      this.refreshCourses();
      wx.showToast({ title: "已从课表移除", icon: "none" });
      return;
    }

    const selection = makeDefaultSelection(course);
    if (!selection) {
      wx.showToast({ title: "暂无可加入的班次", icon: "none" });
      return;
    }

    nextSelections[code] = selection;
    this.selections = saveSelections(nextSelections);
    this.refreshCourses();
    wx.showToast({ title: "已加入课表", icon: "success" });
  }
});
