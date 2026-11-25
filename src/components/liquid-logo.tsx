"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * LiquidLogo — the IEEE SB VJEC emblem (the branch's own mark, sampled from
 * its transparent PNG) rendered entirely as an interactive liquid of glossy
 * glass beads.
 *
 * Form: the logo's alpha channel is sampled into thousands of particle home
 * positions, each shaded like a bead of deep IEEE-blue glass with a lit crown
 * toward the upper-left. Dense overlap reads as one continuous liquid body.
 *
 * Motion: disturb → deform → flow → restore. Each bead springs home through a
 * slow internal flow field while the whole emblem breathes; the pointer carves
 * through the liquid (proximity repulsion plus drag along its motion), taps
 * splash, and scrolling gives a gentle jiggle. On handheld devices the liquid
 * also answers the accelerometer: tilting the phone pools the beads toward
 * the low side (measured from your grip, slowly re-levelling when you hold
 * still) and a quick tilt or pan throws an inertial jiggle through the body —
 * desktops have no motion sensors, so the channel is silent there. Nothing
 * ever stays displaced — every impulse decays and every bead returns to its
 * true place. On entry the beads assemble out of a scattered halo into the
 * emblem, staggered like a pour settling. prefers-reduced-motion renders one
 * calm static frame.
 */

const LOGO_SRC = "/logo.png";

const VERT_SRC = `
attribute vec2 a_pos;   // device px, y-down
attribute float a_energy; // 0..1 turbulence from the physics
attribute vec3 a_info;  // x: diameter px, y: shade 0..1, z: seed 0..1
uniform vec2 u_res;
varying float v_shade;
varying float v_seed;
varying float v_energy;
void main() {
  vec2 clip = (a_pos / u_res) * 2.0 - 1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  gl_PointSize = a_info.x;
  v_shade = a_info.y;
  v_seed = a_info.z;
  v_energy = a_energy;
}`;

const FRAG_SRC = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying float v_shade;
varying float v_seed;
varying float v_energy;
uniform float u_time;   // seconds (frozen for reduced motion)
uniform float u_motion; // 1 animated, 0 reduced motion

