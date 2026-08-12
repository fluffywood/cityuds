import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(toolDirectory, "..", "..");
const outputDirectory = path.join(repositoryRoot, "wechat", "miniprogram", "data");
const EXPECTED_COURSE_COUNT = 27;
const TERM_CODES = ["A", "B", "S"];

async function readJson(relativePath) {
  const absolutePath = path.join(repositoryRoot, relativePath);
  try {
    const contents = await readFile(absolutePath, "utf8");
    return JSON.parse(contents.replace(/^\uFEFF/, ""));
  } catch (error) {
    throw new Error(`无法读取 ${relativePath}: ${error.message}`);
  }
}

async function jsonFiles(relativeDirectory) {
  const absoluteDirectory = path.join(repositoryRoot, relativeDirectory);
  return (await readdir(absoluteDirectory))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((left, right) => left.localeCompare(right, "en"));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function serialize(value) {
  return JSON.stringify(value, null, 2)
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

async function writeModule(fileName, source) {
  const banner = "// 此文件由 wechat/tools/build-data.mjs 自动生成，请勿手动修改。\n\n";
  await writeFile(path.join(outputDirectory, fileName), `${banner}${source}\n`, "utf8");
}

async function buildSources() {
  const sourceMetadata = await readJson("data/sources.json");
  const sourceReviewFiles = await jsonFiles("data/source-reviews");
  const sourceReviewsById = {};

  for (const fileName of sourceReviewFiles) {
    const sourceReview = await readJson(path.posix.join("data/source-reviews", fileName));
    assert(sourceReview.source_id, `${fileName} 缺少 source_id`);
    assert(!sourceReviewsById[sourceReview.source_id], `重复的来源编号：${sourceReview.source_id}`);
    sourceReviewsById[sourceReview.source_id] = sourceReview;
  }

  const metadataIds = Object.keys(sourceMetadata).sort((left, right) => left.localeCompare(right, "en"));
  const reviewIds = Object.keys(sourceReviewsById).sort((left, right) => left.localeCompare(right, "en"));
  assert(
    metadataIds.length === reviewIds.length && metadataIds.every((sourceId, index) => sourceId === reviewIds[index]),
    "data/sources.json 与 data/source-reviews 中的来源编号不一致"
  );

  const sourcesById = {};
  for (const sourceId of metadataIds) {
    sourcesById[sourceId] = {
      source_id: sourceId,
      ...sourceMetadata[sourceId],
      course_reviews: sourceReviewsById[sourceId].course_reviews || {}
    };
  }

  return sourcesById;
}

async function buildDocuments() {
  const documentIndex = await readJson("data/course-documents/index.json");
  const documents = {};

  for (const courseCode of Object.keys(documentIndex).sort((left, right) => left.localeCompare(right, "en"))) {
    const entry = documentIndex[courseCode];
    assert(entry.pdf && entry.translation, `${courseCode} 的课程文档索引不完整`);

    const translation = await readJson(entry.translation);
    assert(translation.course_code === courseCode, `${entry.translation} 的 course_code 与 ${courseCode} 不一致`);

    try {
      await access(path.join(repositoryRoot, entry.pdf));
    } catch {
      throw new Error(`${courseCode} 对应的 PDF 不存在：${entry.pdf}`);
    }

    documents[courseCode] = {
      course_code: courseCode,
      pdf: entry.pdf,
      translation_path: entry.translation,
      translation
    };
  }

  return documents;
}

async function buildCatalog(sourcesById, documents) {
  const courseIndex = await readJson("data/courses/index.json");
  assert(Array.isArray(courseIndex.courses), "data/courses/index.json 缺少 courses 数组");
  assert(
    TERM_CODES.every((term) => courseIndex.terms?.some((item) => item.code === term)),
    "课程索引缺少 A、B、S 三学期元数据"
  );

  const annualCourses = courseIndex.courses.filter(
    (course) => Array.isArray(course.offered_terms) && course.offered_terms.length > 0
  );
  assert(
    annualCourses.length === EXPECTED_COURSE_COUNT,
    `网页版本学年课程应为 ${EXPECTED_COURSE_COUNT} 门，实际为 ${annualCourses.length} 门`
  );

  const annualCourseCodes = annualCourses.map((course) => course.code).sort((left, right) => left.localeCompare(right, "en"));
  const documentCodes = Object.keys(documents).sort((left, right) => left.localeCompare(right, "en"));
  assert(
    annualCourseCodes.length === documentCodes.length
      && annualCourseCodes.every((courseCode, index) => courseCode === documentCodes[index]),
    "本学年课程与课程文档索引不一致"
  );

  const courses = [];
  const seenCourseCodes = new Set();

  for (const course of annualCourses) {
    assert(course.code, "课程索引中存在缺少 code 的课程");
    assert(!seenCourseCodes.has(course.code), `课程编号重复：${course.code}`);
    seenCourseCodes.add(course.code);

    const [eligibleSections, recommendation] = await Promise.all([
      readJson(`data/sections/${course.code}.json`),
      readJson(`data/reviews/${course.code}.json`)
    ]);

    assert(Array.isArray(eligibleSections), `${course.code} 的班次数据不是数组`);
    assert(recommendation.course_code === course.code, `${course.code} 的评价文件课程编号不一致`);
    assert(
      eligibleSections.every((section) => course.offered_terms.includes(section.term)),
      `${course.code} 存在不属于开课学期的班次`
    );

    const sourceReviews = (recommendation.source_ids || []).map((sourceId) => {
      const source = sourcesById[sourceId];
      assert(source, `${course.code} 引用了不存在的来源：${sourceId}`);
      const text = source.course_reviews[course.code];
      assert(text, `${sourceId} 缺少 ${course.code} 的课程评价`);
      return {
        sourceId,
        text,
        title: source.title,
        url: source.url,
        platform: source.platform,
        note: source.note
      };
    });

    courses.push({
      ...course,
      eligible_sections: eligibleSections,
      recommendation,
      sourceReviews,
      documentAvailable: Boolean(documents[course.code])
    });
  }

  const dsc6002 = courses.find((course) => course.code === "DSC6002");
  assert(dsc6002?.requirement_type === "core" && Number(dsc6002.credits) === 3, "DSC6002 必须保留为 3 学分核心课");
  assert(
    dsc6002.offered_terms.includes("B")
      && dsc6002.offered_terms.includes("S")
      && dsc6002.allow_without_section_terms?.includes("S"),
    "DSC6002 必须保留 B、S 开课及 S 学期无班次可选规则"
  );
  assert(
    dsc6002.eligible_sections.some((section) => section.term === "B" && String(section.crn) === "11818")
      && !dsc6002.eligible_sections.some((section) => section.term === "S"),
    "DSC6002 必须仅保留 B 学期 CRN 11818，S 学期不得复制班次"
  );

  const { courses: ignoredCourses, ...metadata } = courseIndex;
  return { metadata, courses };
}

async function main() {
  await mkdir(outputDirectory, { recursive: true });

  const sourcesById = await buildSources();
  const documents = await buildDocuments();
  const { metadata, courses } = await buildCatalog(sourcesById, documents);

  await Promise.all([
    writeModule(
      "catalog.js",
      `const metadata = ${serialize(metadata)};\n\nconst courses = ${serialize(courses)};\n\nconst courseByCode = {};\ncourses.forEach((course) => {\n  courseByCode[course.code] = course;\n});\n\nmodule.exports = { metadata, courses, courseByCode };`
    ),
    writeModule(
      "documents.js",
      `const documents = ${serialize(documents)};\n\nmodule.exports = { documents };`
    ),
    writeModule(
      "sources.js",
      `const sourcesById = ${serialize(sourcesById)};\n\nmodule.exports = { sourcesById };`
    )
  ]);

  const sectionCount = courses.reduce((total, course) => total + course.eligible_sections.length, 0);
  console.log(
    `已生成小程序数据：${courses.length} 门课程、${sectionCount} 个班次、${Object.keys(documents).length} 份文档、${Object.keys(sourcesById).length} 个来源。`
  );
}

await main();
