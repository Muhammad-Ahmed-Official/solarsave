"use client";

import { useMemo, useState } from "react";
import { Document, Page, Text, View, pdf, StyleSheet } from "@react-pdf/renderer";
import type { EstimateLocation } from "@/lib/estimate-location";
import {
  computeEstimateMetrics,
  getDefaultBill,
  getSummaryBillOptions,
  formatNumber,
} from "@/lib/estimate-calculations";
import { estimateAnnualGenerationKwh } from "@/lib/fortyguard-to-generation";
import { ElectricBillCard } from "@/components/estimate/sections/electric-bill-card";
import { SolarSizeCard } from "@/components/estimate/sections/solar-size-card";
import { FinanceSection } from "@/components/estimate/sections/finance-section";
import { ProviderCtaSection } from "@/components/estimate/sections/provider-cta-section";
import { InfoIcon, SectionCard } from "@/components/estimate/cards/section-card";
import { estimateLocationToPlace } from "@/lib/estimate-location";
import { useEstimateSession } from "@/components/estimate/estimate-session-context";
import { FinanceComparisonChart } from "@/components/estimate/sections/finance-comparison-chart";
import { buildSolarComparisonSeries } from "@/lib/solar-comparison";

const pdfStyles = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 28, paddingHorizontal: 28, fontSize: 10.5, color: "#231f18", lineHeight: 1.45 },
  hero: { marginBottom: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#d9cfbf" },
  eyebrow: { fontSize: 9, color: "#7f745f", letterSpacing: 0.6, textTransform: "uppercase" },
  title: { fontSize: 23, marginTop: 6, marginBottom: 8 },
  subtitle: { fontSize: 11, color: "#5f594f" },
  section: { marginTop: 14 },
  sectionTitle: { fontSize: 15, marginBottom: 8, color: "#1f4d2c" },
  paragraph: { marginBottom: 6, color: "#3c372f" },
  twoCol: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6 },
  statCard: { width: "48%", padding: 10, borderWidth: 1, borderColor: "#e7dcc7", borderRadius: 10, backgroundColor: "#f9f4ed" },
  statLabel: { fontSize: 8.5, color: "#7a715f", marginBottom: 4, textTransform: "uppercase" },
  statValue: { fontSize: 15, color: "#231f18" },
  equationBox: { marginTop: 6, marginBottom: 8, padding: 10, borderWidth: 1, borderColor: "#dbe8d7", borderRadius: 10, backgroundColor: "#f7faf7" },
  equation: { fontSize: 10.5, color: "#173d22", marginBottom: 4 },
  bullet: { marginBottom: 4, paddingLeft: 8 },
  muted: { color: "#6d6557" },
  table: { marginTop: 8, borderWidth: 1, borderColor: "#e7dcc7", borderRadius: 10, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f3ece2", paddingVertical: 6, paddingHorizontal: 8 },
  tableRow: { flexDirection: "row", paddingVertical: 5, paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: "#efe6d9" },
  cellYear: { width: "12%" },
  cell: { width: "22%" },
  cellWide: { width: "22%" },
  headerText: { fontSize: 8.5, color: "#6d6557" },
  cellText: { fontSize: 9.2, color: "#231f18" },
  footer: { position: "absolute", bottom: 16, left: 28, right: 28, fontSize: 8.5, color: "#7a715f", textAlign: "center" },
});

