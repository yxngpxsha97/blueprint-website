'use client';

// Marifest PWA — registers the service worker (scope /fleet) in production only,
// so local dev / HMR is never affected. Manifest + icons already make it
// installable on iOS; this adds the Android install prompt + offline shell.
import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return; // skip in dev
    navigator.serviceWorker.register('/sw.js', { scope: '/fleet' }).catch(() => {});
  }, []);
  return null;
}
