/**
 * Site-wide behaviour. Everything here is progressive enhancement: the pages
 * are complete, readable and navigable without it.
 */
import { loadIndex, renderAskOption, renderResult, search } from './search';

const root = document.documentElement;
const motionOK = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
if (motionOK) root.classList.add('js-motion');

/* ---------- Theme ---------- */

type ThemeChoice = 'system' | 'light' | 'dark';
const THEME_KEY = 'bc-theme';

function readTheme(): ThemeChoice {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function applyTheme(choice: ThemeChoice) {
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);
  try {
    if (choice === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    /* storage unavailable: the choice lasts for this page only */
  }
  const labels: Record<ThemeChoice, string> = {
    system: 'Theme: match system',
    light: 'Theme: light',
    dark: 'Theme: dark',
  };
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) {
    button.dataset.state = choice;
    button.setAttribute('aria-label', `${labels[choice]}. Change theme`);
    button.title = labels[choice];
  }
}

applyTheme(readTheme());
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]')) {
  button.addEventListener('click', () => {
    const order: ThemeChoice[] = ['system', 'light', 'dark'];
    const next = order[(order.indexOf(readTheme()) + 1) % order.length];
    root.classList.add('theme-switching');
    applyTheme(next);
    window.setTimeout(() => root.classList.remove('theme-switching'), 420);
  });
}

/* ---------- Header state ---------- */

const header = document.querySelector<HTMLElement>('.site-header');
const progress = document.querySelector<HTMLElement>('[data-progress]');
let ticking = false;
function onScroll() {
  ticking = false;
  const y = window.scrollY;
  header?.classList.toggle('scrolled', y > 8);
  if (progress) {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  }
}
window.addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  },
  { passive: true },
);
onScroll();

// Close the mobile menu on Escape or when a link inside it is followed.
const menu = document.querySelector<HTMLDetailsElement>('.nav-menu');
if (menu) {
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      menu.open = false;
      menu.querySelector('summary')?.focus();
    }
  });
  menu.addEventListener('toggle', () => {
    document.body.classList.toggle('menu-open', menu.open);
    const sheet = menu.querySelector<HTMLElement>('.menu-sheet');
    if (menu.open && sheet && header) {
      sheet.style.height = `${window.innerHeight - header.getBoundingClientRect().bottom}px`;
    }
  });
}

