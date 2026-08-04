const DAY_NAMES = Object.freeze({
  M: "周一",
  T: "周二",
  W: "周三",
  R: "周四",
  F: "周五",
  S: "周六",
  U: "周日"
});

function sectionsOf(course) {
  if (!course) return [];
  return course.eligible_sections || course.sections || [];
}

function sectionKey(section) {
  if (!section) return "";
  return String(section.crn || `${section.section}-${section.day}-${section.time}`);
}

function findSection(course, key) {
  if (!key) return null;
  return sectionsOf(course).find((section) => sectionKey(section) === String(key)) || null;
}

function pickTutorial(primary, tutorials) {
  if (!primary || !tutorials.length) return null;

  const suffixMatch = String(primary.section || "").match(/\d+$/);
  const numericSuffix = suffixMatch ? suffixMatch[0] : "";
  const sameSuffix = numericSuffix
    ? tutorials.find((tutorial) => String(tutorial.section || "").endsWith(numericSuffix))
    : null;
  if (sameSuffix) return sameSuffix;

  const sectionFamily = String(primary.section || "").slice(0, 1);
  return tutorials.find((tutorial) => String(tutorial.section || "").startsWith(sectionFamily)) || tutorials[0];
}

function makeSelectionForPrimary(course, primaryKey) {
  const primary = findSection(course, primaryKey);
  if (!primary || Number(primary.credits) <= 0) return null;

  const tutorials = sectionsOf(course).filter((section) => Number(section.credits) === 0);
  const tutorial = pickTutorial(primary, tutorials);
  return {
    primaryCrn: sectionKey(primary),
    tutorialCrn: tutorial ? sectionKey(tutorial) : null
  };
}

function makeDefaultSelection(course) {
  const primary = sectionsOf(course).find((section) => Number(section.credits) > 0);
  return primary ? makeSelectionForPrimary(course, sectionKey(primary)) : null;
}

function sanitizeSelections(courses, selections = {}) {
  const sanitized = {};

  (courses || []).forEach((course) => {
    const existing = selections && selections[course.code];
    if (!existing || typeof existing !== "object") return;

    const existingPrimary = findSection(course, existing.primaryCrn);
    const primary = existingPrimary && Number(existingPrimary.credits) > 0
      ? existingPrimary
      : sectionsOf(course).find((section) => Number(section.credits) > 0);
    if (!primary) return;

    const next = makeSelectionForPrimary(course, sectionKey(primary));
    if (!next) return;

    if (Object.prototype.hasOwnProperty.call(existing, "tutorialCrn")) {
      if (!existing.tutorialCrn) {
        next.tutorialCrn = null;
      } else {
        const tutorial = findSection(course, existing.tutorialCrn);
        if (tutorial && Number(tutorial.credits) === 0) {
          next.tutorialCrn = sectionKey(tutorial);
        }
      }
    }
    sanitized[course.code] = next;
  });

  return sanitized;
}

function filterCourses(courses, filters = {}) {
  const searchTerm = String(filters.searchTerm || "").trim().toLowerCase();
  const requirementType = filters.requirementType || "all";
  const day = filters.day || "all";

  return (courses || []).filter((course) => {
    const searchableText = `${course.code || ""} ${course.programme_title || ""}`.toLowerCase();
    if (searchTerm && !searchableText.includes(searchTerm)) return false;
    if (requirementType !== "all" && course.requirement_type !== requirementType) return false;
    if (day !== "all") {
      const offeredThatDay = sectionsOf(course).some(
        (section) => Number(section.credits) > 0 && section.day === day
      );
      if (!offeredThatDay) return false;
    }
    return true;
  });
}

function parseTime(value) {
  const match = String(value || "").trim().match(/^(\d{1,2}):([0-5]\d)$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23) return null;
  return hours * 60 + minutes;
}

function parseTimeRange(value) {
  const parts = String(value || "").trim().split(/\s*[-–—]\s*/);
  if (parts.length !== 2) return null;

  const start = parseTime(parts[0]);
  const end = parseTime(parts[1]);
  if (start === null || end === null || end <= start) return null;
  return { start, end };
}

function buildSelectedEvents(courses, selections = {}) {
  const courseByCode = Object.create(null);
  (courses || []).forEach((course) => {
    courseByCode[course.code] = course;
  });

  const events = [];
  Object.keys(selections || {}).forEach((courseCode) => {
    const course = courseByCode[courseCode];
    const selection = selections[courseCode];
    if (!course || !selection) return;

    [
      ["primary", selection.primaryCrn],
      ["tutorial", selection.tutorialCrn]
    ].forEach(([sectionType, key]) => {
      const section = findSection(course, key);
      const range = section ? parseTimeRange(section.time) : null;
      if (!section || !section.day || !range) return;
      events.push({
        id: `${courseCode}:${sectionType}:${sectionKey(section)}`,
        courseCode,
        sectionType,
        section,
        day: section.day,
        start: range.start,
        end: range.end
      });
    });
  });

  return events;
}

function hasTimeConflict(first, second) {
  return Boolean(
    first &&
      second &&
      first.day === second.day &&
      Number.isFinite(first.start) &&
      Number.isFinite(first.end) &&
      Number.isFinite(second.start) &&
      Number.isFinite(second.end) &&
      first.start < second.end &&
      second.start < first.end
  );
}

function detectConflicts(events) {
  const annotatedEvents = (events || []).map((event) => ({
    ...event,
    conflict: false,
    conflictingEventIds: []
  }));
  const conflicts = [];

  for (let leftIndex = 0; leftIndex < annotatedEvents.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < annotatedEvents.length; rightIndex += 1) {
      const first = annotatedEvents[leftIndex];
      const second = annotatedEvents[rightIndex];
      if (!hasTimeConflict(first, second)) continue;

      first.conflict = true;
      second.conflict = true;
      first.conflictingEventIds.push(second.id);
      second.conflictingEventIds.push(first.id);
      conflicts.push({
        firstId: first.id,
        secondId: second.id,
        day: first.day,
        start: Math.max(first.start, second.start),
        end: Math.min(first.end, second.end)
      });
    }
  }

  return { events: annotatedEvents, conflicts };
}

function getSelectedEvents(courses, selections = {}) {
  return detectConflicts(buildSelectedEvents(courses, selections)).events;
}

function summarizeCredits(courses, selections = {}) {
  const selectedCourses = (courses || []).filter((course) => Boolean(selections[course.code]));
  const summary = {
    coreCount: 0,
    coreCredits: 0,
    electiveCount: 0,
    electiveCredits: 0,
    totalCount: selectedCourses.length,
    totalCredits: 0
  };

  selectedCourses.forEach((course) => {
    const credits = Number(course.credits) || 0;
    if (course.requirement_type === "core") {
      summary.coreCount += 1;
      summary.coreCredits += credits;
    } else {
      summary.electiveCount += 1;
      summary.electiveCredits += credits;
    }
    summary.totalCredits += credits;
  });

  return summary;
}

module.exports = {
  DAY_NAMES,
  buildSelectedEvents,
  detectConflicts,
  filterCourses,
  findSection,
  getSelectedEvents,
  hasTimeConflict,
  makeDefaultSelection,
  makeSelectionForPrimary,
  parseTime,
  parseTimeRange,
  pickTutorial,
  sanitizeSelections,
  sectionKey,
  summarizeCredits
};
