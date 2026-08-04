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
      this.triggerEvent("toggle", { code: this.properties.course.code });
    }
  }
});
