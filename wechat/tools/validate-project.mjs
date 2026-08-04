import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(toolDirectory, "..", "..");
const miniProgramRoot = path.join(repositoryRoot, "wechat", "miniprogram");
const manifestPath = path.join(repositoryRoot, "wechat", "generated", "pdf-pages-manifest.json");
const TWO_MIB = 2 * 1024 * 1024;
const THIRTY_MIB = 30 * 1024 * 1024;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesBelow(filePath)));
    if (entry.isFile()) files.push(filePath);
  }
  return files;
}

async function directoryBytes(directory) {
  const files = await filesBelow(directory);
  const sizes = await Promise.all(files.map(async (filePath) => (await stat(filePath)).size));
  return sizes.reduce((sum, size) => sum + size, 0);
}

async function assertPageFiles(routeBase) {
  for (const extension of ["js", "json", "wxml", "wxss"]) {
    const filePath = path.join(miniProgramRoot, `${routeBase}.${extension}`);
    await stat(filePath);
    if (extension === "json") await readJson(filePath);
  }
}

const appConfig = await readJson(path.join(miniProgramRoot, "app.json"));
const manifest = await readJson(manifestPath);
const { metadata, courses } = require(path.join(miniProgramRoot, "data", "catalog.js"));
const { documents } = require(path.join(miniProgramRoot, "data", "documents.js"));
const { documentRoutes } = require(path.join(miniProgramRoot, "data", "document-routes.js"));
const planner = require(path.join(miniProgramRoot, "utils", "planner.js"));

assert(appConfig.pages[0] === "pages/home/index", "首页必须是小程序首个页面");
assert(appConfig.tabBar?.list?.[0]?.pagePath === "pages/home/index", "首页必须是首个 TabBar 入口");

const homeMarkup = await readFile(path.join(miniProgramRoot, "pages", "home", "index.wxml"), "utf8");
assert(homeMarkup.includes('/assets/home-logo.jpg'), "首页缺少 CityU DS Only Logo");
assert(!homeMarkup.includes("使用人次"), "首页不应显示使用人次计数");
assert(homeMarkup.includes("PC端使用网页版更方便"), "首页缺少 PC 端访问入口");
const homeLogic = await readFile(path.join(miniProgramRoot, "pages", "home", "index.js"), "utf8");
assert(homeLogic.includes("https://fluffywood.github.io/cityuds/"), "网页版地址不正确");
assert(homeLogic.includes("setClipboardData"), "网页版地址复制功能缺失");
const homeLogo = await readFile(path.join(miniProgramRoot, "assets", "home-logo.jpg"));
assert(homeLogo[0] === 0xff && homeLogo[1] === 0xd8, "首页 Logo 不是 JPEG 文件");

const aboutMarkup = await readFile(path.join(miniProgramRoot, "pages", "about", "index.wxml"), "utf8");
const supportPosition = aboutMarkup.indexOf("赞赏与支持");
const featurePosition = aboutMarkup.indexOf("我可以做什么");
assert(supportPosition >= 0 && supportPosition < featurePosition, "赞赏功能应位于“我可以做什么”上方");
const aboutLogic = await readFile(path.join(miniProgramRoot, "pages", "about", "index.js"), "utf8");
assert(aboutLogic.includes("https://github.com/fluffywood/cityuds"), "GitHub 项目地址不正确");
assert(aboutLogic.includes("setClipboardData"), "GitHub 地址复制功能缺失");

const timetableMarkup = await readFile(path.join(miniProgramRoot, "pages", "timetable", "index.wxml"), "utf8");
assert(
  (timetableMarkup.match(/更改班次和时间/g) || []).length === 2,
  "主课和 Tutorial 选择器都应显示更改班次提示"
);

assert(courses.length === 24, `应有 24 门课程，实际为 ${courses.length}`);
assert(metadata.schedule_as_of === "2026-08-04 16:48 Asia/Beijing", "课表快照时间不正确");
assert(manifest.course_count === 16, `应有 16 份文档，实际为 ${manifest.course_count}`);
assert(Object.keys(documents).length === manifest.course_count, "文档数据与页图清单数量不一致");
assert(Object.keys(documentRoutes).length === manifest.course_count, "文档路由与页图清单数量不一致");