function formatPdfCurrency(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function formatPdfPercent(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(2)}%`;
}

function BreakdownPdf({
  data,
}: {
  data: {
    place: { displayName?: string | null; title?: string | null; state?: string | null } | null;
    monthlyBill: number;
    solarSizeKw: number;
    upfrontCost: number;
    generatorEstimate: {
      annualGenerationKwh?: number | null;
      annualIrradianceKwhPerM2?: number | null;
      ghiWattsPerM2?: number | null;
      peakSunHoursPerDayUsed?: number;
      annualGenerationFormulaHours?: number | null;
      systemCapacityKwUsed?: number;
      performanceRatioUsed?: number;
      derived?: boolean;
      warning?: string;
    } | null;
    analysisResult: {
      electricity?: {
        stateName?: string;
        period?: string;
        dollarsPerKwh?: number;
      };
      treasury?: {
        date?: string;
        rate?: number;
      };
      assumptions?: {
        projectYears?: number;
        annualDegradation?: number;
        electricityInflation?: number;
        annualMaintenanceCost?: number;
        maintenanceInflation?: number;
        incentives?: number;
        riskPremium?: number;
        discountRate?: number;
        annualConsumptionKwh?: number;
        annualGenerationKwh?: number;
        ghiWattsPerM2?: number | null;
        peakSunHoursPerDay?: number | null;
        annualGenerationFormulaHours?: number | null;
      };
      metrics?: {
        netInstallationCost?: number;
        discountRate?: number;
        npv?: number;
        irr?: number;
        roi?: number;
        paybackYears?: number;
        lifetimeGrossSavings?: number;
        lifetimeOperatingSavings?: number;
        lifetimeNetProfit?: number;
        financiallyAttractive?: boolean;
        annualConsumptionKwh?: number;
        annualGenerationKwh?: number;
        ghiWattsPerM2?: number;
        peakSunHoursPerDay?: number;
        annualGenerationFormulaHours?: number;
      };
      annualCashFlows?: Array<{
        year?: number;
        annualConsumptionKwh?: number;
        annualGenerationKwh?: number;
        pricePerKwh?: number;
        grossSavings?: number;
        netCashFlow?: number;
        gridCost?: number;
        instantInstall?: number;
        leaseCost?: number;
        maintenanceCost?: number;
      }>;
    } | null;
  };
}) {
  const title = data.place?.displayName ?? data.place?.title ?? "Selected location";
  const annualConsumption = Number(data.analysisResult?.metrics?.annualConsumptionKwh ?? 0);
  const annualGeneration = Number(data.analysisResult?.metrics?.annualGenerationKwh ?? data.generatorEstimate?.annualGenerationKwh ?? 0);
  const ghi = Number(data.analysisResult?.metrics?.ghiWattsPerM2 ?? data.generatorEstimate?.ghiWattsPerM2 ?? 0);
  const peakSunHours = Number(data.analysisResult?.metrics?.peakSunHoursPerDay ?? data.generatorEstimate?.peakSunHoursPerDayUsed ?? 0);
  const formulaHours = Number(data.analysisResult?.metrics?.annualGenerationFormulaHours ?? data.generatorEstimate?.annualGenerationFormulaHours ?? 0);
  const projectYears = Number(data.analysisResult?.assumptions?.projectYears ?? 25);
  const annualRows = data.analysisResult?.annualCashFlows ?? [];
  const sampleRows = annualRows.slice(0, Math.min(10, annualRows.length));

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.hero}>
          <Text style={pdfStyles.eyebrow}>SolarSave analysis breakdown</Text>
          <Text style={pdfStyles.title}>Detailed estimate and calculation guide</Text>
          <Text style={pdfStyles.subtitle}>{title}</Text>
          <Text style={[pdfStyles.subtitle, { marginTop: 4 }]}>This report explains the live location estimate, the generation derivation, and the financial model used to produce the result.</Text>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Executive summary</Text>
          <View style={pdfStyles.statGrid}>
            <View style={pdfStyles.statCard}>
              <Text style={pdfStyles.statLabel}>Grid annual consumption</Text>
              <Text style={pdfStyles.statValue}>{formatNumber(annualConsumption)} kWh/yr</Text>
            </View>
            <View style={pdfStyles.statCard}>
              <Text style={pdfStyles.statLabel}>Estimated annual generation</Text>
              <Text style={pdfStyles.statValue}>{formatNumber(annualGeneration)} kWh/yr</Text>
            </View>
            <View style={pdfStyles.statCard}>
              <Text style={pdfStyles.statLabel}>Net installation cost</Text>
              <Text style={pdfStyles.statValue}>{formatPdfCurrency(data.analysisResult?.metrics?.netInstallationCost ?? data.upfrontCost)}</Text>
            </View>
            <View style={pdfStyles.statCard}>
              <Text style={pdfStyles.statLabel}>20–25 year net profit</Text>
              <Text style={pdfStyles.statValue}>{formatPdfCurrency(data.analysisResult?.metrics?.lifetimeNetProfit)}</Text>
            </View>
            <View style={pdfStyles.statCard}>
              <Text style={pdfStyles.statLabel}>Net present value</Text>
              <Text style={pdfStyles.statValue}>{formatPdfCurrency(data.analysisResult?.metrics?.npv)}</Text>
            </View>
            <View style={pdfStyles.statCard}>
              <Text style={pdfStyles.statLabel}>Payback year</Text>
              <Text style={pdfStyles.statValue}>{Number(data.analysisResult?.metrics?.paybackYears) > 0 ? String(data.analysisResult?.metrics?.paybackYears) : "No payback in model horizon"}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Source inputs</Text>
          <Text style={pdfStyles.paragraph}>The estimate combines your selected monthly electricity bill, a live FortyGuard irradiance sample, a state-level peak-sun-hours assumption, the latest state residential electricity price, and a treasury-derived discount rate.</Text>
          <View style={pdfStyles.twoCol}>
            <View style={pdfStyles.col}>
              <Text style={pdfStyles.bullet}>• Monthly electricity bill: {formatPdfCurrency(data.monthlyBill)}</Text>
              <Text style={pdfStyles.bullet}>• Estimated system size used: {formatNumber(data.generatorEstimate?.systemCapacityKwUsed ?? data.solarSizeKw)} kW</Text>
              <Text style={pdfStyles.bullet}>• Performance ratio used: {formatNumber(Number(data.generatorEstimate?.performanceRatioUsed ?? 0.75))}</Text>
              <Text style={pdfStyles.bullet}>• GHI sample: {formatNumber(ghi)} W/m²</Text>
            </View>
            <View style={pdfStyles.col}>
              <Text style={pdfStyles.bullet}>• Peak sun hours/day: {formatNumber(peakSunHours)}</Text>
              <Text style={pdfStyles.bullet}>• Formula hours/year: {formatNumber(formulaHours)}</Text>
              <Text style={pdfStyles.bullet}>• State electricity price: {formatPdfCurrency(data.analysisResult?.electricity?.dollarsPerKwh)} per kWh</Text>
              <Text style={pdfStyles.bullet}>• Treasury rate date: {data.analysisResult?.treasury?.date ?? "—"}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Derivation guide</Text>
          <View style={pdfStyles.equationBox}>
            <Text style={pdfStyles.equation}>1. Grid annual consumption = (monthly bill ÷ electricity price per kWh) × 12</Text>
            <Text style={pdfStyles.paragraph}>Using the inputs above, the model converts a monthly spend estimate into annual household electricity consumption.</Text>
            <Text style={pdfStyles.paragraph}>Result: ({formatPdfCurrency(data.monthlyBill)} ÷ {formatPdfCurrency(data.analysisResult?.electricity?.dollarsPerKwh)}) × 12 = {formatNumber(annualConsumption)} kWh/year</Text>
          </View>
          <View style={pdfStyles.equationBox}>
            <Text style={pdfStyles.equation}>2. Annual irradiance = GHI × peak sun hours/day × 365 ÷ 1000</Text>
            <Text style={pdfStyles.paragraph}>The report uses the live FortyGuard GHI sample and a state-level peak-sun-hours assumption to derive a practical yearly irradiation estimate.</Text>
            <Text style={pdfStyles.paragraph}>Result: {formatNumber(ghi)} × {formatNumber(peakSunHours)} × 365 ÷ 1000 = {formatNumber(Number(data.generatorEstimate?.annualIrradianceKwhPerM2 ?? 0))} kWh/m²/year</Text>
          </View>
          <View style={pdfStyles.equationBox}>
            <Text style={pdfStyles.equation}>3. Estimated annual generation = annual irradiance × system capacity × performance ratio</Text>
            <Text style={pdfStyles.paragraph}>This converts irradiation into a lightweight production estimate for the selected solar system size.</Text>
            <Text style={pdfStyles.paragraph}>Result: {formatNumber(Number(data.generatorEstimate?.annualIrradianceKwhPerM2 ?? 0))} × {formatNumber(data.generatorEstimate?.systemCapacityKwUsed ?? data.solarSizeKw)} × {formatNumber(Number(data.generatorEstimate?.performanceRatioUsed ?? 0.75))} = {formatNumber(annualGeneration)} kWh/year</Text>
          </View>
          <View style={pdfStyles.equationBox}>
            <Text style={pdfStyles.equation}>4. Yearly solar savings = yearly solar generation × annual electricity price for that year</Text>
            <Text style={pdfStyles.paragraph}>The model degrades generation each year and inflates electricity price each year, then calculates gross savings and subtracts maintenance to get annual net cash flow.</Text>
          </View>
          <View style={pdfStyles.equationBox}>
            <Text style={pdfStyles.equation}>5. Discount rate = 10-year treasury rate + risk premium</Text>
            <Text style={pdfStyles.paragraph}>NPV is calculated from year 0 installation cost and future yearly cash flows discounted by this rate.</Text>
            <Text style={pdfStyles.paragraph}>Result: {formatPdfPercent(data.analysisResult?.treasury?.rate)} + {formatPdfPercent(data.analysisResult?.assumptions?.riskPremium)} = {formatPdfPercent((Number(data.analysisResult?.assumptions?.discountRate) || Number(data.analysisResult?.metrics?.discountRate)) / 1)}</Text>
          </View>
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Assumptions and model behavior</Text>
          <Text style={pdfStyles.bullet}>• Project horizon: {projectYears} years</Text>
          <Text style={pdfStyles.bullet}>• Annual panel degradation: {formatPdfPercent(data.analysisResult?.assumptions?.annualDegradation)}</Text>
          <Text style={pdfStyles.bullet}>• Electricity price inflation: {formatPdfPercent(data.analysisResult?.assumptions?.electricityInflation)}</Text>
          <Text style={pdfStyles.bullet}>• Annual maintenance cost: {formatPdfCurrency(data.analysisResult?.assumptions?.annualMaintenanceCost)}</Text>
          <Text style={pdfStyles.bullet}>• Maintenance inflation: {formatPdfPercent(data.analysisResult?.assumptions?.maintenanceInflation)}</Text>
          <Text style={pdfStyles.bullet}>• Incentives: {formatPdfCurrency(data.analysisResult?.assumptions?.incentives)}</Text>
          <Text style={pdfStyles.bullet}>• Risk premium: {formatPdfPercent(data.analysisResult?.assumptions?.riskPremium)}</Text>
          <Text style={pdfStyles.bullet}>• Financial attractiveness flag: {data.analysisResult?.metrics?.financiallyAttractive ? "Attractive under model assumptions" : "Not attractive under current model assumptions"}</Text>
          {data.generatorEstimate?.warning ? (
            <Text style={[pdfStyles.paragraph, pdfStyles.muted]}>Note: {data.generatorEstimate.warning.replaceAll("extrapolated", "derived")}. This is a quick estimator and not a full PV performance simulation.</Text>
          ) : null}
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Financial interpretation</Text>
          <Text style={pdfStyles.paragraph}>Net present value (NPV) discounts all modeled cash flows back to today. Internal rate of return (IRR) is the discount rate that makes the project NPV equal to zero. Return on investment (ROI) compares lifetime net profit to net installation cost. Payback year is the first year in which cumulative undiscounted savings recover the net installation cost.</Text>
          <View style={pdfStyles.twoCol}>
            <View style={pdfStyles.col}>
              <Text style={pdfStyles.bullet}>• NPV: {formatPdfCurrency(data.analysisResult?.metrics?.npv)}</Text>
              <Text style={pdfStyles.bullet}>• IRR: {formatPdfPercent(data.analysisResult?.metrics?.irr)}</Text>
              <Text style={pdfStyles.bullet}>• ROI: {formatPdfPercent(data.analysisResult?.metrics?.roi)}</Text>
            </View>
            <View style={pdfStyles.col}>
              <Text style={pdfStyles.bullet}>• Lifetime gross savings: {formatPdfCurrency(data.analysisResult?.metrics?.lifetimeGrossSavings)}</Text>
              <Text style={pdfStyles.bullet}>• Lifetime operating savings: {formatPdfCurrency(data.analysisResult?.metrics?.lifetimeOperatingSavings)}</Text>
              <Text style={pdfStyles.bullet}>• Lifetime net profit: {formatPdfCurrency(data.analysisResult?.metrics?.lifetimeNetProfit)}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.section} wrap={false}>
          <Text style={pdfStyles.sectionTitle}>Year-by-year cash flow snapshot</Text>
          <Text style={pdfStyles.paragraph}>The table below shows the first {sampleRows.length} years of the backend cash flow model, including the grid baseline, solar savings, install cost, and lease comparator.</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.headerText, pdfStyles.cellYear]}>Year</Text>
              <Text style={[pdfStyles.headerText, pdfStyles.cell]}>Grid cost</Text>
              <Text style={[pdfStyles.headerText, pdfStyles.cell]}>Solar output</Text>
              <Text style={[pdfStyles.headerText, pdfStyles.cellWide]}>Gross savings</Text>
              <Text style={[pdfStyles.headerText, pdfStyles.cell]}>Lease cost</Text>
            </View>
            {sampleRows.map((row) => (
              <View key={String(row.year)} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.cellText, pdfStyles.cellYear]}>{row.year ?? "—"}</Text>
                <Text style={[pdfStyles.cellText, pdfStyles.cell]}>{formatPdfCurrency(row.gridCost)}</Text>
                <Text style={[pdfStyles.cellText, pdfStyles.cell]}>{formatNumber(Number(row.annualGenerationKwh ?? 0))} kWh</Text>
                <Text style={[pdfStyles.cellText, pdfStyles.cellWide]}>{formatPdfCurrency(row.grossSavings)}</Text>
                <Text style={[pdfStyles.cellText, pdfStyles.cell]}>{formatPdfCurrency(row.leaseCost)}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={pdfStyles.footer}>Prepared by SolarSave • Estimate derived from live irradiance sampling, state-level electricity pricing, and a simplified long-horizon financial model.</Text>
      </Page>
    </Document>
  );
}

export function EstimateResultSections({ location, fortyGuardResult }: { location: EstimateLocation; fortyGuardResult?: unknown }) {
  const session = useEstimateSession();
  const defaultBill = useMemo(() => getDefaultBill(location), [location]);
  const [monthlyBill, setMonthlyBill] = useState(defaultBill);

  const billOptions = useMemo(() => getSummaryBillOptions(defaultBill), [defaultBill]);
  const metrics = useMemo(
    () => computeEstimateMetrics(location, monthlyBill),
    [location, monthlyBill],
  );

  const place = useMemo(() => estimateLocationToPlace(location), [location]);
  const analysisResult = session.analysisResult ?? null;
  const comparisonSeries =
    session.comparisonSeries ??
    (analysisResult
      ? buildSolarComparisonSeries({
          monthlyBill,
          annualCashFlows: analysisResult.annualCashFlows,
          installationCost: Number(analysisResult.metrics?.netInstallationCost ?? metrics.upfrontCost),
          paybackYear: analysisResult.metrics?.paybackYears ?? null,
        })
      : null);

  const generatorEstimate = useMemo(() => {
    if (session.generatorDiagnostics?.est) return session.generatorDiagnostics.est;
    if (session.generatorDiagnostics?.annualGenerationKwh !== undefined) return session.generatorDiagnostics;

    const result = session.fortyGuardResult ?? fortyGuardResult;
    if (!result) return null;
    try {
      return estimateAnnualGenerationKwh(result, {
        systemCapacityKw: metrics.solarSizeKw,
        performanceRatio: 0.75,
        state: place?.state ?? location?.subtitle ?? undefined,
      });
    } catch {
      return null;
    }
  }, [fortyGuardResult, location?.subtitle, metrics.solarSizeKw, place?.state, session.fortyGuardResult, session.generatorDiagnostics]);

  async function downloadBreakdown() {
    if (!place || !generatorEstimate) return;
    const doc = <BreakdownPdf data={{ place, monthlyBill, solarSizeKw: metrics.solarSizeKw, upfrontCost: metrics.upfrontCost, generatorEstimate, analysisResult }} />;
    const asPdf = pdf(doc);
    const blob = await asPdf.toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

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
          <SectionCard
            title="Session results"
            showInfo
            infoText="This estimate is built from a live FortyGuard GHI sample for your location. The UI shows both your annual grid consumption estimate and the annual solar generation estimate derived from GHI × state peak-sun-hours × 365."
          >
            {generatorEstimate ? (
              <div className="flex flex-col gap-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#e5dccf] bg-[#fdfaf6] p-4">
                    <div className="flex items-center gap-2 text-lg font-medium">
                      Grid annual consumption
                      <span className="group relative inline-flex text-[#948a77] cursor-default">
                        <span aria-label="Grid annual consumption info">
                          <InfoIcon />
                        </span>
                        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-72 -translate-x-1/2 rounded-xl border border-black/5 bg-[#231f18] px-3 py-2 text-left text-xs leading-5 text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                          Estimated from your selected monthly bill and electricity price: monthly bill ÷ price per kWh, then multiplied by 12 months.
                        </span>
                      </span>
                    </div>
                    <div className="text-2xl font-semibold">{formatNumber(Number(analysisResult?.metrics?.annualConsumptionKwh ?? 0))} kWh / year</div>
                    <div className="text-sm text-[#6d6557]">Derived from monthly bill × 12 and state electricity price</div>
                  </div>

                  <div className="rounded-2xl border border-[#dbe8d7] bg-[#f7faf7] p-4">
                    <div className="flex items-center gap-2 text-lg font-medium">
                      Estimated annual generation
                      <span className="group relative inline-flex text-[#948a77] cursor-default">
                        <span aria-label="Estimated annual generation info">
                          <InfoIcon />
                        </span>
                        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-80 -translate-x-1/2 rounded-xl border border-black/5 bg-[#231f18] px-3 py-2 text-left text-xs leading-5 text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                          Derived from the FortyGuard GHI sample and the state peak-sun-hours model: GHI × peak sun hours per day × 365 ÷ 1000, then scaled by system size and performance ratio.
                        </span>
                      </span>
                    </div>
                    <div className="text-2xl font-semibold">{formatNumber(generatorEstimate.annualGenerationKwh ?? 0)} kWh / year</div>
                    <div className="text-sm text-[#6d6557]">Derived from <a target="_blank" href="https://docs-api.fortyguard.com/docs/environmental-parameters" className="underline" >FortyGuard</a> GHI data</div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-md bg-[#f7faf7] p-3">
                    <div className="text-xs text-[#6d6557]">GHI</div>
                    <div className="text-lg font-semibold">{formatNumber(Number(analysisResult?.metrics?.ghiWattsPerM2 ?? generatorEstimate.ghiWattsPerM2 ?? 0))} W/m²</div>
                  </div>
                  <div className="rounded-md bg-[#f7faf7] p-3">
                    <div className="text-xs text-[#6d6557]">Peak sun hours / day</div>
                    <div className="text-lg font-semibold">{formatNumber(Number(analysisResult?.metrics?.peakSunHoursPerDay ?? generatorEstimate.peakSunHoursPerDayUsed ?? 0))}</div>
                  </div>
                  <div className="rounded-md bg-[#f7faf7] p-3">
                    <div className="text-xs text-[#6d6557]">Generation formula hours / year</div>
                    <div className="text-lg font-semibold">{formatNumber(Number(analysisResult?.metrics?.annualGenerationFormulaHours ?? generatorEstimate.annualGenerationFormulaHours ?? 0))}</div>
                  </div>
                </div>

                {generatorEstimate.warning ? (
                  <div className="mt-2 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-800">{generatorEstimate.warning.replaceAll("extrapolated", "derived")}</div>
                ) : null}

                {analysisResult ? (
                  <div className="mt-3 space-y-2">
                    <div className="text-sm text-[#4a4337]">Financial summary (engine):</div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

                {generatorEstimate ? (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => { void downloadBreakdown(); }}
                      className="inline-flex items-center gap-2 rounded-full bg-[#2f6b3b] px-3 py-2 text-sm text-white"
                    >
                      Download breakdown
                    </button>
                  </div>
                ) : null}

              </div>
            ) : (
              <div className="text-sm text-[#6d6557]">No session generation data available yet.</div>
            )}
          </SectionCard>
        </div>

        {analysisResult ? (
          <div className="mt-6">
            <SectionCard
              title="Cumulative cost comparison"
              showInfo
              infoText="This chart compares the cumulative cost of staying on-grid against buying or leasing solar, using the same annual electricity-price growth and solar cash-flow assumptions as the financial engine."
            >
              <FinanceComparisonChart series={comparisonSeries} />
            </SectionCard>
          </div>
        ) : null}
      </section>

      <FinanceSection
        upfrontCost={metrics.upfrontCost}
        savings20y={metrics.savings20y}
        analysisResult={analysisResult}
      />

      <ProviderCtaSection />
    </div>
  );
}
