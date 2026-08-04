(function () {
  "use strict";

  const detail = document.getElementById("syllabus-detail");
  const code = new URLSearchParams(window.location.search).get("code")?.trim().toUpperCase();
  const pdfJsBaseUrl = new URL("assets/vendor/pdfjs/", document.baseURI);
  const pdfJsModuleUrl = new URL("pdf.min.mjs?v=6.2.108", pdfJsBaseUrl).href;
  const pdfJsWorkerUrl = new URL("pdf.worker.min.mjs?v=6.2.108", pdfJsBaseUrl).href;

  function getJson(url) {
    return fetch(url).then((response) => {
      if (!response.ok) throw new Error(`数据读取失败：${url}`);
      return response.json();
    });
  }

  function renderPage(page) {
    return `
      <article class="translation-page" data-page-number="${MSDS.escapeHtml(page.page)}">
        <h3>第 ${MSDS.escapeHtml(page.page)} 页</h3>
        <div class="translation-text">${MSDS.escapeHtml(page.text)}</div>
      </article>`;
  }

  function trackCurrentPage(container, pages, onChange) {
    let animationFrame = 0;
    let currentPageNumber = 0;

    function update() {
      animationFrame = 0;
      const containerTop = container.getBoundingClientRect().top;
      const anchor = containerTop + Math.min(container.clientHeight * 0.2, 120);
      const currentPage = pages.reduce((nearest, page) => {
        const pageRect = page.getBoundingClientRect();
        const nearestRect = nearest.getBoundingClientRect();
        const pageDistance = anchor < pageRect.top
          ? pageRect.top - anchor
          : Math.max(0, anchor - pageRect.bottom);
        const nearestDistance = anchor < nearestRect.top
          ? nearestRect.top - anchor
          : Math.max(0, anchor - nearestRect.bottom);
        return pageDistance < nearestDistance ? page : nearest;
      });
      const pageNumber = Number(currentPage.dataset.pageNumber);

      if (pageNumber === currentPageNumber) return;
      currentPageNumber = pageNumber;
      pages.forEach((page) => page.classList.toggle("is-current", page === currentPage));
      onChange(pageNumber);
    }

    container.addEventListener("scroll", () => {
      if (!animationFrame) animationFrame = window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  function setTranslationPage(pageNumber) {
    const pagesContainer = document.getElementById("translation-pages");
    const page = pagesContainer?.querySelector(`[data-page-number="${pageNumber}"]`);
    if (!pagesContainer || !page) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    pagesContainer.scrollTo({
      top: page.offsetTop,
      behavior: reducedMotion ? "auto" : "smooth"
    });
  }

  function setupTranslationPager() {
    const pagesContainer = document.getElementById("translation-pages");
    const pageCounter = document.getElementById("translation-page-counter");
    if (!pagesContainer || !pageCounter) return;

    const pages = Array.from(pagesContainer.querySelectorAll(".translation-page"));
    trackCurrentPage(pagesContainer, pages, (pageNumber) => {
      pageCounter.textContent = `第 ${pageNumber} / ${pages.length} 页`;
    });
  }

  function setPdfStatus(message, state = "loading") {
    const status = document.getElementById("pdf-viewer-status");
    if (!status) return;
    status.dataset.state = state;
    status.querySelector(".pdf-viewer-status-text").textContent = message;
  }

  async function renderPdfPage(pdf, pageElement) {
    if (pageElement.dataset.renderState !== "idle") return;
    pageElement.dataset.renderState = "loading";
    pageElement.setAttribute("aria-busy", "true");
    const pageNumber = Number(pageElement.dataset.pageNumber);

    try {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const availableWidth = Math.max(1, pageElement.clientWidth - 2);
      const viewport = page.getViewport({ scale: availableWidth / baseViewport.width });
      const maxPixelRatio = availableWidth > 700 ? 1.5 : 2;
      const outputScale = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("当前浏览器不支持 Canvas PDF 渲染");

      canvas.className = "pdf-page-canvas";
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", `PDF 第 ${pageNumber} 页`);

      await page.render({
        canvas,
        canvasContext: context,
        transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0],
        viewport
      }).promise;

      const pageLabel = document.createElement("span");
      pageLabel.className = "pdf-page-number";
      pageLabel.textContent = `第 ${pageNumber} 页`;
      pageElement.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
      pageElement.replaceChildren(canvas, pageLabel);
      pageElement.dataset.renderState = "rendered";
      pageElement.setAttribute("aria-busy", "false");
      page.cleanup();
    } catch (error) {
      pageElement.dataset.renderState = "error";
      pageElement.setAttribute("aria-busy", "false");
      pageElement.classList.add("pdf-page-error");
      pageElement.textContent = `第 ${pageNumber} 页加载失败，请使用上方原文件入口。`;
      console.error(`PDF page ${pageNumber} render failed`, error);
    }
  }

  function observePdfPages(pdf, pageElements, pagesContainer) {
    if (!("IntersectionObserver" in window)) {
      pageElements.reduce(
        (sequence, pageElement) => sequence.then(() => renderPdfPage(pdf, pageElement)),
        Promise.resolve()
      );
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        renderPdfPage(pdf, entry.target);
      });
    }, { root: pagesContainer, rootMargin: "700px 0px" });

    pageElements.forEach((pageElement) => observer.observe(pageElement));
  }

  async function loadPdfViewer(pdfUrl) {
    const pagesContainer = document.getElementById("pdf-pages");
    if (!pagesContainer) return;

    try {
      const pdfjsLib = await import(pdfJsModuleUrl);
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfJsWorkerUrl;
      const loadingTask = pdfjsLib.getDocument({ url: pdfUrl });
      loadingTask.onProgress = ({ loaded, total }) => {
        if (!total) return;
        setPdfStatus(`正在加载英文 PDF… ${Math.round((loaded / total) * 100)}%`);
      };
      const pdf = await loadingTask.promise;
      const pageElements = Array.from({ length: pdf.numPages }, (_, index) => {
        const pageNumber = index + 1;
        const pageElement = document.createElement("article");
        pageElement.className = "pdf-page";
        pageElement.dataset.pageNumber = String(pageNumber);
        pageElement.dataset.renderState = "idle";
        pageElement.setAttribute("aria-label", `英文 PDF 第 ${pageNumber} 页`);
        pageElement.setAttribute("aria-busy", "true");
        pageElement.innerHTML = `<span class="pdf-page-placeholder">第 ${pageNumber} 页等待显示…</span>`;
        return pageElement;
      });

      pagesContainer.replaceChildren(...pageElements);
      setPdfStatus(`英文 PDF 已加载，共 ${pdf.numPages} 页；向下滚动时自动显示。`, "ready");
      trackCurrentPage(pagesContainer, pageElements, setTranslationPage);
      observePdfPages(pdf, pageElements, pagesContainer);
    } catch (error) {
      setPdfStatus("英文 PDF 暂时无法在页面内显示。", "error");
      const errorMessage = document.createElement("div");
      errorMessage.className = "pdf-viewer-error";
      errorMessage.textContent = "请使用上方“原文件备用入口”查看课程文件。";
      pagesContainer.replaceChildren(errorMessage);
      console.error("PDF viewer initialization failed", error);
    }
  }

  function render(course, courseDocument, translation) {
    const pdfUrl = new URL(courseDocument.pdf, window.location.href).href;
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
          <a class="button button-primary" href="${MSDS.escapeHtml(pdfUrl)}" target="_blank" rel="noreferrer">原文件备用入口</a>
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
            <a href="${MSDS.escapeHtml(pdfUrl)}" target="_blank" rel="noreferrer">单独打开原文件</a>
          </div>
          <div id="pdf-viewer" class="pdf-viewer" aria-label="${MSDS.escapeHtml(course.code)} 英文课程介绍 PDF">
            <div id="pdf-viewer-status" class="pdf-viewer-status" data-state="loading" role="status" aria-live="polite">
              <span class="pdf-viewer-spinner" aria-hidden="true"></span>
              <span class="pdf-viewer-status-text">正在准备网页内 PDF 阅读器…</span>
            </div>
            <div id="pdf-pages" class="pdf-pages"></div>
          </div>
          <p class="pdf-fallback">PDF 会直接绘制在当前网页中，不会自动跳转或下载；如渲染失败，可使用上方备用入口。</p>
        </section>

        <section id="course-translation" class="document-panel translation-panel">
          <div class="document-panel-heading">
            <div><span>Chinese translation</span><h2>中文翻译</h2></div>
          </div>
          <div class="translation-notice"><strong>翻译说明：</strong>中文内容按英文 PDF 逐页整理，仅供理解与选课参考；课程要求、考核规则及阅读资料以英文原文为准。</div>
          <div class="translation-page-status">
            <span>上下滚动，逐页对照英文原文</span>
            <strong id="translation-page-counter" aria-live="polite">第 1 / ${translation.pages.length} 页</strong>
          </div>
          <div id="translation-pages" class="translation-pages" tabindex="0" role="region" aria-label="中文翻译逐页阅读区">
            ${translation.pages.map(renderPage).join("")}
          </div>
        </section>
      </div>`;

    setupTranslationPager();
    loadPdfViewer(pdfUrl);
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