const expectedDocumentPackages = manifest.courses.map((course) => course.package).sort();
const configuredDocumentPackages = appConfig.subPackages
  .map((subPackage) => subPackage.root)
  .filter((root) => String(root).startsWith("packages/doc-"))
  .sort();
assert(
  JSON.stringify(configuredDocumentPackages) === JSON.stringify(expectedDocumentPackages),
  "app.json 文档分包与页图清单不一致"
);

for (const page of appConfig.pages) await assertPageFiles(page);
for (const subPackage of appConfig.subPackages) {
  for (const page of subPackage.pages) {
    await assertPageFiles(path.posix.join(subPackage.root, page));
  }
}

let totalDocumentPages = 0;
for (const course of manifest.courses) {
  const document = documents[course.course_code];
  const expectedRoute = `/${course.package}/pages/index/index`;
  assert(document, `${course.course_code} 缺少翻译数据`);
  assert(documentRoutes[course.course_code] === expectedRoute, `${course.course_code} 文档路由不正确`);
  assert(document.translation.pages.length === course.page_count, `${course.course_code} 中英文页数不一致`);
  assert(course.package_bytes < TWO_MIB, `${course.course_code} 分包超过 2 MiB`);
  const actualPackageBytes = await directoryBytes(path.join(miniProgramRoot, course.package));
  assert(actualPackageBytes < TWO_MIB, `${course.course_code} 实际分包超过 2 MiB`);
  totalDocumentPages += course.page_count;

  for (const page of course.pages) {
    const filePath = path.join(miniProgramRoot, page.path);
    const contents = await readFile(filePath);
    assert(contents.length === page.bytes, `${page.path} 文件大小与清单不一致`);
    assert(contents[0] === 0xff && contents[1] === 0xd8, `${page.path} 不是 JPEG 文件`);
  }

  const sourcePath = path.join(repositoryRoot, course.source_pdf);
  const sourceHash = createHash("sha256").update(await readFile(sourcePath)).digest("hex");
  assert(sourceHash === course.source_sha256, `${course.source_pdf} 在页图生成后发生变化`);
}

assert(totalDocumentPages === manifest.page_count, "页图总数与清单不一致");
assert(manifest.total_package_bytes < THIRTY_MIB, "文档分包总量超过 30 MiB");

const firstCourseWithSections = courses.find((course) =>
  course.eligible_sections.some((section) => Number(section.credits) > 0)
);
const selection = planner.makeDefaultSelection(firstCourseWithSections);
assert(selection && selection.primaryCrn, "默认班次选择失败");
assert(planner.filterCourses(courses, { searchTerm: "CS5285" }).length === 1, "课程搜索失败");
const syntheticConflicts = planner.detectConflicts([
  { id: "a", day: "M", start: 600, end: 700 },
  { id: "b", day: "M", start: 650, end: 750 }
]);
assert(syntheticConflicts.conflicts.length === 1, "冲突检测失败");

const mainPackageFiles = (await filesBelow(miniProgramRoot)).filter(
  (filePath) => !filePath.startsWith(path.join(miniProgramRoot, "packages") + path.sep)
);
const mainPackageSizes = await Promise.all(mainPackageFiles.map(async (filePath) => (await stat(filePath)).size));
const mainPackageBytes = mainPackageSizes.reduce((sum, size) => sum + size, 0);
assert(mainPackageBytes < TWO_MIB, `主包约 ${mainPackageBytes} 字节，超过 2 MiB`);

const projectBytes = await directoryBytes(miniProgramRoot);
assert(projectBytes < THIRTY_MIB, `小程序源码约 ${projectBytes} 字节，超过 30 MiB`);

console.log(
  `验证通过：${courses.length} 门课程、${manifest.course_count} 份文档、${manifest.page_count} 页；` +
    `主包约 ${(mainPackageBytes / 1024).toFixed(1)} KiB，源码合计约 ${(projectBytes / 1024 / 1024).toFixed(2)} MiB。`
);
