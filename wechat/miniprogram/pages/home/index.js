const { metadata, courses } = require("../../data/catalog");
const WEB_URL = "https://fluffywood.github.io/cityuds/";

Page({
  data: {
    semester: metadata.semester,
    courseCount: courses.length,
    webUrl: WEB_URL
  },

  onOpenCourses() {
    wx.switchTab({ url: "/pages/courses/index" });
  },

  onOpenTimetable() {
    wx.switchTab({ url: "/pages/timetable/index" });
  },

  onOpenAbout() {
    wx.switchTab({ url: "/pages/about/index" });
  },

  onCopyWebUrl() {
    wx.setClipboardData({
      data: WEB_URL,
      success() {
        wx.showToast({ title: "网页版链接已复制", icon: "none" });
      }
    });
  }
});