void main() {
  vec2 p = gl_PointCoord - 0.5;
  float r = length(p);

  // Round bead with a liquid-soft edge (relative softness — reads as
  // surface tension, not a vector circle).
  float body = 1.0 - smoothstep(0.5 - 0.16, 0.5, r);
  if (body <= 0.004) discard;

  // Glass body: deep IEEE navy underside rolling to a lit crown.
  vec3 deep = vec3(0.024, 0.155, 0.42);
  vec3 lite = vec3(0.30, 0.57, 0.87);
  vec3 col = mix(deep, lite, v_shade);

  // Specular hotspot riding the upper-left of every bead — the gloss.
  vec2 hp = p - vec2(-0.15, -0.15);
  float dh2 = dot(hp, hp);
  col += vec3(0.85, 0.93, 1.0) * exp(-dh2 * 16.0) * 0.38;

  // A soft sheen on the far side — light bending through the glass.
  col += vec3(0.55, 0.72, 0.95) * exp(-dot(p - vec2(0.18, 0.18), p - vec2(0.18, 0.18)) * 9.0) * 0.10;

  // Slow shimmer: each bead breathes its brightness a touch out of phase —
  // the surface feels alive even when nothing is moving.
  float tw = sin(u_time * (0.7 + v_seed * 1.5) + v_seed * 43.7);
  col *= 1.0 + (0.045 + 0.075 * v_shade) * tw * u_motion;

  // Turbulence: liquid that is being stirred lifts toward pale light —
  // instant, honest feedback on every interaction.
  col += vec3(0.55, 0.70, 0.92) * v_energy * v_energy * 0.5;

  float a = body * 0.86;
  gl_FragColor = vec4(col * a, a); // premultiplied
}`;

/** A sampled candidate bead (logo-box normalized uv + character). */
interface Candidate {
  u: number;
  v: number;
  r: number; // thinning random, stable across rebuilds
  seed: number;
}

export interface LiquidLogoProps {
  className?: string;
  /** Accessible label for the emblem. */
  label?: string;
}

export function LiquidLogo({
  className,
  label = "IEEE Student Branch VJEC logo",
}: LiquidLogoProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let disposed = false;
    let cleanup: (() => void) | null = null;

    // The emblem asset must decode before anything else — its alpha channel
    // is the source of truth for every bead's home.
    const logo = new Image();
    logo.decoding = "async";
    logo.onload = () => {
      if (disposed) return;
      try {
        cleanup = start(logo);
      } catch {
        setFallback(true);
      }
    };
    logo.onerror = () => setFallback(true);
    logo.src = LOGO_SRC;

    function start(logoImg: HTMLImageElement): (() => void) | null {
      // ---- sample the mark into candidate beads ---------------------------
      const iw = Math.max(1, logoImg.naturalWidth);
      const ih = Math.max(1, logoImg.naturalHeight);
      const off = document.createElement("canvas");
      off.width = iw;
      off.height = ih;
      const octx = off.getContext("2d", { willReadFrequently: true });
      if (!octx) {
        setFallback(true);
        return null;
      }
      octx.drawImage(logoImg, 0, 0);
      let px: Uint8ClampedArray;
      try {
        px = octx.getImageData(0, 0, iw, ih).data;
      } catch {
        setFallback(true);
        return null;
      }

      // Logo aspect (portrait for this mark) and ink coverage, measured —
      // never assumed.
      let ink = 0;
      for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 96) ink++;
      const inkFrac = ink / (iw * ih);
      if (inkFrac <= 0.001) {
        setFallback(true);
        return null;
      }

      // Candidate grid at ~2 image px — finer than any render, then thinned
      // per rebuild so density tracks the on-screen size.
      const cell = 2.0;
      const cols = Math.floor(iw / cell);
      const rows = Math.floor(ih / cell);
      const cands: Candidate[] = [];
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          const jx = (gx + 0.5 + (Math.random() - 0.5) * 0.72) * cell;
          const jy = (gy + 0.5 + (Math.random() - 0.5) * 0.72) * cell;
          const ix = Math.min(iw - 1, Math.round(jx));
          const iy = Math.min(ih - 1, Math.round(jy));
          const a = px[(iy * iw + ix) * 4 + 3];
          // Solid ink always; soft edges keep proportionally — anti-aliased
          // density instead of a hard cutoff.
          if (a > 96 || (a > 24 && Math.random() * 255 < a)) {
            cands.push({
              u: jx / iw,
              v: jy / ih,
              r: Math.random(),
              seed: Math.random(),
            });
          }
        }
      }
      if (!cands.length) {
        setFallback(true);
        return null;
      }

      // ---- GL --------------------------------------------------------------
      const gl = canvas.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "low-power",
      }) as WebGLRenderingContext | null;
      if (!gl) {
        setFallback(true);
        return null;
      }

      const compile = (type: number, src: string) => {
        const sh = gl.createShader(type);
        if (!sh) return null;
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          gl.deleteShader(sh);
          return null;
        }
        return sh;
      };

      let prog: WebGLProgram | null = null;
      let posBuf: WebGLBuffer | null = null;
      let infoBuf: WebGLBuffer | null = null;
      let aPos = 0;
      let aEnergy = 0;
      let aInfo = 0;
      let uRes: WebGLUniformLocation | null = null;
      let uTime: WebGLUniformLocation | null = null;
      let uMotion: WebGLUniformLocation | null = null;

      const initGL = (): boolean => {
        const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
        const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
        if (!vs || !fs) return false;
        const p = gl.createProgram();
        if (!p) return false;
        gl.attachShader(p, vs);
        gl.attachShader(p, fs);
        gl.linkProgram(p);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
          gl.deleteProgram(p);
          return false;
        }
        prog = p;
        gl.useProgram(p);
        aPos = gl.getAttribLocation(p, "a_pos");
        aEnergy = gl.getAttribLocation(p, "a_energy");
        aInfo = gl.getAttribLocation(p, "a_info");
        uRes = gl.getUniformLocation(p, "u_res");
        uTime = gl.getUniformLocation(p, "u_time");
        uMotion = gl.getUniformLocation(p, "u_motion");

        if (posBuf) gl.deleteBuffer(posBuf);
        if (infoBuf) gl.deleteBuffer(infoBuf);
        posBuf = gl.createBuffer();
        infoBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, infoBuf);
        gl.enableVertexAttribArray(aInfo);
        gl.vertexAttribPointer(aInfo, 3, gl.FLOAT, false, 12, 0);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);
        return true;
      };

      if (!initGL()) {
        setFallback(true);
        return null;
      }

      // ---- particle state ---------------------------------------------------
      let count = 0;
      let uu = new Float32Array(0); // home uv
      let vv = new Float32Array(0);
      let seedA = new Float32Array(0);
      let x = new Float32Array(0);
      let y = new Float32Array(0);
      let vx = new Float32Array(0);
      let vy = new Float32Array(0);
      let en = new Float32Array(0); // visible turbulence per bead
      let delay = new Float32Array(0);
      let posArr = new Float32Array(0); // interleaved upload [x,y,energy]*
      let infoArr = new Float32Array(0); // [diameter, shade, seed]*

      let width = 1;
      let height = 1;
      let span = 1; // emblem box height in device px
      let logoW = 1; // emblem box width (aspect-fit)
      let logoH = 1;
      let cellPx = 3; // thinning cell in canvas px
      let firstBuild = true;
      let t0 = -1; // entrance clock epoch (ms)

      const rebuild = (now: number) => {
        const rect = host.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = Math.max(1, Math.round(rect.width * dpr));
        height = Math.max(1, Math.round(rect.height * dpr));
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);

        logoH = Math.min(width, height) * 0.84;
        logoW = logoH * (iw / ih);
        span = logoH;

        // Ink area in canvas px → thinning cell that lands near the target
        // bead count for this size.
        const inkArea = inkFrac * logoW * logoH;
        const target = Math.max(1400, Math.min(10200, Math.round(span * span * 0.042)));
        cellPx = Math.sqrt(inkArea / target);
        // Thinning probability: fraction of candidates that fit the target.
        const p = Math.min(1, (target / cands.length) * 1.06);

        // Beads whose thinning random passes — stable candidate order keeps
        // membership monotone as p changes.
        const kept: Candidate[] = [];
        for (let i = 0; i < cands.length; i++) {
          if (cands[i].r < p) kept.push(cands[i]);
        }
        const n = kept.length;
        if (n < 200) {
          setFallback(true);
          return;
        }

        const prevCount = count;
        count = n;
        uu = new Float32Array(n);
        vv = new Float32Array(n);
        seedA = new Float32Array(n);
        delay = new Float32Array(n);
        const shade = new Float32Array(n);
        const diam = new Float32Array(n);
        const cx = width / 2;
        const cy = height / 2;

        for (let i = 0; i < n; i++) {
          const c = kept[i];
          uu[i] = c.u;
          vv[i] = c.v;
          seedA[i] = c.seed;
          // Light from the upper-left, softly randomized.
          shade[i] = Math.min(1, Math.max(0, 0.58 * (1 - c.v) + 0.42 * (1 - c.u) + (c.seed - 0.5) * 0.34));
          // Bead size: overlapping mostly-uniform, a few chunkier droplets.
          let d = cellPx * (1.38 + c.seed * 0.7);
          if (c.r < 0.045) d *= 1.45;
          diam[i] = Math.max(2.2, Math.min(11, d));
          delay[i] = c.seed * 0.55 + (1 - c.v) * 0.2;
        }

        // Static per-bead attributes.
        infoArr = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          infoArr[i * 3] = diam[i];
          infoArr[i * 3 + 1] = shade[i];
          infoArr[i * 3 + 2] = seedA[i];
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, infoBuf);
        gl.bufferData(gl.ARRAY_BUFFER, infoArr, gl.STATIC_DRAW);

        // Dynamic positions.
        posArr = new Float32Array(n * 3);
        x = new Float32Array(n);
        y = new Float32Array(n);
        vx = new Float32Array(n);
        vy = new Float32Array(n);
        en = new Float32Array(n);

        const softRebuild =
          !firstBuild && Math.abs(n - prevCount) <= Math.max(30, n * 0.08);

        if (reducedMotion || softRebuild) {
          // Calm start (or resize): every bead rests at home.
          for (let i = 0; i < n; i++) {
            x[i] = cx + (uu[i] - 0.5) * logoW;
            y[i] = cy + (vv[i] - 0.5) * logoH;
          }
        } else {
          // Entrance: beads pour in from a scattered halo around the emblem.
          const ringBase = span * 0.62;
          for (let i = 0; i < n; i++) {
            const ang = seedA[i] * Math.PI * 2 + uu[i] * 1.5;
            const rad = ringBase * (0.55 + seedA[i] * 0.85);
            x[i] = cx + Math.cos(ang) * rad;
            y[i] = cy + Math.sin(ang) * rad * 0.92;
            vx[i] = 0;
            vy[i] = 0;
          }
          t0 = now;
        }
        firstBuild = false;
      };

      // ---- interaction ------------------------------------------------------
      let pointerActive = false;
      let pcx = -1e5;
      let pcy = -1e5;
      let smx = -1e5;
      let smy = -1e5;
      let pvx = 0;
      let pvy = 0;
      let press = 0;
      let scrollKick = 0;
      let lastScrollY = window.scrollY;

      // Device tilt (mobile only — these values move only when the device's
      // orientation sensor fires, which desktops don't have):
      //   gravX/gravY — the tilt relative to the user's grip when the liquid
      //                 settled; beads gently pool toward the low side.
      //   kickX/kickY — inertial impulses from fast tilts/pans that jiggle
      //                 the whole body, then decay like every other input.
      let gravX = 0;
      let gravY = 0;
      let kickX = 0;
      let kickY = 0;
      let lastGX = 0;
      let lastGY = 0;
      let lastOrientAt = 0;
      let baseGX = 0;
      let baseGY = 0;
      let baselineSet = false;
      let motionLive = false;

      const canvasPoint = (cx0: number, cy0: number) => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return null;
        return {
          x: ((cx0 - rect.left) / rect.width) * width,
          y: ((cy0 - rect.top) / rect.height) * height,
        };
      };

      const updatePointer = () => {
        let tx = -1e6;
        let ty = -1e6;
        if (pointerActive) {
          const pt = canvasPoint(pcx, pcy);
          if (pt) {
            tx = pt.x;
            ty = pt.y;
          }
        }
        const px0 = smx;
        const py0 = smy;
        smx += (tx - smx) * 0.42;
        smy += (ty - smy) * 0.42;
        pvx = px0 < -1e4 ? 0 : smx - px0;
        pvy = py0 < -1e4 ? 0 : smy - py0;
        const clam = (val: number) => Math.max(-160, Math.min(160, val));
        pvx = clam(pvx);
        pvy = clam(pvy);
      };

      /** Immediate splash: radial impulse from a press. */
      const splash = (px0: number, py0: number, strength: number) => {
        const R = span * 0.36;
        const R2 = R * R;
        for (let i = 0; i < count; i++) {
          const dx = x[i] - px0;
          const dy = y[i] - py0;
          const d2 = dx * dx + dy * dy;
          if (d2 >= R2) continue;
          const d = Math.sqrt(d2) + 0.001;
          const w = 1 - d / R;
          const f = w * w * strength;
          vx[i] += (dx / d) * f;
          vy[i] += (dy / d) * f;
        }
      };

      // ---- physics ----------------------------------------------------------
      const physics = (t: number, dtc: number) => {
        const cx = width / 2;
        const cy = height / 2;
        const flowA = 0.006 * span;
        const damp = Math.pow(0.94, dtc);
        const R = span * 0.3;
        const R2 = R * R;
        const speed = Math.hypot(pvx, pvy);
        const scale = span / 460;
        // A resting pointer still parts the liquid (gentle proximity), a
        // moving one carves through it, a pressed one digs deep.
        const hover = pointerActive ? 1.7 * scale : 0;
        const stir =
          pointerActive && (speed > 0.35 || press > 0.01)
            ? (5.0 + Math.min(speed * 0.05, 7.5)) * scale * (1 + press * 1.6)
            : 0;
        const dragC = 0.12 * scale;
        const vmax = span * 0.13;
        const scrollImpulse = scrollKick * 0.16 * scale * dtc;
        // Tilt: gentle pooling toward the low side (relative to the grip
        // baseline, so the emblem never droops at rest), scaled by span so
        // the physics is size-independent. Gated on motionLive so desktops
        // (no sensor events) never see it.
        const gravA = motionLive ? 0.0042 * span : 0;
        const kickAX = kickX * 0.16 * scale * dtc;
        const kickAY = kickY * 0.16 * scale * dtc;
        const enFade = Math.pow(0.9, dtc);
        const enThresh = span * 0.035;

        for (let i = 0; i < count; i++) {
          const u = uu[i];
          const v = vv[i];
          const sd = seedA[i];

          // Breathing — the whole emblem swells a touch, phased diagonally.
          const br = 1 + 0.012 * Math.sin(t * 0.8 - (u + v) * 1.2);
          const hx = cx + (u - 0.5) * logoW * br;
          const hy = cy + (v - 0.5) * logoH * br;

          // Internal flow — a slow current circling inside the body.
          const fx =
            flowA *
            (Math.sin(t * 0.5 + u * 2.4 + sd * 6.28) * 0.62 +
              Math.sin(t * 0.27 + v * 3.1 + sd * 9.42) * 0.38);
          const fy =
            flowA *
            (Math.cos(t * 0.44 + v * 2.2 + sd * 6.28) * 0.62 +
              Math.sin(t * 0.33 + u * 2.8 + sd * 7.85) * 0.38);
          const tx = hx + fx;
          const ty = hy + fy;

          // Spring home — gated by the entrance stagger.
          const act = t0 < 0 ? 1 : Math.min(1, Math.max(0, (t - delay[i]) / 0.32));
          const k = 0.052 * act * act;
          let ax = (tx - x[i]) * k;
          let ay = (ty - y[i]) * k;

          // Pointer: proximity repulsion + drag along the motion.
          if (pointerActive) {
            const dx = x[i] - smx;
            const dy = y[i] - smy;
            const d2 = dx * dx + dy * dy;
            if (d2 < R2) {
              const d = Math.sqrt(d2) + 0.001;
              const w = 1 - d / R;
              const w2 = w * w;
              const f = w2 * (hover + stir) * dtc;
              ax += (dx / d) * f + pvx * w2 * dragC * dtc;
              ay += (dy / d) * f + pvy * w2 * dragC * dtc;
            }
          }

          let nvx = (vx[i] + ax * dtc + kickAX + gravX * gravA) * damp;
          let nvy =
            (vy[i] + ay * dtc + scrollImpulse + kickAY + gravY * gravA) * damp;
          if (nvx > vmax) nvx = vmax;
          else if (nvx < -vmax) nvx = -vmax;
          if (nvy > vmax) nvy = vmax;
          else if (nvy < -vmax) nvy = -vmax;
          vx[i] = nvx;
          vy[i] = nvy;
          x[i] += nvx * dtc;
          y[i] += nvy * dtc;

          // Visible turbulence — fast beads lift toward the light.
          const esp = Math.sqrt(nvx * nvx + nvy * nvy);
          const et = esp > enThresh ? Math.min(1, esp / (enThresh * 2.2)) : 0;
          en[i] = Math.max(et, en[i] * enFade);
        }
        scrollKick *= Math.pow(0.8, dtc);
        kickX *= Math.pow(0.8, dtc);
        kickY *= Math.pow(0.8, dtc);
        press *= Math.pow(0.88, dtc);
      };

      // ---- draw -------------------------------------------------------------
      const draw = (t: number) => {
        if (!prog) return;
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
        gl.bufferData(gl.ARRAY_BUFFER, posArr, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(aPos);
        gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 12, 0);
        gl.enableVertexAttribArray(aEnergy);
        gl.vertexAttribPointer(aEnergy, 1, gl.FLOAT, false, 12, 8);
        gl.bindBuffer(gl.ARRAY_BUFFER, infoBuf);
        gl.enableVertexAttribArray(aInfo);
        gl.vertexAttribPointer(aInfo, 3, gl.FLOAT, false, 12, 0);
        gl.uniform2f(uRes, width, height);
        gl.uniform1f(uTime, t);
        gl.uniform1f(uMotion, reducedMotion ? 0 : 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, count);
      };

      const step = (t: number) => {
        for (let i = 0; i < count; i++) {
          posArr[i * 3] = x[i];
          posArr[i * 3 + 1] = y[i];
          posArr[i * 3 + 2] = en[i];
        }
        draw(t);
      };
      // ---- frame loop -------------------------------------------------------
      let raf = 0;
      let visible = true;
      let lastT = 0;

      const frame = (ms: number) => {
        raf = requestAnimationFrame(frame);
        if (!visible) {
          lastT = ms;
          return;
        }
        const t = t0 < 0 ? ms / 1000 : (ms - t0) / 1000 + 0.001;
        let dtc = lastT ? (ms - lastT) / 16.667 : 1;
        lastT = ms;
        dtc = Math.min(Math.max(dtc, 0.25), 2);
        updatePointer();
        physics(t, dtc);
        step(t);
      };

      const startLoop = () => {
        if (!raf) {
          lastT = 0;
          raf = requestAnimationFrame(frame);
        }
      };
      const stopLoop = () => {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      };

      rebuild(performance.now());

      // ---- reduced motion: one calm frame ------------------------------------
      if (reducedMotion) {
        const still = () => {
          rebuild(performance.now());
          step(1.4);
        };
        still();
        const ro = new ResizeObserver(still);
        ro.observe(host);
        return () => {
          ro.disconnect();
          gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
      }

      startLoop();

      // ---- listeners ----------------------------------------------------------
      const onMove = (e: PointerEvent) => {
        pointerActive = true;
        pcx = e.clientX;
        pcy = e.clientY;
      };
      const onDown = (e: PointerEvent) => {
        pointerActive = true;
        pcx = e.clientX;
        pcy = e.clientY;
        press = Math.min(press + 1, 2);
        const pt = canvasPoint(e.clientX, e.clientY);
        if (pt) splash(pt.x, pt.y, 16 * (span / 460));
      };
      const onDeactivate = () => {
        pointerActive = false;
      };
      const onOut = (e: PointerEvent) => {
        if (!e.relatedTarget) pointerActive = false;
      };
      const onScroll = () => {
        const dy = window.scrollY - lastScrollY;
        lastScrollY = window.scrollY;
        scrollKick = Math.max(-2.4, Math.min(2.4, scrollKick + dy * 0.012));
      };
      const onVisChange = () => {
        if (document.hidden) stopLoop();
        else if (visible) startLoop();
      };

      // Device tilt — mobile only in practice: desktops never fire
      // deviceorientation with real values, and the reduced-motion path
      // returns before any of this is wired.
      const RAD = Math.PI / 180;
      const clampKick = (v: number) => Math.max(-3, Math.min(3, v));
      const onOrient = (e: DeviceOrientationEvent) => {
        if (e.beta == null || e.gamma == null) return;
        // Gravity direction in device space (unit-ish: -1..1 per axis).
        const b = Math.sin(e.beta * RAD);
        const g = Math.sin(e.gamma * RAD);
        // Rotate into screen space so the liquid always pools toward the
        // physically low side of the screen, whatever the orientation lock.
        let gx = g;
        let gy = b;
        const angle = screen.orientation?.angle ?? 0;
        if (angle === 90) {
          gx = -b;
          gy = g;
        } else if (angle === 270 || angle === -90) {
          gx = b;
          gy = -g;
        } else if (angle === 180) {
          gx = -g;
          gy = -b;
        }
        if (!baselineSet) {
          // First reading defines "level" for this grip — the emblem never
          // droops at rest, it only responds to tilting from how you hold it.
          baseGX = gx;
          baseGY = gy;
          baselineSet = true;
        }
        const now = performance.now();
        if (lastOrientAt > 0) {
          const dts = Math.min(0.5, Math.max(0.016, (now - lastOrientAt) / 1000));
          // Inertial jiggle: a quick tilt or pan flings the liquid against
          // the motion, exactly like carrying a real bowl.
          kickX = clampKick(kickX - ((gx - lastGX) / dts) * 0.35);
          kickY = clampKick(kickY - ((gy - lastGY) / dts) * 0.35);
        }
        lastOrientAt = now;
        lastGX = gx;
        lastGY = gy;
        // Smoothed pooling bias, relative to the grip baseline.
        const rgx = Math.max(-1, Math.min(1, gx - baseGX));
        const rgy = Math.max(-1, Math.min(1, gy - baseGY));
        gravX += (rgx - gravX) * 0.16;
        gravY += (rgy - gravY) * 0.16;
        // Slow re-level: hold a tilt and the liquid gradually settles back
        // — nothing ever stays displaced.
        baseGX += (gx - baseGX) * 0.0012;
        baseGY += (gy - baseGY) * 0.0012;
        motionLive = true;
      };

      let orientationBound = false;
      const bindOrientation = () => {
        if (orientationBound) return;
        orientationBound = true;
        window.addEventListener("deviceorientation", onOrient, { passive: true });
      };
      // Only iOS/WebKit gates motion sensors behind a user-gesture permission
      // prompt (some Chromium builds also expose requestPermission, but they
      // deliver events freely — so detect the platform, not the API). On iOS
      // the prompt piggybacks on the first tap anywhere (the same tap that
      // splashes the emblem); everywhere else the sensor needs no permission
      // and — on desktops — simply never fires.
      const removeGrantListeners = [] as Array<() => void>;
      if (typeof window.DeviceOrientationEvent !== "undefined") {
        const ua = navigator.userAgent;
        const isIOS =
          /iPad|iPhone|iPod/.test(ua) ||
          (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        const DOE = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
          requestPermission?: () => Promise<string>;
        };
        if (isIOS && typeof DOE.requestPermission === "function") {
          const grant = () => {
            removeGrantListeners.forEach((off) => off());
            DOE.requestPermission?.()
              .then((r) => {
                if (r === "granted") bindOrientation();
              })
              .catch(() => {});
          };
          for (const type of ["touchend", "pointerdown"] as const) {
            window.addEventListener(type, grant, { capture: true, passive: true });
            removeGrantListeners.push(() =>
              window.removeEventListener(type, grant, { capture: true })
            );
          }
        } else {
          bindOrientation();
        }
      }

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
      window.addEventListener("pointercancel", onDeactivate);
      window.addEventListener("blur", onDeactivate);
      document.addEventListener("pointerout", onOut);
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", onVisChange);

      const io = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
          if (visible) startLoop();
          else stopLoop();
        },
        { threshold: 0 }
      );
      io.observe(canvas);

      let resizePending = false;
      const ro = new ResizeObserver(() => {
        if (resizePending) return;
        resizePending = true;
        requestAnimationFrame(() => {
          resizePending = false;
          rebuild(performance.now());
        });
      });
      ro.observe(host);

      const onContextLost = (e: Event) => {
        e.preventDefault();
        stopLoop();
      };
      const onContextRestored = () => {
        if (initGL()) {
          rebuild(performance.now());
          if (visible) startLoop();
        }
      };
      canvas.addEventListener("webglcontextlost", onContextLost);
      canvas.addEventListener("webglcontextrestored", onContextRestored);

      return () => {
        stopLoop();
        io.disconnect();
        ro.disconnect();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointercancel", onDeactivate);
        window.removeEventListener("blur", onDeactivate);
        document.removeEventListener("pointerout", onOut);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("deviceorientation", onOrient);
        document.removeEventListener("visibilitychange", onVisChange);
        removeGrantListeners.forEach((off) => off());
        canvas.removeEventListener("webglcontextlost", onContextLost);
        canvas.removeEventListener("webglcontextrestored", onContextRestored);
        if (posBuf) gl.deleteBuffer(posBuf);
        if (infoBuf) gl.deleteBuffer(infoBuf);
        if (prog) gl.deleteProgram(prog);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    }

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={label}
      className={cn("relative touch-pan-y", className)}
    >
      {/* Soft frosted backlight — an elliptical glass plate of light matching
          the emblem's own portrait silhouette (not a wider circle), lifting
          the emblem off the type behind it like a lens sitting on the page.
          Opacity is high enough that letters passing behind it read as
          clearly behind glass, never as a ghosting artifact; the tighter
          inset keeps the glow off the "IEEE SB" line above. */}
      <div
        aria-hidden="true"
        className="absolute inset-[9%_14%] rounded-[50%] bg-[radial-gradient(closest-side,rgb(255_255_255/0.74),rgb(255_255_255/0.32)_58%,transparent_74%)] blur-lg"
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full [filter:drop-shadow(0_4px_10px_rgba(4,26,52,0.24))_drop-shadow(0_10px_22px_rgba(0,60,105,0.12))]"
      />
      {fallback && (
        <img
          src={LOGO_SRC}
          alt=""
          className="absolute inset-0 m-auto h-[84%] w-auto object-contain"
        />
      )}
      <noscript>
        <img
          src={LOGO_SRC}
          alt=""
          className="absolute inset-0 m-auto h-[84%] w-auto object-contain"
        />
      </noscript>
    </div>
  );
}
