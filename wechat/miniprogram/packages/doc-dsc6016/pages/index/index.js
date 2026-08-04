const images = [
  "/packages/doc-dsc6016/assets/page-001.jpg",
  "/packages/doc-dsc6016/assets/page-002.jpg",
  "/packages/doc-dsc6016/assets/page-003.jpg",
  "/packages/doc-dsc6016/assets/page-004.jpg",
  "/packages/doc-dsc6016/assets/page-005.jpg",
  "/packages/doc-dsc6016/assets/page-006.jpg"
];

Page({
  data: {
    courseCode: "DSC6016",
    images
  },

  onShareAppMessage() {
    return {
      title: "DSC6016 课程介绍（中英对照）",
      path: "/packages/doc-dsc6016/pages/index/index"
    };
  }
});
