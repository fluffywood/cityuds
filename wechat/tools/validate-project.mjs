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
assert(
  appConfig.pages.includes("pages/timetable-overview/index"),
  "app.json 缺少完整课表概览页面"
);
await assertPageFiles("pages/timetable-overview/index");
const overviewConfig = await readJson(
  path.join(miniProgramRoot, "pages", "timetable-overview", "index.json")
);
assert(overviewConfig.pageOrientation === "landscape", "完整课表概览页面必须使用横屏方向");
assert(overviewConfig.disableScroll === true, "完整课表概览页面必须禁用页面级滚动");

const homeMarkup = await readFile(path.join(miniProgramRoot, "pages", "home", "index.wxml"), "utf8");
assert(homeMarkup.includes('/assets/home-logo.jpg'), "首页缺少 CityU DS Only Logo");
assert(!homeMarkup.includes("使用人次"), "首页不应显示使用人次计数");
assert(homeMarkup.includes("PC端使用网页版更方便"), "首页缺少 PC 端访问入口");
const homeLogic = await readFile(path.join(miniProgramRoot, "pages", "home", "index.js"), "utf8");
assert(homeLogic.includes("https://fluffywood.github.io/cityuds/"), "网页版地址不正确");
assert(homeLogic.includes("setClipboardData"), "网页版地址复制功能缺失");
const homeStyles = await readFile(path.join(miniProgramRoot, "pages", "home", "index.wxss"), "utf8");
assert(
  /\.home-page\s*\{[^}]*height:\s*100vh[^}]*justify-content:\s*space-between[^}]*overflow:\s*hidden/s.test(homeStyles),
  "首页未按视口高度分配空间或仍可能溢出"
);
assert(/\.home-logo\s*\{[^}]*height:\s*285rpx/s.test(homeStyles), "首页 Logo 高度不符合自适应首屏布局");
assert(
  /\.home-stats\s*\{[^}]*margin-top:\s*22rpx[^}]*gap:\s*18rpx/s.test(homeStyles) &&
    /\.home-stat\s*\{[^}]*padding:\s*22rpx 24rpx[^}]*gap:\s*10rpx/s.test(homeStyles) &&
    /\.home-stat-value\s*\{[^}]*font-size:\s*36rpx/s.test(homeStyles) &&
    /\.home-stat-label\s*\{[^}]*font-size:\s*21rpx/s.test(homeStyles),
  "首页课程与课程介绍统计卡未保持原始尺寸和字体"
);
assert(
  /\.quick-grid\s*\{[^}]*display:\s*flex[^}]*flex-direction:\s*column/s.test(homeStyles) &&
    /\.quick-card\s*\{[^}]*width:\s*100%[^}]*min-height:\s*112rpx/s.test(homeStyles) &&
    /\.quick-description\s*\{[^}]*display:\s*block/s.test(homeStyles),
  "首页快捷入口未恢复舒展的纵向布局"
);
assert(homeStyles.includes("@media (max-height: 610px)"), "首页缺少真正矮屏的首屏适配");
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
const timetableLogic = await readFile(path.join(miniProgramRoot, "pages", "timetable", "index.js"), "utf8");
assert(
  (timetableMarkup.match(/更改班次和时间/g) || []).length === 2,
  "主课和 Tutorial 选择器都应显示更改班次提示"
);
assert(timetableMarkup.includes("完整课表概览"), "课表页缺少完整课表概览按钮");
assert(timetableMarkup.includes('class="week-card surface"'), "课表页缺少整周大课表");
assert(timetableMarkup.includes('class="conflict-pair-list surface"'), "课表页缺少冲突课程组合列表");
assert(timetableMarkup.includes("展开按天详情"), "课表页缺少可展开的按天详情");
assert(timetableMarkup.includes('bindtap="handleEventTap"'), "冲突课程块缺少点击处理器");
assert(
  timetableMarkup.includes('class="conflict-pair-action"') &&
    timetableMarkup.includes('data-pair-index="{{pairIndex}}"') &&
    timetableMarkup.includes('catchtap="openConflictPair"'),
  "调整班次和时间必须是直接绑定点击事件的独立按钮"
);
assert(
  !timetableMarkup.includes("点击红色课程块，可同时调整两门课程的班次和时间"),
  "冲突提示栏不应继续显示已删除的第二行提示"
);
assert(timetableMarkup.includes('class="conflict-editor-mask"'), "课表页缺少冲突班次编辑弹窗");
assert(
  timetableMarkup.includes('wx:for="{{conflictEditorItems}}"') &&
    timetableMarkup.includes('bindchange="changeConflictChoice"'),
  "冲突班次弹窗必须同时显示两项可调整安排"
);
assert(timetableMarkup.includes("确定并更新"), "冲突班次弹窗缺少确认更新按钮");
assert(
  timetableMarkup.includes('wx:if="{{conflictEditorPairChoices.length > 1}}"') &&
    timetableMarkup.includes('bindchange="changeConflictPair"') &&
    timetableMarkup.includes("conflictEditorPairLabel"),
  "同一课程存在多组冲突时必须可以切换冲突组合"
);
assert(timetableLogic.includes("handleEventTap(event)"), "课表页缺少冲突事件点击逻辑");
assert(timetableLogic.includes("confirmConflictChanges()"), "课表页缺少冲突班次确认逻辑");
assert(timetableLogic.includes("renderPlanner(selectionOverride)"), "课表重绘不支持已保存选择覆盖");

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