// Grouped header menus: one open at a time; close on Escape, outside click or
// when focus leaves. Native <details>, so they work without this too.
const drops = [...document.querySelectorAll<HTMLDetailsElement>('[data-nav-drop]')];
for (const drop of drops) {
  drop.addEventListener('toggle', () => {
    if (drop.open) for (const other of drops) if (other !== drop) other.open = false;
  });
  drop.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && drop.open) {
      drop.open = false;
      drop.querySelector('summary')?.focus();
    }
  });
  drop.addEventListener('focusout', (event) => {
    if (drop.open && !drop.contains(event.relatedTarget as Node | null)) drop.open = false;
  });
}
document.addEventListener('click', (event) => {
  for (const drop of drops) if (drop.open && !drop.contains(event.target as Node)) drop.open = false;
});
// With a mouse or trackpad the menus behave like a product site's: hover
// intent before the first open, instant switching between groups, and one
// surface (.nav-morph) that glides and resizes to fit each group, with the
// content sliding in from the side the pointer came from. Touch and keyboard
// keep the plain click-to-open disclosure.
const primary = document.querySelector<HTMLElement>('nav.primary');
const morph = primary?.querySelector<HTMLElement>('.nav-morph');
if (primary && morph && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  primary.classList.add('morph-mode');
  let current: HTMLDetailsElement | null = null;
  let openTimer = 0;
  let closeTimer = 0;

  const place = (drop: HTMLDetailsElement, instant: boolean) => {
    const panel = drop.querySelector<HTMLElement>('.drop-panel');
    const summary = drop.querySelector('summary');
    if (!panel || !summary) return;
    const box = primary.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const s = summary.getBoundingClientRect();
    primary.classList.toggle('morph-instant', instant);
    morph.style.setProperty('--mx', `${p.left - box.left}px`);
    morph.style.setProperty('--my', `${p.top - box.top}px`);
    morph.style.setProperty('--mw', `${p.width}px`);
    morph.style.setProperty('--mh', `${p.height}px`);
    morph.style.setProperty('--caret', `${s.left + s.width / 2 - p.left}px`);
    morph.style.setProperty('--mo', `${s.left + s.width / 2 - p.left}px`);
    primary.classList.add('morph-open');
  };

  const show = (drop: HTMLDetailsElement) => {
    const from = current ? drops.indexOf(current) : -1;
    const to = drops.indexOf(drop);
    primary.dataset.dir = from < 0 ? 'none' : to > from ? 'right' : 'left';
    const instant = !current;
    current = drop;
    drop.open = true; // closes the others via the toggle listener above
    place(drop, instant);
  };
  // Close by fading the surface and the content together, then closing the menu.
  const hide = () => {
    const closing = current;
    current = null;
    primary.classList.remove('morph-open');
    delete primary.dataset.dir;
    window.setTimeout(() => {
      if (closing && current !== closing) closing.removeAttribute('open');
    }, 170);
  };

  for (const drop of drops) {
    drop.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'mouse') return;
      window.clearTimeout(closeTimer);
      window.clearTimeout(openTimer);
      // Hover intent: a pause before the first open, none when moving between menus.
      openTimer = window.setTimeout(() => show(drop), current ? 0 : 80);
    });
    drop.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'mouse') return;
      window.clearTimeout(openTimer);
      closeTimer = window.setTimeout(() => {
        if (!primary.contains(document.activeElement) || !current?.contains(document.activeElement)) hide();
      }, 220);
    });
    // A click on a label the pointer already opened keeps it open.
    drop.querySelector('summary')?.addEventListener('click', (event) => {
      if ((event as PointerEvent).pointerType === 'mouse' && drop.open) event.preventDefault();
    });
    // Keyboard or click opening: follow it with the surface too.
    drop.addEventListener('toggle', () => {
      if (drop.open && current !== drop) show(drop);
      if (!drop.open && current === drop) {
        current = null;
        primary.classList.remove('morph-open');
      }
    });
  }
  window.addEventListener('resize', () => current && place(current, true));
}

/* ---------- Gliding highlights ---------- */

// One soft highlight that follows the pointer between items of a list, the way
// product sites do it, instead of each item flashing its own background.
// Mouse and trackpad only; touch and keyboard keep the items' own states.
function glide(host: HTMLElement, items: string) {
  if (host.dataset.glided) return;
  host.dataset.glided = '1';
  host.classList.add('glide-host');
  const pill = document.createElement('span');
  pill.className = 'glide';
  pill.setAttribute('aria-hidden', 'true');
  host.prepend(pill);
  let shown = false;
  const moveTo = (el: HTMLElement) => {
    const h = host.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    // First appearance fades in where it is; later moves slide.
    host.classList.toggle('glide-snap', !shown);
    host.style.setProperty('--gx', `${r.left - h.left + host.scrollLeft}px`);
    host.style.setProperty('--gy', `${r.top - h.top + host.scrollTop}px`);
    host.style.setProperty('--gw', `${r.width}px`);
    host.style.setProperty('--gh', `${r.height}px`);
    if (!shown) requestAnimationFrame(() => host.classList.remove('glide-snap'));
    shown = true;
    host.classList.add('gliding');
  };
  host.addEventListener('pointerover', (event) => {
    if ((event as PointerEvent).pointerType !== 'mouse') return;
    const item = (event.target as Element).closest<HTMLElement>(items);
    if (!item || !host.contains(item) || item.hidden) return;
    // Lists rebuilt by script (search results) lose the highlight; put it back.
    if (!pill.isConnected) host.prepend(pill);
    item.setAttribute('data-glide-item', '');
    moveTo(item.matches('li') && item.firstElementChild instanceof HTMLAnchorElement ? item.firstElementChild : item);
  });
  host.addEventListener('pointerleave', () => {
    shown = false;
    host.classList.remove('gliding');
  });
}

