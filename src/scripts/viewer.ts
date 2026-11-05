/**
 * The in-site document reader: PDF, XLSX and DOCX, read without downloading.
 *
 * Renderers load only when a document is opened. PDF pages are laid out at
 * once with the first page's proportions and drawn as they approach the
 * viewport, so a 60-page plan opens as fast as a one-page notice; each page
 * gets PDF.js's text layer, so text can be selected, copied and found with
 * the browser's own search. Spreadsheets and Word files are unzipped and
 * rebuilt as HTML (scripts/office.ts).
 */

// The legacy build carries polyfills (Map.getOrInsertComputed and others) the
// modern build assumes; without them PDF.js fails on current Safari and older
// Chromium.
type PdfJs = typeof import('pdfjs-dist/legacy/build/pdf.mjs');
type PdfDoc = Awaited<ReturnType<PdfJs['getDocument']>['promise']>;

const dialog = document.querySelector<HTMLDialogElement>('#doc-viewer');

if (dialog) {
  const $ = <T extends Element = HTMLElement>(sel: string) => dialog.querySelector<T>(sel)!;
  const stage = $('[data-v-stage]');
  const pagesWrap = $('[data-v-pages]');
  const loading = $('[data-v-loading]');
  const error = $('[data-v-error]');
  const progress = $('[data-v-progress]');
  const pageInput = $<HTMLInputElement>('[data-v-page]');
  const countEl = $('[data-v-count]');
  const zoomEl = $('[data-v-zoom]');
  const prev = $<HTMLButtonElement>('[data-v-prev]');
  const next = $<HTMLButtonElement>('[data-v-next]');
  const sheetBar = $('[data-v-sheets]');

  let pdfjs: PdfJs | null = null;
  let doc: PdfDoc | null = null;
  let loadingTask: { destroy(): Promise<void> } | null = null;
  let zoom = 0; // 0 = fit to width
  let baseRatio = 1.414;
  let observer: IntersectionObserver | null = null;
  let current = 1;
  let opener: HTMLElement | null = null;
  let session = 0;
  /** Who the open document is fetched from, for progress and error messages. */
  let source = 'the Internet Archive';
  let type = 'pdf';

  async function loadPdfJs(): Promise<PdfJs> {
    if (pdfjs) return pdfjs;
    const [lib, worker] = await Promise.all([
      import('pdfjs-dist/legacy/build/pdf.mjs'),
      import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
    ]);
    lib.GlobalWorkerOptions.workerSrc = worker.default;
    pdfjs = lib;
    return lib;
  }

  const fitWidth = () => Math.min(stage.clientWidth - 32, 980);

  function pageWidth() {
    return zoom === 0 ? fitWidth() : Math.round(fitWidth() * zoom);
  }

  function layout(count: number) {
    pagesWrap.replaceChildren();
    const w = pageWidth();
    for (let i = 1; i <= count; i++) {
      const box = document.createElement('div');
      box.className = 'v-page-box';
      box.dataset.page = String(i);
      box.style.width = `${w}px`;
      box.style.height = `${Math.round(w * baseRatio)}px`;
      pagesWrap.append(box);
    }
    observer?.disconnect();
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) void draw(entry.target as HTMLElement);
      },
      { root: stage, rootMargin: '800px 0px' },
    );
    for (const box of pagesWrap.children) observer.observe(box);
  }

  async function draw(box: HTMLElement) {
    if (!doc || !pdfjs || box.dataset.state) return;
    const mine = session;
    box.dataset.state = 'drawing';
    const page = await doc.getPage(Number(box.dataset.page));
    if (mine !== session) return;
    const w = pageWidth();
    const unscaled = page.getViewport({ scale: 1 });
    const scale = w / unscaled.width;
    const viewport = page.getViewport({ scale });
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    box.style.height = `${Math.round(viewport.height)}px`;
    await page.render({
      canvas,
      canvasContext: canvas.getContext('2d')!,
      viewport,
      transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
    }).promise;
    if (mine !== session) return;
    const text = document.createElement('div');
    text.className = 'textLayer';
    text.style.setProperty('--scale-factor', String(scale));
    text.style.setProperty('--total-scale-factor', String(scale));
    box.replaceChildren(canvas, text);
    box.classList.add('drawn');
    try {
      await new pdfjs.TextLayer({ textContentSource: page.streamTextContent(), container: text, viewport }).render();
    } catch {
      /* text is a convenience; the page image is already drawn */
    }
  }

  const zoomLabel = () => (zoom === 0 ? (type === 'pdf' ? 'Fit' : '100%') : `${Math.round(zoom * 100)}%`);

  function redraw() {
    if (type !== 'pdf') {
      pagesWrap.style.setProperty('zoom', String(zoom || 1));
      zoomEl.textContent = zoomLabel();
      return;
    }
    if (!doc) return;
    session++;
    const keep = current;
    layout(doc.numPages);
    zoomEl.textContent = zoomLabel();
    goTo(keep, false);
  }

  function goTo(n: number, smooth = true) {
    if (!doc) return;
    const page = Math.min(doc.numPages, Math.max(1, n));
    const box = pagesWrap.children[page - 1] as HTMLElement | undefined;
    box?.scrollIntoView({ block: 'start', behavior: smooth ? 'smooth' : 'auto' });
    setCurrent(page);
  }

  function setCurrent(n: number) {
    current = n;
    if (document.activeElement !== pageInput) pageInput.value = String(n);
    prev.disabled = n <= 1;
    next.disabled = !doc || n >= doc.numPages;
  }

  let scrollFrame = 0;
  stage.addEventListener(
    'scroll',
    () => {
      if (scrollFrame || type !== 'pdf') return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const mid = stage.getBoundingClientRect().top + stage.clientHeight * 0.35;
        const boxes = pagesWrap.children;
        for (let i = 0; i < boxes.length; i++) {
          const r = boxes[i].getBoundingClientRect();
          if (r.bottom > mid) {
            setCurrent(i + 1);
            break;
          }
        }
      });
    },
    { passive: true },
  );

  /**
   * Fetches through the same-origin pass-through, retrying when the source is
   * slow or briefly failing. The Internet Archive can take a minute to serve a
   * capture it has not served lately, and a gateway may give up first; the
   * host caches each file once it arrives, so a retry usually succeeds.
   */
  async function fetchWithRetry(src: string, mine: number): Promise<Response> {
    const waits = [2_000, 5_000];
    let lastError: unknown = null;
    for (let attempt = 0; attempt <= waits.length; attempt += 1) {
      const slow = window.setTimeout(() => {
        if (mine === session) progress.textContent = `Still fetching from ${source}…`;
      }, 6_000);
      try {
        const response = await fetch(src);
        if (response.ok) return response;
        lastError = new Error(`HTTP ${response.status}`);
        if (response.status < 500 && response.status !== 429) break;
      } catch (error) {
        lastError = error;
      } finally {
        window.clearTimeout(slow);
      }
      if (mine !== session) throw new Error('superseded');
      if (attempt < waits.length) {
        progress.textContent = `${source[0].toUpperCase()}${source.slice(1)} is slow to respond — trying again (${attempt + 2} of ${waits.length + 1})…`;
        await new Promise((resolve) => window.setTimeout(resolve, waits[attempt]));
        if (mine !== session) throw new Error('superseded');
      }
    }
    throw lastError ?? new Error('fetch failed');
  }

  /** Reads a response body while reporting progress. */
  async function fetchBytes(src: string, mine: number): Promise<Uint8Array> {
    const response = await fetchWithRetry(src, mine);
    const total = Number(response.headers.get('content-length')) || 0;
    if (!response.body) return new Uint8Array(await response.arrayBuffer());
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (mine !== session) {
        void reader.cancel();
        throw new Error('superseded');
      }
      chunks.push(value);
      loaded += value.length;
      progress.textContent = total ? `${Math.round((loaded / total) * 100)}%` : `${Math.round(loaded / 1024)} KB`;
    }
    const bytes = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return bytes;
  }

  async function openPdf(src: string, trigger: HTMLElement, mine: number) {
    const lib = await loadPdfJs();
    if (mine !== session) return;
    // Downloaded through the retrying fetch, then parsed from memory.
    const data = await fetchBytes(src, mine);
    if (mine !== session) return;
    const task = lib.getDocument({ data });
    loadingTask = task;
    task.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
      if (total) progress.textContent = `${Math.round((loaded / total) * 100)}%`;
    };
    const pdf = await task.promise;
    if (mine !== session) {
      void task.destroy();
      return;
    }
    doc = pdf;
    const first = await pdf.getPage(1);
    const vp = first.getViewport({ scale: 1 });
    baseRatio = vp.height / vp.width;
    countEl.textContent = String(pdf.numPages);
    setMeta(trigger, `${pdf.numPages} ${pdf.numPages === 1 ? 'page' : 'pages'}`);
    loading.hidden = true;
    layout(pdf.numPages);
    setCurrent(1);
    // A link to a page of this document (a citation: ?read=<id>#page=<n>) opens there.
    const wanted = Number(/page=(\d+)/.exec(location.hash)?.[1]);
    if (wanted > 1 && wanted <= pdf.numPages) requestAnimationFrame(() => goTo(wanted, false));
  }

  async function openOffice(src: string, trigger: HTMLElement, mine: number) {
    const [bytes, office] = await Promise.all([fetchBytes(src, mine), import('./office')]);
    if (mine !== session) return;
    if (type === 'xlsx') {
      const sheets = office.readXlsx(bytes);
      if (!sheets.length) throw new Error('Invalid workbook');
      setMeta(trigger, `${sheets.length} ${sheets.length === 1 ? 'sheet' : 'sheets'}`);
      const show = (i: number) => {
        pagesWrap.replaceChildren(sheets[i].render());
        stage.scrollTo(0, 0);
        sheetBar.querySelectorAll('button').forEach((b, j) => b.setAttribute('aria-selected', String(i === j)));
      };
      sheetBar.replaceChildren(
        ...sheets.map((sheet, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.setAttribute('role', 'tab');
          b.textContent = sheet.name;
          b.addEventListener('click', () => show(i));
          return b;
        }),
      );
      sheetBar.hidden = sheets.length < 2;
      loading.hidden = true;
      show(0);
    } else {
      const page = office.readDocx(bytes);
      loading.hidden = true;
      pagesWrap.replaceChildren(page);
    }
  }

  function setMeta(trigger: HTMLElement, extra: string) {
    $('[data-v-meta]').textContent = [trigger.dataset.meta, extra].filter(Boolean).join(' · ');
  }

  async function open(trigger: HTMLElement, push = true) {
    const src = trigger.dataset.read!;
    opener = trigger;
    // A new document while the assistant is open: its suggestions follow the document.
    if (askModule && !askSide.hidden) {
      void askModule.then((m) => m.dockAsk(askSide, '', { title: trigger.dataset.title, kind: trigger.dataset.kind }));
    }
    session++;
    const mine = session;
    zoom = 0;
    type = trigger.dataset.type ?? 'pdf';
    dialog!.dataset.type = type;
    source = trigger.dataset.source || 'the Internet Archive';
    dialog!.querySelectorAll('[data-v-source]').forEach((n) => (n.textContent = source));
    $('[data-v-title]').textContent = trigger.dataset.title ?? 'Document';
    $('[data-v-meta]').textContent = trigger.dataset.meta ?? '';
    const original = trigger.dataset.original ?? src;
    $<HTMLAnchorElement>('[data-v-original]').href = original;
    $<HTMLAnchorElement>('[data-v-error-link]').href = original;
    const download = $<HTMLAnchorElement>('[data-v-download]');
    download.href = src;
    download.setAttribute('download', trigger.dataset.filename ?? '');
    pagesWrap.replaceChildren();
    pagesWrap.style.removeProperty('zoom');
    sheetBar.replaceChildren();
    sheetBar.hidden = true;
    loading.hidden = false;
    error.hidden = true;
    progress.textContent = '';
    countEl.textContent = '–';
    zoomEl.textContent = zoomLabel();
    setCurrent(1);
    if (!dialog!.open) dialog!.showModal();
    document.body.classList.add('viewer-open');
    stage.focus({ preventScroll: true });

    if (push && trigger.dataset.id) {
      const url = new URL(location.href);
      url.searchParams.set('read', trigger.dataset.id);
      history.pushState({ reader: trigger.dataset.id }, '', url);
    }

    try {
      if (type === 'pdf') await openPdf(src, trigger, mine);
      else await openOffice(src, trigger, mine);
    } catch (e) {
      if (mine !== session) return;
      loading.hidden = true;
      error.hidden = false;
      const msg = String((e as Error)?.message ?? '');
      $('[data-v-error-text]').textContent = /Invalid|password|Not an Office|No (workbook|document)|zip/i.test(msg)
        ? 'The file arrived, but it is not in a format this reader can draw (it may be damaged or protected).'
        : `${source[0].toUpperCase()}${source.slice(1)} did not return the file just now. It may be busy — try again, or open the original directly.`;
    }
  }

  function cleanup() {
    session++;
    observer?.disconnect();
    pagesWrap.querySelectorAll<HTMLImageElement>('img[src^="blob:"]').forEach((img) => URL.revokeObjectURL(img.src));
    sheetBar.replaceChildren();
    pagesWrap.replaceChildren();
    // Destroying the loading task also tears down its document and worker port.
    void loadingTask?.destroy();
    loadingTask = null;
    doc = null;
    document.body.classList.remove('viewer-open');
  }

  /* ---------- Ask about this document (the assistant docked beside it) ---------- */
  const askToggle = $('[data-v-ask-toggle]') as HTMLButtonElement;
  const askSide = $('[data-v-ask]');
  // Only when the assistant is configured on this build (AskPanel renders #ask-panel).
  const askAvailable = Boolean(document.querySelector('#ask-panel'));
  askToggle.hidden = !askAvailable;
  let askModule: Promise<typeof import('./ask')> | null = null;
  const setAsk = (show: boolean) => {
    askSide.hidden = !show;
    dialog.classList.toggle('with-ask', show);
    askToggle.setAttribute('aria-pressed', String(show));
    // The document column changed width: refit the pages.
    window.dispatchEvent(new Event('resize'));
    if (show) {
      askModule ??= import('./ask');
      void askModule.then((m) => m.dockAsk(askSide, '', { title: opener?.dataset.title, kind: opener?.dataset.kind }));
    } else askToggle.focus({ preventScroll: true });
  };
  askToggle.addEventListener('click', () => setAsk(askSide.hidden));
  askSide.addEventListener('ask:dock-close', () => setAsk(false));
  // A source citing a page of the open document turns the reader to that page
  // instead of leaving it; other sources open as usual.
  askSide.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!link || link.origin !== location.origin) return;
    const url = new URL(link.href);
    const page = Number(/page=(\d+)/.exec(url.hash)?.[1]);
    if (url.searchParams.get('read') === opener?.dataset.id && page) {
      event.preventDefault();
      event.stopPropagation();
      goTo(page);
    }
  }, { capture: true });

  dialog.addEventListener('close', () => {
    // The conversation goes back to its own panel; it is kept for next time.
    if (askModule) void askModule.then((m) => m.undockAsk());
    askSide.hidden = true;
    dialog.classList.remove('with-ask');
    askToggle.setAttribute('aria-pressed', 'false');
    cleanup();
    const url = new URL(location.href);
    if (url.searchParams.has('read')) {
      url.searchParams.delete('read');
      history.replaceState(null, '', url);
    }
    // Focus goes back to the link that opened the reader. After a mouse or
    // touch close it should not wear a keyboard focus ring (Safari and some
    // Chrome versions show one for script-moved focus), so mark it until the
    // reader next moves focus by keyboard; after a keyboard close the ring stays.
    if (opener) {
      if (lastInput === 'pointer') {
        opener.classList.add('focus-quiet');
        opener.addEventListener('blur', () => opener?.classList.remove('focus-quiet'), { once: true });
      }
      opener.focus({ preventScroll: true, focusVisible: lastInput === 'keyboard' } as FocusOptions);
    }
  });
  // How the reader was last operated: decides whether returned focus shows a ring.
  let lastInput: 'pointer' | 'keyboard' = 'pointer';
  document.addEventListener('pointerdown', () => (lastInput = 'pointer'), { capture: true, passive: true });
  document.addEventListener('keydown', (event) => {
    if (!event.metaKey && !event.ctrlKey) lastInput = 'keyboard';
  }, { capture: true });
  window.addEventListener('popstate', () => {
    if (dialog.open && !new URL(location.href).searchParams.has('read')) dialog.close();
  });

  prev.addEventListener('click', () => goTo(current - 1));
  next.addEventListener('click', () => goTo(current + 1));
  pageInput.addEventListener('change', () => goTo(Number(pageInput.value) || 1));
  pageInput.addEventListener('focus', () => pageInput.select());
  const setZoom = (z: number) => {
    zoom = z;
    redraw();
  };
  $('[data-v-zoom-in]').addEventListener('click', () => setZoom(Math.min(3, (zoom || 1) + 0.25)));
  $('[data-v-zoom-out]').addEventListener('click', () => setZoom(Math.max(0.5, (zoom || 1) - 0.25)));
  $('[data-v-fit]').addEventListener('click', () => setZoom(0));
  dialog.addEventListener('keydown', (e) => {
    if (e.target === pageInput) return;
    if (type !== 'pdf' && !['+', '=', '-'].includes(e.key)) return;
    if (e.key === '+' || e.key === '=') setZoom(Math.min(3, (zoom || 1) + 0.25));
    else if (e.key === '-') setZoom(Math.max(0.5, (zoom || 1) - 0.25));
    else if (e.key === 'ArrowRight' || e.key === 'PageDown') goTo(current + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') goTo(current - 1);
    else return;
    e.preventDefault();
  });
  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    if (!dialog.open || zoom !== 0 || type !== 'pdf') return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(redraw, 200);
  });

  document.addEventListener('click', (e) => {
    const trigger = (e.target as Element).closest<HTMLElement>('[data-read]');
    // A modified click (new tab, new window) keeps the link's own behaviour.
    if (!trigger || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e as MouseEvent).button > 0) return;
    e.preventDefault();
    void open(trigger);
  });

  // Arriving with ?read=<id> opens that document.
  const wanted = new URL(location.href).searchParams.get('read');
  if (wanted) {
    const trigger = document.querySelector<HTMLElement>(`[data-read][data-id="${CSS.escape(wanted)}"]`);
    if (trigger) void open(trigger, false);
  }
}
