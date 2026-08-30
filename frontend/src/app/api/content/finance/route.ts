import { NextResponse } from "next/server";

export async function GET() {
  try {
    // In future this could fetch from a CMS or database. For now return canonical copy.
    const payload = {
      title: "Learn how to finance your solar panels",
      tabs: {
        buy: {
          lead: "Pay up front, largest lifetime savings.",
          body:
            "You pay the full cost up front and own the solar system without any additional payments over time. As the outright owner, you may claim any local, state, or federal incentives.",
        },
        lease: {
          lead: "Lower upfront cost, predictable payments.",
          body:
            "A lease reduces the initial spend while still shifting part of your electricity use toward solar.",
        },
        loan: {
          lead: "Finance ownership over time.",
          body:
            "A loan balances cash flow and ownership so you can spread the install cost across monthly payments.",
        },
      },
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (e) {
    return NextResponse.json({ error: "Unable to load content" }, { status: 500 });
  }
}
