"use client";

import { EstimateResultSections } from "@/components/estimate/sections/estimate-result-sections";
import type { EstimateLocation } from "@/lib/estimate-location";
import { useMemo } from "react";
import type { GeocodedPlace } from "@/lib/geocoding";
import { MapComponent } from "@/components/estimate/sections/map-render";

export default function Result({
    activityId,
    location,
    fortyGuardResult,
}: {
    activityId: string;
    location: EstimateLocation;
    fortyGuardResult?: any;
}) {

    const place = useMemo(() => {
        return {
            id: location.placeId,
            displayName: location.title,
            latitude: location.latitude,
            longitude: location.longitude,
            title: location.title,
            subtitle: location.subtitle,
        } as GeocodedPlace;
    }, [location]);

    return (
        <main>
            <div className="h-100 w-full bg-black text-white">
                <MapComponent place={place} />
            </div>
            <EstimateResultSections location={location} fortyGuardResult={fortyGuardResult} />
        </main>
    );
}
