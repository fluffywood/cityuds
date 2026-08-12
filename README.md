# CityU MSDS 选课板

面向 City University of Hong Kong（CityU）MSDS 学生的静态选课参考工具，用于浏览课程、比较班次、组合每周课表，并集中查看课程事实与往届学生经验。项目同时提供可部署到 GitHub Pages 的网页版，以及位于 `wechat/` 的微信原生小程序版。

> 网页版和微信小程序课程表均覆盖 **2026/27 学年 Semester A、Semester B 与 Summer Term**。当前整理快照时间为 **2026-08-04 16:48（Asia/Beijing）**，名额、教师、教室及注册状态可能随时变化，请以 CityU AIMS 的最新信息为准。

## 在线访问

网页版部署完成后可通过以下地址访问：

**https://fluffywood.github.io/cityuds/**

微信小程序版需要使用微信开发者工具导入 `wechat/` 目录；将源码推送到 GitHub 不等于发布小程序，正式上线仍需在微信开发者工具上传并通过微信公众平台审核。

## 双版本说明

- **网页版：**仓库根目录中的原生 HTML、CSS 和 JavaScript 静态网站，无需后端或数据库，可直接部署到 GitHub Pages。
- **微信小程序版：**`wechat/` 中的微信原生工程，不使用 `web-view`，包含首页、课程、课表、详情、中英文课程介绍和项目说明页面。
- 两个版本分别维护课程数据、展示资源和发布流程；任一版本的发布都不会自动更新另一个平台。本次 A/B/S 学期改造仅应用于网页版。

## 网页版主要功能

### 课程浏览与筛选

- 先选择 Semester A、Semester B 或 Summer Term，再进入对应学期的课程与课表。
- 左侧课程栏只显示当前学期声明开设的课程；未在该学期开设的课程不会出现。
- 按课程编号或课程英文名称搜索。
- 按核心课、选修课和上课星期筛选。
- 快速查看课程学分、主课班次数量、上课时间和学生评价摘要。
- 多班次课程可在加入课表前直接选择时间。
- 一般课程已声明开设但暂无主课班次时会明确标注“该学期开设，但暂无可选班次”，不能加入课表；DSC6002 在 Summer Term 可无班次加入并按必修课计分，三门项目课也无需班次，可以加入项目汇总。

### 可视化课表规划

- 将课程加入每周课表，并分别选择主课和 Tutorial 班次。
- A、B、S 三个学期各自保存一份独立课表，切换学期不会覆盖其他学期的选择。
- 可将 A、B、S 三份课表一起导出为便于阅读和备份的 UTF-8 TXT；导入同格式文件后，可一次恢复课程及对应主课、Tutorial 班次。
- 自动汇总 A、B、S 三份课表中的已选课程数量、核心课/选修课数量及总学分；“已选”和“清空”仍只操作当前学期。
- DSC6006 Dissertation、DSC6017 Internship Project、DSC6032 Internship Project (S) 作为项目课列在必修/选修与总计之间，不计入必修或选修，但计入总门数和总学分，也不会生成周课表时间块。
- DSC6017 与 DSC6032 互斥，系统会跨 Semester B 和 Summer Term 阻止同时加入；同一项目也不能跨学期重复加入。
- 自动检测时间冲突，并在课表中标记冲突课程。
- 从课表课程块进入详情页或直接移除课程。
- 首次访问 Semester A 会默认选择三门核心课；Semester B 和 Summer Term 初始为空，用户可随时调整或清空当前学期。

### 课程详情与学生经验

- 展示课程类型、学分、先修要求、互斥课程和授课语言。
- 展示班次时间、日期、地点、教师、CRN 及网页注册状态。
- 汇总学生评价、课程特点和选课提示。
- 保留评价来源链接及与课程相关的原文摘录，方便回到原始内容核对。

### 详细课程文件与中文翻译

- 对当前网站中有对应文件的 27 门课程提供“查看详细课程介绍”入口。
- 将 27 份英文 PDF 转换为 180 张网页页图，访客无需预先下载本地文件。
- 英文页图与对应中文翻译使用同一组上一页/下一页按钮同步切换。
- 电脑端左右对照，手机端上下对照；点击英文页图可单独放大查看。
- 网页不再依赖 PDF.js 或浏览器内置 PDF 阅读器，原 PDF 仅作为备用和下载入口。

### 本地保存与界面适配

- 选课结果保存在浏览器 `localStorage`，刷新或再次访问后仍会保留。
- `localStorage` 会按浏览器、域名和端口隔离；切换设备、浏览器或本地端口时，可使用课表 TXT 导入/导出迁移记录。
- 不需要账号、数据库或后端服务，选课记录不会上传到服务器，也不会自动跨设备同步。
- 支持响应式布局、键盘操作和跟随系统设置的深色模式。

## 微信小程序版

