const images = [
  "/packages/doc-sdsc6007/assets/page-001.jpg",
  "/packages/doc-sdsc6007/assets/page-002.jpg",
  "/packages/doc-sdsc6007/assets/page-003.jpg",
  "/packages/doc-sdsc6007/assets/page-004.jpg",
  "/packages/doc-sdsc6007/assets/page-005.jpg",
  "/packages/doc-sdsc6007/assets/page-006.jpg",
  "/packages/doc-sdsc6007/assets/page-007.jpg",
  "/packages/doc-sdsc6007/assets/page-008.jpg"
];

Page({
  data: {
    courseCode: "SDSC6007",
    images
  },

  onShareAppMessage() {
    return {
      title: "SDSC6007 课程介绍（中英对照）",
      path: "/packages/doc-sdsc6007/pages/index/index"
    };
  }
});
