"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { parseEstimateLocation } from "@/lib/estimate-location";
import { estimateAnnualGenerationKwh, PEAK_SUN_HOURS } from "@/lib/fortyguard-to-generation";
import { pdf, Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

function formatNumber(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
}

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 12, padding: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 700 },
  section: { marginTop: 8 },
  label: { fontSize: 10, color: "#555", marginBottom: 4 },
  value: { fontSize: 12, marginBottom: 4 },
});

function InvoicePdf({ data }: { data: any }) {
  const fg = data.fortyGuardResult;
  const est = data.generatorEstimate;
  const place = data.place;

  return (
    <Document>
      <Page style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>SolarSave Estimate</Text>
            <Text>Invoice-style generation estimate</Text>
          </View>
          {/* Attempt to show logo if available in public */}
          <Image src="/solarsave-icon.png" style={{ width: 48, height: 48 }} />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Place</Text>
          <Text style={styles.value}>{place?.displayName ?? place?.title ?? "Selected location"}</Text>
          <Text style={styles.value}>Latitude: {formatNumber(place?.latitude)} Longitude: {formatNumber(place?.longitude)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>FortyGuard GHI</Text>
          <Text style={styles.value}>{formatNumber(fg?.data?.locations?.[0]?.solar_irradiance?.ghi ?? fg?.data?.locations?.[0]?.parameters?.ghi ?? fg?.ghi ?? null)} W/m²</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Calculation details</Text>
          <Text style={styles.value}>Peak sun hours used: {formatNumber(data.peakSunHours)}</Text>
          <Text style={styles.value}>Hours / year: {formatNumber(data.peakSunHours * 365)}</Text>
          <Text style={styles.value}>Annual irradiance (kWh/m²/yr): {formatNumber(est?.annualIrradianceKwhPerM2)}</Text>
          <Text style={styles.value}>System capacity used (kW): {formatNumber(est?.systemCapacityKwUsed)}</Text>
          <Text style={styles.value}>Performance ratio used: {formatNumber(est?.performanceRatioUsed)}</Text>
          <Text style={styles.value}>Estimated annual generation (kWh/yr): {formatNumber(est?.annualGenerationKwh)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.value}>This estimate is extrapolated from a single instantaneous GHI sample and scaled by a state-level peak sun hours value. It is intended for quick comparisons and diagnostics, not as a production PVWatts-grade forecast.</Text>
        </View>
      </Page>
    </Document>
  );
}

export default function DetailsPage() {
  const params = useParams();
  const search = useSearchParams();
  const activityId = params?.id;
  const [place, setPlace] = useState<any>(null);
  const [fgResult, setFgResult] = useState<any>(null);
  const [generatorEstimate, setGeneratorEstimate] = useState<any>(null);
  const [peakSunHours, setPeakSunHours] = useState<number>(5.0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sp: any = {};
    search?.forEach((v, k) => (sp[k] = v));
    const loc = parseEstimateLocation(sp);
    setPlace(loc);
  }, [search]);

  useEffect(() => {
    async function load() {
      if (!activityId) return;
      try {
        const res = await fetch(`/api/fortyguard/status/${encodeURIComponent(activityId)}`);
        const payload = await res.json();
        const fg = payload.data ?? payload.raw ?? payload;
        setFgResult(fg);

        // infer state from place subtitle if possible
        const stateGuess = (place?.subtitle || "").split("•").pop()?.trim() ?? undefined;
        const peak = stateGuess ? (PEAK_SUN_HOURS[stateGuess.toLowerCase()] ?? 5.0) : 5.0;
        setPeakSunHours(peak);

        const est = estimateAnnualGenerationKwh(fg, { systemCapacityKw: undefined, peakSunHoursPerDay: peak });
        setGeneratorEstimate(est);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [activityId, place]);

  async function downloadPdf() {
    try {
      const doc = <InvoicePdf data={{ fortyGuardResult: fgResult, generatorEstimate, place, peakSunHours }} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (e) {
      console.error(e);
      alert("Unable to generate PDF. Ensure @react-pdf/renderer is installed.");
    }
  }

  if (loading) return <div className="p-6">Loading details…</div>;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Estimate details</h1>
      <div className="mt-4 space-y-2">
        <div>Activity ID: {activityId}</div>
        <div>Place: {place?.displayName ?? place?.title}</div>
        <div>GHI sample: {String(fgResult?.data?.locations?.[0]?.solar_irradiance?.ghi ?? fgResult?.data?.locations?.[0]?.parameters?.ghi ?? '—')}</div>
        <div>Peak sun hours used: {peakSunHours}</div>
        <div>Annual irradiance (kWh/m²/yr): {formatNumber(generatorEstimate?.annualIrradianceKwhPerM2)}</div>
        <div>Estimated annual generation (kWh/yr): {formatNumber(generatorEstimate?.annualGenerationKwh)}</div>
      </div>

      <div className="mt-6 flex gap-3">
        <a className="rounded-full bg-[#4a7c46] px-4 py-2.5 text-sm font-medium text-white" href="#" onClick={(e) => { e.preventDefault(); void downloadPdf(); }}>Download PDF</a>
      </div>
    </div>
  );
}
