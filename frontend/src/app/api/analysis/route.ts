import { NextResponse } from "next/server";
import { getResidentialElectricityPrice, getLatestTenYearTreasury, runSolarAnalysis, type SolarAnalysisInput } from "@/lib/financial-engine";
import { fetchFortyGuardStatus } from "@/lib/fortyguard-api";
import { estimateAnnualGenerationKwh, type EstimateResult } from "@/lib/fortyguard-to-generation";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (!body?.stateCode) return NextResponse.json({ error: "stateCode is required" }, { status: 400 });

    const installationCost = Number(body.installationCost);
    if (!Number.isFinite(installationCost)) {
      return NextResponse.json({ error: "installationCost is required" }, { status: 400 });
    }

    // Determine annualGenerationKwh: prefer provided, else try FortyGuard result or activity id
    let annualGenerationKwh: number | null = null;
    let generatorDiagnostics: Record<string, unknown> | null = {};
    let fortyGuardPayload: unknown = body.fortyGuardResult ?? null;

    if (body.annualGenerationKwh !== undefined && Number.isFinite(Number(body.annualGenerationKwh))) {
      annualGenerationKwh = Number(body.annualGenerationKwh);
    } else if (body.fortyGuardResult) {
      const est = estimateAnnualGenerationKwh(body.fortyGuardResult, {
        systemCapacityKw: Number.isFinite(Number(body.systemCapacityKw)) ? Number(body.systemCapacityKw) : undefined,
        performanceRatio: Number.isFinite(Number(body.performanceRatio)) ? Number(body.performanceRatio) : undefined,
        state: typeof body.stateCode === "string" ? body.stateCode : undefined,
      });
      generatorDiagnostics = est;
      if (est.annualGenerationKwh !== null) annualGenerationKwh = est.annualGenerationKwh;
    } else if (typeof body.fortyGuardActivityId === "string" && body.fortyGuardActivityId) {
      // Fetch the FortyGuard status/result server-side
      const status = await fetchFortyGuardStatus(body.fortyGuardActivityId);
      const fgResult = status.data ?? status.raw ?? null;
      fortyGuardPayload = fgResult;
      const est = estimateAnnualGenerationKwh(fgResult, {
        systemCapacityKw: Number.isFinite(Number(body.systemCapacityKw)) ? Number(body.systemCapacityKw) : undefined,
        performanceRatio: Number.isFinite(Number(body.performanceRatio)) ? Number(body.performanceRatio) : undefined,
        state: typeof body.stateCode === "string" ? body.stateCode : undefined,
      });
      generatorDiagnostics = { fetchedFortyGuard: true, est };
      if (est.annualGenerationKwh !== null) annualGenerationKwh = est.annualGenerationKwh;
    }

    if (!Number.isFinite(annualGenerationKwh)) {
      return NextResponse.json({ error: "annualGenerationKwh is required or could not be derived from FortyGuard result/activityId", generatorDiagnostics }, { status: 400 });
    }

    // Fetch upstream data (electricity price and treasury) in parallel
    const [electricity, treasury] = await Promise.all([
      // getResidentialElectricityPrice will throw if EIA_API_KEY is missing; let it bubble to the catch so the client sees the reason
      getResidentialElectricityPrice(String(body.stateCode)),
      getLatestTenYearTreasury(),
    ]);

    const annualConsumptionKwh = Number.isFinite(Number(body.annualConsumptionKwh))
      ? Number(body.annualConsumptionKwh)
      : Number.isFinite(Number(body.monthlyBill))
        ? undefined
        : undefined;

    const estForMetrics: EstimateResult | null = generatorDiagnostics && "est" in generatorDiagnostics
      ? ((generatorDiagnostics as { est?: EstimateResult }).est ?? null)
      : ((generatorDiagnostics as EstimateResult | null) ?? null);

    const input: SolarAnalysisInput = {
      stateCode: String(body.stateCode),
      annualGenerationKwh: annualGenerationKwh as number,
      installationCost,
      monthlyBill: Number.isFinite(Number(body.monthlyBill)) ? Number(body.monthlyBill) : undefined,
      annualConsumptionKwh,
      annualDegradation: Number.isFinite(Number(body.annualDegradation)) ? Number(body.annualDegradation) : undefined,
      electricityInflation: Number.isFinite(Number(body.electricityInflation)) ? Number(body.electricityInflation) : undefined,
      annualMaintenanceCost: Number.isFinite(Number(body.annualMaintenanceCost)) ? Number(body.annualMaintenanceCost) : undefined,
      maintenanceInflation: Number.isFinite(Number(body.maintenanceInflation)) ? Number(body.maintenanceInflation) : undefined,
      incentives: Number.isFinite(Number(body.incentives)) ? Number(body.incentives) : undefined,
      riskPremium: Number.isFinite(Number(body.riskPremium)) ? Number(body.riskPremium) : undefined,
      ghiWattsPerM2: Number.isFinite(Number(estForMetrics?.ghiWattsPerM2)) ? Number(estForMetrics?.ghiWattsPerM2) : undefined,
      peakSunHoursPerDay: Number.isFinite(Number(estForMetrics?.peakSunHoursPerDayUsed)) ? Number(estForMetrics?.peakSunHoursPerDayUsed) : undefined,
      annualGenerationFormulaHours: Number.isFinite(Number(estForMetrics?.annualGenerationFormulaHours)) ? Number(estForMetrics?.annualGenerationFormulaHours) : undefined,
    };

    const result = runSolarAnalysis(input, electricity, treasury);

    // Attach any generator diagnostics to the response for transparency
    return NextResponse.json({ result, generatorDiagnostics, fortyGuardResult: fortyGuardPayload }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to complete analysis";
    const status = error instanceof RangeError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
