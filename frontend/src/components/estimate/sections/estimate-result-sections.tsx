"use client";

import { useEffect, useMemo, useState } from "react";
import type { EstimateLocation } from "@/lib/estimate-location";
import Link from "next/link";
import {
  computeEstimateMetrics,
  getDefaultBill,
  getSummaryBillOptions,
  formatNumber,
} from "@/lib/estimate-calculations";
import { estimateAnnualGenerationKwh } from "@/lib/fortyguard-to-generation";
import { ElectricBillCard } from "@/components/estimate/sections/electric-bill-card";
import { SolarSizeCard } from "@/components/estimate/sections/solar-size-card";
import { EnvironmentalImpactSection } from "@/components/estimate/sections/environmental-impact-section";
import { FinanceSection } from "@/components/estimate/sections/finance-section";
import { ProviderCtaSection } from "@/components/estimate/sections/provider-cta-section";
import { SectionCard } from "@/components/estimate/cards/section-card";
import { estimateLocationToPlace, buildEstimateSearchParams } from "@/lib/estimate-location";

export function EstimateResultSections({ activityId, location, fortyGuardResult }: { activityId?: string; location: EstimateLocation; fortyGuardResult?: any }) {
  const defaultBill = useMemo(() => getDefaultBill(location), [location]);
  const [monthlyBill, setMonthlyBill] = useState(defaultBill);

  useEffect(() => {
    setMonthlyBill(defaultBill);
  }, [defaultBill]);

  const billOptions = useMemo(() => getSummaryBillOptions(defaultBill), [defaultBill]);
  const metrics = useMemo(
    () => computeEstimateMetrics(location, monthlyBill),
    [location, monthlyBill],
  );

  const generatorEstimate = useMemo(() => {
    if (!fortyGuardResult) return null;
    try {
      return estimateAnnualGenerationKwh(fortyGuardResult, {
        systemCapacityKw: metrics.solarSizeKw,
        performanceRatio: 0.75,
      });
    } catch (e) {
      return null;
    }
  }, [fortyGuardResult, metrics.solarSizeKw]);

  const place = useMemo(() => estimateLocationToPlace(location), [location]);
  const detailsHref = activityId && place ? `/estimate/${encodeURIComponent(activityId)}/details?${buildEstimateSearchParams(place).toString()}` : null;

  return (
    <div className="relative z-10 mx-auto max-w-7xl">
      <section className="mx-auto max-w-[1600px] px-4 pt-10 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-normal tracking-[-0.03em] text-[#231f18] sm:text-3xl">
          Fine-tune your information to find out how much you could save.
        </h2>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <ElectricBillCard
            monthlyBill={monthlyBill}
            billOptions={billOptions}
            onBillChange={setMonthlyBill}
          />
          <SolarSizeCard
            solarSizeKw={metrics.solarSizeKw}
            arraySqFt={metrics.arraySqFt}
            coveragePct={metrics.coveragePct}
          />
        </div>

        {/* Session result card (shows FortyGuard-derived generation when available) */}
        <div className="mt-6">
          <SectionCard title="Session results" showInfo>
            {generatorEstimate ? (
              <div className="flex flex-col gap-2">
                <div className="text-lg font-medium">Estimated annual generation</div>
                <div className="text-2xl font-semibold">{formatNumber(generatorEstimate.annualGenerationKwh ?? 0)} kWh / year</div>
                <div className="text-sm text-[#6d6557]">
                  Extrapolated from a single GHI sample: {generatorEstimate.extrapolated ? "Yes" : "No"}
                </div>
                {generatorEstimate.warning ? (
                  <div className="mt-2 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800">{generatorEstimate.warning}</div>
                ) : null}

                {detailsHref ? (
                  <div className="mt-3">
                    <Link href={detailsHref} target="_blank" className="inline-flex items-center gap-2 rounded-full bg-[#eef7ef] px-3 py-2 text-sm text-[#235522]">
                      Show details
                    </Link>
                  </div>
                ) : null}

              </div>
            ) : (
              <div className="text-sm text-[#6d6557]">No session generation data available yet.</div>
            )}
          </SectionCard>
        </div>
      </section>

      <EnvironmentalImpactSection
        impactCo2={metrics.impactCo2}
        impactCars={metrics.impactCars}
        impactTrees={metrics.impactTrees}
      />

      <FinanceSection
        upfrontCost={metrics.upfrontCost}
        benefits20y={metrics.benefits20y}
        savings20y={metrics.savings20y}
        paybackYears={metrics.paybackYears}
      />

      <ProviderCtaSection />
    </div>
  );
}
