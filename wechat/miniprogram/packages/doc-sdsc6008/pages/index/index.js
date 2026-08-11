const images = [
  "/packages/doc-sdsc6008/assets/page-001.jpg",
  "/packages/doc-sdsc6008/assets/page-002.jpg",
  "/packages/doc-sdsc6008/assets/page-003.jpg",
  "/packages/doc-sdsc6008/assets/page-004.jpg",
  "/packages/doc-sdsc6008/assets/page-005.jpg",
  "/packages/doc-sdsc6008/assets/page-006.jpg",
  "/packages/doc-sdsc6008/assets/page-007.jpg"
];

Page({
  data: {
    courseCode: "SDSC6008",
    images
  },

  onShareAppMessage() {
    return {
      title: "SDSC6008 课程介绍（中英对照）",
      path: "/packages/doc-sdsc6008/pages/index/index"
    };
  }
});
