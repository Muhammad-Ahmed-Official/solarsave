import { SectionCard } from "@/components/estimate/cards/section-card";
import { formatNumber } from "@/lib/estimate-calculations";

export function SolarSizeCard({
  solarSizeKw,
  arraySqFt,
  coveragePct,
}: {
  solarSizeKw: number;
  arraySqFt: number;
  coveragePct: number;
}) {
  return (
    <SectionCard title="Your recommended solar installation size" showInfo>
      <p className="max-w-xl text-sm leading-7 text-[#6f6657]">
        This size will cover about {coveragePct}% of your electricity usage. Solar installations are
        sized in kilowatts (kW).
      </p>
      <div className="mt-7 text-center">
        <div className="text-4xl font-medium tracking-[-0.04em] text-[#231f18]">
          {formatNumber(solarSizeKw)} kW
        </div>
        <div className="mt-3 text-lg text-[#6f6657]">({formatNumber(arraySqFt)} ft²)</div>
      </div>
    </SectionCard>
  );
}
