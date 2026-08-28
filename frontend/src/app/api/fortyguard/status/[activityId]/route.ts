import { NextResponse } from "next/server";
import { fetchFortyGuardStatus } from "@/lib/fortyguard-api";

type ParamsInput = { activityId: string } | Promise<{ activityId: string }>;

export async function GET(
  _request: Request,
  { params }: { params: ParamsInput }
) {
  try {
    const resolved = await params;
    const activityId = resolved.activityId?.trim();

    if (!activityId) {
      return NextResponse.json(
        { ok: false, message: "An activity id is required." },
        { status: 400 }
      );
    }

    const result = await fetchFortyGuardStatus(activityId);
    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to check task status.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
