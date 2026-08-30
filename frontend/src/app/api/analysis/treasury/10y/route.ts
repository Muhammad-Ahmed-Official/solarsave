import { NextResponse } from "next/server";
import { getLatestTenYearTreasury } from "@/lib/financial-engine";

export async function GET() {
  try {
    const treasury = await getLatestTenYearTreasury();
    return NextResponse.json(treasury, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to retrieve Treasury rate";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