if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const targets: [string, string][] = [
    ['.drop-panel ul', ':scope > li'],
    ['.group-links', ':scope > li'],
    ['.rail-nav ul', ':scope > li'],
    ['.dataset-rows', ':scope > .dataset-row'],
    ['.footer-directory ul', ':scope > li'],
  ];
  const attach = () => {
    for (const [hostSel, itemSel] of targets) {
      for (const host of document.querySelectorAll<HTMLElement>(hostSel)) glide(host, itemSel.replace(':scope > ', ''));
    }
  };
  attach();
  // Search results are rebuilt as you type; attach once the lists exist.
  for (const list of document.querySelectorAll<HTMLElement>('.search-results')) glide(list, '[role="option"]');
}

/* ---------- Tables: keep the header row in view ---------- */

// A table narrower than its frame needs no scroll box of its own; without one,
// its sticky header can hold to the page while the reader scrolls. Wide tables
// keep scrolling inside their frame, header pinned there.
const wraps = [...document.querySelectorAll<HTMLElement>('.table-wrap')];
const fit = () => {
  for (const wrap of wraps) {
    const table = wrap.querySelector('table');
    if (!table) continue;
    wrap.classList.remove('fits');
    wrap.classList.toggle('fits', table.scrollWidth <= wrap.clientWidth + 1);
  }
};
if (wraps.length) {
  fit();
  let fitFrame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(fit);
  });
  // Tables inside closed <details> measure as zero wide until opened.
  document.addEventListener('toggle', fit, true);
}

/* ---------- Manila clock in the utility bar ---------- */

const clocks = document.querySelectorAll<HTMLElement>('[data-ph-clock]');
if (clocks.length) {
  const format = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const tick = () => {
    const text = `${format.format(new Date())} PHT`;
    for (const clock of clocks) {
      clock.textContent = text;
      clock.hidden = false;
    }
  };
  tick();
  setInterval(tick, 30_000);
}

/* ---------- Reveal, grow and count-up on scroll ---------- */

function countUp(el: HTMLElement) {
  const target = Number(el.dataset.count);
  if (!Number.isFinite(target)) return;
  const decimals = Number(el.dataset.decimals ?? 0);
  const prefix = el.dataset.prefix ?? '';
  const suffix = el.dataset.suffix ?? '';
  const fmt = new Intl.NumberFormat('en-PH', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const final = el.textContent;
  const start = performance.now();
  const duration = 1400;
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = `${prefix}${fmt.format(target * eased)}${suffix}`;
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = final;
  };
  requestAnimationFrame(step);
}

if (motionOK && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.classList.add('is-in');
        for (const counter of el.matches('[data-count]') ? [el] : el.querySelectorAll<HTMLElement>('[data-count]')) {
          if (!counter.dataset.counted) {
            counter.dataset.counted = '1';
            countUp(counter);
          }
        }
        observer.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal], [data-grow], [data-animate]')) {
    observer.observe(el);
  }
  // Stagger siblings in a group.
  for (const group of document.querySelectorAll<HTMLElement>('[data-stagger]')) {
    const step = Number(group.dataset.stagger) || 70;
    [...group.querySelectorAll<HTMLElement>(':scope > [data-reveal], :scope > * > [data-reveal]')].forEach(
      (child, i) => child.style.setProperty('--reveal-delay', `${i * step}ms`),
    );
  }
} else {
  for (const el of document.querySelectorAll<HTMLElement>('[data-reveal], [data-grow], [data-animate]')) {
    el.classList.add('is-in');
  }
}

/* ---------- Pause ambient animation that is off-screen ---------- */

if ('IntersectionObserver' in window) {
  const pauser = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('offscreen', !e.isIntersecting);
  });
  for (const el of document.querySelectorAll('.contours, .hc-stage, .f-visual, .pulse')) pauser.observe(el);
}
document.addEventListener('visibilitychange', () =>
  root.classList.toggle('page-hidden', document.hidden),
);

