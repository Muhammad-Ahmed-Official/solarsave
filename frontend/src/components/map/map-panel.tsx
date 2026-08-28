"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Map, Marker, ScaleControl, type MapRef } from "react-map-gl/maplibre";
import { setWorkerUrl, type Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GeocodedPlace } from "@/lib/geocoding";
import { useTheme } from "@/components/theme-provider";
import { CONTEXT_STYLES, SATELLITE_STYLE, type Basemap } from "@/lib/map-styles";

// Served from public/maplibre by the prebuild/predev copy script.
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const DEFAULT_VIEW = { longitude: 12, latitude: 26, zoom: 1.35, pitch: 0, bearing: 0 };

/**
 * Roof scale. The previous 15.5 framed a neighbourhood, which is the wrong
 * altitude for a tool whose subject is a single building.
 */
const SELECTED_ZOOM = 19.5;
const MAX_ZOOM = 21;
const SELECTED_PITCH = 60;
/** Enough tilt to read a roof, short of the grazing angles that smear imagery. */
const MAX_PITCH = 75;
/** One full sweep of the building on arrival, then the camera hands back over. */
const ORBIT_MS = 9000;
const FLY_MS = 2200;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function MapPanel({ place }: { place: GeocodedPlace | null }) {
  const mapRef = useRef<MapRef | null>(null);
  const compassRef = useRef<HTMLSpanElement | null>(null);
  const orbitRef = useRef<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [basemap, setBasemap] = useState<Basemap>("satellite");
  const [is3D, setIs3D] = useState(true);
  const { resolvedTheme } = useTheme();

  // Read inside the arrival effect without making the camera re-run on every
  // toggle: tilting should change the pitch, not replay the whole flight.
  const is3DRef = useRef(is3D);
  useEffect(() => {
    is3DRef.current = is3D;
  }, [is3D]);

  const stopOrbit = useCallback(() => {
    if (orbitRef.current !== null) {
      cancelAnimationFrame(orbitRef.current);
      orbitRef.current = null;
    }
  }, []);

  const startOrbit = useCallback(
    (map: MapLibreMap) => {
      stopOrbit();
      const from = map.getBearing();
      const start = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - start) / ORBIT_MS);
        // Ease in and out so the sweep starts and settles gently instead of
        // snapping into constant rotation.
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        map.setBearing(from + eased * 360);
        orbitRef.current = t < 1 ? requestAnimationFrame(step) : null;
      };

      orbitRef.current = requestAnimationFrame(step);
    },
    [stopOrbit]
  );

  // Arrival: fly in, tilt, then orbit the building once.
  useEffect(() => {
    if (!isReady || !place) {
      return;
    }

    const map = mapRef.current?.getMap();
    if (!map) {
      return;
    }

    stopOrbit();
    // Honour the OS reduce-motion setting rather than always animating.
    const reduceMotion = prefersReducedMotion();
    const tilted = is3DRef.current;

    map.flyTo({
      center: [place.longitude, place.latitude],
      zoom: SELECTED_ZOOM,
      pitch: tilted ? SELECTED_PITCH : 0,
      // Slightly off north reads as a considered camera angle rather than a
      // screenshot, and gives the orbit somewhere to start from.
      bearing: -20,
      duration: reduceMotion ? 0 : FLY_MS,
      essential: true,
    });

    if (reduceMotion || !tilted) {
      return;
    }

    const onArrive = () => startOrbit(map);
    map.once("moveend", onArrive);

    return () => {
      map.off("moveend", onArrive);
      stopOrbit();
    };
  }, [isReady, place, startOrbit, stopOrbit]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const map = mapRef.current?.getMap();
    if (!map) {
      return;
    }

    // Any deliberate camera input cancels the orbit — the animation is a
    // flourish, never something to fight.
    const events = ["dragstart", "mousedown", "wheel", "touchstart"] as const;
    events.forEach((event) => map.on(event, stopOrbit));

    // The compass is updated imperatively: bearing changes every frame during
    // an orbit, and routing that through state would re-render the tree sixty
    // times a second to set one transform.
    const syncCompass = () => {
      if (compassRef.current) {
        compassRef.current.style.transform = `rotate(${-map.getBearing()}deg)`;
      }
    };
    map.on("rotate", syncCompass);
    syncCompass();

    return () => {
      events.forEach((event) => map.off(event, stopOrbit));
      map.off("rotate", syncCompass);
    };
  }, [isReady, stopOrbit]);

  useEffect(() => stopOrbit, [stopOrbit]);

  const toggle3D = useCallback(() => {
    const next = !is3D;
    setIs3D(next);

    const map = mapRef.current?.getMap();
    if (!map) {
      return;
    }

    stopOrbit();
    map.easeTo({
      pitch: next ? SELECTED_PITCH : 0,
      duration: prefersReducedMotion() ? 0 : 600,
    });
  }, [is3D, stopOrbit]);

  const resetNorth = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) {
      return;
    }

    stopOrbit();
    map.easeTo({ bearing: 0, duration: prefersReducedMotion() ? 0 : 400 });
  }, [stopOrbit]);

  const zoomBy = useCallback((delta: number) => {
    const map = mapRef.current?.getMap();
    map?.easeTo({ zoom: map.getZoom() + delta, duration: 220 });
  }, []);

  /*
   * The map owns the viewport rather than a box inside it. Two sibling layers
   * rather than one wrapper: `position: fixed` always creates a stacking
   * context, so controls nested inside the map layer would sit under the
   * panels no matter what z-index they were given.
   */
  return (
    <>
      <div className="fixed inset-0 z-0">
        <Map
          ref={mapRef}
          onLoad={() => setIsReady(true)}
          initialViewState={DEFAULT_VIEW}
          minZoom={1}
          maxZoom={MAX_ZOOM}
          maxPitch={MAX_PITCH}
          mapStyle={basemap === "satellite" ? SATELLITE_STYLE : CONTEXT_STYLES[resolvedTheme]}
          attributionControl={{ compact: true }}
          style={{ width: "100%", height: "100%" }}
        >
          <ScaleControl position="bottom-left" />

          {place ? (
            <Marker longitude={place.longitude} latitude={place.latitude} anchor="center">
              <div className="relative grid place-items-center">
                <div className="glow absolute -inset-3 rounded-full bg-solar/30 blur-md" />
                <div className="relative size-4 rounded-full bg-solar ring-2 ring-dusk shadow-[0_0_16px_3px_var(--solar)]" />
              </div>
            </Marker>
          ) : null}
        </Map>

        {!place ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-dusk/45 backdrop-blur-[10px]">
            <p className="num glass rounded-md px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-mute ring-1 ring-line">
              Search an address to begin
            </p>
          </div>
        ) : null}
      </div>

      <MapControls
        compassRef={compassRef}
        is3D={is3D}
        basemap={basemap}
        onToggle3D={toggle3D}
        onToggleBasemap={() => setBasemap((b) => (b === "satellite" ? "context" : "satellite"))}
        onResetNorth={resetNorth}
        onZoomIn={() => zoomBy(1)}
        onZoomOut={() => zoomBy(-1)}
      />
    </>
  );
}

