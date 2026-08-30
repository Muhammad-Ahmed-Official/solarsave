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
import { normalizeState } from "@/lib/financial-engine";
import { ElectricBillCard } from "@/components/estimate/sections/electric-bill-card";
import { SolarSizeCard } from "@/components/estimate/sections/solar-size-card";
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
        state: place?.state ?? location?.subtitle ?? undefined,
      });
    } catch (e) {
      return null;
    }
  }, [fortyGuardResult, metrics.solarSizeKw, location, /* place defined below via memo, but lint wants it */]);

  const place = useMemo(() => estimateLocationToPlace(location), [location]);
  const detailsHref = activityId && place ? `/estimate/${encodeURIComponent(activityId)}/details?${buildEstimateSearchParams(place).toString()}` : null;

  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  useEffect(() => {
    async function runAnalysis() {
      if (!generatorEstimate) return;
      // derive state code from place or subtitle
      let stateCode: string | undefined = undefined;
      try {
        if (place?.state) stateCode = normalizeState(place.state);
        else if (location?.subtitle) {
          const parts = String(location.subtitle).split("•").map((s) => s.trim()).filter(Boolean);
          const guess = parts[parts.length - 1];
          if (guess) stateCode = normalizeState(guess);
        }
      } catch (e) {
        // normalization failed; leave undefined
      }

      if (!stateCode) return; // cannot run authoritative financial analysis without state

      const body = {
        stateCode,
        installationCost: metrics.upfrontCost,
        systemCapacityKw: metrics.solarSizeKw,
        performanceRatio: 0.75,
        fortyGuardResult,
      };

      try {
        const res = await fetch(`/api/analysis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) return;
        const json = await res.json();
        setAnalysisResult(json.result ?? null);
      } catch (e) {
        // ignore failures, leave analysisResult null
        console.error("analysis fetch failed", e);
      }
    }

    void runAnalysis();
  }, [generatorEstimate, place, location, metrics.upfrontCost, metrics.solarSizeKw, fortyGuardResult]);

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
                <div className="text-sm text-[#6d6557]">Derived from a single GHI sample.</div>

                {generatorEstimate.warning ? (
                  <div className="mt-2 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800">{generatorEstimate.warning}</div>
                ) : null}

                {analysisResult ? (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm text-[#4a4337]">Financial summary (engine):</div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-md bg-[#f7faf7] p-3">
                        <div className="text-xs text-[#6d6557]">NPV</div>
                        <div className="text-lg font-semibold">{analysisResult.metrics?.npv !== undefined ? `$${analysisResult.metrics.npv}` : "—"}</div>
                      </div>
                      <div className="rounded-md bg-[#f7faf7] p-3">
                        <div className="text-xs text-[#6d6557]">IRR</div>
                        <div className="text-lg font-semibold">{analysisResult.metrics?.irr !== undefined && Number.isFinite(Number(analysisResult.metrics.irr)) ? `${(Number(analysisResult.metrics.irr) * 100).toFixed(2)}%` : "—"}</div>
                      </div>
                      <div className="rounded-md bg-[#f7faf7] p-3">
                        <div className="text-xs text-[#6d6557]">Payback (yrs)</div>
                        <div className="text-lg font-semibold">{analysisResult.metrics?.paybackYears ?? "—"}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-[#6d6557]">Financial engine result not available yet.</div>
                )}

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


      <FinanceSection
        upfrontCost={metrics.upfrontCost}
        benefits20y={metrics.benefits20y}
        savings20y={metrics.savings20y}
        paybackYears={metrics.paybackYears}
        analysisResult={analysisResult}
      />

      <ProviderCtaSection />
    </div>
  );
}
