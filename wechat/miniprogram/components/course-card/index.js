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
      const course = this.properties.course || {};
      const values = Array.isArray(event.detail.value) ? event.detail.value : [];
      this.triggerEvent("confirmeligibility", {
        key: course.confirmationKey,
        value: values.includes(course.confirmationKey)
      });
    },

    noop() {
      // Keep interactive controls inside the card from opening the detail page.
    }
  }
});
