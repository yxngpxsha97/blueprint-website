'use client';

// ============================================================================
// Map Component — Leaflet (client-only, no SSR)
// Ship icons that rotate based on heading, smooth animated position updates,
// ship name tooltip on hover, dark nautical map tiles + navy/white marker palette.
// ============================================================================

import { useEffect, useRef } from 'react';
import type { CruiseShip } from '@/lib/cruise-ships';
import type { AisShipPosition } from '@/app/api/fleet/positions/route';

// Use the correct type from the AIS positions route
type ShipPosition = AisShipPosition;

interface MapProps {
  ships: CruiseShip[];
  positions: ShipPosition[];
  onSelectShip: (ship: CruiseShip & { position?: ShipPosition }) => void;
  selectedImo?: string;
}

// Navy/white semantic palette — matches fleet-utils STATUS_COLORS
const STATUS_COLORS: Record<string, string> = {
  underway: '#16A06E', // green — sailing
  moored:   '#2E6CB5', // blue — moored
  anchored: '#E0A52E', // amber — anchored
};

const STATUS_LABELS: Record<string, string> = {
  underway: 'Underway',
  moored: 'Moored',
  anchored: 'Anchored',
};

// SVG ship icon that rotates based on heading.
// The ship silhouette points "up" (north) at 0° — heading rotates it correctly.
function createShipIcon(L: typeof import('leaflet'), color: string, heading: number, isSelected: boolean, shipName: string) {
  const size = isSelected ? 26 : 18;
  // Selected: white glow ring; unselected: subtle drop shadow
  const glowFilter = isSelected
    ? `drop-shadow(0 0 5px ${color}) drop-shadow(0 1px 2px rgba(14,27,46,0.3))`
    : 'drop-shadow(0 1px 2px rgba(14,27,46,0.22))';
  const strokeColor = '#ffffff';
  const strokeWidth = isSelected ? 2 : 1.3;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"
    style="transform: rotate(${heading}deg); filter: ${glowFilter}; display: block;"
  >
    <path d="M12 2 L8 10 L4 20 L12 17 L20 20 L16 10 Z"
      fill="${color}"
      stroke="${strokeColor}"
      stroke-width="${strokeWidth}"
      stroke-linejoin="round"
    />
    ${isSelected ? `<circle cx="12" cy="12" r="2.5" fill="rgba(255,255,255,0.95)" />` : ''}
  </svg>`;

  // tooltip via bindTooltip — no permanent label needed
  void shipName;

  return L.divIcon({
    html: svg,
    className: 'ship-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    tooltipAnchor: [0, -size / 2],
  });
}

export default function MapComponent({ ships, positions, onSelectShip, selectedImo }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<unknown>(null);
  const markersRef = useRef<Map<string, unknown>>(new Map());
  // Track previous positions for smooth animation
  const prevPositionsRef = useRef<Map<string, ShipPosition>>(new Map());

  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    import('leaflet').then((L) => {
      const WORLD = L.latLngBounds([[-58, -179.5], [80, 179.5]]);
      const map = L.map(mapRef.current!, {
        center: [25, 5],
        zoom: 3,
        maxZoom: 18,
        zoomControl: true,
        attributionControl: true,
        maxBounds: WORLD,
        maxBoundsViscosity: 1.0,
        worldCopyJump: false,
      });
      // Never reveal empty space: the furthest zoom-out fills the viewport with the world.
      const fitWorld = () => {
        const z = map.getBoundsZoom(WORLD, true);
        map.setMinZoom(z);
        if (map.getZoom() < z) map.setView(map.getCenter(), z, { animate: false });
      };
      map.whenReady(fitWorld);
      window.addEventListener('resize', fitWorld);
      (map as unknown as { __fitWorld?: () => void }).__fitWorld = fitWorld;

      // Light tile layer — CartoDB Voyager, matches the app's light navy/paper theme
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
          noWrap: true,
        }
      ).addTo(map);

      leafletMapRef.current = map;

      // Build position lookup
      const positionMap = new Map(positions.map((p) => [p.imo, p]));

      ships.forEach((ship) => {
        const pos = positionMap.get(ship.imo);
        if (!pos) return;

        const color = STATUS_COLORS[pos.status] ?? '#5C6B82';
        const isSelected = ship.imo === selectedImo;
        const icon = createShipIcon(L, color, pos.heading, isSelected, ship.name);

        const marker = L.marker([pos.lat, pos.lng], { icon, title: ship.name });

        // Permanent tooltip with ship name — appears on hover
        marker.bindTooltip(ship.name, {
          permanent: false,
          direction: 'top',
          offset: [0, -10],
          className: 'ship-name-tooltip',
          opacity: 1,
        });

        // Detailed popup on click
        const popupContent = buildPopupContent(ship, pos, color);
        marker.bindPopup(popupContent, {
          className: 'ship-popup',
          maxWidth: 260,
          closeButton: false,
          offset: [0, -5],
        });

        marker.on('click', () => {
          onSelectShip({ ...ship, position: pos });
        });

        marker.addTo(map);
        markersRef.current.set(ship.imo, marker);
        prevPositionsRef.current.set(ship.imo, pos);
      });

      // Global handler for popup "Bekijk details" button
      (window as unknown as Record<string, unknown>).__selectShip = (imo: string) => {
        const ship = ships.find((s) => s.imo === imo);
        const pos = positionMap.get(imo);
        if (ship) onSelectShip({ ...ship, position: pos });
        (map as unknown as { closePopup: () => void }).closePopup();
      };
    });

    return () => {
      if (leafletMapRef.current) {
        const m = leafletMapRef.current as unknown as { remove: () => void; __fitWorld?: () => void };
        if (m.__fitWorld) window.removeEventListener('resize', m.__fitWorld);
        m.remove();
        leafletMapRef.current = null;
        markersRef.current.clear();
        prevPositionsRef.current.clear();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when positions or selectedImo change
  useEffect(() => {
    if (!leafletMapRef.current) return;

    import('leaflet').then((L) => {
      const positionMap = new Map(positions.map((p) => [p.imo, p]));

      markersRef.current.forEach((marker, imo) => {
        const pos = positionMap.get(imo);
        if (!pos) return;

        const m = marker as {
          setIcon?: (icon: unknown) => void;
          setLatLng?: (latlng: [number, number]) => void;
          getLatLng?: () => { lat: number; lng: number };
          getPopup?: () => { setContent?: (c: string) => void } | null;
        };

        const prevPos = prevPositionsRef.current.get(imo);
        const color = STATUS_COLORS[pos.status] ?? '#5C6B82';
        const isSelected = imo === selectedImo;
        const ship = ships.find((s) => s.imo === imo);
        if (!ship) return;

        // Update icon (heading + selection state)
        const icon = createShipIcon(L, color, pos.heading, isSelected, ship.name);
        if (m.setIcon) m.setIcon(icon);

        // Animate position if it changed
        if (m.setLatLng && prevPos && (prevPos.lat !== pos.lat || prevPos.lng !== pos.lng)) {
          animateMarker(m as unknown as LeafletMarker, prevPos.lat, prevPos.lng, pos.lat, pos.lng, 1500);
        } else if (m.setLatLng) {
          m.setLatLng([pos.lat, pos.lng]);
        }

        // Update popup content
        const popup = m.getPopup?.();
        if (popup?.setContent) {
          popup.setContent(buildPopupContent(ship, pos, color));
        }

        prevPositionsRef.current.set(imo, pos);
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImo, positions]);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <style>{`
        /* ---- Marker icons ---- */
        .ship-marker {
          background: transparent !important;
          border: none !important;
          cursor: pointer !important;
        }

        /* Light sea background so zoom-out never shows black void */
        .leaflet-container { background: #cfe1f0 !important; }

        /* ---- Ship name tooltip — navy glass pill ---- */
        .ship-name-tooltip {
          background: rgba(10, 18, 33, 0.88) !important;
          border: 1px solid rgba(15, 42, 71, 0.55) !important;
          border-radius: 7px !important;
          color: #f1f4f8 !important;
          font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          padding: 4px 9px !important;
          white-space: nowrap !important;
          box-shadow: 0 2px 10px rgba(10,18,33,0.55) !important;
          letter-spacing: 0.2px !important;
          backdrop-filter: blur(10px) !important;
        }
        .ship-name-tooltip::before {
          display: none !important;
        }
        .leaflet-tooltip-top.ship-name-tooltip::before {
          border-top-color: rgba(15, 42, 71, 0.55) !important;
        }

        /* ---- Popup wrapper reset ---- */
        .ship-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .ship-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        .ship-popup .leaflet-popup-tip-container {
          display: none !important;
        }

        /* ---- Map controls — navy ---- */
        .leaflet-control-attribution {
          background: rgba(10, 18, 33, 0.65) !important;
          color: rgba(255, 255, 255, 0.28) !important;
          font-size: 9px !important;
          backdrop-filter: blur(8px);
        }
        .leaflet-control-attribution a {
          color: rgba(42, 86, 133, 0.75) !important;
        }
        .leaflet-control-zoom a {
          background: rgba(10, 18, 33, 0.88) !important;
          color: rgba(255, 255, 255, 0.75) !important;
          border-color: rgba(15, 42, 71, 0.4) !important;
          backdrop-filter: blur(8px);
        }
        .leaflet-control-zoom a:hover {
          background: rgba(15, 42, 71, 0.92) !important;
          color: #fff !important;
        }
        .leaflet-container {
          background: #070b16 !important;
        }

        /* ---- Smooth position transitions ---- */
        .ship-marker-animating {
          transition: transform 1.5s ease-in-out !important;
        }
      `}</style>
      <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#070b16' }} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Helper: build popup HTML content — navy/white house style
// ---------------------------------------------------------------------------

function buildPopupContent(ship: CruiseShip, pos: ShipPosition, color: string): string {
  const lastUpdateStr = new Date(pos.lastUpdate).toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return `<div style="
    background: linear-gradient(160deg, #0a1628 0%, #0d1f38 100%);
    border: 1px solid rgba(15,42,71,0.55);
    border-radius: 13px;
    padding: 14px 16px;
    color: #f1f4f8;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    min-width: 220px;
    box-shadow: 0 8px 32px rgba(10,18,33,0.7), 0 0 0 1px rgba(15,42,71,0.15);
  ">
    <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px; color: #f1f4f8; letter-spacing: 0.1px;">${ship.name}</div>
    <div style="font-size: 11px; color: rgba(255,255,255,0.6); margin-bottom: 10px; font-weight: 500;">${ship.cruiseLine}</div>

    <div style="
      display: inline-flex; align-items: center; gap: 5px;
      background: ${color}1a; border: 1px solid ${color}40;
      border-radius: 999px; padding: 3px 10px;
      font-size: 11px; font-weight: 600; color: ${color};
      margin-bottom: 10px;
    ">
      <span style="width:6px;height:6px;border-radius:50%;background:${color};box-shadow:0 0 5px ${color};display:inline-block;"></span>
      ${STATUS_LABELS[pos.status] ?? pos.status}
      ${pos.status === 'underway' ? `<span style="opacity:0.7;">— ${pos.speed} kn</span>` : ''}
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 7px; font-size: 11px; margin-bottom: 8px;">
      <div>
        <div style="color:rgba(255,255,255,0.28);font-size:9px;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:2px;">Positie</div>
        <div style="color:#e7ecf3;font-variant-numeric:tabular-nums;">${pos.lat.toFixed(3)}°, ${pos.lng.toFixed(3)}°</div>
      </div>
      <div>
        <div style="color:rgba(255,255,255,0.28);font-size:9px;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:2px;">Koers</div>
        <div style="color:#e7ecf3;font-variant-numeric:tabular-nums;">${pos.heading}°</div>
      </div>
      <div>
        <div style="color:rgba(255,255,255,0.28);font-size:9px;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:2px;">Vlag</div>
        <div style="color:#e7ecf3;">${ship.flag}</div>
      </div>
      <div>
        <div style="color:rgba(255,255,255,0.28);font-size:9px;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:2px;">IMO</div>
        <div style="color:#e7ecf3;font-variant-numeric:tabular-nums;">${ship.imo}</div>
      </div>
    </div>

    <div style="padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); margin-bottom: 10px;">
      <div style="color:rgba(255,255,255,0.28);font-size:9px;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:2px;">Bestemming</div>
      <div style="font-weight:500;color:#e7ecf3;font-size:11px;">${pos.destination}</div>
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div style="font-size:9px;color:rgba(255,255,255,0.25);">
        ${pos.source === 'live'
          ? `<span style="color:rgba(34,165,101,0.75);">● Live AIS</span>`
          : `<span style="color:rgba(154,122,46,0.75);">◎ Gesimuleerd</span>`
        }
      </div>
      <div style="font-size:9px;color:rgba(255,255,255,0.25);font-variant-numeric:tabular-nums;">${lastUpdateStr}</div>
    </div>

    <button
      onclick="window.__selectShip('${ship.imo}')"
      style="
        width: 100%;
        padding: 8px 0;
        background: #0F2A47;
        border: 1px solid rgba(42,86,133,0.6);
        border-radius: 9px;
        color: #fff;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        letter-spacing: 0.2px;
        transition: background 0.15s;
      "
      onmouseover="this.style.background='#1B4068'"
      onmouseout="this.style.background='#0F2A47'"
    >Details bekijken</button>
  </div>`;
}

// ---------------------------------------------------------------------------
// Smooth marker animation — interpolates lat/lng over durationMs
// ---------------------------------------------------------------------------

interface LeafletMarker {
  setLatLng: (latlng: [number, number]) => void;
}

function animateMarker(
  marker: LeafletMarker,
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  durationMs: number,
) {
  const start = performance.now();

  function frame(now: number) {
    const elapsed = now - start;
    const t = Math.min(elapsed / durationMs, 1);
    // Ease in-out cubic
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const lat = fromLat + (toLat - fromLat) * ease;
    const lng = fromLng + (toLng - fromLng) * ease;
    marker.setLatLng([lat, lng]);

    if (t < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}
