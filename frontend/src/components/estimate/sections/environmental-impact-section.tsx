import { SectionCard } from "@/components/estimate/cards/section-card";

export function EnvironmentalImpactSection({ impactCo2, impactCars, impactTrees }: { impactCo2: string | number; impactCars: number; impactTrees: string | number; }) {
  return (
    <section className="mx-auto mt-8 max-w-[1600px] px-4 sm:px-6 lg:px-8">
      <SectionCard title="Environmental impact">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-2xl font-medium text-[#231f18]">{impactCo2}</div>
            <div className="mt-2 text-sm text-[#7b63c6]">Tons CO₂ avoided / year</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium text-[#231f18]">{impactCars}</div>
            <div className="mt-2 text-sm text-[#7b63c6]">Cars taken off the road</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium text-[#231f18]">{impactTrees}</div>
            <div className="mt-2 text-sm text-[#7b63c6]">Equivalent trees planted</div>
          </div>
        </div>
      </SectionCard>
    </section>
  );
}
