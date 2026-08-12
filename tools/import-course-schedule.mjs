import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(toolDirectory, "..");
const courseIndexPath = path.join(repositoryRoot, "data", "courses", "index.json");
const sectionsDirectory = path.join(repositoryRoot, "data", "sections");
const reviewsDirectory = path.join(repositoryRoot, "data", "reviews");
const TERMS = Object.freeze(["A", "B", "S"]);
const TERM_LABELS = Object.freeze({ A: "Semester A", B: "Semester B", S: "Summer Term" });
const CORE_COURSE_CODES = new Set(["DSC5001", "DSC5002", "DSC5003", "DSC6001", "DSC6002"]);
const PROJECT_COURSE_METADATA = Object.freeze({
  DSC6006: Object.freeze({ credits: 6, exclusive_course: "Nil" }),
  DSC6017: Object.freeze({ credits: 6, exclusive_course: "DSC6032" }),
  DSC6032: Object.freeze({ credits: 3, exclusive_course: "DSC6017" })
});
const FOUNDATION_COURSE_CODES = Object.freeze(["DSC5001", "DSC5002", "DSC5003"]);
const COURSE_SELECTION_METADATA = Object.freeze({
  CS6290: Object.freeze({
    prerequisites: "CS5285（须在 Semester A 修读）",
    selection_requirement: Object.freeze({
      terms: Object.freeze(["A"]),
      minimum_credits: 0,
      required_courses: Object.freeze(["CS5285"])
    })
  }),
  DSC6017: Object.freeze({
    eligibility_note: "仅限全日制第二年学生修读",
    selection_requirement: Object.freeze({
      terms: Object.freeze(["A"]),
      minimum_credits: 15,
      required_courses: FOUNDATION_COURSE_CODES,
      confirmation_key: "full_time_second_year"
    })
  }),
  DSC6032: Object.freeze({
    selection_requirement: Object.freeze({
      terms: Object.freeze(["A", "B"]),
      minimum_credits: 15,
      required_courses: FOUNDATION_COURSE_CODES
    })
  })
});
const CODE_ALIASES = Object.freeze({ DSC80011: "DSC8011" });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function inputArgument() {
  const inputIndex = process.argv.indexOf("--input");
  assert(inputIndex >= 0 && process.argv[inputIndex + 1], "用法：node tools/import-course-schedule.mjs --input <txt路径>");
  return path.resolve(process.cwd(), process.argv[inputIndex + 1]);
}

function canonicalCourseCode(value) {
  const upper = String(value || "").trim().toUpperCase();
  const canonical = CODE_ALIASES[upper] || upper;
  assert(/^(?:DSC|CS)\d{4}$/.test(canonical), `课程编号格式错误：${value}`);
  return canonical;
}

function parseHeader(rawCode, rawRest, lineNumber) {
  const code = canonicalCourseCode(rawCode);
  const rest = rawRest.trim();

  if (code === "DSC6032" && rest.endsWith("(S)")) {
    return { code, offered_terms: ["S"], title: rest, lineNumber, sections: [] };
  }

  const tokens = rest.split(/\s+/);
  const offeredTerms = [];
  while (TERMS.includes(tokens[0])) offeredTerms.push(tokens.shift());
  assert(offeredTerms.length > 0, `第 ${lineNumber} 行课程头缺少 A/B/S 学期：${rawCode} ${rawRest}`);
  assert(new Set(offeredTerms).size === offeredTerms.length, `第 ${lineNumber} 行课程学期重复：${rawCode}`);
  assert(tokens.length > 0, `第 ${lineNumber} 行课程英文名为空：${rawCode}`);

  return {
    code,
    offered_terms: offeredTerms,
    title: tokens.join(" "),
    lineNumber,
    sections: []
  };
}

function termFromDate(value, lineNumber) {
  const match = String(value || "").match(/^\d{2}\/(\d{2})\/\d{4}\b/);
  assert(match, `第 ${lineNumber} 行无法从日期判断学期：${value}`);
  const month = Number(match[1]);
  if (month >= 8) return "A";
  if (month <= 4) return "B";
  return "S";
}

