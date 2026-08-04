(function () {
  "use strict";

  const detail = document.getElementById("syllabus-detail");
  const code = new URLSearchParams(window.location.search).get("code")?.trim().toUpperCase();

  function getJson(url) {
    return fetch(url).then((response) => {
      if (!response.ok) throw new Error(`数据读取失败：${url}`);
      return response.json();
    });
  }

  function renderPage(page) {
    return `
      <article class="translation-page">
        <h3>第 ${MSDS.escapeHtml(page.page)} 页</h3>
        <div class="translation-text">${MSDS.escapeHtml(page.text)}</div>
      </article>`;
  }

  function render(course, courseDocument, translation) {
    const pdfUrl = new URL(courseDocument.pdf, window.location.href).href;
    const pdfViewerUrl = `${pdfUrl}#view=FitH`;
    const backUrl = `course.html?code=${encodeURIComponent(course.code)}`;

    document.title = `${course.code} 详细课程介绍 · MSDS 选课板`;
    detail.innerHTML = `
      <a class="back-link" href="${backUrl}">← 返回 ${MSDS.escapeHtml(course.code)} 课程详情</a>

      <section class="syllabus-hero">
        <div>
          <div class="detail-code-row">
            <span class="detail-code">${MSDS.escapeHtml(course.code)}</span>
            <span class="document-badge">课程文件</span>
          </div>
          <h1>${MSDS.escapeHtml(translation.title_zh)}</h1>
          <p>${MSDS.escapeHtml(translation.title_en)} · ${translation.pages.length} 页</p>
        </div>
        <div class="syllabus-actions">
          <a class="button button-primary" href="${MSDS.escapeHtml(pdfUrl)}" target="_blank" rel="noreferrer">新窗口打开 PDF</a>
          <a class="button button-quiet" href="${MSDS.escapeHtml(pdfUrl)}" download>下载 PDF</a>
        </div>
      </section>

      <nav class="syllabus-jump-links" aria-label="课程介绍内容导航">
        <a href="#course-pdf">英文 PDF 原文</a>
        <a href="#course-translation">中文翻译</a>
      </nav>

      <div class="syllabus-layout">
        <section id="course-pdf" class="document-panel pdf-panel">
          <div class="document-panel-heading">
            <div><span>Original document</span><h2>英文 PDF 原文</h2></div>
            <a href="${MSDS.escapeHtml(pdfUrl)}" target="_blank" rel="noreferrer">无法显示？单独打开</a>
          </div>
          <iframe class="pdf-frame" src="${MSDS.escapeHtml(pdfViewerUrl)}" title="${MSDS.escapeHtml(course.code)} 英文课程介绍 PDF"></iframe>
          <p class="pdf-fallback">如果当前浏览器无法在页面内显示 PDF，请使用上方“新窗口打开 PDF”或“下载 PDF”。</p>
        </section>

        <section id="course-translation" class="document-panel translation-panel">
          <div class="document-panel-heading">
            <div><span>Chinese translation</span><h2>中文翻译</h2></div>
          </div>
          <div class="translation-notice"><strong>翻译说明：</strong>中文内容按英文 PDF 逐页整理，仅供理解与选课参考；课程要求、考核规则及阅读资料以英文原文为准。</div>
          <div class="translation-pages">
            ${translation.pages.map(renderPage).join("")}
          </div>
        </section>
      </div>`;
  }

  if (!code) {
    detail.innerHTML = '<div class="error-state">缺少课程编号。<br><a class="text-link" href="index.html">返回课程表</a></div>';
    return;
  }

  Promise.all([
    getJson("data/courses/index.json"),
    getJson("data/course-documents/index.json")
  ]).then(([courseIndex, courseDocuments]) => {
    const course = courseIndex.courses.find((item) => item.code === code);
    if (!course) throw new Error("没有找到这门课程");
    const courseDocument = courseDocuments[course.code];
    if (!courseDocument) throw new Error("这门课程暂时没有详细课程文件");
    return getJson(courseDocument.translation)
      .then((translation) => render(course, courseDocument, translation));
  }).catch((error) => {
    const backUrl = code ? `course.html?code=${encodeURIComponent(code)}` : "index.html";
    detail.innerHTML = `<div class="error-state">${MSDS.escapeHtml(error.message)}<br><a class="text-link" href="${backUrl}">返回课程详情</a></div>`;
  });
})();
