const TERM_CODES = Object.freeze(["A", "B", "S"]);
const TERM_FALLBACK_LABELS = Object.freeze({
  A: "Semester A",
  B: "Semester B",
  S: "Summer Term"
});
const TERM_SHORT_LABELS = Object.freeze({
  A: "A 学期",
  B: "B 学期",
  S: "S 学期"
});
const PROJECT_MUTEX = Object.freeze({ DSC6017: "DSC6032", DSC6032: "DSC6017" });

function normalizeTerm(value) {
  const term = String(value || "").trim().toUpperCase();
  return TERM_CODES.includes(term) ? term : "";
}

function normalizeCourseCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/^SDSC(?=\d{4}$)/, "DSC");
}

function termOptions(metadata = {}) {
  const supplied = Array.isArray(metadata.terms) ? metadata.terms : [];
  const suppliedByCode = Object.create(null);
  supplied.forEach((item) => {
    const entry = typeof item === "string" ? { code: item } : item;
    const code = normalizeTerm(entry && entry.code);
    if (code) suppliedByCode[code] = entry;
  });

  return TERM_CODES.map((code) => ({
    code,
    label: TERM_SHORT_LABELS[code],
    fullLabel: (suppliedByCode[code] && suppliedByCode[code].label) || TERM_FALLBACK_LABELS[code]
  }));
}

function termLabel(metadata, term, includeYear = false) {
  const normalized = normalizeTerm(term) || "A";
  const option = termOptions(metadata).find((item) => item.code === normalized);
  const label = option ? option.fullLabel : TERM_FALLBACK_LABELS[normalized];
  const academicYear = metadata && metadata.academic_year;
  return includeYear && academicYear && !label.includes(academicYear)
    ? `${label} · ${academicYear}`
    : label;
}

function courseOfferedInTerm(course, term) {
  const normalized = normalizeTerm(term) || "A";
  if (Array.isArray(course && course.offered_terms)) {
    return course.offered_terms.some((item) => normalizeTerm(item) === normalized);
  }
  return normalized === "A" && course && course.offered_this_year !== false;
}

function sectionsForTerm(course, term) {
  const normalized = normalizeTerm(term) || "A";
  return ((course && course.eligible_sections) || []).filter((section) => {
    const sectionTerm = normalizeTerm(section && section.term);
    return sectionTerm ? sectionTerm === normalized : normalized === "A";
  });
}

function courseForTerm(course, term) {
  return {
    ...course,
    active_term: normalizeTerm(term) || "A",
    eligible_sections: sectionsForTerm(course, term)
  };
}

function isProjectCourse(course) {
  return Boolean(course && (course.requirement_type === "project" || course.allow_without_section === true));
}

function allowsUnscheduledSelection(course, term) {
  if (!courseOfferedInTerm(course, term)) return false;
  if (course && course.allow_without_section === true) return true;
  return Array.isArray(course && course.allow_without_section_terms)
    && course.allow_without_section_terms.some((item) => normalizeTerm(item) === normalizeTerm(term));
}

function makeUnscheduledSelection() {
  return { unscheduled: true };
}

function isUnscheduledSelection(selection) {
  return Boolean(selection && selection.unscheduled === true);
}

function sectionKey(section) {
  if (!section) return "";
  return String(section.crn || `${section.section}-${section.day}-${section.time}`);
}

function selectedCreditsInTerm(course, selection, term) {
  if (!courseOfferedInTerm(course, term)) return 0;
  if (allowsUnscheduledSelection(course, term)) {
    return isUnscheduledSelection(selection) ? Number(course.credits || 0) : 0;
  }
  const primary = sectionsForTerm(course, term).find((section) => (
    Number(section.credits) > 0 && sectionKey(section) === String(selection && selection.primaryCrn || "")
  ));
  return Number(primary && primary.credits || 0);
}

function isSelectionValid(course, selection, term) {
  return selectedCreditsInTerm(course, selection, term) > 0;
}

