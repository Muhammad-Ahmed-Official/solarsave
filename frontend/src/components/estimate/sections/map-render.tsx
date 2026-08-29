"use client";

import { GeocodedPlace } from "@/lib/geocoding";
import { Basemap, CONTEXT_STYLES, SATELLITE_STYLE } from "@/lib/map-styles";
import { setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import { Map, MapRef, Marker, ScaleControl } from "react-map-gl/maplibre";

// Served from public/maplibre by the prebuild/predev copy script.
setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

// default parameters for the map
const DEFAULT_VIEW = { longitude: -98.5795, latitude: 39.8283, zoom: 1.35, pitch: 0, bearing: 0 };
const SELECTED_ZOOM = 2;
const MAX_ZOOM = 21;
const SELECTED_PITCH = 60;
const MAX_PITCH = 75;

export function MapComponent({ place }: { place: GeocodedPlace | null }) {
    const mapRef = useRef<MapRef | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [basemap, setBasemap] = useState<Basemap>("satellite");
    const is3DRef = useRef(true);

    useEffect(() => {
        is3DRef.current = true;
    }, []);

    useEffect(() => {
 
        if (!isReady) {
            return;
        }

        console.log("place", place);
        const map = mapRef.current?.getMap();
        if (!map) {
            console.log("map not found");
            return;
        }

        if(place?.longitude && place.latitude){
            map.flyTo({
                      center: [place.longitude, place.latitude],
                      zoom: SELECTED_ZOOM,
                      pitch: 0,
                      duration: 100,
                      essential: true,
                  });
        }

    }, [place, isReady]);


    return (
        <Map
            ref={mapRef}
            onLoad={() => setIsReady(true)}
            initialViewState={DEFAULT_VIEW}
            minZoom={1}
            maxZoom={MAX_ZOOM}
            maxPitch={MAX_PITCH}
            mapStyle={basemap === "satellite" ? SATELLITE_STYLE : CONTEXT_STYLES.context}
            attributionControl={{ compact: true }}
            style={{ width: "100%", height: "100%" }}
        >
            <ScaleControl position="bottom-left" />

            {(place?.latitude && place.latitude) ? (
                <Marker longitude={place.longitude} latitude={place.latitude} anchor="center">
                    <div className="relative grid place-items-center">
                        <div className="glow absolute -inset-3 rounded-full bg-solar/30 blur-md" />
                        <div className="relative size-4 rounded-full bg-solar ring-2 ring-dusk shadow-[0_0_16px_3px_var(--solar)]" />
                    </div>
                </Marker>
            ) : null}
        </Map>
    )
}