assert(Array.isArray(planner.WEEK_DAYS), "课表工具缺少 WEEK_DAYS");
assert(planner.WEEK_START_MINUTES === 540, "周课表起始时间应为 09:00");
assert(planner.WEEK_END_MINUTES === 1320, "周课表结束时间应为 22:00");
assert(typeof planner.assignEventLanes === "function", "课表工具缺少 assignEventLanes");
assert(typeof planner.buildTimetableModel === "function", "课表工具缺少 buildTimetableModel");

const laneEvents = planner.assignEventLanes([
  { id: "lane-a", day: "M", start: 600, end: 660 },
  { id: "lane-b", day: "M", start: 630, end: 690 },
  { id: "lane-c", day: "M", start: 690, end: 750 }
]);
assert(laneEvents[0].lane !== laneEvents[1].lane, "重叠课程必须分配到不同 lane");
assert(laneEvents[0].laneCount === 2 && laneEvents[1].laneCount === 2, "重叠课程的 laneCount 不正确");
assert(laneEvents[2].laneCount === 1, "首尾相接课程不应占用冲突 lane");

const syntheticCourses = [
  ["TEST1001", "A01", "M", "10:00 - 11:00"],
  ["TEST1002", "B01", "M", "10:30 - 11:30"],
  ["TEST1003", "C01", "M", "11:30 - 12:30"],
  ["TEST1004", "D01", "T", "10:30 - 11:30"]
].map(([code, section, day, time], index) => ({
  code,
  programme_title: `测试课程 ${index + 1}`,
  eligible_sections: [{ crn: `test-${index + 1}`, section, day, time, credits: 3 }]
}));
const syntheticSelections = Object.fromEntries(
  syntheticCourses.map((course) => [
    course.code,
    { primaryCrn: course.eligible_sections[0].crn, tutorialCrn: null }
  ])
);
const timetableModel = planner.buildTimetableModel(syntheticCourses, syntheticSelections);
assert(timetableModel.conflictPairs.length === 1, "首尾相接或不同日期的课程不应判为冲突");
const [conflictPair] = timetableModel.conflictPairs;
assert(
  conflictPair.firstLabel.includes("TEST1001") && conflictPair.secondLabel.includes("TEST1002"),
  "冲突组合未包含正确的课程标签"
);
assert(conflictPair.dayLabel === "周一", "冲突组合日期标签不正确");
assert(conflictPair.overlapText === "10:30–11:00", "冲突组合重叠时段不正确");
assert(
  timetableModel.events.find((event) => event.courseCode === "TEST1003")?.conflict === false,
  "首尾相接课程被错误标记为冲突"
);
assert(
  timetableModel.events.find((event) => event.courseCode === "TEST1004")?.conflict === false,
  "不同日期课程被错误标记为冲突"
);

const timetablePagePath = path.join(miniProgramRoot, "pages", "timetable", "index.js");
const resolvedTimetablePagePath = require.resolve(timetablePagePath);
const previousPageRegistration = globalThis.Page;
const previousWx = globalThis.wx;
const previousTimetablePageCache = require.cache[resolvedTimetablePagePath];
const initialConflictSelections = {
  DSC5001: { primaryCrn: "11599", tutorialCrn: null },
  DSC5003: { primaryCrn: "11604", tutorialCrn: null }
};
let storedSelections = JSON.parse(JSON.stringify(initialConflictSelections));
let storageWrites = 0;
const navigations = [];
let timetablePageDefinition;

