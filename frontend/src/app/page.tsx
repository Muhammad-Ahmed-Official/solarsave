import { FineTuneSection } from "@/components/home/home-fine-tune";
import { HomeNav } from "@/components/home/home-nav";
import { HomeHero } from "@/components/home/home-hero";
import { HowItWorksSection } from "@/components/home/how-it-works";

export default function Home() {
  return (
    <main
      className="relative min-h-screen overflow-hidden text-[#22201a] background-rad-1 "
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-16 h-80 w-80 rounded-full bg-[#ffd66d]/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/3 h-96 w-96 rounded-full bg-[#8abf7a]/18 blur-3xl"
      />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <HomeNav />
        <HomeHero />
        <HowItWorksSection /> 
        {/* <HowItWorksSection />
        <FineTuneSection />
        <TariffChartSection /> */}
      </div>
    </main>
  );
}