function optional(value) {
  const text = value == null ? "" : String(value).trim();
  return text || null;
}

function parseSection(rawLine, course, lineNumber, seenCrns) {
  let source = rawLine.trim().replace(/\t+/g, "  ");
  let explicitTerm = null;
  const prefixed = source.match(/^([ABS])\s*:\s*(\d{5}.*)$/);
  if (prefixed) {
    explicitTerm = prefixed[1];
    source = prefixed[2];
  }

  let fields = source.split(/ {2,}/);
  if (fields.length === 17 && fields[14] === "TBA" && /^DS\d+$/.test(fields[15])) {
    fields = [...fields.slice(0, 14), `${fields[14]} ${fields[15]}`, fields[16]];
  }
  if (fields.length === 12 && /^\d{2}\/\d{2}\/\d{4}\b/.test(fields[9])) {
    fields = [...fields.slice(0, 10), null, null, null, null, fields[10], fields[11]];
  }
  assert(fields.length === 16, `第 ${lineNumber} 行应为 16 列，实际 ${fields.length} 列`);

  const [
    crn,
    section,
    creditsText,
    campus,
    web,
    level,
    available,
    capacity,
    waitlistAvailable,
    date,
    day,
    time,
    building,
    room,
    instructor,
    medium
  ] = fields;
  assert(/^\d{5}$/.test(crn), `第 ${lineNumber} 行 CRN 格式错误：${crn}`);
  assert(!seenCrns.has(crn), `第 ${lineNumber} 行 CRN 重复：${crn}`);
  seenCrns.add(crn);

  const credits = Number(creditsText);
  assert(Number.isFinite(credits) && credits >= 0, `第 ${lineNumber} 行学分错误：${creditsText}`);
  assert(web === "Y" || web === "N", `第 ${lineNumber} 行 WEB 应为 Y/N：${web}`);

  const term = explicitTerm || termFromDate(date, lineNumber);
  assert(course.offered_terms.includes(term), `第 ${lineNumber} 行班次学期 ${term} 未在 ${course.code} 声明学期中`);

  return {
    term,
    crn,
    section,
    credits,
    campus,
    web,
    level,
    available,
    capacity,
    waitlist_available: waitlistAvailable,
    date,
    day: optional(day),
    time: optional(time),
    building: optional(building),
    room: optional(room),
    instructor,
    medium,
    notes: []
  };
}

function parseSchedule(text) {
  const courses = [];
  const courseByCode = new Map();
  const seenCrns = new Set();
  let currentCourse = null;

  text.split(/\r?\n/).forEach((rawLine, index) => {
    const lineNumber = index + 1;
    if (!rawLine.trim()) return;

    const header = rawLine.match(/^\s*((?:DSC|CS)\d{4,5})\s+(.+?)\s*$/i);
    if (header) {
      currentCourse = parseHeader(header[1], header[2], lineNumber);
      assert(!courseByCode.has(currentCourse.code), `第 ${lineNumber} 行课程编号重复：${currentCourse.code}`);
      courseByCode.set(currentCourse.code, currentCourse);
      courses.push(currentCourse);
      return;
    }

    assert(currentCourse, `第 ${lineNumber} 行班次前没有课程头`);
    currentCourse.sections.push(parseSection(rawLine, currentCourse, lineNumber, seenCrns));
  });

  assert(courses.length === 27, `应解析 27 门课程，实际 ${courses.length}`);
  assert(seenCrns.size === 34, `应解析 34 个唯一 CRN，实际 ${seenCrns.size}`);
  return { courses, courseByCode };
}

function assertTerms(course, expectedTerms) {
  assert(course, "缺少需核对的课程");
  assert(JSON.stringify(course.offered_terms) === JSON.stringify(expectedTerms), `${course.code} 声明学期不正确`);
}

