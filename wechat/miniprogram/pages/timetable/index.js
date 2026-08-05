const { courses, courseByCode } = require("../../data/catalog");
const {
  buildTimetableModel,
  DAY_NAMES,
  makeSelectionForPrimary,
  sanitizeSelections,
  sectionKey,
  summarizeCredits,
  WEEK_DAYS,
  WEEK_END_MINUTES,
  WEEK_START_MINUTES
} = require("../../utils/planner");
const {
  clearStoredSelections,
  getStoredSelections,
  saveSelections
} = require("../../utils/storage");

const DAYS = WEEK_DAYS.concat("U");
const WEEK_DAY_WIDTH = 190;
const WEEK_HEADER_HEIGHT = 70;
const WEEK_HOUR_HEIGHT = 80;
const WEEK_BODY_HEIGHT = ((WEEK_END_MINUTES - WEEK_START_MINUTES) / 60) * WEEK_HOUR_HEIGHT;
const WEEK_TIME_LABELS = Array.from(
  { length: (WEEK_END_MINUTES - WEEK_START_MINUTES) / 60 + 1 },
  (_, index) => {
    const hour = WEEK_START_MINUTES / 60 + index;
    return {
      label: `${String(hour).padStart(2, "0")}:00`,
      style: `top:${index * WEEK_HOUR_HEIGHT}rpx`,
      edgeClass: index === 0
        ? "is-first"
        : index === (WEEK_END_MINUTES - WEEK_START_MINUTES) / 60
          ? "is-last"
          : ""
    };
  }
);

function formatChoice(section) {
  return `${section.section} · ${DAY_NAMES[section.day] || section.day} ${section.time}${section.web === "N" ? " · WEB=N" : ""}`;
}

function makeConflictEditorItem(event, selections) {
  const course = courseByCode[event.courseCode];
  if (!course) return null;

  const isTutorial = event.sectionType === "tutorial";
  const sections = course.eligible_sections.filter((section) => (
    isTutorial ? Number(section.credits) === 0 : Number(section.credits) > 0
  ));
  const choices = sections.map((section) => ({
    key: sectionKey(section),
    label: formatChoice(section)
  }));
  if (isTutorial) choices.unshift({ key: "", label: "不选择 Tutorial" });
  if (!choices.length) return null;

  const selection = selections[event.courseCode] || {};
  const selectedKey = String(isTutorial ? selection.tutorialCrn || "" : selection.primaryCrn || "");
  const selectedIndex = choices.findIndex((choice) => choice.key === selectedKey);
  const choiceIndex = selectedIndex >= 0 ? selectedIndex : 0;
  return {
    eventId: event.id,
    courseCode: event.courseCode,
    courseTitle: event.courseTitle,
    sectionType: event.sectionType,
    typeLabel: event.typeLabel,
    choices,
    choiceIndex,
    choiceLabel: choices[choiceIndex].label,
    hasAlternatives: choices.length > 1
  };
}

function eventView(event) {
  const section = event.section;
  return {
    ...event,
    typeLabel: event.typeLabel || (event.sectionType === "tutorial" ? "Tutorial" : "主课"),
    room: event.room || [section.building, section.room].filter(Boolean).join(" ") || "地点待定",
    conflictText: event.conflictingLabels && event.conflictingLabels.length
      ? `与 ${event.conflictingLabels.join("、")} 冲突`
      : ""
  };
}

function weekEventView(event) {
  const visibleStart = Math.max(WEEK_START_MINUTES, event.start);
  const visibleEnd = Math.min(WEEK_END_MINUTES, event.end);
  const top = ((visibleStart - WEEK_START_MINUTES) / 60) * WEEK_HOUR_HEIGHT;
  const height = Math.max(54, ((visibleEnd - visibleStart) / 60) * WEEK_HOUR_HEIGHT - 4);
  const laneCount = Math.max(1, event.laneCount || 1);
  const lane = Math.max(0, event.lane || 0);
  const width = 100 / laneCount;
  const left = lane * width;
  const color = event.color || {};
  const background = event.conflict ? "#fff0f1" : (color.background || "#e9efff");
  const accent = event.conflict ? "#d14356" : (color.accent || "#2855d9");
  return {
    ...event,
    compact: height < 105,
    style:
      `top:${top + 2}rpx;height:${height}rpx;` +
      `left:calc(${left}% + 4rpx);width:calc(${width}% - 8rpx);` +
      `background:${background};` +
      `border-left-color:${accent};` +
      `color:${color.ink || "#263550"}`
  };
}

