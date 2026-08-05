const { courses } = require("../../data/catalog");
const {
  buildTimetableModel,
  sanitizeSelections,
  WEEK_DAYS,
  WEEK_END_MINUTES,
  WEEK_START_MINUTES
} = require("../../utils/planner");
const {
  getStoredSelections,
  saveSelections
} = require("../../utils/storage");

const DAY_LABELS = Object.freeze({
  M: "周一",
  T: "周二",
  W: "周三",
  R: "周四",
  F: "周五",
  S: "周六",
  U: "周日"
});
const WEEK_MINUTES = WEEK_END_MINUTES - WEEK_START_MINUTES;

function formatClock(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function percent(value) {
  return Number(value.toFixed(4));
}

function makeTimeLabels() {
  const labels = [];
  for (let minute = WEEK_START_MINUTES; minute <= WEEK_END_MINUTES; minute += 60) {
    const top = ((minute - WEEK_START_MINUTES) / WEEK_MINUTES) * 100;
    labels.push({
      label: formatClock(minute),
      top: percent(top),
      edgeClass: minute === WEEK_START_MINUTES
        ? "is-first"
        : minute === WEEK_END_MINUTES
          ? "is-last"
          : ""
    });
  }
  return labels;
}

function makeEventView(event, dayIndex, dayCount) {
  const visibleStart = Math.max(WEEK_START_MINUTES, event.start);
  const visibleEnd = Math.min(WEEK_END_MINUTES, event.end);
  const laneCount = Math.max(1, Number(event.laneCount) || 1);
  const lane = Math.min(laneCount - 1, Math.max(0, Number(event.lane) || 0));
  const dayWidth = 100 / dayCount;
  const laneWidth = dayWidth / laneCount;
  const left = dayIndex * dayWidth + lane * laneWidth;
  const top = ((visibleStart - WEEK_START_MINUTES) / WEEK_MINUTES) * 100;
  const height = ((visibleEnd - visibleStart) / WEEK_MINUTES) * 100;
  const section = event.section || {};
  const sectionCode = event.sectionCode || section.section || "";
  const color = event.color || {};
  const conflictingLabels = Array.isArray(event.conflictingLabels)
    ? event.conflictingLabels
    : [];
  const background = event.conflict ? "#fff0f0" : (color.background || "#e9efff");
  const border = event.conflict ? "#c62828" : (color.accent || "#2855d9");

  return {
    ...event,
    sectionCode,
    displayLabel: [event.courseCode, sectionCode].filter(Boolean).join(" "),
    secondaryLabel: sectionCode || event.typeLabel || "课程",
    timeText: event.time || section.time || `${formatClock(event.start)}–${formatClock(event.end)}`,
    roomText: event.room || [section.building, section.room].filter(Boolean).join(" ") || "地点待定",
    conflictingLabels,
    compact: visibleEnd - visibleStart < 75,
    style:
      `top:${percent(top)}%;height:${percent(height)}%;` +
      `left:calc(${percent(left)}% + 1px);width:calc(${percent(laneWidth)}% - 2px);` +
      `background:${background};border-color:${border};border-left-color:${border};` +
      `color:${color.ink || "#263550"}`
  };
}

Page({
  data: {
    days: WEEK_DAYS.map((key, index) => ({
      key,
      label: DAY_LABELS[key] || key,
      alternate: index % 2 === 1
    })),
    timeLabels: makeTimeLabels(),
    events: [],
    conflictPairCount: 0
  },

  onShow() {
    const selections = sanitizeSelections(courses, getStoredSelections());
    saveSelections(selections);

    const timetable = buildTimetableModel(courses, selections);
    const allEvents = timetable.events || [];
    const dayKeys = WEEK_DAYS.slice();
    if (allEvents.some((event) => event.day === "U") && !dayKeys.includes("U")) {
      dayKeys.push("U");
    }
    const days = dayKeys.map((key, index) => ({
      key,
      label: DAY_LABELS[key] || key,
      alternate: index % 2 === 1
    }));
    const events = allEvents
      .filter((event) => (
        dayKeys.includes(event.day) &&
        event.end > WEEK_START_MINUTES &&
        event.start < WEEK_END_MINUTES
      ))
      .map((event) => makeEventView(event, dayKeys.indexOf(event.day), dayKeys.length));

    this.eventById = Object.create(null);
    events.forEach((event) => {
      this.eventById[event.id] = event;
    });
    this.setData({
      days,
      events,
      conflictPairCount: (timetable.conflictPairs || []).length
    });
  },

  openEvent(event) {
    const selectedEvent = this.eventById && this.eventById[event.currentTarget.dataset.id];
    if (!selectedEvent) return;

    const details = [
      selectedEvent.courseTitle || selectedEvent.courseCode,
      `${DAY_LABELS[selectedEvent.day] || selectedEvent.day} ${selectedEvent.timeText}`,
      [selectedEvent.typeLabel, selectedEvent.roomText].filter(Boolean).join(" · ")
    ];
    if (selectedEvent.conflictingLabels.length) {
      details.push(`冲突：${selectedEvent.conflictingLabels.join("、")}`);
    }

    wx.showModal({
      title: selectedEvent.displayLabel || "课程详情",
      content: details.filter(Boolean).join("\n"),
      confirmText: "课程详情",
      cancelText: "关闭",
      confirmColor: "#2855d9",
      success: (result) => {
        if (!result.confirm || !selectedEvent.courseCode) return;
        wx.navigateTo({
          url: `/packages/course/pages/detail/index?code=${selectedEvent.courseCode}`
        });
      }
    });
  }
});
