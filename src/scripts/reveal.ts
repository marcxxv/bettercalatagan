/* Keep filtering immediate; this short reveal only softens the visual change. */
export function revealFilteredResults(node: HTMLElement): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (const animation of node.getAnimations()) {
    if (animation.id === 'filter-reveal') animation.cancel();
  }
  const animation = node.animate(
    [{ opacity: 0.65, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }],
    { duration: 220, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  );
  animation.id = 'filter-reveal';
}
