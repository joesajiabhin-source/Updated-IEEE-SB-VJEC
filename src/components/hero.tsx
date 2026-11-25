"use client";

import { useEffect, useRef } from "react";

export function Hero() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;
    // Local module adapted from the two supplied animation sources.
    const modulePath = "/hero/animation.js?v=connected-ribbon-3";
    import(/* webpackIgnore: true */ modulePath).then(({ mountHero }) => {
      if (!cancelled && canvas.current) dispose = mountHero(canvas.current);
    });
    return () => { cancelled = true; dispose?.(); };
  }, []);

  return (
    <section id="home" className="reference-hero" aria-labelledby="hero-title">
      <div className="hero-poster">
        <p className="branch-caption">IEEE Student Branch<br/>at Vimal Jyothi Engineering College.<span/></p>
        <h1 id="hero-title" className="hero-title"><img src="/hero/vjec-logo.png" alt="IEEE"/><span className="title-divider"/><span>IEEE SB</span><span className="sr-only"> VJEC</span></h1>
        <canvas ref={canvas} className="ribbon-canvas" tabIndex={0} role="img" aria-label="VJEC. Move your pointer across the letters to stretch them and interact with the liquid ribbon. Use arrow keys to choose a letter and Escape to release." />
        <aside className="reference-stats" aria-label="Student branch in numbers">
          {[['338', 'Members'], ['9', 'Societies'], ['50', 'Events']].map(([number,label]) => <div className="reference-stat" key={label}><strong>{number}<span>+</span></strong><p>{label}</p></div>)}
        </aside>
        <div className="hero-motto"><span/>Technology <b>/</b> Innovation <b>/</b> Community</div>
        <img className="campus-sketch" src="/art/campus.png" alt="Blue architectural illustration of Vimal Jyothi Engineering College"/>
      </div>
    </section>
  );
}