- 首页展示 CityU DS Only Logo、课程数据概览、常用功能入口和可复制的 PC 网页版地址。
- 使用微信原生页面实现课程列表、三学期搜索筛选、课表规划、课程详情、选课字段解释和项目说明。
- A、B、S 三份课表分别保存在当前微信设备中；首次进入 Semester A 会默认选择三门核心课，Semester B 和 Summer Term 初始为空；汇总区统一计算三个学期的必修、选修、项目与总学分。
- 课表页以整周大课表展示周一至周六安排；若课程时间重叠，会明确列出冲突课程组合与重叠时段，并可展开查看原有的按天详情。
- 点击冲突组合下方的“调整班次和时间”按钮（或红色冲突课程块），可在同一弹窗中上下查看并调整两门冲突安排；存在多组冲突时可切换组合，确认后两项班次会一起更新。
- 点击“完整课表概览”可进入横屏单页视图，在一个手机屏幕内总览整周课表。
- 27 份课程 PDF 已转换为 180 张离线 JPEG 页图，英文原文与对应中文翻译使用同一个翻页器同步切换。
- 课程文档按课程拆分为 27 个独立分包，进入对应课程介绍时才加载该分包。
- DSC6002 在 Summer Term 可无班次加入并作为核心课计 1 门 3 学分；DSC6007 仅在 Semester B 显示并可选择 C01（CRN 15250）。
- CS6290、DSC6017、DSC6032 的跨学期选课条件，以及 DSC6017 与 DSC6032 的互斥规则，均与网页版一致。
- 小程序不提供网页版的 TXT 课表导入/导出功能。
- 说明页提供项目 GitHub 地址和求 Star 入口；受个人主体小程序外链能力限制，按钮会复制链接，再由用户在浏览器中打开。
- 当前数据规模为 27 门课程、27 份课程文档、180 页；文档分包合计约 24.65 MiB，最终主包与源码总量以校验脚本输出为准。
- 小程序工程不包含 AppSecret 或服务端密钥；开发者工具的本地私有配置不应提交到仓库。

详细的导入、分包和发布说明见 [`wechat/README.md`](wechat/README.md)。

## 当前数据范围

- 网页版年度开课目录共 27 门课程：5 门核心课、19 门选修课、3 门项目课；Semester A、Semester B、Summer Term 分别显示 12、16、2 门课程。
- 网页版共有 34 条实际班次记录，其中 Semester A 16 条、Semester B 18 条、Summer Term 暂无实际班次。DSC6002 在 Summer Term 可无班次加入并按必修 1 门 3 学分计入；其他课程不会复制 Semester B 的班次。
- DSC6007 仅在 Semester B 显示，可选择 C01（CRN 15250）；在 Semester A 和 Summer Term 的选课栏中不显示。
- DSC6006 Dissertation 为 6 学分，仅在 Semester A、B 开设；DSC6017 Internship Project 为 6 学分，DSC6032 Internship Project (S) 为 3 学分。三者无需班次即可加入，不在周课表显示，其中 `(S)` 属于课程名称。
- CS6290 仅在 Semester B 开设，不会出现在 Summer Term 课程栏；只有当前 Semester A 课表已包含 CS5285 时才可加入。
- DSC6017 Internship Project 仅限全日制第二年学生修读；网页会要求本人确认身份，并检查 Semester A 至少 15 学分且包含 DSC5001、DSC5002、DSC5003。DSC6032 Internship Project (S) 则检查 Semester A 与 B 合计至少 15 学分且包含上述三门必修。
- 资格学分按课程编号去重；如果移除或清空前置课程会让已选的 CS6290、DSC6017 或 DSC6032 失去资格，网页会阻止操作并要求先移除受影响课程。
- 原 Semester A 索引中未出现在完整 TXT 课表的 8 门课程仅保留历史元数据，`offered_terms` 为空，不会出现在 A、B、S 任一选课栏。
- 站内课程编号、链接和文件路径统一使用 `DSC`；课程 PDF 与页图保留官方原件内容，原件中可能仍印有 `SDSC` 历史学科代码。
- 班次数据来自手动整理的 CityU AIMS 2026/27 学年 A、B、S 课程表 TXT；站内不包含 CityU 爬虫。
- 学生经验包含 30 条公开小红书来源记录；当前有来源评价的课程为其中一部分。
- `docs/` 收录 32 份课程 PDF；当前网站课程中有 27 门已完成 PDF 映射和中文翻译。
- 所有数据均由仓库内的静态 JSON、PDF 和预生成页图提供，项目不包含 CityU 或小红书爬虫，也不会自动更新数据。

## 网页版本地运行

项目使用原生 HTML、CSS 和 JavaScript，无需安装依赖或执行构建。

首次使用可在 PowerShell 中克隆并启动：

```powershell
git clone https://github.com/fluffywood/cityuds.git
cd cityuds
python -m http.server 8088
```

然后在浏览器打开：

```text
http://127.0.0.1:8088/
```

请通过 HTTP 服务访问，不建议直接双击 `index.html`。页面使用 `fetch` 读取本地 JSON，直接以 `file://` 打开时可能被浏览器阻止。

## 导入微信开发者工具

