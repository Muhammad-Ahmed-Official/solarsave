"use client";

import type { ReactNode } from "react";
import { useState } from "react";

function formatNGN(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white px-5 py-5 shadow-[0_18px_42px_-28px_rgba(93,76,38,0.42)]">
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#8b816e]">{title}</div>
      {children}
    </div>
  );
}

export function FineTuneSection() {
  const [bill, setBill] = useState(175);

  return (
    <section id="fine-tune" className="py-7 sm:py-9">
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.24em] text-[#7f7865]">
          Fine tune your information
        </div>
        <h2 className="mt-3 text-2xl font-normal tracking-[-0.03em] text-[#231f18] sm:text-3xl">
          Fine-tune your information to find out how much you could save.
        </h2>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card title="What&apos;s your average monthly electric bill?">
          <p className="mt-2 max-w-md text-sm leading-6 text-[#71695a]">
            Use your bill to calculate how much electricity you use based on typical utility rates
            in your area.
          </p>

          <div className="mt-5 flex items-center justify-between text-sm text-[#908775]">
            <span>{formatNGN(0)}</span>
            <span>{formatNGN(500_000)}</span>
          </div>

          <div className="relative mt-3 h-8">
            <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#ebdfc7]" />
            <div
              className="absolute left-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#f0be4d]"
              style={{ width: `${(bill / 500) * 100}%` }}
            />
            <div
              className="absolute top-1/2 size-8 -translate-y-1/2 rounded-full border-4 border-white bg-[#f4c94d] shadow-[0_12px_26px_-14px_rgba(92,76,38,0.8)]"
              style={{ left: `${(bill / 500) * 100}%`, transform: "translate(-50%, -50%)" }}
            />
          </div>

          <input
            type="range"
            min={0}
            max={500}
            step={1}
            value={bill}
            onChange={(event) => setBill(Number(event.target.value))}
            className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-transparent accent-[#f0be4d]"
            aria-label="Average monthly electric bill"
          />

          <div className="mt-4 text-center text-4xl font-light tracking-[-0.04em] text-[#756d5b]">
            {bill}
          </div>
        </Card>

        <Card title="Your recommended solar installation size">
          <p className="mt-2 max-w-md text-sm leading-6 text-[#71695a]">
            This size will cover about 100% of your electricity usage. Solar installation sizes are
            sized in kilowatts (kW).
          </p>

          <div className="mt-8 text-center">
            <div className="text-6xl font-light tracking-[-0.05em] text-[#7f7a6c]">
              {(5.2 + bill / 220).toFixed(2)} kW
            </div>
            <div className="mt-2 text-sm text-[#9a907c]">
              ({Math.round(320 + bill / 2)} square feet)
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