try {
  delete require.cache[resolvedTimetablePagePath];
  globalThis.Page = (definition) => {
    timetablePageDefinition = definition;
  };
  globalThis.wx = {
    getStorageSync() {
      return JSON.parse(JSON.stringify(storedSelections));
    },
    setStorageSync(_key, selections) {
      storageWrites += 1;
      storedSelections = JSON.parse(JSON.stringify(selections));
    },
    removeStorageSync() {
      storedSelections = {};
    },
    navigateTo({ url }) {
      navigations.push(url);
    },
    showToast() {},
    switchTab() {},
    showModal() {}
  };
  require(timetablePagePath);
  assert(timetablePageDefinition, "课表页面未通过 Page 注册");

  const timetablePage = {
    ...timetablePageDefinition,
    data: JSON.parse(JSON.stringify(timetablePageDefinition.data)),
    setData(nextData) {
      Object.assign(this.data, nextData);
    }
  };
  timetablePage.renderPlanner();
  assert(timetablePage.data.conflictPairCount === 1, "DSC5001 C61 与 DSC5003 C61 应产生一组冲突");

  const firstConflictEvent = timetablePage.allEvents.find(
    (event) => event.courseCode === "DSC5001" && event.conflict
  );
  assert(firstConflictEvent, "真实课程冲突事件未生成");
  const conflictTap = {
    currentTarget: {
      dataset: { eventId: firstConflictEvent.id, code: firstConflictEvent.courseCode }
    }
  };

  timetablePage.openConflictPair({
    currentTarget: {
      dataset: { pairIndex: 0, pairId: "index-path-check" }
    }
  });
  assert(timetablePage.data.conflictEditorVisible, "调整班次按钮未打开冲突编辑弹窗");
  assert(timetablePage.data.conflictEditorItems.length === 2, "调整班次按钮未载入上下两项冲突安排");
  timetablePage.cancelConflictEditor();

  storageWrites = 0;
  const selectionsBeforeCancel = JSON.stringify(storedSelections);
  timetablePage.handleEventTap(conflictTap);
  assert(timetablePage.data.conflictEditorVisible, "点击冲突课程后未打开班次编辑弹窗");
  assert(timetablePage.data.conflictEditorItems.length === 2, "冲突弹窗未同时载入两门课程安排");
  timetablePage.cancelConflictEditor();
  assert(storageWrites === 0, "取消冲突班次编辑时不应写入选择");
  assert(JSON.stringify(storedSelections) === selectionsBeforeCancel, "取消后已选班次发生变化");

  timetablePage.handleEventTap(conflictTap);
  const targetPrimaryCrns = { DSC5001: "15441", DSC5003: "13472" };
  Object.entries(targetPrimaryCrns).forEach(([courseCode, primaryCrn]) => {
    const itemIndex = timetablePage.data.conflictEditorItems.findIndex(
      (item) => item.courseCode === courseCode
    );
    const item = timetablePage.data.conflictEditorItems[itemIndex];
    const choiceIndex = item && item.choices.findIndex((choice) => choice.key === primaryCrn);
    assert(itemIndex >= 0 && choiceIndex >= 0, `${courseCode} 冲突弹窗缺少目标班次`);
    timetablePage.changeConflictChoice({
      currentTarget: { dataset: { itemIndex } },
      detail: { value: choiceIndex }
    });
  });

  storageWrites = 0;
  timetablePage.confirmConflictChanges();
  assert(storageWrites === 1, "两门冲突课程的班次应在确认后统一保存一次");
  assert(storedSelections.DSC5001.primaryCrn === "15441", "DSC5001 班次未按弹窗选择更新");
  assert(storedSelections.DSC5003.primaryCrn === "13472", "DSC5003 班次未按弹窗选择更新");
  assert(timetablePage.data.conflictPairCount === 0, "调整后的真实课程班次不应继续冲突");

  const nonConflictEvent = timetablePage.allEvents.find((event) => event.courseCode === "DSC5001");
  timetablePage.handleEventTap({
    currentTarget: {
      dataset: { eventId: nonConflictEvent.id, code: nonConflictEvent.courseCode }
    }
  });
  assert(
    navigations.at(-1) === "/packages/course/pages/detail/index?code=DSC5001",
    "点击非冲突课程应继续进入课程详情"
  );
} finally {
  delete require.cache[resolvedTimetablePagePath];
  if (previousTimetablePageCache) require.cache[resolvedTimetablePagePath] = previousTimetablePageCache;
  if (previousPageRegistration === undefined) delete globalThis.Page;
  else globalThis.Page = previousPageRegistration;
  if (previousWx === undefined) delete globalThis.wx;
  else globalThis.wx = previousWx;
}

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
