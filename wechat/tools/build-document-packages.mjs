import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(toolDirectory, "..", "..");
const miniProgramRoot = path.join(repositoryRoot, "wechat", "miniprogram");
const manifestPath = path.join(repositoryRoot, "wechat", "generated", "pdf-pages-manifest.json");
const appConfigPath = path.join(miniProgramRoot, "app.json");
const packagesRoot = path.join(miniProgramRoot, "packages");
const TWO_MIB = 2 * 1024 * 1024;
const THIRTY_MIB = 30 * 1024 * 1024;

async function directoryBytes(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const sizes = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? directoryBytes(entryPath) : (await stat(entryPath)).size;
  }));
  return sizes.reduce((sum, size) => sum + size, 0);
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const routes = {};
const documentPackageNames = new Set(
  manifest.courses.map((course) => path.posix.basename(course.package))
);

for (const entry of await readdir(packagesRoot, { withFileTypes: true })) {
  if (
    entry.isDirectory()
    && entry.name.startsWith("doc-")
    && !documentPackageNames.has(entry.name)
  ) {
    await rm(path.join(packagesRoot, entry.name), { recursive: true, force: true });
  }
}

for (const course of manifest.courses) {
  const packageName = path.posix.basename(course.package);
  const pageDirectory = path.join(miniProgramRoot, "packages", packageName, "pages", "index");
  const route = `/${course.package}/pages/index/index`;
  const images = course.pages.map((page) => `/${page.path}`);
  routes[course.course_code] = route;

  await mkdir(pageDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(pageDirectory, "index.js"),
      `const images = ${JSON.stringify(images, null, 2)};\n\nPage({\n  data: {\n    courseCode: ${JSON.stringify(course.course_code)},\n    images\n  },\n\n  onShareAppMessage() {\n    return {\n      title: ${JSON.stringify(`${course.course_code} 课程介绍（中英对照）`)},\n      path: ${JSON.stringify(route)}\n    };\n  }\n});\n`,
      "utf8"
    ),
    writeFile(
      path.join(pageDirectory, "index.json"),
      `${JSON.stringify(
        {
          navigationBarTitleText: `${course.course_code} 课程介绍`,
          usingComponents: {
            "document-viewer": "/components/document-viewer/index"
          }
        },
        null,
        2
      )}\n`,
      "utf8"
    ),
    writeFile(
      path.join(pageDirectory, "index.wxml"),
      '<document-viewer course-code="{{courseCode}}" images="{{images}}" />\n',
      "utf8"
    ),
    writeFile(path.join(pageDirectory, "index.wxss"), "page { background: #eef2f7; }\n", "utf8")
  ]);
}

const routeLines = Object.keys(routes)
  .sort((left, right) => left.localeCompare(right, "en"))
  .map((courseCode) => `  ${courseCode}: ${JSON.stringify(routes[courseCode])}`)
  .join(",\n");
await writeFile(
  path.join(miniProgramRoot, "data", "document-routes.js"),
  `// 此文件由 wechat/tools/build-document-packages.mjs 自动生成，请勿手动修改。\n\nconst documentRoutes = {\n${routeLines}\n};\n\nmodule.exports = { documentRoutes };\n`,
  "utf8"
);

const appConfig = JSON.parse(await readFile(appConfigPath, "utf8"));
const fixedSubPackages = (appConfig.subPackages || []).filter(
  (subPackage) => !String(subPackage.root || "").startsWith("packages/doc-")
);
const documentSubPackages = manifest.courses.map((course) => ({
  root: course.package,
  pages: ["pages/index/index"]
}));
appConfig.subPackages = fixedSubPackages.concat(documentSubPackages);
await writeFile(appConfigPath, `${JSON.stringify(appConfig, null, 2)}\n`, "utf8");

let totalPackageBytes = 0;
for (const course of manifest.courses) {
  const packageBytes = await directoryBytes(path.join(miniProgramRoot, course.package));
  if (packageBytes >= TWO_MIB) {
    throw new Error(`${course.course_code} 文档分包 ${packageBytes} 字节，不得达到 2 MiB`);
  }
  course.package_bytes = packageBytes;
  totalPackageBytes += packageBytes;
}
if (totalPackageBytes >= THIRTY_MIB) {
  throw new Error(`文档分包合计 ${totalPackageBytes} 字节，不得达到 30 MiB`);
}
manifest.total_package_bytes = totalPackageBytes;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(
  `已生成 ${manifest.courses.length} 个课程文档页面，并同步 app.json 分包；`
    + `文档分包合计 ${(totalPackageBytes / 1024 / 1024).toFixed(2)} MiB。`
);
