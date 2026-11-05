/**
 * Loads the struck seal (lib/seal3d.ts) only when it is about to be seen.
 *
 * The figure ships as a still image, so a reader without JavaScript, without
 * WebGL, or with reduced motion keeps a complete seal. three.js arrives on
 * demand, as a separate chunk, when the figure nears the viewport.
 */
const stage = document.querySelector<HTMLElement>('[data-seal]');

if (stage) {
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    import('../lib/seal3d')
      .then((module) => module.initSeal())
      .catch(() => {
        /* The still stays; nothing else to do. */
      });
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        start();
      },
      { rootMargin: '250px' },
    );
    observer.observe(stage);
  } else {
    start();
  }
}
