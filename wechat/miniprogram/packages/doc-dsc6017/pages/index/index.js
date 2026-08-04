const images = [
  "/packages/doc-dsc6017/assets/page-001.jpg",
  "/packages/doc-dsc6017/assets/page-002.jpg",
  "/packages/doc-dsc6017/assets/page-003.jpg",
  "/packages/doc-dsc6017/assets/page-004.jpg",
  "/packages/doc-dsc6017/assets/page-005.jpg"
];

Page({
  data: {
    courseCode: "DSC6017",
    images
  },

  onShareAppMessage() {
    return {
      title: "DSC6017 课程介绍（中英对照）",
      path: "/packages/doc-dsc6017/pages/index/index"
    };
  }
});
