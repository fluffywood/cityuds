const images = [
  "/packages/doc-dsc6002/assets/page-001.jpg",
  "/packages/doc-dsc6002/assets/page-002.jpg",
  "/packages/doc-dsc6002/assets/page-003.jpg",
  "/packages/doc-dsc6002/assets/page-004.jpg",
  "/packages/doc-dsc6002/assets/page-005.jpg",
  "/packages/doc-dsc6002/assets/page-006.jpg"
];

Page({
  data: {
    courseCode: "DSC6002",
    images
  },

  onShareAppMessage() {
    return {
      title: "DSC6002 课程介绍（中英对照）",
      path: "/packages/doc-dsc6002/pages/index/index"
    };
  }
});
