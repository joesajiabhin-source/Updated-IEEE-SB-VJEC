"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

export function Navbar() {
  const host = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    const modulePath = "/hero/liquid-navigation.js?v=1";
    import(/* webpackIgnore: true */ modulePath).then(({ mountLiquidNavigation }) => {
      if (cancelled || !host.current) return;
      dispose = mountLiquidNavigation(host.current, (label: string) => {
        if (label === "Home") {
          document.getElementById("home")?.scrollIntoView({ behavior: "instant" });
        } else {
          toast({ title: label, description: "Coming soon." });
        }
      });
    });
    return () => { cancelled = true; dispose?.(); };
  }, [toast]);

  return (
    <header className="liquid-nav-header">
      <nav aria-label="Primary">
        <div ref={host} className="liquid-nav-host">
          <div className="liquid-nav-loading" aria-label="Loading navigation">
            Home <span>Chapters</span><span>Events</span><span>Societies</span><span>Contact</span>
          </div>
        </div>
      </nav>
    </header>
  );
}
