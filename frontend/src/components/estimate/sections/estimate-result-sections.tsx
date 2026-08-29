"use client";

import { useEffect, useMemo, useState } from "react";
import type { EstimateLocation } from "@/lib/estimate-location";
import {
  computeEstimateMetrics,
  getDefaultBill,
  getSummaryBillOptions,
} from "@/lib/estimate-calculations";
import { ElectricBillCard } from "@/components/estimate/sections/electric-bill-card";
import { SolarSizeCard } from "@/components/estimate/sections/solar-size-card";
import { EnvironmentalImpactSection } from "@/components/estimate/sections/environmental-impact-section";
import { FinanceSection } from "@/components/estimate/sections/finance-section";
import { ProviderCtaSection } from "@/components/estimate/sections/provider-cta-section";

export function EstimateResultSections({ location }: { location: EstimateLocation }) {
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

  return (
    <div className="relative z-10 bg-[image:var(--gradient-page)] pb-20 text-[#231f18]">
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