/**
 * The controls sit bottom-centre rather than in MapLibre's own top-right
 * container: on this layout the side rails own both upper corners, and the
 * centre strip is the one part of the viewport that is always map.
 */
function MapControls({
  compassRef,
  is3D,
  basemap,
  onToggle3D,
  onToggleBasemap,
  onResetNorth,
  onZoomIn,
  onZoomOut,
}: {
  compassRef: RefObject<HTMLSpanElement | null>;
  is3D: boolean;
  basemap: Basemap;
  onToggle3D: () => void;
  onToggleBasemap: () => void;
  onResetNorth: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <div className="glass pointer-events-auto flex items-center gap-0.5 rounded-full p-1 ring-1 ring-line shadow-[var(--shadow-soft)]">
        <ControlButton onClick={onZoomOut} label="Zoom out">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-4">
            <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </ControlButton>
        <ControlButton onClick={onZoomIn} label="Zoom in">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-4">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </ControlButton>

        <span className="mx-1 h-5 w-px bg-line" />

        <ControlButton onClick={onResetNorth} label="Reset bearing to north">
          <span ref={compassRef} className="grid size-4 place-items-center">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden className="size-4">
              <path d="M12 3 15 13l-3-2-3 2z" className="fill-solar" />
              <path d="M12 13v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
        </ControlButton>

        <ControlButton onClick={onToggle3D} label="Toggle 3D tilt" pressed={is3D}>
          <span className="num px-0.5 text-[11px] font-medium">3D</span>
        </ControlButton>

        <ControlButton
          onClick={onToggleBasemap}
          label={basemap === "satellite" ? "Switch to map view" : "Switch to satellite view"}
          pressed={basemap === "satellite"}
        >
          <span className="num px-1 text-[11px] font-medium">
            {basemap === "satellite" ? "SAT" : "MAP"}
          </span>
        </ControlButton>
      </div>
    </div>
  );
}

function ControlButton({
  onClick,
  label,
  pressed,
  children,
}: {
  onClick: () => void;
  label: string;
  pressed?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      className={`grid h-8 min-w-8 place-items-center rounded-full px-1.5 transition-colors hover:bg-panel2 ${
        pressed ? "bg-panel2 text-paper ring-1 ring-sage/50" : "text-mute"
      }`}
    >
      {children}
    </button>
  );
}
