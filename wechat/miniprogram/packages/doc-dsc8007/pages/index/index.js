const images = [
  "/packages/doc-dsc8007/assets/page-001.jpg",
  "/packages/doc-dsc8007/assets/page-002.jpg",
  "/packages/doc-dsc8007/assets/page-003.jpg",
  "/packages/doc-dsc8007/assets/page-004.jpg",
  "/packages/doc-dsc8007/assets/page-005.jpg",
  "/packages/doc-dsc8007/assets/page-006.jpg",
  "/packages/doc-dsc8007/assets/page-007.jpg"
];

Page({
  data: {
    courseCode: "DSC8007",
    images
  },

  onShareAppMessage() {
    return {
      title: "DSC8007 课程介绍（中英对照）",
      path: "/packages/doc-dsc8007/pages/index/index"
    };
  }
});
