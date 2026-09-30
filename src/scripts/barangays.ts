/**
 * The barangay explorer: sortable columns, a name/code search, and a
 * Poblacion filter. Without JavaScript the table is complete and alphabetical.
 */
const table = document.querySelector<HTMLTableElement>('table[data-sortable]');
const tbody = table?.tBodies[0];
if (table && tbody) {
  const rows = [...tbody.rows];
  const search = document.querySelector<HTMLInputElement>('#brgy-search');
  const count = document.querySelector<HTMLElement>('[data-brgy-count]');
  const empty = document.querySelector<HTMLElement>('[data-brgy-empty]');
  const views = [...document.querySelectorAll<HTMLInputElement>('input[name="brgy-view"]')];
  const headers = [...table.querySelectorAll<HTMLTableCellElement>('th[data-sort]')];

  let sortKey = 'name';
  let ascending = true;

  const value = (row: HTMLTableRowElement, key: string): string | number =>
    key === 'name' ? (row.dataset.name ?? '') : Number(row.dataset[key] ?? 0);

  function sort() {
    const sorted = [...rows].sort((a, b) => {
      const va = value(a, sortKey);
      const vb = value(b, sortKey);
      const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
      return ascending ? cmp : -cmp;
    });
    tbody!.append(...sorted);
    for (const th of headers) {
      if (th.dataset.sort === sortKey) th.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
      else th.removeAttribute('aria-sort');
    }
  }

  function filter() {
    const q = (search?.value ?? '').trim().toLowerCase();
    const view = views.find((v) => v.checked)?.value ?? 'all';
    let shown = 0;
    for (const row of rows) {
      const matchesView =
        view === 'all' || (view === 'pob' ? row.dataset.pob === '1' : row.dataset.pob === '0');
      const ok = matchesView && (!q || (row.dataset.search ?? '').includes(q));
      row.hidden = !ok;
      if (ok) shown += 1;
    }
    if (count) count.textContent = shown === rows.length ? `All ${rows.length} barangays` : `${shown} of ${rows.length} barangays`;
    if (empty) empty.hidden = shown !== 0;
  }

  for (const th of headers) {
    th.querySelector('button')?.addEventListener('click', () => {
      const key = th.dataset.sort ?? 'name';
      if (key === sortKey) ascending = !ascending;
      else {
        sortKey = key;
        // Names read best A–Z; numbers are most useful largest first.
        ascending = key === 'name';
      }
      sort();
    });
  }
  search?.addEventListener('input', filter);
  for (const v of views) v.addEventListener('change', filter);

  // Arriving from search with ?barangay=Name: highlight and scroll to the row.
  const wanted = new URLSearchParams(location.search).get('barangay');
  if (wanted) {
    const row = rows.find((r) => r.dataset.name === wanted.toLowerCase());
    if (row) {
      row.classList.add('is-hit');
      requestAnimationFrame(() => row.scrollIntoView({ block: 'center' }));
    }
  }
  filter();
}
