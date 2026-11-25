"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Statistics block — 3381+ Members, 9+ Societies, 50+ Events, the figures
 * drawn on the reference sketch, each carrying a plus sign.
 * A quiet supporting column — deliberately small so the IEEE SB VJEC
 * identity stays the hero of the page, but still noticeable: bold tabular
 * figures, letter-spaced labels, IEEE-blue plus signs. Plain text, never
 * cards: stacked beneath the artwork on small screens and pinned to the
 * composition's right edge from `lg` up (see hero.tsx), vertically centred
 * on the whole poster block like the sketch's balancing right rail. On
 * short landscape viewports the column collapses into a single row. Numbers
 * count up the first time the block scrolls into view; the animated value
 * is hidden from assistive tech, which gets the final figure instead.
 */

const ITEMS = [
  { value: 3381, suffix: "+", label: "Members" },
  { value: 9, suffix: "+", label: "Societies" },
  { value: 50, suffix: "+", label: "Events" },
] as const;

function useInViewOnce<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    // Reduced motion resolves on the first (asynchronous) tick.
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1100;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = duration === 0 ? 1 : Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);
  return value;
}

function StatCell({
  value,
  suffix,
  label,
  active,
  delay,
}: {
  value: number;
  suffix: string;
  label: string;
  active: boolean;
  delay: number;
}) {
  const count = useCountUp(value, active);
  return (
    <div
      className={cn("reveal", active && "is-in")}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div aria-hidden="true">
        <div className="font-display text-[clamp(1.6rem,2.2vw,2.3rem)] font-bold tabular-nums leading-none tracking-tight text-ink">
          {count}
          {suffix && (
            <span className="text-[0.85em] text-ieee">{suffix}</span>
          )}
        </div>
        <div className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-[10px]">
          {label}
        </div>
      </div>
      <span className="sr-only">
        {value}
        {suffix} {label}
      </span>
    </div>
  );
}

export function Stats({ className }: { className?: string }) {
  const [ref, inView] = useInViewOnce<HTMLDivElement>(0.3);
  return (
    <div
      ref={ref}
      aria-label="IEEE SB VJEC at a glance"
      className={cn(
        "flex flex-col items-center justify-center gap-5 text-center lg:items-start lg:gap-8 lg:text-left",
        "[@media(max-height:560px)]:flex-row [@media(max-height:560px)]:items-center [@media(max-height:560px)]:gap-6",
        className
      )}
    >
      {ITEMS.map((s, i) => (
        <StatCell
          key={s.label}
          value={s.value}
          suffix={s.suffix}
          label={s.label}
          active={inView}
          delay={i * 130}
        />
      ))}
    </div>
  );
}
