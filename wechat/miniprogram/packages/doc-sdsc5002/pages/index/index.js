const images = [
  "/packages/doc-sdsc5002/assets/page-001.jpg",
  "/packages/doc-sdsc5002/assets/page-002.jpg",
  "/packages/doc-sdsc5002/assets/page-003.jpg",
  "/packages/doc-sdsc5002/assets/page-004.jpg",
  "/packages/doc-sdsc5002/assets/page-005.jpg",
  "/packages/doc-sdsc5002/assets/page-006.jpg",
  "/packages/doc-sdsc5002/assets/page-007.jpg"
];

Page({
  data: {
    courseCode: "SDSC5002",
    images
  },

  onShareAppMessage() {
    return {
      title: "SDSC5002 课程介绍（中英对照）",
      path: "/packages/doc-sdsc5002/pages/index/index"
    };
  }
});
