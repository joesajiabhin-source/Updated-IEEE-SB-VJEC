"use client";

import { useEffect, useRef } from "react";

/**
 * Hidden artwork layer — the four pencil illustrations kept from the
 * supplied IEEE artwork sheet (satellite, circuit, astronaut, campus — the
 * planet, the gear, the communication tower and the IEEE-logo emblem were
 * all dropped at the user's request; the IEEE mark itself lives on as the
 * liquid diamond riding the VJEC wordmark) live in a layer
 * UNDER the hero's main composition, fully invisible in the pristine
 * first impression. The whitespace itself is the canvas: as the cursor
 * approaches a zone a soft liquid membrane — feathered CSS mask blobs
 * that trail the cursor like droplets, over a spreading blue ink halo —
 * begins to open and the artwork emerges through it, with a few faint
 * blue dust particles drifting off the cursor and settling into the art.
 *
 * Crossing into a zone's body commits the discovery: the reveal completes
 * on its own (roughly 0.7–1.4s), settles, and PERSISTS for the page
 * session (sessionStorage) — exploring gradually populates the margins
 * with the collection. The pieces sit in the reference mockup's own
 * arrangement and are intentionally generous in size now (the shrunken
 * VJEC wordmark freed the margins for them), yet every placement stays
 * clear of the wordmark's face, the statistics rail and the navbar — the
 * layer itself always sits behind the main content.
 *
 * Desktop: proximity hover (liquid). Touch/tablet: tap a zone (liquid
 * from the tap point). Keyboard: invisible focus targets reveal on
 * focus. prefers-reduced-motion: a plain soft crossfade, no fluid
 * motion, no particles. Everything is lazy — no rAF loop, no canvas
 * work, nothing at all while the page is idle or scrolled away. The
 * assets themselves are the high-resolution individual illustrations
 * supplied by the user (rendered at ~2x their largest display size for
 * retina), and each zone carries a faint twinkling sparkle hint that
 * marks where a piece sleeps — dissolving permanently once found.
 */

/* Zone geometry — the FOUR pieces that remain: satellite top-right,
   circuit bottom-left, the astronaut centred in the bottom gap between
   the circuit and the campus buildings, campus bottom-right. The
   earth-saturn-rings planet, the communication tower, the gear AND the
   IEEE-logo emblem artwork are all REMOVED (the user asked for the IEEE
   logo to be gone from the reveal entirely — its only presence now is the
   liquid diamond integrated into the VJEC wordmark, see liquid-logo.tsx).
   Sizes are generous fractions of the hero width with min/max
   clamps so they scale up on wide screens without crowding. The satellite's
   resting tilt is baked into its PNG, so the liquid-mask math stays exact.
   Phone zones sit in the phone's safe bands (top band above the heading,
   bottom band below the statistics; circuit/campus are desktop-only so the
   small screen stays uncluttered). Tablets keep the compact side band set.
   Each art also carries a tiny sparkle hint (see .ha-hint) marking its spot
   on the pristine page. */
const ARTS: ArtDef[] = [
  { id: "satellite", src: "/art/satellite.png", srcM: "/art/satellite-m.png", label: "Hidden artwork — satellite", aspect: 1.475, w: { min: 210, frac: 0.17, max: 360 }, cx: 0.82, cy: 0.19, minW: 1024, minH: 0, mobile: { w: 88, cx: 0.8, cyPx: 115, minH: 760 }, tablet: { w: 96, cx: 0.83, cyF: 0.84, minH: 660 } },
  { id: "circuit", src: "/art/circuit.png", label: "Hidden artwork — circuit design", aspect: 2.055, w: { min: 300, frac: 0.3, max: 500 }, cx: 0.13, cy: 0.86, minW: 1024, minH: 560 },
  { id: "astronaut", src: "/art/astronaut.png", srcM: "/art/astronaut-m.png", label: "Hidden artwork — astronaut", aspect: 1.377, w: { min: 120, frac: 0.1, max: 175 }, cx: 0.44, cy: 0.9, minW: 1024, minH: 0, mobile: { w: 64, cx: 0.5, cyF: 0.955, minH: 700 } },
  { id: "campus", src: "/art/campus.png", label: "Hidden artwork — the VJEC campus", aspect: 3.307, w: { min: 360, frac: 0.4, max: 660 }, cx: 0.78, cy: 0.88, minW: 1024, minH: 560 },
];