/* ---------- Chart tooltips ---------- */

const tip = document.createElement('div');
tip.className = 'tooltip';
tip.setAttribute('aria-hidden', 'true');
document.body.append(tip);

function showTip(target: HTMLElement | SVGElement, x: number, y: number) {
  const text = target.getAttribute('data-tip');
  if (!text) return;
  const [title, ...rest] = text.split('|');
  tip.replaceChildren();
  const strong = document.createElement('strong');
  strong.textContent = title;
  tip.append(strong);
  for (const line of rest) {
    const span = document.createElement('span');
    span.textContent = line;
    span.style.display = 'block';
    tip.append(span);
  }
  const pad = 12;
  const clampedX = Math.min(window.innerWidth - pad - 90, Math.max(pad + 90, x));
  tip.style.left = `${clampedX}px`;
  tip.style.top = `${Math.max(60, y)}px`;
  tip.classList.add('show');
}
function hideTip() {
  tip.classList.remove('show');
}
document.addEventListener('pointerover', (event) => {
  const target = (event.target as Element).closest<HTMLElement>('[data-tip]');
  if (target) showTip(target, event.clientX, event.clientY);
});
let tipFrame = 0;
document.addEventListener('pointermove', (event) => {
  if (tipFrame) return;
  tipFrame = requestAnimationFrame(() => (tipFrame = 0));
  const target = (event.target as Element).closest<HTMLElement>('[data-tip]');
  if (target) showTip(target, event.clientX, event.clientY);
  else hideTip();
});
document.addEventListener('focusin', (event) => {
  const target = (event.target as Element).closest<HTMLElement>('[data-tip]');
  if (target) {
    const box = target.getBoundingClientRect();
    showTip(target, box.left + box.width / 2, box.top);
  }
});
document.addEventListener('focusout', hideTip);
window.addEventListener('scroll', hideTip, { passive: true });

/* ---------- Scrollspy for on-page navigation ---------- */

for (const nav of document.querySelectorAll<HTMLElement>('[data-spy]')) {
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
  const targets = links
    .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
    .filter((el): el is HTMLElement => Boolean(el));
  if (!targets.length || !('IntersectionObserver' in window)) continue;
  const visible = new Set<HTMLElement>();
  const update = () => {
    const current = targets.find((t) => visible.has(t));
    for (const link of links) {
      const on = current !== undefined && link.hash === `#${current.id}`;
      if (on) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
  };
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target as HTMLElement);
        else visible.delete(entry.target as HTMLElement);
      }
      update();
    },
    { rootMargin: '-20% 0px -65% 0px' },
  );
  for (const target of targets) spy.observe(target);
}

/* ---------- Copy buttons ---------- */

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy]')) {
  button.addEventListener('click', async () => {
    const value = button.dataset.copy ?? '';
    const absolute = value.startsWith('/') ? new URL(value, location.origin).toString() : value;
    try {
      await navigator.clipboard.writeText(absolute);
      const label = button.querySelector('[data-copy-label]');
      if (label) {
        const before = label.textContent;
        label.textContent = 'Copied';
        setTimeout(() => (label.textContent = before), 1600);
      }
    } catch {
      /* clipboard blocked: the URL is still visible beside the button */
    }
  });
}

/* ---------- The assistant (only when the site is built with one) ---------- */

const askPanel = document.querySelector<HTMLDialogElement>('#ask-panel');
let askModule: Promise<typeof import('./ask')> | null = null;

/** Open the assistant with a question, growing out of `from`. Its code is fetched the first time. */
function ask(question: string, from: HTMLElement | null = null) {
  askModule ??= import('./ask');
  askModule
    .then((module) => module.openAsk(question, from))
    .catch(() => {
      askModule = null;
    });
}
// Warm the module when someone starts typing a question, so asking feels instant.
if (askPanel) {
  document.addEventListener('focusin', (event) => {
    if ((event.target as Element).closest('[data-inline-search], #search-dialog')) askModule ??= import('./ask');
  });
}

