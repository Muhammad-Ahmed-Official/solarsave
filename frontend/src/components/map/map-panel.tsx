"use client";

import { useEffect, useRef, useState } from "react";
import { Map, Marker, NavigationControl, ScaleControl, type MapRef } from "react-map-gl/maplibre";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GeocodedPlace } from "@/lib/geocoding";
import { useTheme } from "@/components/theme-provider";

// Served from public/maplibre by the prebuild/predev copy script.
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

const STYLES = {
  light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
} as const;

const DEFAULT_VIEW = { longitude: 12, latitude: 26, zoom: 1.35 };
const SELECTED_ZOOM = 15.5;

export function MapPanel({ place }: { place: GeocodedPlace | null }) {
  const mapRef = useRef<MapRef | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!isReady || !place) {
      return;
    }

    const map = mapRef.current?.getMap();
    if (!map) {
      return;
    }

    // Honour the OS reduce-motion setting rather than always animating.
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.flyTo({
      center: [place.longitude, place.latitude],
      zoom: SELECTED_ZOOM,
      duration: reduceMotion ? 0 : 1400,
      essential: true,
    });
  }, [isReady, place]);

  return (
    <div className="relative h-[300px] lg:h-[340px]">
      <Map
        ref={mapRef}
        onLoad={() => setIsReady(true)}
        initialViewState={DEFAULT_VIEW}
        minZoom={1}
        maxZoom={18}
        mapStyle={STYLES[resolvedTheme]}
        attributionControl={{ compact: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" showCompass={false} />
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
        <div className="pointer-events-none absolute inset-0 grid place-items-center bg-dusk/55 backdrop-blur-[1px]">
          <p className="num rounded-md bg-panel/90 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-mute ring-1 ring-line">
            Search an address to begin
          </p>
        </div>
      ) : null}
    </div>
  );
}
