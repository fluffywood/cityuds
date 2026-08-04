const images = [
  "/packages/doc-cs5487/assets/page-001.jpg",
  "/packages/doc-cs5487/assets/page-002.jpg",
  "/packages/doc-cs5487/assets/page-003.jpg",
  "/packages/doc-cs5487/assets/page-004.jpg",
  "/packages/doc-cs5487/assets/page-005.jpg",
  "/packages/doc-cs5487/assets/page-006.jpg",
  "/packages/doc-cs5487/assets/page-007.jpg",
  "/packages/doc-cs5487/assets/page-008.jpg",
  "/packages/doc-cs5487/assets/page-009.jpg"
];

Page({
  data: {
    courseCode: "CS5487",
    images
  },

  onShareAppMessage() {
    return {
      title: "CS5487 课程介绍（中英对照）",
      path: "/packages/doc-cs5487/pages/index/index"
    };
  }
});
