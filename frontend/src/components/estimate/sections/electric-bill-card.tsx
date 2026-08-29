"use client";

import { SectionCard } from "@/components/estimate/cards/section-card";

export function ElectricBillCard({
  monthlyBill,
  billOptions,
  onBillChange,
}: {
  monthlyBill: number;
  billOptions: number[];
  onBillChange: (value: number) => void;
}) {
  return (
    <SectionCard title="Your average monthly electric bill" showInfo>
      <p className="max-w-xl text-sm leading-7 text-[#6f6657]">
        We use your bill to estimate how much electricity you use based on typical utility rates in
        your area.
      </p>
      <div className="mt-8 flex justify-center">
        <label className="inline-flex flex-col items-stretch">
          <span className="sr-only">Average monthly bill</span>
          <select
            value={monthlyBill}
            onChange={(event) => onBillChange(Number(event.target.value))}
            className="min-w-[14rem] rounded-[12px] border border-[#bda98f] bg-white px-4 py-3 text-lg text-[#231f18] shadow-[0_8px_20px_-16px_rgba(89,72,34,0.45)] outline-none"
          >
            {billOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
    </SectionCard>
  );
}
