'use client';

// ============================================================================
// FleetCube — 3D navy cube with a white anchor glyph on each face.
// Ported from Gugten's draggable triple-G cube; glyph swapped to an anchor.
// Drag-to-spin with inertia + gentle idle drift (reduced-motion safe).
// ============================================================================

import { useEffect, useRef } from 'react';

// Anchor glyph, centered in a 100×100 box (stroke-based, rounded).
const ANCHOR = (
  <svg viewBox="0 0 100 100" fill="none" stroke="#fff" strokeWidth={6.5}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="50" cy="20" r="8" />
    <path d="M50 28 V82" />
    <path d="M30 44 H70" />
    <path d="M22 60 a28 28 0 0 0 56 0" />
    <path d="M22 60 l-8 -4 M22 60 l8 -6" />
    <path d="M78 60 l8 -4 M78 60 l-8 -6" />
  </svg>
);

const FACES = ['f', 'b', 'r', 'l', 't', 'd'] as const;

export default function FleetCube({
  size = 220,
  draggable = true,
  spin = false,
  className = '',
}: {
  size?: number;
  draggable?: boolean;
  spin?: boolean;     // CSS auto-spin (used by splash)
  className?: string;
}) {
  const z = size / 2;
  const ref = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!draggable || spin) return;
    const host = ref.current;
    const cube = cubeRef.current;
    if (!host || !cube) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let rx = -20, ry = -25, vx = 0, vy = 0;
    let dragging = false, lastX = 0, lastY = 0, raf = 0;
    const SENS = 0.42, FR = 0.94, IDLE = reduce ? 0 : 0.12;

    const apply = () => { cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`; };
    const loop = () => {
      if (!dragging) {
        ry += vy + IDLE; rx += vx + IDLE * 0.16;
        vx *= FR; vy *= FR;
        rx = Math.max(-80, Math.min(80, rx));
      }
      apply();
      raf = requestAnimationFrame(loop);
    };
    const down = (e: PointerEvent) => {
      dragging = true; lastX = e.clientX; lastY = e.clientY;
      host.classList.add('dragging'); host.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      ry += dx * SENS; rx -= dy * SENS;
      rx = Math.max(-80, Math.min(80, rx));
      vy = dx * SENS * 0.5; vx = -dy * SENS * 0.5;
      apply();
    };
    const up = () => { dragging = false; host.classList.remove('dragging'); };

    host.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [draggable, spin]);

  const faceTransform = (f: typeof FACES[number]) => {
    switch (f) {
      case 'f': return `translateZ(${z}px)`;
      case 'b': return `rotateY(180deg) translateZ(${z}px)`;
      case 'r': return `rotateY(90deg) translateZ(${z}px)`;
      case 'l': return `rotateY(-90deg) translateZ(${z}px)`;
      case 't': return `rotateX(90deg) translateZ(${z}px)`;
      case 'd': return `rotateX(-90deg) translateZ(${z}px)`;
    }
  };

  return (
    <div
      ref={ref}
      className={`fl-cube ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        ref={cubeRef}
        className={`fl-cube__c ${spin ? 'fl-splash__cube' : ''}`}
        style={{ width: size, height: size }}
      >
        {FACES.map((f) => (
          <div key={f} className="fl-cube__f" style={{ transform: faceTransform(f) }}>
            {ANCHOR}
          </div>
        ))}
      </div>
    </div>
  );
}
