/**
 * Site-wide behaviour. Everything here is progressive enhancement: the pages
 * are complete, readable and navigable without it.
 */
import { loadIndex, renderResult, search } from './search';

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
    applyTheme(next);
  });
}

/* ---------- Header state ---------- */

const header = document.querySelector<HTMLElement>('.site-header');
const toTop = document.querySelector<HTMLElement>('.to-top');
const progress = document.querySelector<HTMLElement>('[data-progress]');
let ticking = false;
function onScroll() {
  ticking = false;
  const y = window.scrollY;
  header?.classList.toggle('scrolled', y > 8);
  toTop?.classList.toggle('show', y > 900);
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
toTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: motionOK ? 'smooth' : 'auto' });
  document.getElementById('main')?.focus({ preventScroll: true });
});

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
    list.innerHTML = results.map((entry, i) => renderResult(entry, `${prefix}-${i}`)).join('');
    items = [...list.querySelectorAll<HTMLElement>('[role="option"]')];
    list.hidden = results.length === 0;
    input.setAttribute('aria-expanded', String(results.length > 0));
    setActive(results.length ? 0 : -1);
    if (status) {
      status.textContent = results.length
        ? `${results.length} ${results.length === 1 ? 'result' : 'results'}. Use the arrow keys to choose, Enter to open.`
        : `No results for “${query.trim()}”. Try a barangay, a year or a topic such as “income”.`;
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
      const link = items[active]?.querySelector('a');
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
  list.addEventListener('click', () => onGo?.());
  return { run };
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
  const { run } = attachSearch(input, list, status);
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
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
    if (list.children.length) {
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
