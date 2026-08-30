"use client";

import { GeocodedPlace } from "@/lib/geocoding";
import { Basemap, CONTEXT_STYLES, SATELLITE_STYLE } from "@/lib/map-styles";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Map,
  MapRef,
  Marker,
  ScaleControl,
  NavigationControl,
} from "react-map-gl/maplibre";

// Served from public/maplibre by the prebuild/predev copy script.
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

// default parameters for the map
const DEFAULT_VIEW = {
  longitude: -98.5795,
  latitude: 39.8283,
  zoom: 1.35,
  pitch: 0,
  bearing: 0,
};
const SELECTED_ZOOM = 17;
const MAX_ZOOM = 21;
const SELECTED_PITCH = 60;

export function MapComponent({ place }: { place: GeocodedPlace | null }) {
  const mapRef = useRef<MapRef | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [basemap] = useState<Basemap>("satellite");

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const map = mapRef.current?.getMap();
    if (!map) {
      return;
    }

    if (
      place &&
      typeof place.longitude === "number" &&
      typeof place.latitude === "number"
    ) {
      map.flyTo({
        center: [place.longitude, place.latitude],
        zoom: SELECTED_ZOOM,
        pitch: SELECTED_PITCH,
        bearing: -20,
        duration: 2200,
        essential: true,
      });
    }
  }, [place, isReady]);

  const fit = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (
      place &&
      typeof place.longitude === "number" &&
      typeof place.latitude === "number"
    ) {
      const lat = place.latitude;
      const lng = place.longitude;
      // Pan to the location keeping the current zoom level (do not zoom out)
      const currentZoom = map.getZoom();
      map.easeTo({ center: [lng, lat], zoom: currentZoom, duration: 600 });
    } else {
      // No place: pan to default view (preserve default zoom)
      map.easeTo({ center: [DEFAULT_VIEW.longitude, DEFAULT_VIEW.latitude], zoom: DEFAULT_VIEW.zoom, duration: 600 });
    }
  }, []);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        onLoad={() => setIsReady(true)}
        initialViewState={DEFAULT_VIEW}
        minZoom={1}
        maxZoom={MAX_ZOOM}
        maxPitch={0}
        mapStyle={
          basemap === "satellite" ? SATELLITE_STYLE : CONTEXT_STYLES.context
        }
        attributionControl={{ compact: true }}
        style={{ width: "100%", height: "100%" }}
        // interaction controls: disable mouse wheel and double-click zoom but keep programmatic zoom
        scrollZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
      >
        <ScaleControl position="bottom-left" />
        <NavigationControl position="top-right" showCompass={false} />

        {place &&
        typeof place.longitude === "number" &&
        typeof place.latitude === "number" ? (
          <Marker
            longitude={place.longitude}
            latitude={place.latitude}
            anchor="center"
          >
            <div className="relative grid place-items-center">
              {/* Outer white ping */}
              <span className="absolute -inset-3 rounded-full bg-white/80 opacity-80 blur-sm animate-ping" />
              {/* Inner blue marker */}
              <div className="relative size-4 rounded-full bg-blue-600 ring-2 ring-white shadow-[0_0_16px_3px_rgba(37,99,235,0.35)]" />
            </div>
          </Marker>
        ) : null}
      </Map>

      {/* Fit-to-screen control */}
      <div className="absolute right-2 top-20 z-50 flex flex-col gap-2">
        <button
          type="button"
          aria-label="Fit to screen"
          onClick={fit}
          className="rounded-md bg-white/90 px-3 py-2 text-sm text-black shadow"
        >
          Fit
        </button>
      </div>
    </div>
  );
}
