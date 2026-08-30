import { NextResponse } from "next/server";
import { getResidentialElectricityPrice, getLatestTenYearTreasury, runSolarAnalysis, type SolarAnalysisInput } from "@/lib/financial-engine";
import { fetchFortyGuardStatus } from "@/lib/fortyguard-api";
import { estimateAnnualGenerationKwh } from "@/lib/fortyguard-to-generation";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as any;

    if (!body?.stateCode) return NextResponse.json({ error: "stateCode is required" }, { status: 400 });

    const installationCost = Number(body.installationCost);
    if (!Number.isFinite(installationCost)) {
      return NextResponse.json({ error: "installationCost is required" }, { status: 400 });
    }

    // Determine annualGenerationKwh: prefer provided, else try FortyGuard result or activity id
    let annualGenerationKwh: number | null = null;
    let generatorDiagnostics: any = {};

    if (body.annualGenerationKwh !== undefined && Number.isFinite(Number(body.annualGenerationKwh))) {
      annualGenerationKwh = Number(body.annualGenerationKwh);
    } else if (body.fortyGuardResult) {
      const est = estimateAnnualGenerationKwh(body.fortyGuardResult, {
        systemCapacityKw: body.systemCapacityKw,
        performanceRatio: body.performanceRatio,
      });
      generatorDiagnostics = est;
      if (est.annualGenerationKwh !== null) annualGenerationKwh = est.annualGenerationKwh;
    } else if (typeof body.fortyGuardActivityId === "string" && body.fortyGuardActivityId) {
      // Fetch the FortyGuard status/result server-side
      const status = await fetchFortyGuardStatus(body.fortyGuardActivityId);
      const fgResult = status.data ?? status.raw ?? null;
      const est = estimateAnnualGenerationKwh(fgResult, {
        systemCapacityKw: body.systemCapacityKw,
        performanceRatio: body.performanceRatio,
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
      getResidentialElectricityPrice(body.stateCode),
      getLatestTenYearTreasury(),
    ]);

    const input = {
      ...(body as SolarAnalysisInput),
      annualGenerationKwh,
      installationCost,
    } as SolarAnalysisInput;

    const result = runSolarAnalysis(input, electricity, treasury);

    // Attach any generator diagnostics to the response for transparency
    return NextResponse.json({ result, generatorDiagnostics }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to complete analysis";
    const status = error instanceof RangeError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