function assertConfirmedRules(parsed) {
  const { courseByCode } = parsed;
  const dsc6002 = courseByCode.get("DSC6002");
  const cs6290 = courseByCode.get("CS6290");
  const dsc6006 = courseByCode.get("DSC6006");
  const dsc6007 = courseByCode.get("DSC6007");
  const dsc6017 = courseByCode.get("DSC6017");
  const dsc6032 = courseByCode.get("DSC6032");

  assertTerms(dsc6002, ["B", "S"]);
  assertTerms(cs6290, ["B"]);
  assert(dsc6002.sections.every((section) => section.term === "B"), "DSC6002 的 B 班次不得复制到 S");
  assert(cs6290.sections.every((section) => section.term === "B"), "CS6290 班次必须属于 B");
  assertTerms(dsc6006, ["A", "B"]);
  assert(dsc6006.sections.length === 0, "DSC6006 应无班次");
  assertTerms(dsc6017, ["B"]);
  assert(dsc6017.sections.length === 0, "DSC6017 应无班次");
  assertTerms(dsc6032, ["S"]);
  assert(dsc6032.title === "Internship Project (S)" && dsc6032.sections.length === 0, "DSC6032 标题或班次不正确");
  assertTerms(dsc6007, ["B"]);
  assert(
    dsc6007.sections.length === 1
      && dsc6007.sections[0].section === "C01"
      && dsc6007.sections[0].crn === "15250",
    "DSC6007 必须仅有 B 学期 C01/15250"
  );
  assert(
    parsed.courses.filter((course) => course.offered_terms.includes("S")).length === 2,
    "声明 S 学期开设的课程必须为 2 门"
  );
  assert(
    parsed.courses.flatMap((course) => course.sections).every((section) => section.term !== "S"),
    "当前 S 学期必须没有实际班次"
  );
}

function summarizeSections(sections, fallbackMedium = "English") {
  const primarySections = sections.filter((section) => section.credits > 0);
  const source = primarySections.length ? primarySections : sections;
  const values = (field) => source.map((section) => section[field]);
  const sumNumeric = (field) => values(field).reduce((total, value) => total + (Number(value) || 0), 0);
  const availableValues = values("available");
  const available = availableValues.some((value) => !/^\d+$/.test(value))
    ? availableValues.find((value) => !/^\d+$/.test(value)) || "0"
    : String(sumNumeric("available"));
  const media = [...new Set(values("medium").filter(Boolean))];

  return {
    web: source.some((section) => section.web === "Y") ? "Y" : "N",
    available,
    capacity: String(sumNumeric("capacity")),
    medium: media.join(" / ") || fallbackMedium
  };
}

function mergedCourse(imported, existing) {
  const inferredCredits = imported.sections.find((section) => section.credits > 0)?.credits;
  const projectMetadata = PROJECT_COURSE_METADATA[imported.code];
  const selectionMetadata = COURSE_SELECTION_METADATA[imported.code];
  const base = existing || {
    code: imported.code,
    requirement_type: "elective",
    credits: inferredCredits || 3,
    remarks: imported.code.startsWith("CS") ? "CC" : "SD",
    prerequisites: "Nil",
    exclusive_course: "Nil"
  };
  const { offered_this_year: ignoredOfferedFlag, ...metadata } = base;

  return {
    ...metadata,
    ...selectionMetadata,
    code: imported.code,
    requirement_type: projectMetadata
      ? "project"
      : CORE_COURSE_CODES.has(imported.code)
        ? "core"
        : "elective",
    programme_title: imported.title,
    schedule_title: imported.title,
    title_changed: false,
    credits: projectMetadata?.credits || inferredCredits || metadata.credits || 3,
    prerequisites: selectionMetadata?.prerequisites || metadata.prerequisites || "Nil",
    exclusive_course: projectMetadata?.exclusive_course || metadata.exclusive_course || "Nil",
    ...(projectMetadata ? { allow_without_section: true } : {}),
    offered_terms: imported.offered_terms,
    summary: summarizeSections(imported.sections, metadata.summary?.medium),
    section_count: imported.sections.length
  };
}

