'use client';

// ============================================================================
// FleetSplash — navy full-screen intro: spinning anchor cube + wordmark + bar.
// Shows once per session (sessionStorage `fleet_splash`), ~2.2s, reduced-motion aware.
// ============================================================================

import { useEffect, useState } from 'react';
import FleetCube from './FleetCube';

export default function FleetSplash() {
  const [mounted, setMounted] = useState(true);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('fleet_splash')) { setMounted(false); return; }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const wait = reduce ? 900 : 2200;
    const t1 = setTimeout(() => setHide(true), wait);
    const t2 = setTimeout(() => {
      sessionStorage.setItem('fleet_splash', '1');
      setMounted(false);
    }, wait + 650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!mounted) return null;

  return (
    <div className={`fl-splash ${hide ? 'hide' : ''}`} aria-hidden="true">
      <div className="fl-splash__box">
        <FleetCube size={148} draggable={false} spin />
        <div className="fl-splash__wm">Fleet&nbsp;Manager</div>
        <div className="fl-splash__bar"><span /></div>
      </div>
    </div>
  );
}
