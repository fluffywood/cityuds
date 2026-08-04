const { documents } = require("../../data/documents");

Component({
  properties: {
    courseCode: {
      type: String,
      value: ""
    },
    images: {
      type: Array,
      value: []
    }
  },

  data: {
    document: null,
    currentIndex: 0,
    currentPage: null,
    currentImage: "",
    totalPages: 0,
    imageError: false
  },

  observers: {
    "courseCode, images": function handleDocumentChange(courseCode, images) {
      if (!courseCode || !images || !images.length) {
        this.setData({ document: null, currentPage: null, currentImage: "", totalPages: 0 });
        return;
      }
      const documentRecord = documents[courseCode];
      const document = documentRecord && documentRecord.translation;
      if (!document || !Array.isArray(document.pages) || !document.pages.length) {
        this.setData({ document: null, currentPage: null, currentImage: "", totalPages: 0 });
        return;
      }
      const totalPages = Math.min(document.pages.length, images.length);
      this.setData({
        document,
        currentIndex: 0,
        currentPage: document.pages[0],
        currentImage: images[0],
        totalPages,
        imageError: false
      });
    }
  },

  methods: {
    showPage(index, moveViewport) {
      const document = this.data.document;
      const images = this.properties.images;
      const totalPages = this.data.totalPages;
      if (!document || index < 0 || index >= totalPages) return;

      this.setData({
        currentIndex: index,
        currentPage: document.pages[index],
        currentImage: images[index],
        imageError: false
      });

      if (moveViewport) {
        wx.pageScrollTo({ scrollTop: 0, duration: 180 });
      }
    },

    previousPage() {
      this.showPage(this.data.currentIndex - 1, true);
    },

    nextPage() {
      this.showPage(this.data.currentIndex + 1, true);
    },

    previewOriginal() {
      if (!this.data.currentImage) return;
      wx.previewImage({
        current: this.data.currentImage,
        urls: [this.data.currentImage]
      });
    },

    handleImageError() {
      this.setData({ imageError: true });
      wx.showToast({ title: "原文图片加载失败", icon: "none" });
    }
  }
});