const SESSION_KEY = "vjec-hidden-art-v1";
const DUST_MAX = 90;

type MobileDef = { w: number; cx: number; cyPx?: number; cyF?: number; minH: number };
type TabletDef = { w: number; cx: number; cyF: number; minH: number };
type ArtDef = {
  id: string;
  src: string;
  srcM?: string;
  label: string;
  aspect: number;
  /* desktop width: a fraction of the hero width, clamped between min/max
     so the pieces grow with the viewport without ever crowding it */
  w: { min: number; frac: number; max: number };
  cx: number;
  cy: number;
  minW: number;
  minH: number;
  mobile?: MobileDef;
  /* tablets (640–1023px) have no top band — the navbar bar and the
     heading consume it — so their zones live beside the stats stack */
  tablet?: TabletDef;
};

type Dust = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  r: number;
  a: number;
  c: string;
};

type ArtState = {
  def: ArtDef;
  el: HTMLElement;
  img: HTMLImageElement;
  visible: boolean;
  cx: number;
  cy: number;
  w: number;
  h: number;
  R: number;
  coverR: number;
  energy: number;
  committed: boolean;
  discovered: boolean;
  settled: boolean;
  settleT: number;
  mx: number;
  my: number;
  dx: number;
  dy: number;
  tx: number;
  ty: number;
  phase: number;
  lastVars: string[];
};

