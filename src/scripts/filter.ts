/**
 * Filterable lists: a form of named fields narrows a list of items in place.
 *
 * - A field named `q` matches the item's `data-search` text; any other field
 *   named N must equal the item's `data-N`.
 * - Filters are mirrored into the URL (?form=…&year=…), so a filtered view can
 *   be bookmarked or shared, and arriving with parameters applies them.
 * - Active filters appear as removable pills; any element with
 *   `data-set-filter="name=value"` (a chart cell, a chip) applies a filter.
 *
 * Without JavaScript every item is listed and the form is hidden.
 */

const escapeCss = (value: string) => ('escape' in CSS ? CSS.escape(value) : value.replace(/"/g, '\\"'));

for (const form of document.querySelectorAll<HTMLFormElement>('form[data-filter]')) {
  const found = document.getElementById(form.dataset.filter ?? '');
  if (!found) continue;
  const list: HTMLElement = found;
  const items = [...list.querySelectorAll<HTMLElement>('[data-item]')];
  const noun = form.dataset.noun ?? 'items';
  const count = document.querySelector<HTMLElement>(`[data-count-for="${list.id}"]`);
  const empty = document.querySelector<HTMLElement>(`[data-empty-for="${list.id}"]`);
  const pills = document.querySelector<HTMLElement>(`[data-pills-for="${list.id}"]`);
  const fields = [...form.elements].filter(
    (el): el is HTMLInputElement | HTMLSelectElement =>
      (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) && Boolean(el.name),
  );
  const total = items.length;

  const labelFor = (field: HTMLInputElement | HTMLSelectElement) => {
    const label = form.querySelector(`label[for="${escapeCss(field.id)}"]`)?.textContent?.trim() ?? field.name;
    if (field instanceof HTMLSelectElement) {
      const text = field.selectedOptions[0]?.textContent?.replace(/\s*\(\d+\)\s*$/, '').trim() ?? field.value;
      return `${label}: ${text}`;
    }
    return `${label}: “${field.value}”`;
  };

  function apply(updateUrl = true) {
    const active = fields.filter((f) => f.value.trim() !== '');
    const q = (active.find((f) => f.name === 'q')?.value ?? '').trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const item of items) {
      let ok = terms.every((t) => (item.dataset.search ?? '').includes(t));
      if (ok) {
        for (const f of active) {
          if (f.name === 'q') continue;
          if (item.dataset[f.name] !== f.value) {
            ok = false;
            break;
          }
        }
      }
      item.hidden = !ok;
      if (ok) shown += 1;
    }

    if (count) {
      count.innerHTML =
        shown === total
          ? `Showing all <strong>${total}</strong> ${noun}`
          : `Showing <strong>${shown}</strong> of ${total} ${noun}`;
    }
    if (empty) empty.hidden = shown !== 0;

    if (pills) {
      pills.replaceChildren(
        ...active.map((f) => {
          const li = document.createElement('li');
          const button = document.createElement('button');
          button.type = 'button';
          button.innerHTML = `<span></span><span aria-hidden="true">×</span>`;
          button.firstElementChild!.textContent = labelFor(f);
          button.setAttribute('aria-label', `Remove filter ${labelFor(f)}`);
          button.addEventListener('click', () => {
            f.value = '';
            apply();
            f.focus();
          });
          li.append(button);
          return li;
        }),
      );
      if (active.length > 1) {
        const li = document.createElement('li');
        const clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'clear-all';
        clear.textContent = 'Clear all';
        clear.addEventListener('click', () => {
          form.reset();
          setTimeout(() => apply(), 0);
        });
        li.append(clear);
        pills.append(li);
      }
    }

    // Keep "selected" state on any external filter controls (e.g. heatmap cells).
    for (const trigger of document.querySelectorAll<HTMLElement>(`[data-set-filter][data-for="${list.id}"]`)) {
      const pairs = (trigger.dataset.setFilter ?? '').split('&').map((p) => p.split('='));
      const on = pairs.every(([k, v]) => fields.find((f) => f.name === k)?.value === v);
      trigger.setAttribute('aria-pressed', String(on));
    }

    if (updateUrl) {
      const params = new URLSearchParams(location.search);
      for (const f of fields) {
        if (f.value.trim()) params.set(f.name, f.value.trim());
        else params.delete(f.name);
      }
      const qs = params.toString();
      history.replaceState(null, '', `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`);
    }
  }

  // Arriving with parameters.
  const params = new URLSearchParams(location.search);
  let fromUrl = false;
  for (const f of fields) {
    const v = params.get(f.name);
    if (v !== null) {
      if (f instanceof HTMLSelectElement && ![...f.options].some((o) => o.value === v)) continue;
      f.value = v;
      fromUrl = true;
    }
  }

  let timer = 0;
  form.addEventListener('input', (event) => {
    if ((event.target as HTMLInputElement).name === 'q') {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => apply(), 120);
    } else apply();
  });
  form.addEventListener('change', () => apply());
  form.addEventListener('reset', () => setTimeout(() => apply(), 0));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    apply();
  });

  for (const trigger of document.querySelectorAll<HTMLElement>(`[data-set-filter][data-for="${list.id}"]`)) {
    trigger.addEventListener('click', () => {
      const pairs = (trigger.dataset.setFilter ?? '').split('&').map((p) => p.split('='));
      const already = trigger.getAttribute('aria-pressed') === 'true';
      for (const [k, v] of pairs) {
        const f = fields.find((x) => x.name === k);
        if (f) f.value = already ? '' : v;
      }
      apply();
      if (!already) form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  apply(fromUrl);
  form.hidden = false;
}
