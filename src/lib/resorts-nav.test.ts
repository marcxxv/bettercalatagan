import { expect, it } from 'vitest';
import { NAV_GROUPS, PAGES } from './site';

it('places the resort safety guide in Services and exposes it once across site navigation', () => {
  const services = NAV_GROUPS.find((group) => group.label === 'Services');
  expect(services?.items.some((item) => item.href === '/resorts')).toBe(true);
  expect(PAGES.filter((item) => item.href === '/resorts')).toHaveLength(1);
  expect(services?.items.find((item) => item.href === '/resorts')).toMatchObject({ label: 'Resorts & booking tips', icon: 'umbrella' });
});