export function HiddenDiscoveries() {
  const layerRef = useRef<HTMLDivElement>(null);
  const dustRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const dust = dustRef.current;
    if (!layer || !dust) return;
    const hero = layer.closest("section") as HTMLElement | null;
    if (!hero) return;
    const ctx = dust.getContext("2d");
    if (!ctx) return;

    const reducedMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reducedMQ.matches;

    const states: ArtState[] = [];
    for (const el of Array.from(layer.querySelectorAll<HTMLElement>(".ha-art"))) {
      const def = ARTS.find((x) => x.id === el.dataset.art);
      if (!def) continue;
      states.push({
        def,
        el,
        img: el.querySelector("img") as HTMLImageElement,
        visible: false,
        cx: 0, cy: 0, w: 0, h: 0, R: 0, coverR: 0,
        energy: 0,
        committed: false,
        discovered: false,
        settled: false,
        settleT: 0,
        mx: 0, my: 0, dx: 0, dy: 0, tx: 0, ty: 0,
        phase: Math.random() * 6.28,
        lastVars: [],
      });
    }

    /* ---- geometry (recomputed on resize) ---- */
    let W = 0;
    let H = 0;
    function layout() {
      W = hero.clientWidth;
      H = hero.clientHeight;
      /* phones AND tablets share the compact tap-band experience (tablets
         transition to touch/tap rather than hover); desktops (≥1024px)
         get the full four-zone hover layout */
      const compact = W < 1024;
      const isTablet = compact && W >= 640;
      for (const s of states) {
        const d = s.def;
        const t = isTablet ? d.tablet : undefined;
        const m = compact && !t ? d.mobile : undefined;
        const w = t
          ? t.w
          : m
            ? m.w
            : Math.min(Math.max(d.w.min, W * d.w.frac), d.w.max);
        const natural = s.img.naturalWidth / (s.img.naturalHeight || 1);
        const h = w / (natural > 0.05 ? natural : d.aspect);
        let cx: number;
        let cy: number;
        let ok: boolean;
        if (t) {
          cx = t.cx * W;
          cy = t.cyF * H;
          ok = H >= t.minH;
        } else if (m) {
          cx = m.cx * W;
          cy = m.cyF ? m.cyF * H : m.cyPx!;
          ok = H >= m.minH;
        } else {
          cx = d.cx * W;
          cy = d.cy * H;
          ok = !compact && W >= d.minW && H >= d.minH;
        }
        cx = Math.min(Math.max(cx, w / 2 + 6), W - w / 2 - 6);
        cy = Math.min(Math.max(cy, h / 2 + 8), H - h / 2 - 8);
        Object.assign(s, { visible: ok, w, h, cx, cy });
        s.R = Math.hypot(w, h) / 2 + (compact ? 62 : 92);
        s.coverR = Math.hypot(w, h) / 2 + 6;
        s.el.style.display = ok ? "block" : "none";
        s.el.style.width = `${w}px`;
        s.el.style.left = `${cx}px`;
        s.el.style.top = `${cy}px`;
        const key = document.querySelector<HTMLElement>(`.ha-key[data-key="${d.id}"]`);
        if (key) {
          key.style.display = ok ? "block" : "none";
          key.style.left = `${cx - w / 2}px`;
          key.style.top = `${cy - h / 2}px`;
          key.style.width = `${w}px`;
          key.style.height = `${h}px`;
        }
      }
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dust.width = Math.round(W * dpr);
      dust.height = Math.round(H * dpr);
      dust.style.width = `${W}px`;
      dust.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
    }

    /* ---- restore discoveries from this page session ---- */
    let foundIds: string[] = [];
    try {
      foundIds = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
    } catch {
      foundIds = [];
    }
    for (const s of states) {
      if (foundIds.includes(s.def.id)) {
        s.discovered = true;
        s.committed = true;
        s.settled = true;
        s.energy = 1;
        s.el.classList.add("is-found", "is-restored");
      }
    }

    /* ---- interaction state ---- */
    const ptr = { x: -9999, y: -9999, inside: false, vx: 0, vy: 0, t: 0, lastMove: -1e9 };
    let particles: Dust[] = [];
    let raf = 0;
    let lastT = performance.now();
    let heroOn = true;
    let lastAmbient = 0;

    const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
    const dist = (x: number, y: number, s: ArtState) => Math.hypot(x - s.cx, y - s.cy);

    function saveSession() {
      try {
        sessionStorage.setItem(
          SESSION_KEY,
          JSON.stringify(states.filter((s) => s.discovered).map((s) => s.def.id))
        );
      } catch {
        /* private mode — discoveries just won't persist */
      }
    }

    function revealNow(s: ArtState) {
      s.discovered = true;
      s.committed = true;
      s.settled = true;
      s.energy = 1;
      s.el.classList.add("is-found");
      saveSession();
    }

    function spawnDust(x: number, y: number, n: number, alpha: number, spread: number, drift: number) {
      for (let i = 0; i < n && particles.length < DUST_MAX; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * spread,
          y: y + (Math.random() - 0.5) * spread,
          vx: drift * (Math.random() - 0.5) + ptr.vx * 0.05,
          vy: drift * (Math.random() - 0.5) + ptr.vy * 0.05 - 10,
          age: 0,
          life: 0.7 + Math.random() * 0.8,
          r: 0.7 + Math.random() * 1.7,
          a: alpha * (0.6 + Math.random() * 0.4),
          c: Math.random() < 0.5 ? "76,147,194" : "0,98,155",
        });
      }
    }

    function stepDust(dt: number) {
      if (!particles.length) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.age += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy -= 10 * dt;
      }
      particles = particles.filter((p) => p.age < p.life);
      for (const p of particles) {
        const k = 1 - p.age / p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.fillStyle = `rgba(${p.c},${(p.a * k).toFixed(3)})`;
        ctx.fill();
      }
      if (!particles.length) ctx.clearRect(0, 0, W, H);
    }

    /* ---- the loop ---- */
    const glow = layer.querySelector<HTMLElement>(".ha-cursor-glow");
    let gx = 0;
    let gy = 0;
    let gA = 0;
    const glowLast: string[] = [];

    function tick(now: number) {
      raf = 0;
      const dt = clamp((now - lastT) / 1000, 0.001, 0.05);
      lastT = now;
      const t = now / 1000;
      let busy = false;

      if (now - ptr.lastMove > 120) {
        ptr.vx *= Math.exp(-dt * 5);
        ptr.vy *= Math.exp(-dt * 5);
        /* snap the decaying velocity to rest so the trailing-droplet
           origins stop micro-drifting and style writes go quiet */
        if (Math.abs(ptr.vx) < 4) ptr.vx = 0;
        if (Math.abs(ptr.vy) < 4) ptr.vy = 0;
      }

      for (const s of states) {
        if (!s.visible || s.settled) continue;

        /* discovery energy — approach the proximity target; drain slowly
           while the user is still exploring inside the hero (a partly-opened
           membrane closes softly, never snapping shut), but once the cursor
           has LEFT the hero the fade-out quickens so the loop can suspend
           within a couple of seconds. Committed reveals complete on their
           own in ~1.1s (spec 0.7–1.4s) */
        let target = 0;
        if (s.committed || s.discovered) {
          target = 1;
        } else if (ptr.inside) {
          const d = dist(ptr.x, ptr.y, s);
          if (d < s.R) {
            target = clamp((s.R - d) / s.R, 0, 1);
            if (Math.abs(ptr.x - s.cx) < s.w / 2 && Math.abs(ptr.y - s.cy) < s.h / 2) {
              target = Math.max(target, 0.8);
            }
          }
        }
        const exploring = ptr.inside && now - ptr.lastMove < 700;
        const k = target > s.energy ? (s.committed ? 4 : 2.6) : exploring ? 0.5 : 3;
        s.energy += (target - s.energy) * Math.min(1, dt * k);
        /* below ~0.006 the membrane is imperceptible (<0.7% opacity) — snap
           it to exactly zero so the loop's busy flag goes quiet at once */
        if (!s.committed && !s.discovered && s.energy < 0.006) s.energy = 0;
        if (!s.committed && s.energy >= 0.3) s.committed = true;
        if (!s.discovered && s.energy >= 0.995) {
          s.discovered = true;
          s.settleT = 0;
          saveSession();
        }

        /* fully closed and idle — the artwork is invisible; write the
           zeroed state once and skip all origin/animation work until the
           cursor comes back. This is what lets the loop go silent. */
        if (!s.committed && !s.discovered && s.energy === 0) {
          if (s.lastVars[0] !== "0.000" || s.lastVars[1] !== "0.0px") {
            s.el.style.setProperty("--p", "0.000");
            s.el.style.setProperty("--r", "0.0px");
            s.el.style.setProperty("--ink", "0.000");
            s.lastVars[0] = "0.000";
            s.lastVars[1] = "0.0px";
            s.lastVars[8] = "0.000";
          }
          continue;
        }

        /* liquid membrane origin — follows the cursor, droplets trail it */
        let ox = s.w / 2;
        let oy = s.h / 2;
        if (ptr.inside && !s.discovered) {
          ox = clamp(ptr.x - (s.cx - s.w / 2), -22, s.w + 22);
          oy = clamp(ptr.y - (s.cy - s.h / 2), -22, s.h + 22);
        }
        s.mx += (ox - s.mx) * Math.min(1, dt * (s.discovered ? 4 : 9));
        s.my += (oy - s.my) * Math.min(1, dt * (s.discovered ? 4 : 9));
        const vx = clamp(ptr.vx * 0.05, -46, 46);
        const vy = clamp(ptr.vy * 0.05, -46, 46);
        s.dx += (clamp(s.mx + vx, -30, s.w + 30) - s.dx) * Math.min(1, dt * 3.4);
        s.dy += (clamp(s.my + vy, -30, s.h + 30) - s.dy) * Math.min(1, dt * 3.4);
        s.tx += ((s.mx + s.dx) / 2 - s.tx) * Math.min(1, dt * 5);
        s.ty += ((s.my + s.dy) / 2 - s.ty) * Math.min(1, dt * 5);

        /* radius — grows with energy; after discovery it swells past cover
           during the settle, then the mask is dropped entirely */
        let r: number;
        if (s.discovered) {
          s.settleT += dt;
          const f = clamp(s.settleT / 0.55, 0, 1);
          r = s.coverR * (1 + 0.9 * (1 - Math.pow(1 - f, 3)));
          if (f >= 1) {
            s.settled = true;
            s.el.classList.add("is-found");
          }
        } else {
          const e = 1 - Math.pow(1 - clamp(s.energy, 0, 1), 3);
          const wob =
            s.energy > 0.02 && s.energy < 0.99
              ? 1 + 0.055 * Math.sin(t * 2.4 + s.phase)
              : 1;
          r = s.coverR * e * wob;
        }

        /* style writes are dirty-checked: only the properties whose value
           actually changed this frame touch the element, so a frame spends
           its recalc budget only on membranes that are truly moving */
        const vars: Array<[string, string]> = [
          ["--p", clamp(s.energy, 0, 1).toFixed(3)],
          ["--r", `${r.toFixed(1)}px`],
          ["--mx", `${s.mx.toFixed(1)}px`],
          ["--my", `${s.my.toFixed(1)}px`],
          ["--dx", `${s.dx.toFixed(1)}px`],
          ["--dy", `${s.dy.toFixed(1)}px`],
          ["--tx", `${s.tx.toFixed(1)}px`],
          ["--ty", `${s.ty.toFixed(1)}px`],
          [
            "--ink",
            (s.energy * (s.discovered ? clamp(1 - s.settleT / 0.55, 0, 1) : 1)).toFixed(3),
          ],
        ];
        for (let vi = 0; vi < vars.length; vi++) {
          if (s.lastVars[vi] !== vars[vi][1]) {
            s.el.style.setProperty(vars[vi][0], vars[vi][1]);
            s.lastVars[vi] = vars[vi][1];
          }
        }

        if (s.energy > 0.004 || s.discovered) busy = true;

        /* reveal-linked dust — off the cursor while a membrane is opening */
        if (
          !reduced &&
          ptr.inside &&
          !s.discovered &&
          s.energy > 0.08 &&
          dist(ptr.x, ptr.y, s) < s.R * 0.9
        ) {
          if (Math.random() < Math.min(0.9, dt * 30)) {
            spawnDust(ptr.x, ptr.y, 1, 0.1 + 0.2 * s.energy, 26, 36);
          }
        }
        /* settle-linked dust — particles drifting into the artwork */
        if (!reduced && s.discovered && s.settleT < 0.4 && Math.random() < dt * 22) {
          const ang = Math.random() * 6.2832;
          const px = s.cx + Math.cos(ang) * (s.w / 2) * 0.85;
          const py = s.cy + Math.sin(ang) * (s.h / 2) * 0.85;
          if (particles.length < DUST_MAX) {
            particles.push({
              x: px,
              y: py,
              vx: (s.cx - px) * 0.7,
              vy: (s.cy - py) * 0.7,
              age: 0,
              life: 0.5 + Math.random() * 0.5,
              r: 0.7 + Math.random() * 1.4,
              a: 0.16,
              c: Math.random() < 0.5 ? "76,147,194" : "0,98,155",
            });
          }
        }
      }

      /* ambient dust — only while actively exploring empty space */
      if (!reduced && ptr.inside) {
        const speed = Math.hypot(ptr.vx, ptr.vy);
        const nearArt = states.some(
          (s) => s.visible && !s.discovered && dist(ptr.x, ptr.y, s) < s.R
        );
        if (speed > 200 && !nearArt && now - lastAmbient > 110) {
          spawnDust(ptr.x, ptr.y, 1, 0.05, 14, 20);
          lastAmbient = now;
        }
      }

      stepDust(dt);
      if (particles.length) busy = true;

      /* ambient cursor glow — a faint blue breath that follows exploration.
         Its fade-out is decisive (not a multi-second asymptotic tail) and
         writes are dirty-checked so a resting page goes fully silent. */
      if (glow) {
        if (ptr.inside) {
          gx += (ptr.x - gx) * Math.min(1, dt * 6);
          gy += (ptr.y - gy) * Math.min(1, dt * 6);
        }
        const want = ptr.inside && now - ptr.lastMove < 600 && !reduced ? 1 : 0;
        gA += (want - gA) * Math.min(1, dt * (want ? 5 : 3));
        if (gA < 0.02) gA = 0;
        const glowVars = [
          ["--gx", `${gx.toFixed(1)}px`],
          ["--gy", `${gy.toFixed(1)}px`],
          ["--go", gA.toFixed(3)],
        ] as Array<[string, string]>;
        for (let gi = 0; gi < glowVars.length; gi++) {
          if (glowLast[gi] !== glowVars[gi][1]) {
            glow.style.setProperty(glowVars[gi][0], glowVars[gi][1]);
            glowLast[gi] = glowVars[gi][1];
          }
        }
        if (gA > 0.02) busy = true;
      }

      if (busy && heroOn && !reduced) raf = requestAnimationFrame(tick);
    }

    function start() {
      if (!raf && !reduced) raf = requestAnimationFrame(tick);
    }

    /* ---- events ---- */
    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const now = performance.now();
      if (ptr.inside && now > ptr.t) {
        const dts = Math.max(0.008, (now - ptr.t) / 1000);
        ptr.vx = 0.65 * ptr.vx + 0.35 * (x - ptr.x) / dts;
        ptr.vy = 0.65 * ptr.vy + 0.35 * (y - ptr.y) / dts;
      }
      ptr.x = x;
      ptr.y = y;
      ptr.t = now;
      ptr.lastMove = now;
      ptr.inside = true;
      if (reduced) {
        reducedHit(x, y);
        return;
      }
      start();
    };

    function reducedHit(x: number, y: number) {
      for (const s of states) {
        if (s.visible && !s.discovered && dist(x, y, s) < s.R * 0.75) revealNow(s);
      }
    }

    const onLeave = () => {
      ptr.inside = false;
      start(); /* let in-flight reveals complete / drain */
    };

    const onActivate = (e: MouseEvent) => {
      const r = hero.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (reduced) {
        reducedHit(x, y);
        return;
      }
      for (const s of states) {
        if (!s.visible || s.discovered || s.committed) continue;
        if (dist(x, y, s) < s.R * 0.85) {
          s.committed = true;
          s.mx = clamp(x - (s.cx - s.w / 2), -22, s.w + 22);
          s.my = clamp(y - (s.cy - s.h / 2), -22, s.h + 22);
          s.dx = s.mx;
          s.dy = s.my;
          s.tx = s.mx;
          s.ty = s.my;
          break;
        }
      }
      start();
    };

    hero.addEventListener("pointermove", onMove, { passive: true });
    hero.addEventListener("pointerenter", () => {
      ptr.inside = true;
      start();
    });
    hero.addEventListener("pointerleave", onLeave);
    hero.addEventListener("click", onActivate);

    /* keyboard discovery — the reveal itself is the focus feedback */
    const keyEls = Array.from(document.querySelectorAll<HTMLElement>(".ha-key"));
    const onKeyFocus = (el: HTMLElement) => () => {
      const s = states.find((x) => x.def.id === el.dataset.key);
      if (!s || !s.visible || s.discovered) return;
      if (reduced) {
        revealNow(s);
        return;
      }
      s.committed = true;
      s.mx = s.w / 2;
      s.my = s.h / 2;
      s.dx = s.mx;
      s.dy = s.my;
      s.tx = s.mx;
      s.ty = s.my;
      start();
    };
    const keyHandlers: Array<[HTMLElement, () => void]> = [];
    for (const el of keyEls) {
      const h = onKeyFocus(el);
      el.addEventListener("focus", h);
      keyHandlers.push([el, h]);
    }

    /* lifecycle */
    for (const s of states) {
      if (!s.img.complete) {
        s.img.addEventListener("load", () => layout(), { once: true });
      }
    }
    const ro = new ResizeObserver(() => layout());
    ro.observe(hero);
    const io = new IntersectionObserver(
      (es) => {
        heroOn = es[0]?.isIntersecting ?? true;
      },
      { threshold: 0.02 }
    );
    io.observe(hero);
    const onReducedChange = () => {
      reduced = reducedMQ.matches;
      if (reduced) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        particles = [];
        ctx.clearRect(0, 0, W, H);
      }
    };
    reducedMQ.addEventListener?.("change", onReducedChange);

    layout();

    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      hero.removeEventListener("click", onActivate);
      for (const [el, h] of keyHandlers) el.removeEventListener("focus", h);
      reducedMQ.removeEventListener?.("change", onReducedChange);
      ro.disconnect();
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* the hidden artwork layer — behind the hero's main content */}
      <div ref={layerRef} className="ha-layer" aria-hidden="true">
        {ARTS.map((a, i) => (
          <figure key={a.id} data-art={a.id} className="ha-art">
            <div className="ha-ink" />
            {a.srcM ? (
              <picture>
                <source media="(max-width: 1023px)" srcSet={a.srcM} />
                <img src={a.src} alt="" draggable={false} />
              </picture>
            ) : (
              <img src={a.src} alt="" draggable={false} />
            )}
            {/* tiny sparkle hint — the only visible trace of the sleeping
                artwork until it is found (then it dissolves for good) */}
            <span
              className="ha-hint"
              style={{ "--hint-delay": `${(i * 0.47).toFixed(2)}s` } as React.CSSProperties}
            />
          </figure>
        ))}
        <div className="ha-cursor-glow" />
      </div>

      {/* dust particles — float above the composition, never interactive */}
      <canvas ref={dustRef} className="ha-dust" aria-hidden="true" />

      {/* invisible keyboard/touch targets — the reveal is the only feedback */}
      <div className="ha-keys">
        {ARTS.map((a) => (
          <button key={a.id} type="button" className="ha-key" data-key={a.id} aria-label={a.label} />
        ))}
      </div>
    </>
  );
}