1. 安装并打开微信开发者工具，选择“小程序”与“导入项目”。
2. 项目目录选择仓库中的 `wechat/`，不要直接选择 `wechat/miniprogram/`。
3. 在开发者工具中确认 `project.config.json` 的 AppID 属于你要发布的小程序；若使用自己的小程序，请替换为自己的 AppID。
4. 编译后检查课程列表、课表、课程详情、文档分包下载以及中英文同步翻页。
5. 真机预览和正式上传前，重新运行 `node wechat\tools\validate-project.mjs` 并在开发者工具中复核实际包体。

## 项目结构

```text
cityuds/
├── index.html                 # 课程浏览与课表规划主页
├── course.html                # 课程详情页
├── syllabus.html              # PDF 原文与中文翻译页面
├── assets/
│   ├── styles.css             # 全站样式与响应式布局
│   ├── shared.js              # 数据加载、存储和公共工具
│   ├── planner.js             # 课程筛选、选课和课表逻辑
│   ├── course.js              # 课程详情渲染逻辑
│   ├── syllabus.js            # 课程文件与翻译渲染逻辑
│   └── course-pages/          # 网页版 27 门课程的 180 张英文原文页图
├── data/
│   ├── courses/index.json     # 学期、培养要求和课程索引
│   ├── course-schedule-2026-27.txt # 网页版 A/B/S 课程与班次的版本化原始 TXT
│   ├── course-documents/      # PDF 映射、页图索引与逐页中文翻译
│   ├── sections/              # 各课程班次数据
│   ├── reviews/               # 各课程评价摘要
│   ├── source-reviews/        # 按来源整理的课程评价原文
│   └── sources.json           # 评价来源及原文链接
├── docs/                      # 课程 PDF 资料
├── tools/
│   ├── import-course-schedule.mjs  # 将完整课程表 TXT 导入网页版 JSON
│   └── build-web-course-images.mjs # 同步网页版课程页图及索引
└── wechat/                    # 微信原生小程序工程
    ├── project.config.json    # 微信开发者工具项目配置
    ├── README.md              # 小程序导入、分包与发布说明
    ├── generated/             # PDF 页图清单
    ├── miniprogram/           # 小程序源码、数据与文档分包
    └── tools/                 # 数据生成、PDF 转图和项目校验脚本
```

## 数据更新说明

更新数据时应保持以下文件之间的课程编号一致：

1. 将完整课程表保存到 `data/course-schedule-2026-27.txt`，每门课程第一行写课程编号、开课学期和英文名称，后续行写班次字段。
2. 运行 `node tools\import-course-schedule.mjs --input data\course-schedule-2026-27.txt`，重新生成网页版课程索引、班次和缺失的空评价文件。
3. 在 `data/reviews/<课程编号>.json` 更新评价摘要和来源 ID。
4. 在 `data/sources.json` 与 `data/source-reviews/` 中同步维护来源信息。
5. 网页版课程文档索引、逐页翻译或已经生成的页图发生变化后，重新校验并生成网页版页图索引：

```powershell
node tools\build-web-course-images.mjs
```

6. 只有在明确同步微信小程序版本时，才运行以下命令；当前 27 门课程介绍均已写入小程序生成物：

```powershell
node wechat\tools\build-data.mjs
python wechat\tools\render-pdf-pages.py
node wechat\tools\build-document-packages.mjs
node wechat\tools\validate-project.mjs
```

PDF 转图脚本需要本机安装 `PyMuPDF` 与 `Pillow`；普通浏览、部署或导入已生成的小程序工程不需要这些 Python 依赖。

修改后请通过本地 HTTP 服务检查课程列表、详情页、课表布局和冲突检测。

## 发布

### 网页版：GitHub Pages

仓库通过 GitHub Pages 直接发布 `main` 分支根目录。仓库设置应保持为 `Settings → Pages → Deploy from a branch → main → /(root)`；推送到 `main` 后会自动更新线上网站。

```powershell
git status
git add -A
git commit -m "描述本次修改"
git push
```

可在仓库的 [Pages 设置](https://github.com/fluffywood/cityuds/settings/pages)查看发布状态和线上地址。

### 微信小程序

GitHub 仅保存小程序源码，不会自动将小程序发布到微信。更新仓库后，还需要在微信开发者工具中完成以下步骤：

1. 使用真实 AppID 编译并完成 iOS、Android 真机预览。
2. 点击“上传”，填写版本号和功能说明。
3. 登录微信公众平台，将上传版本提交审核。
4. 审核通过后发布，并再次进行真机回归测试。

## 使用提示与免责声明

- 本项目是非官方选课参考工具，不代表 CityU 或任何课程单位。
- 课程名额、教师、地点、考核方式和注册规则可能变化，请以 CityU 官方系统和课程文件为准。
- 学生评价具有主观性，且可能对应往届教学安排，不应作为唯一选课依据。
- 原始评价与课程资料的相关权利归各自作者或发布机构所有。
- 本工具不会代替正式注册，也不会向 CityU AIMS 提交任何选课操作。
