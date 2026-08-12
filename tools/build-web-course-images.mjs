import { copyFile, mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(toolDirectory, "..");
const manifestPath = path.join(repositoryRoot, "wechat", "generated", "pdf-pages-manifest.json");
const documentIndexPath = path.join(repositoryRoot, "data", "course-documents", "index.json");
const outputRoot = path.join(repositoryRoot, "assets", "course-pages");
const indexPath = path.join(repositoryRoot, "data", "course-documents", "images.json");

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const documentIndex = JSON.parse(await readFile(documentIndexPath, "utf8"));
const courses = {};

const manifestCodes = manifest.courses.map((course) => course.course_code).sort();
const documentCodes = Object.keys(documentIndex).sort();
const missingDocumentCodes = manifestCodes.filter((courseCode) => !documentIndex[courseCode]);
if (missingDocumentCodes.length) {
  throw new Error(`小程序页图清单中的课程未配置网页版文档：${missingDocumentCodes.join("、")}`);
}

function validateTranslation(courseCode, translation, expectedPageCount) {
  if (translation.course_code !== courseCode) {
    throw new Error(`${courseCode} 的中文翻译课程编号不一致`);
  }
  if (
    !Number.isInteger(expectedPageCount) ||
    expectedPageCount < 1 ||
    !Array.isArray(translation.pages) ||
    translation.pages.length !== expectedPageCount
  ) {
    throw new Error(`${courseCode} 的英文页图与中文翻译页数不一致`);
  }
  translation.pages.forEach((page, index) => {
    if (Number(page.page) !== index + 1 || !String(page.text || "").trim()) {
      throw new Error(`${courseCode} 的第 ${index + 1} 页中文翻译无效`);
    }
  });
}

for (const course of manifest.courses) {
  const courseCode = course.course_code;
  const translation = JSON.parse(
    await readFile(path.join(repositoryRoot, documentIndex[courseCode].translation), "utf8")
  );
  validateTranslation(courseCode, translation, course.pages.length);
  const courseDirectory = path.join(outputRoot, courseCode);
  await mkdir(courseDirectory, { recursive: true });

  for (const fileName of await readdir(courseDirectory)) {
    if (/^page-\d+\.jpg$/i.test(fileName)) {
      await unlink(path.join(courseDirectory, fileName));
    }
  }

  const pages = [];
  for (const page of course.pages) {
    const fileName = path.posix.basename(page.path);
    const sourcePath = path.join(repositoryRoot, "wechat", "miniprogram", page.path);
    const outputPath = path.join(courseDirectory, fileName);
    await copyFile(sourcePath, outputPath);
    pages.push(`assets/course-pages/${courseCode}/${fileName}`);
  }

  courses[courseCode] = {
    page_count: course.page_count,
    source_pdf: course.source_pdf,
    source_sha256: course.source_sha256,
    pages
  };
}

const manifestCodeSet = new Set(manifestCodes);
for (const courseCode of documentCodes.filter((code) => !manifestCodeSet.has(code))) {
  const mapping = documentIndex[courseCode];
  const translation = JSON.parse(
    await readFile(path.join(repositoryRoot, mapping.translation), "utf8")
  );
  const pageCount = translation.pages?.length || 0;
  validateTranslation(courseCode, translation, pageCount);
  if (translation.source_pdf !== mapping.pdf) {
    throw new Error(`${courseCode} 的中文翻译与 PDF 路径不一致`);
  }

  const courseDirectory = path.join(outputRoot, courseCode);
  const expectedFileNames = Array.from(
    { length: pageCount },
    (_, index) => `page-${String(index + 1).padStart(3, "0")}.jpg`
  );
  const actualFileNames = (await readdir(courseDirectory))
    .filter((fileName) => /^page-\d+\.jpg$/i.test(fileName))
    .sort();
  if (JSON.stringify(actualFileNames) !== JSON.stringify(expectedFileNames)) {
    throw new Error(`${courseCode} 的网页版英文页图数量或文件名不正确`);
  }

  const pages = [];
  for (const fileName of expectedFileNames) {
    const outputPath = path.join(courseDirectory, fileName);
    const image = await readFile(outputPath);
    if (
      image.length < 4 ||
      image[0] !== 0xff ||
      image[1] !== 0xd8 ||
      image.at(-2) !== 0xff ||
      image.at(-1) !== 0xd9
    ) {
      throw new Error(`${courseCode} 的页图 ${fileName} 不是完整的 JPEG 文件`);
    }
    pages.push(`assets/course-pages/${courseCode}/${fileName}`);
  }

  const pdf = await readFile(path.join(repositoryRoot, mapping.pdf));
  courses[courseCode] = {
    page_count: pageCount,
    source_pdf: mapping.pdf,
    source_sha256: createHash("sha256").update(pdf).digest("hex"),
    pages
  };
}

const pageCount = Object.values(courses).reduce((total, course) => total + course.page_count, 0);

await mkdir(path.dirname(indexPath), { recursive: true });
await writeFile(
  indexPath,
  `${JSON.stringify(
    {
      schema_version: 1,
      generated_from: "wechat/generated/pdf-pages-manifest.json and web-only course pages",
      course_count: documentCodes.length,
      page_count: pageCount,
      courses
    },
    null,
    2
  )}\n`,
  "utf8"
);

console.log(`已生成网页版课程页图：${documentCodes.length} 门课程，${pageCount} 页。`);
