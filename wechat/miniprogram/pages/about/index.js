const { metadata, courses } = require("../../data/catalog");
const GITHUB_URL = "https://github.com/fluffywood/cityuds";

const scheduleAsOf = String(metadata.schedule_as_of || "").replace(
  " Asia/Beijing",
  "（Asia/Beijing）"
);

Page({
  data: {
    programme: metadata.programme,
    semester: metadata.semester,
    scheduleAsOf,
    courseCount: courses.length,
    githubUrl: GITHUB_URL
  },

  onOpenAimsFields() {
    wx.navigateTo({ url: "/pages/aims-fields/index" });
  },

  onSupportProject() {
    wx.showModal({
      title: "支持这个项目",
      content: "微信小程序无法直接打开外部 GitHub。复制项目地址后，请在浏览器中打开并为项目点亮 Star，感谢支持！",
      confirmText: "复制地址",
      success(result) {
        if (!result.confirm) return;
        wx.setClipboardData({
          data: GITHUB_URL,
          success() {
            wx.showToast({ title: "GitHub 地址已复制", icon: "none" });
          }
        });
      }
    });
  }
});
