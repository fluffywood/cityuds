const images = [
  "/packages/doc-sdsc5003/assets/page-001.jpg",
  "/packages/doc-sdsc5003/assets/page-002.jpg",
  "/packages/doc-sdsc5003/assets/page-003.jpg",
  "/packages/doc-sdsc5003/assets/page-004.jpg",
  "/packages/doc-sdsc5003/assets/page-005.jpg",
  "/packages/doc-sdsc5003/assets/page-006.jpg"
];

Page({
  data: {
    courseCode: "SDSC5003",
    images
  },

  onShareAppMessage() {
    return {
      title: "SDSC5003 课程介绍（中英对照）",
      path: "/packages/doc-sdsc5003/pages/index/index"
    };
  }
});
