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
      if (course.offered === false || course.addable === false || course.canAdd === false && !this.properties.added) return;
      this.triggerEvent("toggle", { code: this.properties.course.code });
    },

    changeSection(event) {
      const course = this.properties.course || {};
      const choices = Array.isArray(course.primaryChoices) ? course.primaryChoices : [];
      const choice = choices[Number(event.detail.value)];
      if (!choice) return;
      this.triggerEvent("sectionchange", {
        code: course.code,
        key: choice.key
      });
    },

    confirmEligibility(event) {
      const values = Array.isArray(event.detail.value) ? event.detail.value : [];
      const key = String(event.currentTarget.dataset.key || "");
      if (!key) return;
      this.triggerEvent("confirmeligibility", {
        key,
        value: values.includes(key)
      });
    },

    noop() {
      // Keep interactive controls inside the card from opening the detail page.
    }
  }
});
