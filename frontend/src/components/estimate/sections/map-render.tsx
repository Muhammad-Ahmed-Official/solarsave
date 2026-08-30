"use client";

import { GeocodedPlace } from "@/lib/geocoding";
import { Basemap, CONTEXT_STYLES, SATELLITE_STYLE } from "@/lib/map-styles";
import { LngLatBounds, setWorkerUrl } from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Map,
  MapRef,
  Marker,
  ScaleControl,
  NavigationControl,
} from "react-map-gl/maplibre";
import { TiLocation } from "react-icons/ti";

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
const SELECTED_ZOOM = 18;
const MAX_ZOOM = 21;
const SELECTION_PADDING = 96;

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
      const bounds = new LngLatBounds(
        [place.longitude, place.latitude],
        [place.longitude, place.latitude],
      ).extend([place.longitude - 0.0008, place.latitude - 0.0008]).extend([place.longitude + 0.0008, place.latitude + 0.0008]);

      map.fitBounds(bounds, {
        padding: SELECTION_PADDING,
        maxZoom: SELECTED_ZOOM,
        duration: 1800,
        essential: true,
      });
      return;
    }

    map.easeTo({
      center: [DEFAULT_VIEW.longitude, DEFAULT_VIEW.latitude],
      zoom: DEFAULT_VIEW.zoom,
      pitch: DEFAULT_VIEW.pitch,
      bearing: DEFAULT_VIEW.bearing,
      duration: 1200,
      essential: true,
    });
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
      const bounds = new LngLatBounds([lng, lat], [lng, lat])
        .extend([lng - 0.0008, lat - 0.0008])
        .extend([lng + 0.0008, lat + 0.0008]);
      map.fitBounds(bounds, { padding: SELECTION_PADDING, maxZoom: SELECTED_ZOOM, duration: 700 });
    } else {
      map.easeTo({ center: [DEFAULT_VIEW.longitude, DEFAULT_VIEW.latitude], zoom: DEFAULT_VIEW.zoom, duration: 600 });
    }
  }, [place]);

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
              <span className="pointer-events-none absolute inset-0 m-auto size-10 rounded-full bg-white/80 opacity-80 blur-sm animate-ping" />
              <span className="absolute size-8 rounded-full border-2 border-blue-500/60 bg-blue-500/10" />
              <div className="relative size-4 rounded-full bg-blue-600 ring-2 ring-white shadow-[0_0_16px_3px_rgba(37,99,235,0.45)]" />
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
            <TiLocation size={14}/>
        </button>
      </div>
    </div>
  );
}
