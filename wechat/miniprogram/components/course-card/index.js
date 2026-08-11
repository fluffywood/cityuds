Component({
  properties: {
    course: {
      type: Object,
      value: {}
    },
    added: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    openCourse() {
      this.triggerEvent("open", { code: this.properties.course.code });
    },

    toggleCourse() {
      const course = this.properties.course || {};
      if (course.offered === false) return;
      this.triggerEvent("toggle", { code: this.properties.course.code });
    }
  }
});
