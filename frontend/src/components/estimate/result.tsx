"use client";

import { EstimateResultSections } from "@/components/estimate/sections/estimate-result-sections";
import type { EstimateLocation } from "@/lib/estimate-location";
import { MapPanel } from "@/components/map-panel";
import { useMemo } from "react";
import type { GeocodedPlace } from "@/lib/geocoding";
import { MapComponent } from "@/components/estimate/sections/map-render";
import { FallbackSection } from "./sections/fallback";

export default function Result({
    activityId,
    location,
}: {
    activityId: string;
    location: EstimateLocation;
}) {

      const hasLocation = location.latitude !== null && location.longitude !== null;
  const hasAnalysisResult = Boolean(location.placeId);

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

      if (!hasLocation) {
    return <FallbackSection reason="location" />;
  }

  if (!hasAnalysisResult) {
    return <FallbackSection reason="analysis" />;
  }

    return (
        <main>
            <div className="h-100 w-full bg-black text-white">
                <MapComponent place={place} />
            </div>
            <EstimateResultSections location={location} />
        </main>
    );
}