/* ---------- Search: combobox behaviour shared by the dialog and inline boxes ---------- */

function attachSearch(input: HTMLInputElement, list: HTMLElement, status: HTMLElement | null, onGo?: () => void) {
  let active = -1;
  let items: HTMLElement[] = [];
  let seq = 0;
  const prefix = list.id || 'sr';

  const setActive = (index: number) => {
    items.forEach((item, i) => item.setAttribute('aria-selected', String(i === index)));
    active = index;
    if (index >= 0 && items[index]) {
      input.setAttribute('aria-activedescendant', items[index].id);
      items[index].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  };

  const run = async () => {
    const query = input.value;
    const mine = ++seq;
    if (!query.trim()) {
      list.innerHTML = '';
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      if (status) status.textContent = '';
      items = [];
      setActive(-1);
      list.dispatchEvent(new CustomEvent('search:empty', { bubbles: true }));
      return;
    }
    let index;
    try {
      index = await loadIndex();
    } catch {
      if (status) status.textContent = 'Search is unavailable right now.';
      return;
    }
    if (mine !== seq) return;
    const results = search(index, query, list.dataset.limit ? Number(list.dataset.limit) : 12);
    list.innerHTML =
      (askPanel ? renderAskOption(query, `${prefix}-ask`) : '') +
      results.map((entry, i) => renderResult(entry, `${prefix}-${i}`)).join('');
    items = [...list.querySelectorAll<HTMLElement>('[role="option"]')];
    list.hidden = items.length === 0;
    input.setAttribute('aria-expanded', String(items.length > 0));
    setActive(items.length ? 0 : -1);
    if (status) {
      const found = results.length
        ? `${results.length} ${results.length === 1 ? 'result' : 'results'}`
        : `No results for “${query.trim()}”`;
      status.textContent = askPanel
        ? `${found}. Press Enter to ask the assistant, or use the arrow keys to choose a result.`
        : results.length
          ? `${found}. Use the arrow keys to choose, Enter to open.`
          : `${found}. Try a barangay, a year or a topic such as “income”.`;
    }
    list.dispatchEvent(new CustomEvent('search:results', { bubbles: true, detail: results.length }));
  };

  let debounce = 0;
  input.addEventListener('input', () => {
    window.clearTimeout(debounce);
    debounce = window.setTimeout(run, 90);
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (items.length) setActive((active + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (items.length) setActive((active - 1 + items.length) % items.length);
    } else if (event.key === 'Enter') {
      const option = items[active];
      if (option?.hasAttribute('data-ask-option')) {
        event.preventDefault();
        askFrom();
        return;
      }
      const link = option?.querySelector('a');
      if (link) {
        event.preventDefault();
        onGo?.();
        location.assign(link.href);
      }
    }
  });
  list.addEventListener('pointermove', (event) => {
    const option = (event.target as Element).closest<HTMLElement>('[role="option"]');
    if (option) setActive(items.indexOf(option));
  });
  list.addEventListener('click', (event) => {
    if ((event.target as Element).closest('[data-ask-option]')) {
      event.preventDefault();
      askFrom();
      return;
    }
    onGo?.();
  });

  /** Hand the typed question to the assistant and reset this box. */
  function askFrom() {
    const question = input.value;
    // Grow out of the pill the question was typed in (the dialog's field when asked from ⌘K).
    const from = input.closest<HTMLElement>('form, .palette-field');
    onGo?.();
    input.value = '';
    void run();
    input.blur();
    ask(question, from);
  }
  return { run, askFrom };
}

// The dialog
const dialog = document.querySelector<HTMLDialogElement>('#search-dialog');
if (dialog) {
  const input = dialog.querySelector<HTMLInputElement>('input')!;
  const list = dialog.querySelector<HTMLElement>('[role="listbox"]')!;
  const status = dialog.querySelector<HTMLElement>('[role="status"]');
  const suggestions = dialog.querySelector<HTMLElement>('.palette-suggest');
  const close = () => dialog.close();
  const { run } = attachSearch(input, list, status, close);

  list.addEventListener('search:results', () => suggestions && (suggestions.hidden = true));
  list.addEventListener('search:empty', () => suggestions && (suggestions.hidden = false));

  const open = (seed = '') => {
    if (dialog.open) return;
    dialog.showModal();
    document.body.classList.add('palette-open');
    input.value = seed;
    input.focus();
    void run();
    void loadIndex().catch(() => undefined);
  };
  dialog.addEventListener('close', () => document.body.classList.remove('palette-open'));
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
  for (const button of document.querySelectorAll<HTMLElement>('[data-open-search]')) {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      open();
    });
  }
  for (const chip of dialog.querySelectorAll<HTMLButtonElement>('[data-suggest]')) {
    chip.addEventListener('click', () => {
      input.value = chip.dataset.suggest ?? '';
      input.focus();
      void run();
    });
  }
  document.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement;
    const typing = target.closest('input, textarea, select, [contenteditable="true"]');
    if ((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      if (dialog.open) close();
      else open();
    } else if (event.key === '/' && !typing && !dialog.open) {
      event.preventDefault();
      const bar = document.querySelector<HTMLElement>('[data-ask-bar]:not(.away) input');
      if (bar) bar.focus();
      else open();
    }
  });
  // Hint the right modifier key.
  const mac = /Mac|iPhone|iPad/.test(navigator.userAgent);
  for (const kbd of document.querySelectorAll<HTMLElement>('[data-kbd-mod]')) kbd.textContent = mac ? '⌘' : 'Ctrl';
}

