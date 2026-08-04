const images = [
  "/packages/doc-dsc5003/assets/page-001.jpg",
  "/packages/doc-dsc5003/assets/page-002.jpg",
  "/packages/doc-dsc5003/assets/page-003.jpg",
  "/packages/doc-dsc5003/assets/page-004.jpg",
  "/packages/doc-dsc5003/assets/page-005.jpg",
  "/packages/doc-dsc5003/assets/page-006.jpg"
];

Page({
  data: {
    courseCode: "DSC5003",
    images
  },

  onShareAppMessage() {
    return {
      title: "DSC5003 课程介绍（中英对照）",
      path: "/packages/doc-dsc5003/pages/index/index"
    };
  }
});