function assertProjectMetadata(courses) {
  const courseByCode = new Map(courses.map((course) => [course.code, course]));
  for (const [courseCode, expected] of Object.entries(PROJECT_COURSE_METADATA)) {
    const course = courseByCode.get(courseCode);
    assert(course, `缺少项目课程 ${courseCode}`);
    assert(course.requirement_type === "project", `${courseCode} 必须归类为 project`);
    assert(course.credits === expected.credits, `${courseCode} 学分必须为 ${expected.credits}`);
    assert(course.allow_without_section === true, `${courseCode} 必须允许无班次开设`);
    assert(course.exclusive_course === expected.exclusive_course, `${courseCode} 互斥课程不正确`);
  }
}

function assertSelectionRequirements(courses) {
  const courseByCode = new Map(courses.map((course) => [course.code, course]));
  for (const [courseCode, expected] of Object.entries(COURSE_SELECTION_METADATA)) {
    const course = courseByCode.get(courseCode);
    assert(course, `缺少资格限制课程 ${courseCode}`);
    assert(
      JSON.stringify(course.selection_requirement) === JSON.stringify(expected.selection_requirement),
      `${courseCode} 选课资格限制不正确`
    );
    if (expected.eligibility_note) {
      assert(course.eligibility_note === expected.eligibility_note, `${courseCode} 学生身份说明不正确`);
    }
    if (expected.prerequisites) {
      assert(course.prerequisites === expected.prerequisites, `${courseCode} 先修要求说明不正确`);
    }
  }
}

function emptyReview(courseCode) {
  return {
    course_code: courseCode,
    level: "unknown",
    verdict: "暂无评价",
    summary: "本地资料暂未收集到可核对的学生评价，暂不作判断。",
    tags: [],
    source_ids: [],
    last_updated: "2026-08-11"
  };
}

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const inputPath = inputArgument();
  const [sourceText, currentIndexText] = await Promise.all([
    readFile(inputPath, "utf8"),
    readFile(courseIndexPath, "utf8")
  ]);
  const parsed = parseSchedule(sourceText.replace(/^\uFEFF/, ""));
  assertConfirmedRules(parsed);

  const currentIndex = JSON.parse(currentIndexText.replace(/^\uFEFF/, ""));
  assert(Array.isArray(currentIndex.courses), "data/courses/index.json 缺少 courses 数组");
  const existingByCode = new Map(currentIndex.courses.map((course) => [course.code, course]));
  const importedCodes = new Set(parsed.courses.map((course) => course.code));
  const importedCourses = parsed.courses.map((course) => mergedCourse(course, existingByCode.get(course.code)));
  assertProjectMetadata(importedCourses);
  assertSelectionRequirements(importedCourses);
  const retainedCourses = currentIndex.courses
    .filter((course) => !importedCodes.has(course.code))
    .map((course) => ({ ...course, offered_terms: [] }));
  const nextIndex = {
    ...currentIndex,
    semester: "Academic Year 2026/27 · A / B / S",
    notes: [
      "课程与班次数据按 CityU AIMS 2026/27 学年 A、B、S 学期课表手动整理，仅供参考。",
      ...(currentIndex.notes || []).slice(1)
    ],
    academic_year: "2026/27",
    default_term: "A",
    terms: TERMS.map((code) => ({
      code,
      label: TERM_LABELS[code],
      schedule_as_of: currentIndex.schedule_as_of
    })),
    courses: [...importedCourses, ...retainedCourses]
  };

  const writes = [writeJson(courseIndexPath, nextIndex)];
  for (const imported of parsed.courses) {
    writes.push(writeJson(path.join(sectionsDirectory, `${imported.code}.json`), imported.sections));
    const reviewPath = path.join(reviewsDirectory, `${imported.code}.json`);
    if (!(await exists(reviewPath))) writes.push(writeJson(reviewPath, emptyReview(imported.code)));
  }
  await Promise.all(writes);

  const addedCourses = parsed.courses.filter((course) => !existingByCode.has(course.code)).map((course) => course.code);
  console.log(
    `已导入 ${parsed.courses.length} 门开课课程、${parsed.courses.reduce((sum, course) => sum + course.sections.length, 0)} 个班次；`
      + `新增 ${addedCourses.length} 门课程：${addedCourses.join(", ")}`
  );
}

await main();
