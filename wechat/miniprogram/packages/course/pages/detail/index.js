const { courses, courseByCode } = require("../../../../data/catalog");
const { documentRoutes } = require("../../../../data/document-routes");
const {
  DAY_NAMES,
  makeDefaultSelection,
  sanitizeSelections
} = require("../../../../utils/planner");
const {
  getStoredSelections,
  saveSelections
} = require("../../../../utils/storage");

function textOrNone(value) {
  return value && value !== "Nil" ? value : "无";
}

function unique(values) {
  return values.filter((value, index) => value && values.indexOf(value) === index);
}

function sectionView(section) {
  const available = Number(section.available);
  const capacity = Number(section.capacity);
  const seatText = capacity > 0 ? `${available}/${capacity}` : "以 AIMS 为准";
  return {
    ...section,
    key: String(section.crn || section.section),
    dayLabel: DAY_NAMES[section.day] || section.day || "待定",
    typeLabel: Number(section.credits) === 0 ? "Tutorial · 0 学分" : `${section.credits} 学分`,
    location: [section.building, section.room].filter(Boolean).join(" ") || "地点待定",
    webLabel: section.web === "Y" ? "可网页注册" : "WEB=N，请联系课程单位",
    seatText
  };
}

Page({
  data: {
    course: null,
    sections: [],
    facts: [],
    recommendation: null,
    sources: [],
    added: false,
    documentRoute: ""
  },

  onLoad(options) {
    const code = String(options.code || "").toUpperCase();
    const course = courseByCode[code];
    if (!course) {
      wx.showToast({ title: "没有找到这门课程", icon: "none" });
      return;
    }

    const instructors = unique(
      course.eligible_sections.map((section) => section.instructor)
    ).join("；");
    const webAvailable = course.eligible_sections.some((section) => section.web === "Y");
    const facts = [
      { label: "课程类型", value: course.requirement_type === "core" ? "核心课" : "选修课" },
      { label: "先修要求", value: textOrNone(course.prerequisites) },
      { label: "互斥课程", value: textOrNone(course.exclusive_course) },
      { label: "授课语言", value: textOrNone(course.summary && course.summary.medium) },
      { label: "授课教师", value: instructors || "待公布" },
      { label: "注册状态", value: webAvailable ? "有班次可网页注册" : "不可正常网页注册，请联系课程单位" }
    ];

    this.setData({
      course: {
        ...course,
        requirementLabel: course.requirement_type === "core" ? "核心课" : "选修课",
        titleNote: course.title_changed
          ? `本学期课表名称：${course.schedule_title}`
          : "课程名称与课表一致"
      },
      sections: course.eligible_sections.map(sectionView),
      facts,
      recommendation: course.recommendation,
      sources: course.sourceReviews || [],
      documentRoute: documentRoutes[code] || ""
    });
    wx.setNavigationBarTitle({ title: `${code} 课程详情` });
  },

  onShow() {
    if (!this.data.course) return;
    const selections = sanitizeSelections(courses, getStoredSelections());
    saveSelections(selections);
    this.setData({ added: Boolean(selections[this.data.course.code]) });
  },

  toggleCourse() {
    const course = this.data.course;
    if (!course) return;
    const selections = sanitizeSelections(courses, getStoredSelections());
    if (selections[course.code]) {
      delete selections[course.code];
      saveSelections(selections);
      this.setData({ added: false });
      wx.showToast({ title: `已移除 ${course.code}`, icon: "none" });
      return;
    }

    const selection = makeDefaultSelection(course);
    if (!selection) {
      wx.showToast({ title: "该课程暂无可选主课班次", icon: "none" });
      return;
    }
    selections[course.code] = selection;
    saveSelections(selections);
    this.setData({ added: true });
    wx.showToast({ title: `已加入 ${course.code}`, icon: "success" });
  },

  openTimetable() {
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
    const course = this.data.course;
    return course
      ? {
          title: `${course.code} ${course.programme_title}`,
          path: `/packages/course/pages/detail/index?code=${course.code}`
        }
      : { title: "课程详情" };
  }
});
