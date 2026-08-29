import { SectionCard } from "@/components/estimate/cards/section-card";
import { ImpactMetric } from "@/components/estimate/cards/impact-metric";

export function EnvironmentalImpactSection({
  impactCo2,
  impactCars,
  impactTrees,
}: {
  impactCo2: string;
  impactCars: number;
  impactTrees: string;
}) {
  return (
    <section id="impact" className="mx-auto mt-4 max-w-[1600px] px-4 sm:px-6 lg:px-8">
      <SectionCard title="Your potential environmental impact">
        <p className="text-center text-sm leading-7 text-[#6f6657]">
          Estimated annual environmental impact of the recommended solar installation size.
        </p>
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <ImpactMetric
            title="Carbon dioxide"
            value={impactCo2}
            caption="metric tons"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden>
                <circle cx="6" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="12" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="16.5" cy="15" r="2.4" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            }
          />
          <ImpactMetric
            title="Passenger cars"
            value={String(impactCars)}
            caption="taken off the road for 1 yr"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="size-8" aria-hidden>
                <path
                  d="M5 15h14l-1.4-4.5a2 2 0 0 0-1.9-1.4H8.3a2 2 0 0 0-1.9 1.4L5 15Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M7 15v2M17 15v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="8" cy="17.5" r="1.2" stroke="currentColor" strokeWidth="1.8" />
                <circle cx="16" cy="17.5" r="1.2" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            }
          />
          <ImpactMetric
            title="Tree seedlings"
            value={impactTrees}
            caption="grown for 10 yrs"
            icon={
              <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden>
                <path
                  d="M12 4c-3 2-4.5 4.5-4.5 7.5A4.5 4.5 0 0 0 12 16a4.5 4.5 0 0 0 4.5-4.5C16.5 8.5 15 6 12 4Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M12 16v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M8 21h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            }
          />
        </div>
      </SectionCard>
    </section>
  );
}
