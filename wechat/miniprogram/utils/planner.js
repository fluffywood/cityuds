const DAY_NAMES = Object.freeze({
  M: "周一",
  T: "周二",
  W: "周三",
  R: "周四",
  F: "周五",
  S: "周六",
  U: "周日"
});

const WEEK_DAYS = Object.freeze(["M", "T", "W", "R", "F", "S"]);
const WEEK_START_MINUTES = 9 * 60;
const WEEK_END_MINUTES = 22 * 60;
const COURSE_COLORS = Object.freeze([
  Object.freeze({ background: "#dceee6", accent: "#145f49", ink: "#0e4938" }),
  Object.freeze({ background: "#e1ecf4", accent: "#275b83", ink: "#204c6c" }),
  Object.freeze({ background: "#f8e9d7", accent: "#a45b16", ink: "#81440d" }),
  Object.freeze({ background: "#ebe6f3", accent: "#65508d", ink: "#514071" }),
  Object.freeze({ background: "#edf0d9", accent: "#6d7b25", ink: "#526018" }),
  Object.freeze({ background: "#f2e4e8", accent: "#984a63", ink: "#77364c" })
]);
const COURSE_COLOR_PALETTE = COURSE_COLORS;
const TERM_CODES = Object.freeze(["A", "B", "S"]);
const DEFAULT_TERM = "A";
const DEFAULT_SELECTIONS = Object.freeze([
  Object.freeze({ code: "DSC5003", section: "C62" }),
  Object.freeze({ code: "DSC5001", section: "C61" }),
  Object.freeze({ code: "DSC5002", section: "C62" })
]);
const PROJECT_MUTEX = Object.freeze({ DSC6017: "DSC6032", DSC6032: "DSC6017" });

function normalizeTerm(value) {
  const term = String(value || "").trim().toUpperCase();
  return TERM_CODES.includes(term) ? term : "";
}

function courseOfferedInTerm(course, term = DEFAULT_TERM) {
  const normalizedTerm = normalizeTerm(term) || DEFAULT_TERM;
  if (Array.isArray(course && course.offered_terms)) {
    return course.offered_terms.some((item) => normalizeTerm(item) === normalizedTerm);
  }
  return normalizedTerm === DEFAULT_TERM && course && course.offered_this_year !== false;
}

function sectionsOf(course) {
  if (!course) return [];
  return course.eligible_sections || course.sections || [];
}

function sectionsForTerm(course, term = DEFAULT_TERM) {
  const normalizedTerm = normalizeTerm(term) || DEFAULT_TERM;
  return sectionsOf(course).filter((section) => {
    const sectionTerm = normalizeTerm(section && section.term);
    return sectionTerm ? sectionTerm === normalizedTerm : normalizedTerm === DEFAULT_TERM;
  });
}

function isProjectCourse(course) {
  return Boolean(course && course.allow_without_section === true);
}

function allowsUnscheduledSelection(course, term = DEFAULT_TERM) {
  if (isProjectCourse(course)) return courseOfferedInTerm(course, term);
  const normalizedTerm = normalizeTerm(term) || DEFAULT_TERM;
  return Array.isArray(course && course.allow_without_section_terms)
    && course.allow_without_section_terms.some((item) => normalizeTerm(item) === normalizedTerm);
}

function makeUnscheduledSelection() {
  return { unscheduled: true };
}

function isUnscheduledSelection(selection) {
  return Boolean(selection && selection.unscheduled === true);
}

function projectSelectionKey(courseOrCode) {
  const code = String(typeof courseOrCode === "string" ? courseOrCode : courseOrCode && courseOrCode.code || "");
  return code === "DSC6017" || code === "DSC6032" ? "INTERNSHIP_PROJECT" : code;
}

function projectConflictCodes(courseOrCode) {
  const code = String(typeof courseOrCode === "string" ? courseOrCode : courseOrCode && courseOrCode.code || "");
  return Array.from(new Set([code, PROJECT_MUTEX[code]].filter(Boolean)));
}

function sectionKey(section) {
  if (!section) return "";
  return String(section.crn || `${section.section}-${section.day}-${section.time}`);
}

