const images = [
  "/packages/doc-dsc6011/assets/page-001.jpg",
  "/packages/doc-dsc6011/assets/page-002.jpg",
  "/packages/doc-dsc6011/assets/page-003.jpg",
  "/packages/doc-dsc6011/assets/page-004.jpg",
  "/packages/doc-dsc6011/assets/page-005.jpg"
];

Page({
  data: {
    courseCode: "DSC6011",
    images
  },

  onShareAppMessage() {
    return {
      title: "DSC6011 课程介绍（中英对照）",
      path: "/packages/doc-dsc6011/pages/index/index"
    };
  }
});
