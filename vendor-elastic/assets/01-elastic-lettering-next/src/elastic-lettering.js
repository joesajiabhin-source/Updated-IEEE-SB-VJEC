import { normalize } from './configuration.js';
import { glyphs } from './glyphs.js';
const NS = 'http://www.w3.org/2000/svg';
const element = (name, attrs = {}) => {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
};
export function mountElasticLettering(host, input = {}) {
  if (!host?.append) throw new TypeError('A mount element is required.');
  let options = normalize(input);
  let disposed = false;
  let frame = 0;
  let previous = 0;
  let elapsed = 0;
  let pointer = null;
  let letters = [];
  let totalWidth = 1;
  let selected = -1;
  let entrance = true;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const events = new AbortController();
  const root = document.createElement('div');
  root.className = 'elastic-lettering';
  root.tabIndex = 0;
  root.setAttribute('role', 'group');
  const accessible = document.createElement('span');
  accessible.className = 'el__accessible';
  const svg = element('svg', { class: 'el__surface', 'aria-hidden': 'true', preserveAspectRatio: 'none' });
  root.append(accessible, svg);
  host.append(root);

  function build() {
    svg.replaceChildren();
    letters = [];
    let x = 14;
    const segments = typeof Intl.Segmenter === 'function'
      ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(options.text)].map(item => item.segment)
      : Array.from(options.text);
    for (const character of segments) {
      if (character === ' ') { x += 42; continue; }
      const upper = character.toUpperCase();
      const width = upper === 'I' || upper === '!' || upper === '.' ? 32 : /[MW]/.test(upper) ? 130 : 100;
      const offset = width === 32 ? -34 : 0;
      const group = element('g');
      svg.append(group);
      const paths = [];
      if (glyphs[upper]) {
        for (const d of glyphs[upper]) {
          const path = element('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': 28, 'stroke-linejoin': 'round' });
          group.append(path);
          const length = path.getTotalLength();
          const points = Array.from({ length: 81 }, (_, i) => {
            const point = path.getPointAtLength(length * i / 80);
            return { x: point.x + offset, y: point.y };
          });
          paths.push({ path, points });
        }
      } else {
        // Preserve arbitrary Unicode text without inventing a replacement glyph.
        const text = element('text', { x: 0, y: 390, textLength: 100, lengthAdjust: 'spacingAndGlyphs', fill: 'currentColor', 'font-family': 'sans-serif', 'font-weight': 900, 'font-size': 440 });
        text.textContent = character;
        group.append(text);
      }
      letters.push({ character, x, width, group, paths, pull: 0, velocity: 0 });
      x += width + 2;
    }
    totalWidth = x + 5;
    svg.setAttribute('viewBox', `0 0 ${totalWidth} 560`);
    root.setAttribute('aria-label', `${options.text}. Move across letters to stretch them. Arrow keys choose a letter; Enter stretches it.`);
    accessible.textContent = options.text;
    elapsed = 0;
    entrance = !media.matches;
    selected = -1;
    pointer = null;
    resize();
    draw();
    wake();
  }
  function resize() {
    const bounds = host.getBoundingClientRect();
    const width = Math.max(1, Math.min(options.width, bounds.width * 0.94));
    const height = Math.max(1, Math.min(options.height, bounds.height * 0.94));
    svg.style.width = `${width}px`;
    svg.style.height = `${height}px`;
    root.style.setProperty('--el-ink', options.ink);
  }
  function draw() {
    for (const [index, letter] of letters.entries()) {
      const time = Math.max(0, elapsed - index * options.stagger / 1000);
      const reveal = !entrance || media.matches ? 1 : time === 0 ? 0 : 1 - Math.exp(-7 * time) * (Math.cos(12 * time) + 0.58 * Math.sin(12 * time));
      letter.group.style.opacity = time === 0 && entrance ? '0' : '1';
      letter.group.setAttribute('transform', `translate(${letter.x} ${22 + (1 - reveal) * 60}) scale(1 ${Math.max(0.01, reveal)})`);
      for (const { path, points } of letter.paths) {
        const d = points.map((point, i) => {
          const t = point.y / 400;
          const waist = Math.sin(Math.PI * t) * Math.max(0, letter.pull) * 0.2;
          const x = letter.width / 2 + (point.x - letter.width / 2) * (1 - waist);
          const y = point.y + letter.pull * 110 * Math.pow(t, 1.65);
          return `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
        }).join('');
        path.setAttribute('d', d);
      }
      if (!letter.paths.length) letter.group.firstChild.setAttribute('transform', `scale(1 ${1 + letter.pull * 0.275})`);
    }
  }
  function tick(now) {
    frame = 0;
    if (disposed) return;
    const dt = previous ? Math.min((now - previous) / 1000, 0.032) : 1 / 60;
    previous = now;
    elapsed += dt;
    let moving = entrance && elapsed < (letters.length - 1) * options.stagger / 1000 + 1.5;
    if (!moving) entrance = false;
    const damping = 25 - options.bounce * 15;
    for (const letter of letters) {
      const center = letter.x + letter.width / 2;
      const influence = pointer === null ? 0 : Math.max(0, 1 - Math.abs(pointer - center) / (letter.width * 0.8));
      const target = media.matches ? 0 : influence * options.stretch;
      // Small semi-implicit steps keep spring motion stable after slow frames.
      const steps = Math.ceil(dt / 0.008);
      for (let i = 0; i < steps; i++) {
        const step = dt / steps;
        letter.velocity += ((target - letter.pull) * 190 - letter.velocity * damping) * step;
        letter.pull += letter.velocity * step;
      }
      if (Math.abs(letter.pull - target) < 0.0001 && Math.abs(letter.velocity) < 0.001) {
        letter.pull = target;
        letter.velocity = 0;
      } else moving = true;
    }
    draw();
    if (moving) frame = requestAnimationFrame(tick);
    else previous = 0;
  }
  function wake() {
    if (!disposed && !frame) frame = requestAnimationFrame(tick);
  }
  function release() {
    pointer = null;
    wake();
  }
  function move(event) {
    if (media.matches) return;
    const bounds = svg.getBoundingClientRect();
    pointer = (event.clientX - bounds.left) / bounds.width * totalWidth;
    wake();
  }
  root.addEventListener('pointermove', move, { signal: events.signal, passive: true });
  root.addEventListener('pointerdown', move, { signal: events.signal, passive: true });
  root.addEventListener('pointerleave', release, { signal: events.signal });
  root.addEventListener('pointerup', event => { if (event.pointerType !== 'mouse') release(); }, { signal: events.signal });
  root.addEventListener('pointercancel', release, { signal: events.signal });
  root.addEventListener('blur', release, { signal: events.signal });
  root.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      selected = (selected + (event.key === 'ArrowRight' ? 1 : -1) + letters.length) % letters.length;
      const letter = letters[selected];
      pointer = letter.x + letter.width / 2;
      wake();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const letter = letters[Math.max(0, selected)];
      pointer = letter.x + letter.width / 2;
      wake();
    } else if (event.key === 'Escape') release();
  }, { signal: events.signal });
  root.addEventListener('keyup', event => {
    if (['Enter', ' ', 'ArrowRight', 'ArrowLeft'].includes(event.key)) release();
  }, { signal: events.signal });
  function reduced() {
    entrance = false;
    pointer = null;
    for (const letter of letters) { letter.pull = 0; letter.velocity = 0; }
    draw();
    wake();
  }
  media.addEventListener('change', reduced);
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  build();
  return {
    ready: Promise.resolve(),
    update(next = {}) {
      if (disposed) return Promise.reject(new Error('Component has been destroyed.'));
      const oldText = options.text;
      options = normalize({ ...options, ...next });
      if (options.text !== oldText) build();
      else { resize(); draw(); wake(); }
      return Promise.resolve();
    },
    replay() {
      if (disposed) return;
      elapsed = 0;
      entrance = !media.matches;
      for (const letter of letters) { letter.pull = 0; letter.velocity = 0; }
      release();
      draw();
    },
    release,
    getState() {
      return { ready: !disposed, options: { ...options }, reducedMotion: media.matches, entering: entrance, active: frame !== 0, pointerInside: pointer !== null,
        letters: letters.map(({ character, x, width, pull, velocity }) => ({ character, x, width, pull, velocity })), totalWidth };
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      events.abort();
      observer.disconnect();
      media.removeEventListener('change', reduced);
      cancelAnimationFrame(frame);
      frame = 0;
      root.remove();
    },
  };
}