function getSelectionEligibility(courses, course, selectionsByTerm = {}, confirmations = {}) {
  const requirement = course && course.selection_requirement;
  const audienceNote = String(course && course.eligibility_note || "");
  if (!requirement) {
    return {
      audienceNote,
      confirmationKey: "",
      confirmationMet: true,
      eligible: true,
      hasRequirement: false,
      minimumCredits: 0,
      missingCourses: [],
      requiredCourses: [],
      requirementText: "",
      selectedCredits: 0,
      selectedRequiredCount: 0,
      statusText: "",
      termLabel: ""
    };
  }

  const terms = [...new Set((requirement.terms || []).map(normalizeTerm).filter(Boolean))];
  const requiredCourses = [...new Set(
    (requirement.required_courses || []).map(normalizeCourseCode).filter(Boolean)
  )];
  const confirmationKey = String(requirement.confirmation_key || "").trim();
  const confirmationMet = !confirmationKey || confirmations[confirmationKey] === true;
  const selectedCodes = new Set();
  let selectedCredits = 0;

  terms.forEach((term) => {
    const selections = selectionsByTerm[term] || {};
    (courses || []).forEach((candidate) => {
      const credits = selectedCreditsInTerm(candidate, selections[candidate.code], term);
      if (credits <= 0 || selectedCodes.has(candidate.code)) return;
      selectedCodes.add(candidate.code);
      selectedCredits += credits;
    });
  });

  const minimumCredits = Math.max(0, Number(requirement.minimum_credits || 0));
  const missingCourses = requiredCourses.filter((code) => !selectedCodes.has(code));
  const requiredCourseText = requiredCourses.length === 3
    && requiredCourses.every((code) => ["DSC5001", "DSC5002", "DSC5003"].includes(code))
    ? `包含三门必修（${requiredCourses.join("、")}）`
    : requiredCourses.length
      ? `需包含 ${requiredCourses.join("、")}`
      : "";
  const requirementTermLabel = terms.length > 1 ? `${terms.join("+")} 两学期` : `${terms[0] || "指定"} 学期`;
  const requirementText = [
    minimumCredits > 0 ? `${requirementTermLabel}至少 ${minimumCredits} 学分` : "",
    requiredCourseText
  ].filter(Boolean).join("，且");
  const unmet = [
    !confirmationMet ? "尚未确认学生身份" : "",
    selectedCredits < minimumCredits ? `${requirementTermLabel}当前 ${selectedCredits}/${minimumCredits} 学分` : "",
    missingCourses.length ? `${requirementTermLabel}缺少 ${missingCourses.join("、")}` : ""
  ].filter(Boolean);
  const eligible = confirmationMet && selectedCredits >= minimumCredits && missingCourses.length === 0;

  return {
    audienceNote,
    confirmationKey,
    confirmationMet,
    eligible,
    hasRequirement: true,
    minimumCredits,
    missingCourses,
    requiredCourses,
    requirementText,
    selectedCredits,
    selectedRequiredCount: requiredCourses.length - missingCourses.length,
    statusText: eligible
      ? `当前课表已满足：${[confirmationKey ? "学生身份已确认" : "", requirementText].filter(Boolean).join("；")}。`
      : `当前课表未满足：${unmet.join("；")}。`,
    termLabel: requirementTermLabel,
    terms
  };
}

function projectSelectionKey(courseOrCode) {
  const code = normalizeCourseCode(typeof courseOrCode === "string" ? courseOrCode : courseOrCode && courseOrCode.code);
  return ["DSC6017", "DSC6032"].includes(code) ? "INTERNSHIP_PROJECT" : code;
}

function projectConflictCodes(courseOrCode) {
  const code = normalizeCourseCode(typeof courseOrCode === "string" ? courseOrCode : courseOrCode && courseOrCode.code);
  return [...new Set([code, PROJECT_MUTEX[code]].filter(Boolean))];
}

function findProjectConflict(courses, course, selectionsByTerm, activeTerm) {
  if (!isProjectCourse(course)) return null;
  const codes = projectConflictCodes(course);
  for (const term of TERM_CODES) {
    const selections = selectionsByTerm[term] || {};
    for (const code of codes) {
      if (term === activeTerm && code === course.code) continue;
      if (!isUnscheduledSelection(selections[code])) continue;
      const conflictCourse = (courses || []).find((item) => item.code === code);
      if (conflictCourse && !courseOfferedInTerm(conflictCourse, term)) continue;
      return { code, term };
    }
  }
  return null;
}

function findInvalidatedDependent(courses, beforeSnapshot, afterSnapshot, confirmations = {}) {
  for (const term of TERM_CODES) {
    const selections = afterSnapshot[term] || {};
    for (const course of courses || []) {
      if (!selections[course.code] || !course.selection_requirement) continue;
      const before = getSelectionEligibility(courses, course, beforeSnapshot, confirmations);
      const after = getSelectionEligibility(courses, course, afterSnapshot, confirmations);
      if (before.eligible && !after.eligible) return { course, term, eligibility: after };
    }
  }
  return null;
}

module.exports = {
  TERM_CODES,
  TERM_FALLBACK_LABELS,
  TERM_SHORT_LABELS,
  allowsUnscheduledSelection,
  courseForTerm,
  courseOfferedInTerm,
  findInvalidatedDependent,
  findProjectConflict,
  getSelectionEligibility,
  isProjectCourse,
  isSelectionValid,
  isUnscheduledSelection,
  makeUnscheduledSelection,
  normalizeCourseCode,
  normalizeTerm,
  projectConflictCodes,
  projectSelectionKey,
  sectionsForTerm,
  selectedCreditsInTerm,
  termLabel,
  termOptions
};