function findSection(course, key, term) {
  if (!key) return null;
  const sections = term ? sectionsForTerm(course, term) : sectionsOf(course);
  return sections.find((section) => sectionKey(section) === String(key)) || null;
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

function makeSelectionForPrimary(course, primaryKey, term = DEFAULT_TERM) {
  const primary = findSection(course, primaryKey, term);
  if (!primary || Number(primary.credits) <= 0) return null;

  const tutorials = sectionsForTerm(course, term).filter((section) => Number(section.credits) === 0);
  const tutorial = pickTutorial(primary, tutorials);
  return {
    primaryCrn: sectionKey(primary),
    tutorialCrn: tutorial ? sectionKey(tutorial) : null
  };
}

function makeDefaultSelection(course, term = DEFAULT_TERM) {
  if (!courseOfferedInTerm(course, term)) return null;
  if (allowsUnscheduledSelection(course, term)) return makeUnscheduledSelection();
  const primary = sectionsForTerm(course, term).find((section) => Number(section.credits) > 0);
  return primary ? makeSelectionForPrimary(course, sectionKey(primary), term) : null;
}

function makeInitialSelections(courses, term = DEFAULT_TERM) {
  const normalizedTerm = normalizeTerm(term) || DEFAULT_TERM;
  if (normalizedTerm !== DEFAULT_TERM) return {};

  const selections = {};
  DEFAULT_SELECTIONS.forEach(({ code, section }) => {
    const course = (courses || []).find((item) => item && item.code === code);
    if (!course || !courseOfferedInTerm(course, normalizedTerm)) return;
    const primary = sectionsForTerm(course, normalizedTerm).find(
      (item) => item.section === section && Number(item.credits) > 0
    );
    const selection = primary
      ? makeSelectionForPrimary(course, sectionKey(primary), normalizedTerm)
      : null;
    if (selection) selections[code] = selection;
  });
  return selections;
}

function sanitizeSelections(courses, selections = {}, term = DEFAULT_TERM) {
  const sanitized = {};

  (courses || []).forEach((course) => {
    if (!courseOfferedInTerm(course, term)) return;
    const existing = selections && selections[course.code];
    if (!existing || typeof existing !== "object") return;

    if (allowsUnscheduledSelection(course, term)) {
      if (isUnscheduledSelection(existing)) sanitized[course.code] = makeUnscheduledSelection();
      return;
    }

    const existingPrimary = findSection(course, existing.primaryCrn, term);
    const primary = existingPrimary && Number(existingPrimary.credits) > 0
      ? existingPrimary
      : sectionsForTerm(course, term).find((section) => Number(section.credits) > 0);
    if (!primary) return;

    const next = makeSelectionForPrimary(course, sectionKey(primary), term);
    if (!next) return;

    if (Object.prototype.hasOwnProperty.call(existing, "tutorialCrn")) {
      if (!existing.tutorialCrn) {
        next.tutorialCrn = null;
      } else {
        const tutorial = findSection(course, existing.tutorialCrn, term);
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
  const term = normalizeTerm(filters.term) || DEFAULT_TERM;

  return (courses || []).filter((course) => {
    if (!courseOfferedInTerm(course, term)) return false;
    const searchableText = `${course.code || ""} ${course.programme_title || ""}`.toLowerCase();
    if (searchTerm && !searchableText.includes(searchTerm)) return false;
    if (requirementType !== "all" && course.requirement_type !== requirementType) return false;
    if (day !== "all") {
      const offeredThatDay = sectionsForTerm(course, term).some(
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

function formatMinutes(value) {
  const totalMinutes = Number(value);
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) return "";

  const roundedMinutes = Math.round(totalMinutes);
  const hours = Math.floor(roundedMinutes / 60);
  const minutes = roundedMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function parseTimeRange(value) {
  const parts = String(value || "").trim().split(/\s*[-–—]\s*/);
  if (parts.length !== 2) return null;

  const start = parseTime(parts[0]);
  const end = parseTime(parts[1]);
  if (start === null || end === null || end <= start) return null;
  return { start, end };
}

function buildSelectedEvents(courses, selections = {}, term = DEFAULT_TERM) {
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
      const section = findSection(course, key, term);
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

function assignEventLanes(events) {
  const assignedEvents = (events || []).map((event) => ({
    ...event,
    lane: 0,
    laneCount: 1
  }));
  const eventsByDay = Object.create(null);

  assignedEvents.forEach((event) => {
    const day = String(event.day || "");
    if (!eventsByDay[day]) eventsByDay[day] = [];
    eventsByDay[day].push(event);
  });

  Object.keys(eventsByDay).forEach((day) => {
    const dayEvents = eventsByDay[day].slice().sort(
      (left, right) => left.start - right.start || left.end - right.end
    );
    let cluster = [];
    let clusterEnd = -Infinity;

    const assignCluster = () => {
      const laneEnds = [];
      cluster.forEach((event) => {
        let lane = laneEnds.findIndex((end) => end <= event.start);
        if (lane === -1) lane = laneEnds.length;
        laneEnds[lane] = event.end;
        event.lane = lane;
      });

      const laneCount = Math.max(1, laneEnds.length);
      cluster.forEach((event) => {
        event.laneCount = laneCount;
      });
    };

    dayEvents.forEach((event) => {
      if (cluster.length && event.start >= clusterEnd) {
        assignCluster();
        cluster = [];
        clusterEnd = -Infinity;
      }
      cluster.push(event);
      clusterEnd = Math.max(clusterEnd, event.end);
    });
    if (cluster.length) assignCluster();
  });

  return assignedEvents;
}

function eventLabel(event) {
  const sectionCode = event.sectionCode || (event.section && event.section.section) || "班次待定";
  const typeLabel = event.typeLabel || (event.sectionType === "tutorial" ? "Tutorial" : "主课");
  return `${event.courseCode} ${sectionCode}（${typeLabel}）`;
}

function buildTimetableModel(courses, selections = {}, term = DEFAULT_TERM) {
  const courseByCode = Object.create(null);
  const colorByCode = Object.create(null);
  (courses || []).forEach((course, index) => {
    courseByCode[course.code] = course;
    colorByCode[course.code] = COURSE_COLORS[index % COURSE_COLORS.length];
  });

  const detected = detectConflicts(buildSelectedEvents(courses, selections, term));
  const laidOutEvents = assignEventLanes(detected.events);
  const labelsById = Object.create(null);

  laidOutEvents.forEach((event) => {
    labelsById[event.id] = eventLabel(event);
  });

  const events = laidOutEvents.map((event) => {
    const course = courseByCode[event.courseCode] || {};
    const section = event.section || {};
    const typeLabel = event.sectionType === "tutorial" ? "Tutorial" : "主课";
    const sectionCode = section.section || "";
    const paletteColor = colorByCode[event.courseCode] || COURSE_COLORS[0];
    return {
      ...event,
      courseTitle: course.programme_title || course.schedule_title || event.courseCode,
      sectionCode,
      typeLabel,
      room: [section.building, section.room].filter(Boolean).join(" ") || "地点待定",
      time: section.time || `${formatMinutes(event.start)} - ${formatMinutes(event.end)}`,
      conflictingEventIds: (event.conflictingEventIds || []).slice(),
      conflictingLabels: (event.conflictingEventIds || [])
        .map((id) => labelsById[id])
        .filter(Boolean),
      color: {
        background: paletteColor.background,
        accent: paletteColor.accent,
        ink: paletteColor.ink
      }
    };
  });

  const conflictPairs = detected.conflicts.map((conflict) => ({
    id: `${conflict.firstId}__${conflict.secondId}`,
    firstId: conflict.firstId,
    secondId: conflict.secondId,
    firstLabel: labelsById[conflict.firstId] || conflict.firstId,
    secondLabel: labelsById[conflict.secondId] || conflict.secondId,
    day: conflict.day,
    dayLabel: DAY_NAMES[conflict.day] || conflict.day,
    start: conflict.start,
    end: conflict.end,
    overlapText: `${formatMinutes(conflict.start)}–${formatMinutes(conflict.end)}`
  }));

  return {
    events,
    conflictPairs,
    conflicts: detected.conflicts
  };
}

function getSelectedEvents(courses, selections = {}, term = DEFAULT_TERM) {
  return detectConflicts(buildSelectedEvents(courses, selections, term)).events;
}

function summarizeCredits(courses, selections = {}, term = DEFAULT_TERM) {
  const selectedCourses = (courses || []).filter((course) => (
    courseOfferedInTerm(course, term) && Boolean(selections[course.code])
  ));
  const summary = {
    coreCount: 0,
    coreCredits: 0,
    electiveCount: 0,
    electiveCredits: 0,
    totalCount: selectedCourses.length,
    totalCredits: 0,
    projectCount: 0,
    projectCredits: 0,
    projects: []
  };

  selectedCourses.forEach((course) => {
    const credits = Number(course.credits) || 0;
    if (isProjectCourse(course)) {
      summary.projectCount += 1;
      summary.projectCredits += credits;
      summary.projects.push({ code: course.code, title: course.programme_title, credits });
    } else if (course.requirement_type === "core") {
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

function summarizeAllTerms(courses, selectionsByTerm = {}, confirmations = {}) {
  const regularEntries = [];
  const projectsByKey = Object.create(null);

  TERM_CODES.forEach((term) => {
    const selections = sanitizeSelections(courses, selectionsByTerm[term] || {}, term);
    (courses || []).forEach((course) => {
      if (!selections[course.code]) return;
      if (!getSelectionEligibility(courses, course, selectionsByTerm, confirmations).eligible) return;
      if (isProjectCourse(course)) {
        const key = projectSelectionKey(course);
        if (!projectsByKey[key]) projectsByKey[key] = course;
      } else {
        regularEntries.push(course);
      }
    });
  });

  const projects = Object.values(projectsByKey);
  const core = regularEntries.filter((course) => course.requirement_type === "core");
  const electives = regularEntries.filter((course) => course.requirement_type === "elective");
  const credits = (items) => items.reduce((total, course) => total + Number(course.credits || 0), 0);
  return {
    coreCount: core.length,
    coreCredits: credits(core),
    electiveCount: electives.length,
    electiveCredits: credits(electives),
    projectCount: projects.length,
    projectCredits: credits(projects),
    projects: projects.map((course) => ({ code: course.code, title: course.programme_title, credits: Number(course.credits) || 0 })),
    totalCount: core.length + electives.length + projects.length,
    totalCredits: credits(core) + credits(electives) + credits(projects)
  };
}

function countCreditsForSelection(course, selection, term) {
  if (!selection || !courseOfferedInTerm(course, term)) return 0;
  if (allowsUnscheduledSelection(course, term)) {
    return isUnscheduledSelection(selection) ? Number(course.credits || 0) : 0;
  }
  const primary = findSection(course, selection.primaryCrn, term);
  return Number(primary && primary.credits) || 0;
}

function selectedCreditsInTerm(courses, selections, term) {
  return (courses || []).reduce((total, course) => {
    return total + countCreditsForSelection(course, selections && selections[course.code], term);
  }, 0);
}

function confirmationItemsForRequirement(requirement, audienceNote, confirmations) {
  const items = [];
  const identityKey = String(requirement.confirmation_key || "").trim();
  if (identityKey) {
    items.push({
      key: identityKey,
      label: `我确认：${audienceNote || "符合课程身份要求"}`,
      met: confirmations[identityKey] === true,
      unmetText: "尚未确认学生身份"
    });
  }

  const minimumCreditsKey = String(requirement.minimum_credits_confirmation_key || "").trim();
  if (minimumCreditsKey) {
    const minimumCredits = Math.max(0, Number(requirement.minimum_credits || 0));
    items.push({
      key: minimumCreditsKey,
      label: String(requirement.minimum_credits_confirmation_label || `我已修满${minimumCredits}学分`),
      met: confirmations[minimumCreditsKey] === true,
      unmetText: `尚未确认已修满${minimumCredits}学分`
    });
  }

  return items;
}

function getSelectionEligibility(courses, course, selectionsByTerm = {}, confirmations = {}) {
  const requirement = course && course.selection_requirement;
  const audienceNote = String(course && course.eligibility_note || "");
  if (!requirement) {
    return { audienceNote, confirmationKey: "", confirmationMet: true, confirmationItems: [], eligible: true, hasRequirement: false, statusText: "" };
  }

  const terms = Array.from(new Set((requirement.terms || []).map(normalizeTerm).filter(Boolean)));
  const minimumCredits = Math.max(0, Number(requirement.minimum_credits || 0));
  const requiredCourses = Array.from(new Set((requirement.required_courses || []).map(String).filter(Boolean)));
  const confirmationItems = confirmationItemsForRequirement(requirement, audienceNote, confirmations);
  const confirmationKey = confirmationItems[0] ? confirmationItems[0].key : "";
  const confirmationMet = confirmationItems.every((item) => item.met);
  const selectedCodes = new Set();
  let selectedCredits = 0;

  terms.forEach((term) => {
    const selections = sanitizeSelections(courses, selectionsByTerm[term] || {}, term);
    (courses || []).forEach((candidate) => {
      if (selectedCodes.has(candidate.code) || !selections[candidate.code]) return;
      const credits = countCreditsForSelection(candidate, selections[candidate.code], term);
      if (credits <= 0) return;
      selectedCredits += credits;
      selectedCodes.add(candidate.code);
    });
  });
  const manuallyConfirmedCredits = Boolean(requirement.minimum_credits_confirmation_key);
  const missingCourses = requiredCourses.filter((code) => !selectedCodes.has(code));
  const termLabel = terms.length === 1 ? `${terms[0]} 学期` : `${terms.join("+")} 两学期`;
  const unmet = [
    ...confirmationItems.filter((item) => !item.met).map((item) => item.unmetText),
    !manuallyConfirmedCredits && selectedCredits < minimumCredits
      ? `${termLabel}当前 ${selectedCredits}/${minimumCredits} 学分`
      : "",
    missingCourses.length ? `${termLabel}缺少 ${missingCourses.join("、")}` : ""
  ].filter(Boolean);
  const creditsMet = manuallyConfirmedCredits
    ? confirmationItems.some((item) => item.key === requirement.minimum_credits_confirmation_key && item.met)
    : selectedCredits >= minimumCredits;
  const eligible = confirmationMet && creditsMet && missingCourses.length === 0;
  return {
    audienceNote,
    confirmationKey,
    confirmationMet,
    confirmationItems,
    eligible,
    hasRequirement: true,
    minimumCredits,
    missingCourses,
    requiredCourses,
    selectedCredits,
    selectedRequiredCount: requiredCourses.length - missingCourses.length,
    statusText: eligible ? "当前排课记录已满足选课条件。" : `当前排课记录未满足：${unmet.join("；")}。`,
    termLabel,
    terms
  };
}

function findProjectConflict(courses, selectionsByTerm, course) {
  const conflicts = projectConflictCodes(course);
  for (const term of TERM_CODES) {
    const selections = selectionsByTerm[term] || {};
    const code = conflicts.find((candidate) => selections[candidate]);
    if (code) return { code, term };
  }
  return null;
}

function findInvalidatedDependents(courses, selectionsByTerm, confirmations = {}) {
  const invalid = [];
  TERM_CODES.forEach((term) => {
    const selections = selectionsByTerm[term] || {};
    (courses || []).forEach((course) => {
      if (!selections[course.code] || !course.selection_requirement) return;
      const eligibility = getSelectionEligibility(courses, course, selectionsByTerm, confirmations);
      if (!eligibility.eligible) invalid.push({ course, term, eligibility });
    });
  });
  return invalid;
}

module.exports = {
  COURSE_COLORS,
  COURSE_COLOR_PALETTE,
  DEFAULT_TERM,
  DEFAULT_SELECTIONS,
  DAY_NAMES,
  TERM_CODES,
  WEEK_DAYS,
  WEEK_END_MINUTES,
  WEEK_START_MINUTES,
  assignEventLanes,
  allowsUnscheduledSelection,
  buildSelectedEvents,
  buildTimetableModel,
  courseOfferedInTerm,
  detectConflicts,
  filterCourses,
  findInvalidatedDependents,
  findProjectConflict,
  findSection,
  formatMinutes,
  getSelectedEvents,
  getSelectionEligibility,
  hasTimeConflict,
  isProjectCourse,
  isUnscheduledSelection,
  makeDefaultSelection,
  makeInitialSelections,
  makeSelectionForPrimary,
  makeUnscheduledSelection,
  normalizeTerm,
  parseTime,
  parseTimeRange,
  pickTutorial,
  projectConflictCodes,
  projectSelectionKey,
  sanitizeSelections,
  sectionsForTerm,
  sectionKey,
  summarizeAllTerms,
  summarizeCredits
};