// The floating ask bar steps aside while a page's own ask box is on screen,
// and while the reader is typing in any other field.
const askBar = document.querySelector<HTMLElement>('[data-ask-bar]');
const heroAsk = document.querySelector<HTMLElement>('[data-hero-ask]');
if (askBar && heroAsk && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    const away = entry.isIntersecting;
    askBar.classList.toggle('away', away);
    askBar.toggleAttribute('inert', away);
  }).observe(heroAsk);
}

// Inline search boxes (the homepage ask box and the floating ask bar)
for (const box of document.querySelectorAll<HTMLElement>('[data-inline-search]')) {
  const input = box.querySelector<HTMLInputElement>('input')!;
  const list = box.querySelector<HTMLElement>('[role="listbox"]')!;
  const status = box.querySelector<HTMLElement>('[role="status"]');
  const form = box.querySelector('form');
  const { run, askFrom } = attachSearch(input, list, status);
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (askPanel && input.value.trim()) return askFrom();
    const first = list.querySelector<HTMLAnchorElement>('[role="option"] a');
    if (first) location.assign(first.href);
    else void run();
  });
  for (const chip of box.querySelectorAll<HTMLButtonElement>('[data-suggest]')) {
    chip.addEventListener('click', () => {
      input.value = chip.dataset.suggest ?? '';
      input.focus();
      void run();
    });
  }
  document.addEventListener('click', (event) => {
    if (!box.contains(event.target as Node)) {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
    }
  });
  input.addEventListener('focus', () => {
    if (list.querySelector('[role="option"]')) {
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ---------- Voice input for the ask boxes (where the browser supports it) ---------- */

type Recognition = {
  lang: string;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
};
const SpeechAPI = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition })
  .SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
if (SpeechAPI) {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-voice]')) {
    const input = button.closest('form')?.querySelector('input');
    if (!input) continue;
    button.hidden = false;
    let rec: Recognition | null = null;
    button.addEventListener('click', () => {
      if (rec) return rec.stop();
      rec = new SpeechAPI();
      rec.lang = 'en-PH';
      rec.interimResults = true;
      button.classList.add('listening');
      rec.onresult = (e) => {
        input.value = Array.from(e.results, (r) => r[0].transcript).join('');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      };
      rec.onend = () => {
        button.classList.remove('listening');
        rec = null;
        input.focus();
      };
      rec.start();
    });
  }
}
