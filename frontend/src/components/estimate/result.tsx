"use client";

import { EstimateResultSections } from "@/components/estimate/sections/estimate-result-sections";
import type { EstimateLocation } from "@/lib/estimate-location";

export default function Result({
  activityId,
  location,
}: {
  activityId: string;
  location: EstimateLocation;
}) {
  void activityId;

  return (
    <main>
      <section title="map-section" className="h-100 w-full bg-black text-white">
        this is the map section
      </section>

      <EstimateResultSections location={location} />
    </main>
  );
}
