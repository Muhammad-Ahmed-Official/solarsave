import { NextResponse } from "next/server";
import { getResidentialElectricityPrice } from "@/lib/financial-engine";

export async function GET(request: Request, { params }: { params: { stateCode: string } }) {
  try {
    const stateCode = params?.stateCode;
    if (!stateCode) return NextResponse.json({ error: "stateCode required" }, { status: 400 });

    const electricity = await getResidentialElectricityPrice(stateCode);
    return NextResponse.json(electricity, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to retrieve electricity price";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
