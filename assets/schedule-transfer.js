(function (globalScope, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (globalScope) globalScope.MSDS_SCHEDULE_TRANSFER = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const FORMAT_SIGNATURE = "# CITYUDS_TIMETABLE_V1";
  const TERM_CODES = ["A", "B", "S"];
  const FIELD_KEYS = [
    "crn",
    "section",
    "credits",
    "campus",
    "web",
    "level",
    "available",
    "capacity",
    "waitlist_available",
    "date",
    "day",
    "time",
    "building",
    "room",
    "instructor",
    "medium"
  ];
  const TERM_HEADINGS = { A: "A 学期", B: "B 学期", S: "S 学期" };
  const LEGACY_COURSE_CODE_PATTERN = /^SDSC(?=\d{4}$)/;

  function importError(lineNumber, message) {
    const prefix = lineNumber ? `第 ${lineNumber} 行：` : "";
    return new Error(`${prefix}${message}`);
  }

  function normalizeCourseCode(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(LEGACY_COURSE_CODE_PATTERN, "DSC");
  }

  function normalizeTerm(value) {
    const term = String(value || "").trim().toUpperCase();
    return TERM_CODES.includes(term) ? term : "";
  }

  function courseOfferedInTerm(course, term) {
    return Array.isArray(course?.offered_terms)
      && course.offered_terms.some((item) => normalizeTerm(item) === term);
  }

  function sectionsForTerm(course, term) {
    return (course?.eligible_sections || []).filter((section) => {
      const sectionTerm = normalizeTerm(section.term);
      return sectionTerm ? sectionTerm === term : term === "A";
    });
  }

  function sectionKey(section) {
    return String(section?.crn || `${section?.section}-${section?.day}-${section?.time}`);
  }

  function isProjectCourse(course) {
    return course?.allow_without_section === true;
  }

  function allowsUnscheduledSelection(course, term) {
    return isProjectCourse(course)
      || (course?.allow_without_section_terms || []).some((item) => normalizeTerm(item) === term);
  }

  function isUnscheduledSelection(selection) {
    return selection?.unscheduled === true;
  }

  function projectSelectionKey(course) {
    return ["DSC6017", "DSC6032"].includes(course.code)
      ? "INTERNSHIP_PROJECT"
      : course.code;
  }

  function createTermCourseMaps(data) {
    const allCourses = Array.isArray(data?.courses) ? data.courses : [];
    return Object.fromEntries(TERM_CODES.map((term) => [
      term,
      new Map(allCourses
        .filter((course) => courseOfferedInTerm(course, term))
        .map((course) => [course.code, course]))
    ]));
  }

  function emptySnapshot() {
    return { A: {}, B: {}, S: {} };
  }

  function selectedCredits(course, selection, term) {
    if (!courseOfferedInTerm(course, term)) return 0;
    if (allowsUnscheduledSelection(course, term)) {
      return isUnscheduledSelection(selection) ? Number(course.credits || 0) : 0;
    }
    const primary = sectionsForTerm(course, term).find((section) => (
      Number(section.credits) > 0 && sectionKey(section) === String(selection?.primaryCrn || "")
    ));
    return Number(primary?.credits || 0);
  }

  function validateEligibility(data, course, snapshot, confirmations, lineNumber) {
    const requirement = course.selection_requirement;
    if (!requirement) return;
    const confirmationKey = String(requirement.confirmation_key || "").trim();
    if (confirmationKey && confirmations?.[confirmationKey] !== true) {
      throw importError(
        lineNumber,
        `${course.code} 需要先在课程栏确认“${course.eligibility_note || "学生身份条件"}”，再重新导入。`
      );
    }
    const minimumCreditsConfirmationKey = String(
      requirement.minimum_credits_confirmation_key || ""
    ).trim();
    if (minimumCreditsConfirmationKey && confirmations?.[minimumCreditsConfirmationKey] !== true) {
      throw importError(
        lineNumber,
        `${course.code} 需要先在课程栏确认“${requirement.minimum_credits_confirmation_label || "我已修满规定学分"}”，再重新导入。`
      );
    }

    const terms = [...new Set((requirement.terms || []).map(normalizeTerm).filter(Boolean))];
    const requiredCourses = [...new Set(
      (requirement.required_courses || []).map(normalizeCourseCode).filter(Boolean)
    )];
    const selectedCodes = new Set();
    let credits = 0;
    terms.forEach((term) => {
      (data.courses || []).forEach((candidate) => {
        const value = selectedCredits(candidate, snapshot[term]?.[candidate.code], term);
        if (value <= 0 || selectedCodes.has(candidate.code)) return;
        selectedCodes.add(candidate.code);
        credits += value;
      });
    });

    const minimumCredits = Math.max(0, Number(requirement.minimum_credits || 0));
    const missingCourses = requiredCourses.filter((code) => !selectedCodes.has(code));
    const minimumCreditsMet = minimumCreditsConfirmationKey ? true : credits >= minimumCredits;
    if (!minimumCreditsMet || missingCourses.length) {
      const termText = terms.length > 1 ? terms.join("+") : terms[0];
      const reasons = [
        !minimumCreditsMet ? `${termText} 学期当前 ${credits}/${minimumCredits} 学分` : "",
        missingCourses.length ? `${termText} 学期缺少 ${missingCourses.join("、")}` : ""
      ].filter(Boolean).join("；");
      throw importError(lineNumber, `${course.code} 不满足选课条件：${reasons}。`);
    }
  }

  function validateSnapshot(data, snapshot, options = {}) {
    const termCourseMaps = createTermCourseMaps(data);
    const confirmations = options.eligibilityConfirmations || {};
    const courseLines = options.courseLines || {};
    const projects = new Map();
    let courseCount = 0;
    let sectionCount = 0;

    TERM_CODES.forEach((term) => {
      const termSelections = snapshot?.[term];
      if (!termSelections || typeof termSelections !== "object" || Array.isArray(termSelections)) {
        throw importError(0, `${term} 学期课表结构无效。`);
      }
      Object.entries(termSelections).forEach(([rawCode, selection]) => {
        const code = normalizeCourseCode(rawCode);
        const lineNumber = courseLines[`${term}:${code}`] || 0;
        const course = termCourseMaps[term].get(code);
        if (!course) throw importError(lineNumber, `${code} 未在 ${term} 学期开设。`);

        const isProject = isProjectCourse(course);
        const allowsUnscheduled = allowsUnscheduledSelection(course, term);
        if (isUnscheduledSelection(selection)) {
          if (!allowsUnscheduled) {
            throw importError(lineNumber, `${code} 必须提供有效的主课班次。`);
          }
          if (isProject) {
            const key = projectSelectionKey(course);
            if (projects.has(key)) {
              throw importError(
                lineNumber,
                `${course.code} 与 ${projects.get(key)} 不能同时或跨学期重复加入。`
              );
            }
            projects.set(key, course.code);
          }
        } else if (isProject) {
          throw importError(lineNumber, `${code} 是无固定班次项目课，记录格式无效。`);
        } else {
          const sections = sectionsForTerm(course, term);
          const primary = sections.find((section) => (
            Number(section.credits) > 0 && sectionKey(section) === String(selection?.primaryCrn || "")
          ));
          if (!primary) throw importError(lineNumber, `${code} 的主课班次不存在或已失效。`);
          const tutorialKey = String(selection?.tutorialCrn || "");
          if (tutorialKey) {
            const tutorial = sections.find((section) => (
              Number(section.credits) === 0 && sectionKey(section) === tutorialKey
            ));
            if (!tutorial) throw importError(lineNumber, `${code} 的 Tutorial 班次不存在或已失效。`);
            sectionCount += 1;
          }
          sectionCount += 1;
        }
        courseCount += 1;
      });
    });

    TERM_CODES.forEach((term) => {
      Object.keys(snapshot[term]).forEach((rawCode) => {
        const code = normalizeCourseCode(rawCode);
        const course = termCourseMaps[term].get(code);
        validateEligibility(
          data,
          course,
          snapshot,
          confirmations,
          courseLines[`${term}:${code}`] || 0
        );
      });
    });

    return { courseCount, sectionCount };
  }

  function cleanField(value) {
    if (value === null || value === undefined || String(value).trim() === "") return "-";
    return String(value).replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  }

  function sectionLine(section) {
    return FIELD_KEYS.map((key) => cleanField(section[key])).join("  ");
  }

  function serializeSchedule(data, snapshot, options = {}) {
    const validation = validateSnapshot(data, snapshot, options);
    const termCourseMaps = createTermCourseMaps(data);
    const lines = [
      FORMAT_SIGNATURE,
      `# CityU MSDS ${cleanField(data?.academic_year || "")} 三学期课表备份`,
      "# 字段：CRN  Section  Credit  Campus  WEB  Level  Avail  Cap  Waitlist Avail  Date  Day  Time  Bldg  Room  Instructor  Medium of Instruction",
      "# 导入会整体替换网页中的 A、B、S 三份课表，请保留标题、学期和班次行格式。",
      ""
    ];

    TERM_CODES.forEach((term, termIndex) => {
      lines.push(`===== ${TERM_HEADINGS[term]} =====`);
      const termSelections = snapshot[term] || {};
      const orderedCourses = [...termCourseMaps[term].values()]
        .filter((course) => termSelections[course.code]);
      orderedCourses.forEach((course) => {
        const selection = termSelections[course.code];
        lines.push(`${course.code} ${term} ${cleanField(course.programme_title || course.schedule_title)}`);
        if (allowsUnscheduledSelection(course, term) && isUnscheduledSelection(selection)) {
          lines.push("NO_SECTION");
          lines.push("# 无需班次，不在周课表显示");
        } else {
          const sections = sectionsForTerm(course, term);
          const primary = sections.find((section) => sectionKey(section) === String(selection.primaryCrn));
          const tutorial = sections.find((section) => sectionKey(section) === String(selection.tutorialCrn || ""));
          lines.push(sectionLine(primary));
          if (tutorial) lines.push(sectionLine(tutorial));
        }
        lines.push("");
      });
      if (termIndex < TERM_CODES.length - 1 && lines.at(-1) !== "") lines.push("");
    });

    return {
      text: lines.join("\r\n").replace(/(?:\r\n){3,}/g, "\r\n\r\n").trimEnd() + "\r\n",
      ...validation
    };
  }

  function parseSchedule(text, data, options = {}) {
    const content = String(text || "").replace(/^\uFEFF/, "");
    if (!content.trim()) throw importError(0, "文件为空，请选择由本网站导出的 TXT 课表。");
    const lines = content.replace(/\r\n?/g, "\n").split("\n");
    if (!lines.some((line) => line.trim() === FORMAT_SIGNATURE)) {
      throw importError(0, "无法识别文件格式，请选择由本网站导出的 TXT 课表。");
    }

    const termCourseMaps = createTermCourseMaps(data);
    const snapshot = emptySnapshot();
    const courseLines = {};
    const seenTerms = new Set();
    let currentTerm = "";
    let currentBlock = null;

    function finalizeBlock() {
      if (!currentBlock) return;
      const { course, rows, hasNoSection, lineNumber, term } = currentBlock;
      const identity = `${term}:${course.code}`;
      if (snapshot[term][course.code]) {
        throw importError(lineNumber, `${course.code} 在 ${term} 学期重复出现。`);
      }
      if (hasNoSection) {
        if (!allowsUnscheduledSelection(course, term) || rows.length) {
          throw importError(lineNumber, `${course.code} 必须提供一个主课班次。`);
        }
        snapshot[term][course.code] = { unscheduled: true };
      } else if (isProjectCourse(course)) {
        throw importError(lineNumber, `${course.code} 是无固定班次项目课，必须使用 NO_SECTION。`);
      } else {
        if (!rows.length) throw importError(lineNumber, `${course.code} 缺少班次记录。`);
        const primaryRows = rows.filter((row) => Number(row.section.credits) > 0);
        const tutorialRows = rows.filter((row) => Number(row.section.credits) === 0);
        if (primaryRows.length !== 1) {
          throw importError(lineNumber, `${course.code} 必须且只能包含一个主课班次。`);
        }
        if (tutorialRows.length > 1) {
          throw importError(lineNumber, `${course.code} 最多只能包含一个 Tutorial 班次。`);
        }
        snapshot[term][course.code] = {
          primaryCrn: sectionKey(primaryRows[0].section),
          tutorialCrn: tutorialRows[0] ? sectionKey(tutorialRows[0].section) : null
        };
      }
      courseLines[identity] = lineNumber;
      currentBlock = null;
    }

    lines.forEach((rawLine, index) => {
      const lineNumber = index + 1;
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) return;

      const termMatch = line.match(/^=====\s*([ABS])\s+学期\s*=====$/i);
      if (termMatch) {
        finalizeBlock();
        const term = normalizeTerm(termMatch[1]);
        if (seenTerms.has(term)) throw importError(lineNumber, `${term} 学期区块重复出现。`);
        seenTerms.add(term);
        currentTerm = term;
        return;
      }

      const courseMatch = line.match(/^([A-Za-z]{2,5}\d{4})\s+([ABS])\s+(.+)$/i);
      if (courseMatch) {
        finalizeBlock();
        if (!currentTerm) throw importError(lineNumber, "课程必须写在对应的学期区块内。");
        const code = normalizeCourseCode(courseMatch[1]);
        const term = normalizeTerm(courseMatch[2]);
        if (term !== currentTerm) {
          throw importError(lineNumber, `${code} 的课程行学期与当前 ${currentTerm} 学期区块不一致。`);
        }
        const course = termCourseMaps[term].get(code);
        if (!course) throw importError(lineNumber, `${code} 未在 ${term} 学期开设。`);
        currentBlock = { course, hasNoSection: false, lineNumber, rows: [], term };
        return;
      }

      if (!currentBlock) throw importError(lineNumber, "班次记录前缺少课程行。");
      if (line === "NO_SECTION") {
        if (currentBlock.hasNoSection || currentBlock.rows.length) {
          throw importError(lineNumber, `${currentBlock.course.code} 的无班次标记重复或与班次混用。`);
        }
        currentBlock.hasNoSection = true;
        return;
      }
      if (currentBlock.hasNoSection) {
        throw importError(lineNumber, `${currentBlock.course.code} 已标记为无固定班次，不能再添加班次。`);
      }

      const fields = line.split(/\t+| {2,}/).map((value) => value.trim());
      if (fields.length !== FIELD_KEYS.length) {
        throw importError(
          lineNumber,
          `${currentBlock.course.code} 的班次应有 ${FIELD_KEYS.length} 个字段，当前为 ${fields.length} 个。`
        );
      }
      const imported = Object.fromEntries(FIELD_KEYS.map((key, fieldIndex) => [key, fields[fieldIndex]]));
      const sections = sectionsForTerm(currentBlock.course, currentBlock.term);
      const section = sections.find((candidate) => String(candidate.crn) === imported.crn);
      if (!section) {
        throw importError(
          lineNumber,
          `${currentBlock.course.code} 在 ${currentBlock.term} 学期没有 CRN ${imported.crn}。`
        );
      }
      if (String(section.section).toUpperCase() !== imported.section.toUpperCase()) {
        throw importError(
          lineNumber,
          `CRN ${imported.crn} 当前对应 Section ${section.section}，与文件中的 ${imported.section} 不一致。`
        );
      }
      if (currentBlock.rows.some((row) => row.section.crn === section.crn)) {
        throw importError(lineNumber, `CRN ${imported.crn} 重复出现。`);
      }
      currentBlock.rows.push({ lineNumber, section });
    });

    finalizeBlock();
    const missingTerms = TERM_CODES.filter((term) => !seenTerms.has(term));
    if (missingTerms.length) {
      throw importError(0, `文件缺少 ${missingTerms.join("、")} 学期区块，无法完整恢复三学期课表。`);
    }

    const validation = validateSnapshot(data, snapshot, {
      ...options,
      courseLines
    });
    return { selectionsByTerm: snapshot, ...validation };
  }

  function replaceStoredSelections(storage, snapshot, options) {
    const keys = TERM_CODES.flatMap((term) => [
      options.selectionKeyForTerm(term),
      options.initializedKeyForTerm(term)
    ]);
    const previousValues = new Map(keys.map((key) => [key, storage.getItem(key)]));
    try {
      TERM_CODES.forEach((term) => {
        storage.setItem(options.selectionKeyForTerm(term), JSON.stringify(snapshot[term] || {}));
        storage.setItem(options.initializedKeyForTerm(term), "1");
      });
    } catch (error) {
      keys.forEach((key) => {
        try {
          const previous = previousValues.get(key);
          if (previous === null) storage.removeItem(key);
          else storage.setItem(key, previous);
        } catch {
          // Best-effort rollback for browsers that stop accepting storage writes.
        }
      });
      throw error;
    }
  }

  return {
    FIELD_KEYS,
    FORMAT_SIGNATURE,
    TERM_CODES,
    parseSchedule,
    replaceStoredSelections,
    serializeSchedule,
    validateSnapshot
  };
});
