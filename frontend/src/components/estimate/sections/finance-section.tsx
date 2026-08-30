"use client";

import { useState } from "react";
import { SectionCard } from "@/components/estimate/cards/section-card";
import { formatCurrency, formatNumber } from "@/lib/estimate-calculations";

function FinanceTabs({
  upfrontCost,
  benefits20y,
  savings20y,
  paybackYears,
  remoteCopy,
}: {
  upfrontCost: number;
  benefits20y: number;
  savings20y: number;
  paybackYears: number;
  remoteCopy?: Record<string, { lead: string; body: string }>;
}) {
  const [tab, setTab] = useState<"buy" | "lease" | "loan">("buy");

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
    },
    loan: {
      lead: "Finance ownership over time.",
      body:
        "A loan balances cash flow and ownership so you can spread the install cost across monthly payments.",
    },
  } as Record<string, { lead: string; body: string }>;

  const copySource = remoteCopy ?? localCopy;
  const copy = copySource[tab];

  return (
    <div>
      <div className="flex border-b border-[#d8c8b2]">
        {(["buy", "lease", "loan"] as const).map((item) => {
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

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-medium tracking-[-0.04em] text-[#231f18]">
              {formatCurrency(upfrontCost)}
            </div>
            <div className="mt-2 text-[15px] leading-6 text-[#7b63c6]">
              Upfront cost after incentives
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium tracking-[-0.04em] text-[#231f18]">
              {formatCurrency(benefits20y)}
            </div>
            <div className="mt-2 text-[15px] leading-6 text-[#7b63c6]">20 year benefits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium tracking-[-0.04em] text-[#231f18]">
              {formatCurrency(savings20y)}
            </div>
            <div className="mt-2 text-[15px] leading-6 text-[#7b63c6]">
              Total 20 year savings
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium tracking-[-0.04em] text-[#231f18]">
              {formatNumber(paybackYears)}
            </div>
            <div className="mt-2 text-[15px] leading-6 text-[#7b63c6]">Years until payback</div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            className="flex items-center gap-2 text-[15px] font-medium text-[#b66a07]"
          >
            Show detailed estimates
            <span className="grid size-6 place-items-center rounded-full border border-[#d8c8b2]">
              <svg viewBox="0 0 24 24" fill="none" className="size-3.5" aria-hidden>
                <path
                  d="M12 5.5v8M7.5 10l4.5 4.5L16.5 10"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function FinanceSection({
  upfrontCost,
  benefits20y,
  savings20y,
  paybackYears,
}: {
  upfrontCost: number;
  benefits20y: number;
  savings20y: number;
  paybackYears: number;
}) {
  const [remote, setRemote] = useState<{ title?: string; tabs?: Record<string, { lead: string; body: string }> } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/content/finance", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (mounted) setRemote(json);
      } catch (e) {
        // ignore and keep local copy
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const title = remote?.title ?? "Learn how to finance your solar panels";
  const tabs = remote?.tabs ?? undefined;

  return (
    <section id="finance" className="mx-auto mt-4 max-w-[1600px] px-4 sm:px-6 lg:px-8">
      <SectionCard title={title}>
        <FinanceTabs
          upfrontCost={upfrontCost}
          benefits20y={benefits20y}
          savings20y={savings20y}
          paybackYears={paybackYears}
          remoteCopy={tabs}
        />
      </SectionCard>
    </section>
  );
}
