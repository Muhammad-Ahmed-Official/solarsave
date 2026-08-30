"use client";

import { useState } from "react";
import { SectionCard } from "@/components/estimate/cards/section-card";
import { formatCurrency } from "@/lib/estimate-calculations";

function FinanceTabs({
  upfrontCost,
  savings20y,
  remoteCopy,
}: {
  upfrontCost: number;
  savings20y: number;
  remoteCopy?: Record<string, { lead: string; body: string }>;
}) {
  const [tab, setTab] = useState<"buy" | "lease" >("buy");

  const localCopy = {
    buy: {
      lead: "Pay up front, largest lifetime savings.",
      body:
        "You pay the full cost up front and own the solar system without any additional payments over time. As the outright owner, you may claim any local, state, or federal incentives.",
    },
    lease: {
      lead: "Lower upfront cost, predictable payments.",
      body:
        "A lease reduces the initial spend while still shifting part of your electricity use toward solar.",
    }
  } as Record<string, { lead: string; body: string }>;

  const copySource = remoteCopy ?? localCopy;
  const copy = copySource[tab];

  return (
    <div>
      <div className="flex border-b border-[#d8c8b2]">
        {(["buy", "lease"] as const).map((item) => {
          const active = item === tab;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`relative flex-1 py-4 text-center text-[17px] transition ${
                active ? "text-[#231f18]" : "text-[#6f6657]"
              }`}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
              <span
                className={`absolute inset-x-0 bottom-0 h-0.5 ${
                  active ? "bg-[#b66a07]" : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>

      <div className="px-1 py-6">
        <p className="max-w-5xl text-base leading-8 text-[#4a4337]">
          <span className="font-semibold text-[#7b5eae]">{copy.lead}</span> {copy.body}
        </p>

        {tab === "buy" ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="text-center">
              <div className="text-2xl font-medium tracking-[-0.04em] text-[#231f18]">
                {formatCurrency(upfrontCost)}
              </div>
              <div className="mt-2 text-[15px] leading-6 text-[#7b63c6]">
                Installation cost
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-medium tracking-[-0.04em] text-[#231f18]">
                {formatCurrency(savings20y)}
              </div>
              <div className="mt-2 text-[15px] leading-6 text-[#7b63c6]">
                Total 20 year savings
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-[#e7dcc7] p-5 text-center">
              <div className="text-2xl font-medium tracking-[-0.04em] text-[#231f18]">
                {formatCurrency(0)}
              </div>
              <div className="mt-2 text-[15px] leading-6 text-[#7b63c6]">
                Upfront cost
              </div>
            </div>
            <div className="rounded-2xl border border-[#e7dcc7] p-5 text-center">
              <div className="text-2xl font-medium tracking-[-0.04em] text-[#231f18]">
                {formatCurrency(Math.round(upfrontCost * 0.08))}
              </div>
              <div className="mt-2 text-[15px] leading-6 text-[#7b63c6]">
                Estimated annual lease payment
              </div>
            </div>
            <div className="rounded-2xl border border-[#e7dcc7] p-5 text-center">
              <div className="text-2xl font-medium tracking-[-0.04em] text-[#231f18]">
                {formatCurrency(savings20y)}
              </div>
              <div className="mt-2 text-[15px] leading-6 text-[#7b63c6]">
                Estimated 20 year net impact
              </div>
            </div>
            <div className="rounded-2xl border border-[#e7dcc7]  p-5 text-center">
              <div className="text-2xl font-medium tracking-[-0.04em] text-[#231f18]">
                Fixed term
              </div>
              <div className="mt-2 text-[15px] leading-6 text-[#7b63c6]">
                Predictable payment structure
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}

export function FinanceSection({
  upfrontCost,
  savings20y,
  analysisResult,
}: {
  upfrontCost: number;
  savings20y: number;
  analysisResult?: {
    metrics?: {
      netInstallationCost?: number;
      lifetimeGrossSavings?: number;
      lifetimeNetProfit?: number;
      paybackYears?: number;
    };
    annualCashFlows?: Array<{
      grossSavings?: number;
    }>;
  } | null;
}) {
  const title = "Learn how to finance your solar panels";

  // Prefer values from analysisResult when available
  const upfront = analysisResult?.metrics?.netInstallationCost ?? upfrontCost;
  const savings20 = analysisResult?.metrics?.lifetimeNetProfit ?? savings20y;

  return (
    <section id="finance" className="mx-auto mt-4 max-w-[1600px] px-4 sm:px-6 lg:px-8">
      <SectionCard title={title}>
        <FinanceTabs
          upfrontCost={upfront}
          savings20y={savings20}
        />
      </SectionCard>
    </section>
  );
}
