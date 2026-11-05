/**
 * The municipal seal, struck as a two-sided medallion (components/RotatingSeal.astro).
 *
 * A real cylinder, not a flat picture pretending to turn: a gold body with a
 * bevelled bezel, milled marks along the edge and the seal printed on both
 * faces, lit by a small studio environment. Loaded only when the figure is
 * about to scroll into view; the server-rendered still stays in place until
 * then, and stays for good if WebGL is unavailable or the reader asks for
 * reduced motion.
 *
 * Drag to turn it; double-click to turn it over. No network
 * request is made after the page loads — the artwork is a bundled asset.
 */
import {
  ACESFilmicToneMapping,
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  TorusGeometry,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const SEAL_URL = '/images/calatagan-seal-face.webp';
const RADIUS = 2.16;
const THICKNESS = 0.36;
/** Radians per pixel of horizontal drag. */
const DRAG_SPEED = 0.009;
const REST_PITCH = -0.055;

export function initSeal() {
  const stage = document.querySelector<HTMLElement>('[data-seal]');
  if (!stage) return;
  const still = stage.querySelector<HTMLElement>('[data-seal-still]');

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return; // The still survives; nothing to do.
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearAlpha(0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.outputColorSpace = SRGBColorSpace;
  stage.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 80);
  camera.position.set(0, 0.08, 7.4);

  const ambient = new HemisphereLight(0xffffff, 0x4b5670, 0.9);
  scene.add(ambient);

  const key = new DirectionalLight(0xfff3dc, 3.1);
  key.position.set(-4.5, 6.5, 7);
  scene.add(key);

  const fill = new DirectionalLight(0xc8d8f2, 1.15);
  fill.position.set(5, 2, 5);
  scene.add(fill);

  const rim = new DirectionalLight(0xffd98a, 1.8);
  rim.position.set(0, 4, -7);
  scene.add(rim);

  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;

  const coin = new Group();
  scene.add(coin);

  const gold = new MeshStandardMaterial({ color: 0xbf9550, metalness: 0.82, roughness: 0.27 });
  const goldDeep = new MeshStandardMaterial({ color: 0x8a642d, metalness: 0.78, roughness: 0.34 });

  const body = new Mesh(new CylinderGeometry(RADIUS, RADIUS, THICKNESS, 128, 1, false), gold);
  body.rotation.x = Math.PI / 2;
  coin.add(body);

  // A recessed bed keeps the printed seal slightly below the raised bezel.
  const bed = new Mesh(
    new CylinderGeometry(RADIUS - 0.075, RADIUS - 0.075, THICKNESS + 0.012, 128),
    new MeshStandardMaterial({ color: 0xf1eadc, roughness: 0.72, metalness: 0.02 }),
  );
  bed.rotation.x = Math.PI / 2;
  coin.add(bed);

  // The seal is printed artwork, not a lit surface: a basic material keeps the
  // supplied colours exact and lets the gold body carry the depth.
  const faceMaterial = new MeshBasicMaterial({ color: 0xffffff, transparent: true, alphaTest: 0.02, toneMapped: false });
  const faceGeometry = new CircleGeometry(RADIUS - 0.085, 128);

  for (const side of [1, -1]) {
    const face = new Mesh(faceGeometry, faceMaterial);
    face.position.z = side * (THICKNESS / 2 + 0.012);
    if (side < 0) face.rotation.y = Math.PI;
    coin.add(face);
  }

  for (const z of [THICKNESS / 2 + 0.006, -THICKNESS / 2 - 0.006]) {
    const bezel = new Mesh(new TorusGeometry(RADIUS - 0.055, 0.042, 18, 160), gold);
    bezel.position.z = z;
    coin.add(bezel);

    const inner = new Mesh(new TorusGeometry(RADIUS - 0.11, 0.012, 10, 160), goldDeep);
    inner.position.z = z;
    coin.add(inner);
  }

  // Milled marks along the edge, so the medal reads as struck metal.
  const mill = new BoxGeometry(0.012, 0.018, THICKNESS * 0.7);
  for (let index = 0; index < 96; index += 1) {
    const angle = (index / 96) * Math.PI * 2;
    const mark = new Mesh(mill, goldDeep);
    mark.position.set(Math.cos(angle) * (RADIUS + 0.001), Math.sin(angle) * (RADIUS + 0.001), 0);
    mark.rotation.z = angle;
    coin.add(mark);
  }

  coin.rotation.x = REST_PITCH;

  const loader = new TextureLoader();
  loader.load(
    SEAL_URL,
    (texture) => {
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      faceMaterial.map = texture;
      faceMaterial.needsUpdate = true;
      still?.setAttribute('hidden', '');
      stage.dataset.ready = 'true';
      if (reduce) render(performance.now());
    },
    undefined,
    () => {
      /* Keep the still if the texture cannot load. */
    },
  );

  /* ---------------------------------------------------------------- */
  /* turning                                                            */
  /* ---------------------------------------------------------------- */

  /** One slow turn every 24 seconds, as the CSS version did. */
  const SPIN = (Math.PI * 2) / 24;

  let spin = 0; // the slow automatic turn
  let yawFrom = 0; // where a drag (or a flip) left it
  let yaw = 0;
  let targetYaw = 0;
  let pitch = REST_PITCH;
  let targetPitch = REST_PITCH;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let releaseAt = 0;
  let hover = 0;
  let paused = false;
  let previous = 0;

  const clampPitch = (value: number) => MathUtils.clamp(value, -0.55, 0.55);

  stage.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('is-dragging');
  });

  stage.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    yawFrom += dx * DRAG_SPEED;
    targetYaw = spin + yawFrom;
    targetPitch = clampPitch(targetPitch + dy * 0.004);
    if (reduce) render(performance.now());
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    releaseAt = performance.now();
    stage.classList.remove('is-dragging');
  };

  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('pointerleave', () => {
    if (dragging) endDrag();
    hover = 0;
  });
  stage.addEventListener('pointerenter', () => {
    hover = 1;
  });

  const turnOver = () => {
    // The same face is printed on both sides, so a half-turn keeps the
    // lettering the right way up.
    yawFrom += Math.PI;
    targetYaw = spin + yawFrom;
    if (reduce) {
      yaw = targetYaw;
      render(performance.now());
    }
  };

  stage.addEventListener('dblclick', turnOver);

  /** Optional pause control: the figure ships without one (the turn is ambient), but any [data-seal-spin] button is honoured. */
  const pauseButtons = document.querySelectorAll<HTMLElement>('[data-seal-spin]');
  const setPaused = (value: boolean) => {
    paused = value;
    for (const button of pauseButtons) {
      button.setAttribute('aria-pressed', String(value));
      const label = button.dataset.sealSpinLabel || '';
      const other = button.dataset.sealSpinResume || '';
      button.textContent = value ? other : label;
    }
    if (value) releaseAt = performance.now();
  };
  for (const button of pauseButtons) {
    button.addEventListener('click', () => setPaused(!paused));
  }

  const applyTheme = () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    renderer.toneMappingExposure = dark ? 0.92 : 1.04;
    ambient.intensity = dark ? 0.74 : 0.9;
    key.intensity = dark ? 2.8 : 3.1;
    fill.intensity = dark ? 0.95 : 1.15;
    rim.intensity = dark ? 2.2 : 1.8;
  };

  applyTheme();
  const themeWatcher = new MutationObserver(applyTheme);
  themeWatcher.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------------------------------------------------------------- */
  /* fit and draw                                                       */
  /* ---------------------------------------------------------------- */

  function fit() {
    const width = stage!.clientWidth;
    const height = stage!.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // Back the camera off far enough for the whole medal, with air for the
    // bezel and the tilt.
    const vertical = MathUtils.degToRad(camera.fov);
    const half = Math.tan(vertical / 2);
    const desired = Math.max((RADIUS + 0.39) / half, (RADIUS + 0.39) / (half * camera.aspect));
    camera.position.z = Math.min(9.5, desired * 1.06);
    camera.updateProjectionMatrix();
  }

  const startedAt = performance.now();
  let visible = true;
  const observer = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
  });
  observer.observe(stage);

  let scrollRatio = 0;
  const readScroll = () => {
    const rect = stage.getBoundingClientRect();
    scrollRatio = Math.min(1, Math.max(0, 1 - (rect.top + rect.height) / (window.innerHeight + rect.height)));
  };
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  function render(now: number) {
    const t = (now - startedAt) / 1000;
    const dt = previous ? Math.min(0.05, (now - previous) / 1000) : 0;
    previous = now;
    const idle = now - releaseAt > 3400;

    if (!reduce) {
      // One slow, steady turn, easing back in after a drag and slowing while
      // the pointer rests on the seal so the lettering can be read.
      const resume = Math.min(1, Math.max(0, (now - releaseAt - 700) / 1600));
      if (!dragging && !paused) spin += dt * SPIN * resume * (hover ? 0.25 : 1);
      targetYaw = spin + yawFrom + hover * 0.06;
      if (!dragging) targetPitch = REST_PITCH + scrollRatio * 0.08 - 0.02 * hover;
    }

    const ease = reduce ? 1 : 1 - Math.exp(-8 * dt);
    yaw += (targetYaw - yaw) * ease;
    pitch += (targetPitch - pitch) * ease;

    coin.rotation.y = yaw;
    coin.rotation.x = pitch;
    coin.position.y = (reduce ? 0 : Math.sin(t * 0.6) * 0.045) - scrollRatio * 0.16;
    coin.position.x = reduce ? 0 : Math.sin(t * 0.24) * 0.025;

    // A barely-there drift of the camera keeps the highlight moving.
    if (!reduce && idle) camera.position.x = Math.sin(t * 0.21) * 0.06;
    else camera.position.x += (0 - camera.position.x) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  let frame = 0;
  function loop(now: number) {
    if (visible) render(now);
    frame = requestAnimationFrame(loop);
  }

  fit();
  new ResizeObserver(() => {
    fit();
    if (reduce) render(performance.now());
  }).observe(stage);
  render(startedAt);

  if (!reduce) {
    frame = requestAnimationFrame(loop);
    window.addEventListener(
      'pagehide',
      () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        themeWatcher.disconnect();
        pmrem.dispose();
        environment.dispose();
        renderer.dispose();
      },
      { once: true },
    );
  }
}
