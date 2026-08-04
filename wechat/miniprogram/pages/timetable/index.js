const { courses, courseByCode } = require("../../data/catalog");
const {
  DAY_NAMES,
  getSelectedEvents,
  makeSelectionForPrimary,
  sanitizeSelections,
  sectionKey,
  summarizeCredits
} = require("../../utils/planner");
const {
  clearStoredSelections,
  getStoredSelections,
  saveSelections
} = require("../../utils/storage");

const DAYS = ["M", "T", "W", "R", "F", "S", "U"];

function formatChoice(section) {
  return `${section.section} · ${DAY_NAMES[section.day] || section.day} ${section.time}${section.web === "N" ? " · WEB=N" : ""}`;
}

function eventView(event) {
  const section = event.section;
  return {
    ...event,
    typeLabel: event.sectionType === "tutorial" ? "Tutorial" : "主课",
    room: [section.building, section.room].filter(Boolean).join(" ") || "地点待定",
    conflictText: event.conflict ? "与其他课程冲突" : ""
  };
}

Page({
  data: {
    days: DAYS.map((key) => ({ key, label: DAY_NAMES[key] })),
    activeDay: "M",
    activeDayLabel: DAY_NAMES.M,
    events: [],
    selectedCourses: [],
    summary: null,
    conflictCourseCount: 0
  },

  onShow() {
    this.renderPlanner();
  },

  renderPlanner() {
    const selections = sanitizeSelections(courses, getStoredSelections());
    saveSelections(selections);
    const allEvents = getSelectedEvents(courses, selections);
    const selectedCourses = courses
      .filter((course) => Boolean(selections[course.code]))
      .map((course) => {
        const selection = selections[course.code];
        const primaries = course.eligible_sections.filter((section) => Number(section.credits) > 0);
        const tutorials = course.eligible_sections.filter((section) => Number(section.credits) === 0);
        const primaryKeys = primaries.map(sectionKey);
        const tutorialKeys = [""].concat(tutorials.map(sectionKey));
        const primaryIndex = Math.max(0, primaryKeys.indexOf(String(selection.primaryCrn || "")));
        const tutorialIndex = Math.max(0, tutorialKeys.indexOf(String(selection.tutorialCrn || "")));
        const primaryChoices = primaries.map((section) => ({
          key: sectionKey(section),
          label: formatChoice(section)
        }));
        const tutorialChoices = [{ key: "", label: "不选择 Tutorial" }].concat(
          tutorials.map((section) => ({ key: sectionKey(section), label: formatChoice(section) }))
        );
        return {
          code: course.code,
          title: course.programme_title,
          primaryChoices,
          primaryIndex,
          primaryLabel: primaryChoices[primaryIndex].label,
          tutorialChoices,
          tutorialIndex,
          tutorialLabel: tutorialChoices[tutorialIndex].label
        };
      });
    const conflictCodes = {};
    allEvents.forEach((event) => {
      if (event.conflict) conflictCodes[event.courseCode] = true;
    });

    this.allEvents = allEvents;
    this.setData({
      events: allEvents
        .filter((event) => event.day === this.data.activeDay)
        .sort((left, right) => left.start - right.start)
        .map(eventView),
      selectedCourses,
      summary: summarizeCredits(courses, selections),
      conflictCourseCount: Object.keys(conflictCodes).length
    });
  },

  selectDay(event) {
    const activeDay = event.currentTarget.dataset.day;
    this.setData({
      activeDay,
      activeDayLabel: DAY_NAMES[activeDay],
      events: (this.allEvents || [])
        .filter((item) => item.day === activeDay)
        .sort((left, right) => left.start - right.start)
        .map(eventView)
    });
  },

  changePrimary(event) {
    const code = event.currentTarget.dataset.code;
    const course = courseByCode[code];
    const selectedView = this.data.selectedCourses.find((item) => item.code === code);
    const choice = selectedView && selectedView.primaryChoices[Number(event.detail.value)];
    if (!course || !choice) return;
    const selections = getStoredSelections();
    selections[code] = makeSelectionForPrimary(course, choice.key);
    saveSelections(selections);
    this.renderPlanner();
    wx.showToast({ title: `已切换 ${code} 班次`, icon: "none" });
  },

  changeTutorial(event) {
    const code = event.currentTarget.dataset.code;
    const selectedView = this.data.selectedCourses.find((item) => item.code === code);
    const choice = selectedView && selectedView.tutorialChoices[Number(event.detail.value)];
    const selections = getStoredSelections();
    if (!selections[code] || !choice) return;
    selections[code].tutorialCrn = choice.key || null;
    saveSelections(selections);
    this.renderPlanner();
  },

  removeCourse(event) {
    const code = event.currentTarget.dataset.code;
    const selections = getStoredSelections();
    delete selections[code];
    saveSelections(selections);
    this.renderPlanner();
    wx.showToast({ title: `已移除 ${code}`, icon: "none" });
  },

  openCourse(event) {
    const code = event.currentTarget.dataset.code;
    wx.navigateTo({ url: `/packages/course/pages/detail/index?code=${code}` });
  },

  browseCourses() {
    wx.switchTab({ url: "/pages/courses/index" });
  },

  clearAll() {
    if (!this.data.selectedCourses.length) return;
    wx.showModal({
      title: "清空课表",
      content: "确定移除全部已选课程吗？",
      confirmColor: "#b42335",
      success: (result) => {
        if (!result.confirm) return;
        clearStoredSelections();
        this.renderPlanner();
      }
    });
  },

  onShareAppMessage() {
    return { title: "CityU MSDS 选课板" };
  }
});
