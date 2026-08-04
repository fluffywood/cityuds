const images = [
  "/packages/doc-dsc6018/assets/page-001.jpg",
  "/packages/doc-dsc6018/assets/page-002.jpg",
  "/packages/doc-dsc6018/assets/page-003.jpg",
  "/packages/doc-dsc6018/assets/page-004.jpg",
  "/packages/doc-dsc6018/assets/page-005.jpg",
  "/packages/doc-dsc6018/assets/page-006.jpg",
  "/packages/doc-dsc6018/assets/page-007.jpg",
  "/packages/doc-dsc6018/assets/page-008.jpg"
];

Page({
  data: {
    courseCode: "DSC6018",
    images
  },

  onShareAppMessage() {
    return {
      title: "DSC6018 课程介绍（中英对照）",
      path: "/packages/doc-dsc6018/pages/index/index"
    };
  }
});
