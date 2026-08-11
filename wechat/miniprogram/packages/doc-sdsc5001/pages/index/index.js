const images = [
  "/packages/doc-sdsc5001/assets/page-001.jpg",
  "/packages/doc-sdsc5001/assets/page-002.jpg",
  "/packages/doc-sdsc5001/assets/page-003.jpg",
  "/packages/doc-sdsc5001/assets/page-004.jpg",
  "/packages/doc-sdsc5001/assets/page-005.jpg",
  "/packages/doc-sdsc5001/assets/page-006.jpg"
];

Page({
  data: {
    courseCode: "SDSC5001",
    images
  },

  onShareAppMessage() {
    return {
      title: "SDSC5001 课程介绍（中英对照）",
      path: "/packages/doc-sdsc5001/pages/index/index"
    };
  }
});
