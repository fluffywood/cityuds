# CityU MSDS 选课板

[![Deploy static site to Pages](https://github.com/fluffywood/cityuds/actions/workflows/pages.yml/badge.svg)](https://github.com/fluffywood/cityuds/actions/workflows/pages.yml)

面向 City University of Hong Kong（CityU）MSDS 学生的静态选课参考工具，用于浏览课程、比较班次、组合每周课表，并集中查看课程事实与往届学生经验。

> 当前数据适用于 **Semester A 2026/27**。课表快照时间为 **2026-08-04 16:48（Asia/Beijing）**，名额、教师、教室及注册状态可能随时变化，请以 CityU AIMS 的最新信息为准。

## 在线访问

部署完成后可通过以下地址访问：

**https://fluffywood.github.io/cityuds/**

## 主要功能

### 课程浏览与筛选

- 按课程编号或课程英文名称搜索。
- 按核心课、选修课和上课星期筛选。
- 快速查看课程学分、主课班次数量、上课时间和学生评价摘要。
- 多班次课程可在加入课表前直接选择时间。

### 可视化课表规划

- 将课程加入每周课表，并分别选择主课和 Tutorial 班次。
- 自动统计已选课程数量、核心课/选修课数量及总学分。
- 自动检测时间冲突，并在课表中标记冲突课程。
- 从课表课程块进入详情页或直接移除课程。
- 首次访问会默认选择三门核心课；用户可随时调整或清空。

### 课程详情与学生经验

- 展示课程类型、学分、先修要求、互斥课程和授课语言。
- 展示班次时间、日期、地点、教师、CRN 及网页注册状态。
- 汇总学生评价、课程特点和选课提示。
- 保留评价来源链接及与课程相关的原文摘录，方便回到原始内容核对。

### 详细课程文件与中文翻译

- 对当前网站中有对应文件的 16 门课程提供“查看详细课程介绍”入口。
- 在独立页面内嵌英文 PDF 原文，无需访客预先下载本地文件。
- 按 PDF 页码展示完整中文翻译，便于和英文内容逐页核对。
- 提供新窗口打开和下载 PDF 的备用入口，兼顾无法内嵌 PDF 的移动端浏览器。

### 本地保存与界面适配

- 选课结果保存在浏览器 `localStorage`，刷新或再次访问后仍会保留。
- 不需要账号、数据库或后端服务，选课记录不会上传到服务器，也不会跨设备同步。
- 支持响应式布局、键盘操作和跟随系统设置的深色模式。

## 当前数据范围

- 24 门课程：3 门核心课、21 门选修课。
- 34 个可展示班次组件，包括主课和零学分 Tutorial。
- 班次数据来自 CityU AIMS 的 Semester A 2026/27 快照。
- 学生经验包含 30 条公开小红书来源记录；当前有来源评价的课程为其中一部分。
- `docs/` 收录 32 份课程 PDF；当前网站课程中有 16 门已完成 PDF 映射和中文翻译。
- 所有数据均由仓库内的静态 JSON 和 PDF 提供，项目不包含 CityU 或小红书爬虫，也不会自动更新数据。

## 本地运行

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
│   └── syllabus.js            # 课程文件与翻译渲染逻辑
├── data/
│   ├── courses/index.json     # 学期、培养要求和课程索引
│   ├── course-documents/      # PDF 映射与逐页中文翻译
│   ├── sections/              # 各课程班次数据
│   ├── reviews/               # 各课程评价摘要
│   ├── source-reviews/        # 按来源整理的课程评价原文
│   └── sources.json           # 评价来源及原文链接
├── docs/                      # 课程 PDF 资料
└── .github/workflows/pages.yml # GitHub Pages 自动部署
```

## 数据更新说明

更新数据时应保持以下文件之间的课程编号一致：

1. 在 `data/courses/index.json` 更新课程基本信息和学期快照时间。
2. 在 `data/sections/<课程编号>.json` 更新班次、时间、教师和注册信息。
3. 在 `data/reviews/<课程编号>.json` 更新评价摘要和来源 ID。
4. 在 `data/sources.json` 与 `data/source-reviews/` 中同步维护来源信息。

修改后请通过本地 HTTP 服务检查课程列表、详情页、课表布局和冲突检测。

## 部署

仓库已配置 GitHub Actions。推送到 `main` 分支后，`.github/workflows/pages.yml` 会自动将整个静态站点部署到 GitHub Pages。

```powershell
git status
git add README.md
git commit -m "描述本次修改"
git push
```

可在仓库的 [Actions 页面](https://github.com/fluffywood/cityuds/actions) 查看部署状态。

## 使用提示与免责声明

- 本项目是非官方选课参考工具，不代表 CityU 或任何课程单位。
- 课程名额、教师、地点、考核方式和注册规则可能变化，请以 CityU 官方系统和课程文件为准。
- 学生评价具有主观性，且可能对应往届教学安排，不应作为唯一选课依据。
- 原始评价与课程资料的相关权利归各自作者或发布机构所有。
- 本工具不会代替正式注册，也不会向 CityU AIMS 提交任何选课操作。
