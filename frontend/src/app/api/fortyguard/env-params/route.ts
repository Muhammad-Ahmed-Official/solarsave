import { NextResponse } from "next/server";
import { submitFortyGuardTask } from "@/lib/fortyguard-api";

function isFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { latitude?: unknown; longitude?: unknown };
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) {
      return NextResponse.json(
        { ok: false, message: "Please provide a valid latitude and longitude." },
        { status: 400 }
      );
    }

    const result = await submitFortyGuardTask({ latitude, longitude });
    return NextResponse.json(
      { ok: true, activityId: result.activityId, data: result.raw },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start the analysis.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