function makeWeekDays(events) {
  const dayKeys = WEEK_DAYS.slice();
  if (events.some((event) => event.day === "U")) dayKeys.push("U");
  return dayKeys.map((key) => ({
    key,
    label: DAY_NAMES[key],
    events: events
      .filter((event) => event.day === key && event.end > WEEK_START_MINUTES && event.start < WEEK_END_MINUTES)
      .map(weekEventView)
  }));
}

Page({
  data: {
    days: DAYS.map((key) => ({ key, label: DAY_NAMES[key] })),
    activeDay: "M",
    activeDayLabel: DAY_NAMES.M,
    events: [],
    weekDays: WEEK_DAYS.map((key) => ({ key, label: DAY_NAMES[key], events: [] })),
    weekTimeLabels: WEEK_TIME_LABELS,
    weekBodyHeight: WEEK_BODY_HEIGHT,
    weekHeaderHeight: WEEK_HEADER_HEIGHT,
    weekGridWidth: WEEK_DAYS.length * WEEK_DAY_WIDTH,
    weekEventCount: 0,
    selectedCourses: [],
    summary: null,
    conflictCourseCount: 0,
    conflictPairCount: 0,
    conflictPairs: [],
    showDailyAgenda: false,
    conflictEditorVisible: false,
    conflictEditorPairId: "",
    conflictEditorPairIndex: 0,
    conflictEditorPairChoices: [],
    conflictEditorPairLabel: "",
    conflictEditorOverlap: "",
    conflictEditorItems: []
  },

  onShow() {
    this.renderPlanner();
  },

  renderPlanner(selectionOverride) {
    const hasSelectionOverride = selectionOverride !== undefined;
    const selections = sanitizeSelections(
      courses,
      hasSelectionOverride ? selectionOverride : getStoredSelections()
    );
    if (!hasSelectionOverride) saveSelections(selections);
    const timetableModel = buildTimetableModel(courses, selections);
    const allEvents = timetableModel.events;
    const weekDays = makeWeekDays(allEvents);
    const selectedCourses = courses
      .filter((course) => Boolean(selections[course.code]))
      .map((course) => {
        const selection = selections[course.code];
        const primaries = course.eligible_sections.filter((section) => Number(section.credits) > 0);
        const tutorials = course.eligible_sections.filter((section) => Number(section.credits) === 0);
        const primaryKeys = primaries.map(sectionKey);
        const tutorialKeys = [""].concat(tutorials.map(sectionKey));
        const primaryIndex = Math.max(0, primaryKeys.indexOf(String(selection.primaryCrn || "")));
        const tutorialIndex = Math.max(0, tutorialKeys.indexOf(String(selection.tutorialCrn || "")));
        const primaryChoices = primaries.map((section) => ({
          key: sectionKey(section),
          label: formatChoice(section)
        }));
        const tutorialChoices = [{ key: "", label: "不选择 Tutorial" }].concat(
          tutorials.map((section) => ({ key: sectionKey(section), label: formatChoice(section) }))
        );
        return {
          code: course.code,
          title: course.programme_title,
          primaryChoices,
          primaryIndex,
          primaryLabel: primaryChoices[primaryIndex].label,
          tutorialChoices,
          tutorialIndex,
          tutorialLabel: tutorialChoices[tutorialIndex].label
        };
      });
    const conflictCodes = {};
    allEvents.forEach((event) => {
      if (event.conflict) conflictCodes[event.courseCode] = true;
    });

    this.allEvents = allEvents;
    this.eventById = Object.create(null);
    allEvents.forEach((event) => {
      this.eventById[event.id] = event;
    });
    this.conflictPairs = timetableModel.conflictPairs;
    this.setData({
      events: allEvents
        .filter((event) => event.day === this.data.activeDay)
        .sort((left, right) => left.start - right.start)
        .map(eventView),
      weekDays,
      weekGridWidth: weekDays.length * WEEK_DAY_WIDTH,
      weekEventCount: weekDays.reduce((count, day) => count + day.events.length, 0),
      selectedCourses,
      summary: summarizeCredits(courses, selections),
      conflictCourseCount: Object.keys(conflictCodes).length,
      conflictPairCount: timetableModel.conflictPairs.length,
      conflictPairs: timetableModel.conflictPairs
    });
  },

  openOverview() {
    wx.navigateTo({ url: "/pages/timetable-overview/index" });
  },

  toggleDailyAgenda() {
    this.setData({ showDailyAgenda: !this.data.showDailyAgenda });
  },

  handleEventTap(event) {
    const eventId = event.currentTarget.dataset.eventId;
    const selectedEvent = this.eventById && this.eventById[eventId];
    if (!selectedEvent || !selectedEvent.conflict) {
      this.openCourse(event);
      return;
    }

    const pairs = (this.conflictPairs || []).filter(
      (item) => item.firstId === eventId || item.secondId === eventId
    );
    if (pairs.length) {
      const pairChoices = pairs.map((pair) => ({
        key: pair.id,
        label: `${pair.firstId === eventId ? pair.secondLabel : pair.firstLabel} · ${pair.dayLabel} ${pair.overlapText}`
      }));
      this.showConflictEditor(pairs[0], pairChoices, 0);
      return;
    }
    this.openCourse(event);
  },

  openConflictPair(event) {
    const pairIndex = Number(event.currentTarget.dataset.pairIndex);
    const pairId = event.currentTarget.dataset.pairId;
    const conflictPairs = this.data.conflictPairs || this.conflictPairs || [];
    const pairFromIndex = Number.isInteger(pairIndex) ? conflictPairs[pairIndex] : null;
    const pair = pairFromIndex || conflictPairs.find((item) => item.id === pairId);
    if (!pair) {
      wx.showToast({ title: "未找到冲突组合", icon: "none" });
      return;
    }
    this.showConflictEditor(pair, [{
      key: pair.id,
      label: `${pair.firstLabel} ↔ ${pair.secondLabel}`
    }], 0);
  },

  showConflictEditor(pair, pairChoices, pairIndex) {
    const selections = sanitizeSelections(courses, getStoredSelections());
    const items = [pair.firstId, pair.secondId]
      .map((eventId) => this.eventById && this.eventById[eventId])
      .map((event) => event && makeConflictEditorItem(event, selections))
      .filter(Boolean);
    if (items.length !== 2) {
      wx.showToast({ title: "暂时无法读取班次", icon: "none" });
      return;
    }

    this.setData({
      conflictEditorVisible: true,
      conflictEditorPairId: pair.id,
      conflictEditorPairIndex: pairIndex,
      conflictEditorPairChoices: pairChoices,
      conflictEditorPairLabel: pairChoices[pairIndex] ? pairChoices[pairIndex].label : "",
      conflictEditorOverlap: `${pair.dayLabel} ${pair.overlapText}`,
      conflictEditorItems: items
    });
  },

  changeConflictPair(event) {
    const pairIndex = Number(event.detail.value);
    const pairChoices = this.data.conflictEditorPairChoices || [];
    const choice = pairChoices[pairIndex];
    const pair = choice && (this.conflictPairs || []).find((item) => item.id === choice.key);
    if (pair) this.showConflictEditor(pair, pairChoices, pairIndex);
  },

  changeConflictChoice(event) {
    const itemIndex = Number(event.currentTarget.dataset.itemIndex);
    const choiceIndex = Number(event.detail.value);
    const items = (this.data.conflictEditorItems || []).map((item, index) => {
      if (index !== itemIndex || !item.choices[choiceIndex]) return item;
      return {
        ...item,
        choiceIndex,
        choiceLabel: item.choices[choiceIndex].label
      };
    });
    this.setData({ conflictEditorItems: items });
  },

  cancelConflictEditor() {
    this.setData({
      conflictEditorVisible: false,
      conflictEditorPairId: "",
      conflictEditorPairIndex: 0,
      conflictEditorPairChoices: [],
      conflictEditorPairLabel: "",
      conflictEditorOverlap: "",
      conflictEditorItems: []
    });
  },

  confirmConflictChanges() {
    const changes = (this.data.conflictEditorItems || []).map((item) => ({
      ...item,
      choice: item.choices[item.choiceIndex]
    }));
    if (changes.length !== 2 || changes.some((item) => !item.choice)) return;

    const preparedChanges = changes.map((item) => {
      const course = courseByCode[item.courseCode];
      if (!course) return null;
      if (item.sectionType !== "tutorial") {
        const nextSelection = makeSelectionForPrimary(course, item.choice.key);
        return nextSelection ? { ...item, nextSelection } : null;
      }
      const tutorialIsValid = item.choice.key === "" || course.eligible_sections.some(
        (section) => Number(section.credits) === 0 && sectionKey(section) === item.choice.key
      );
      return tutorialIsValid ? item : null;
    });
    if (preparedChanges.some((item) => !item)) {
      wx.showToast({ title: "所选班次无效", icon: "none" });
      return;
    }

    const selections = sanitizeSelections(courses, getStoredSelections());
    preparedChanges
      .filter((item) => item.sectionType !== "tutorial")
      .forEach((item) => {
        selections[item.courseCode] = item.nextSelection;
      });
    preparedChanges
      .filter((item) => item.sectionType === "tutorial")
      .forEach((item) => {
        if (selections[item.courseCode]) selections[item.courseCode].tutorialCrn = item.choice.key || null;
      });

    saveSelections(selections);
    this.setData({
      conflictEditorVisible: false,
      conflictEditorPairId: "",
      conflictEditorPairIndex: 0,
      conflictEditorPairChoices: [],
      conflictEditorPairLabel: "",
      conflictEditorOverlap: "",
      conflictEditorItems: []
    });
    this.renderPlanner(selections);
    wx.showToast({ title: "班次已更新", icon: "success" });
  },

  stopTouch() {},

  selectDay(event) {
    const activeDay = event.currentTarget.dataset.day;
    this.setData({
      activeDay,
      activeDayLabel: DAY_NAMES[activeDay],
      events: (this.allEvents || [])
        .filter((item) => item.day === activeDay)
        .sort((left, right) => left.start - right.start)
        .map(eventView)
    });
  },

  changePrimary(event) {
    const code = event.currentTarget.dataset.code;
    const course = courseByCode[code];
    const selectedView = this.data.selectedCourses.find((item) => item.code === code);
    const choice = selectedView && selectedView.primaryChoices[Number(event.detail.value)];
    if (!course || !choice) return;
    const selections = getStoredSelections();
    selections[code] = makeSelectionForPrimary(course, choice.key);
    saveSelections(selections);
    this.renderPlanner();
    wx.showToast({ title: `已切换 ${code} 班次`, icon: "none" });
  },

  changeTutorial(event) {
    const code = event.currentTarget.dataset.code;
    const selectedView = this.data.selectedCourses.find((item) => item.code === code);
    const choice = selectedView && selectedView.tutorialChoices[Number(event.detail.value)];
    const selections = getStoredSelections();
    if (!selections[code] || !choice) return;
    selections[code].tutorialCrn = choice.key || null;
    saveSelections(selections);
    this.renderPlanner();
  },

  removeCourse(event) {
    const code = event.currentTarget.dataset.code;
    const selections = getStoredSelections();
    delete selections[code];
    saveSelections(selections);
    this.renderPlanner();
    wx.showToast({ title: `已移除 ${code}`, icon: "none" });
  },

  openCourse(event) {
    const code = event.currentTarget.dataset.code;
    wx.navigateTo({ url: `/packages/course/pages/detail/index?code=${code}` });
  },

  browseCourses() {
    wx.switchTab({ url: "/pages/courses/index" });
  },

  clearAll() {
    if (!this.data.selectedCourses.length) return;
    wx.showModal({
      title: "清空课表",
      content: "确定移除全部已选课程吗？",
      confirmColor: "#b42335",
      success: (result) => {
        if (!result.confirm) return;
        clearStoredSelections();
        this.renderPlanner();
      }
    });
  },

  onShareAppMessage() {
    return { title: "CityU MSDS 选课板" };
  }
});
