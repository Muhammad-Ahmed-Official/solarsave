"use client";

import Image from "next/image";
import { AddressSearch } from "./address-search";

export function HomeHero() {
  return (
    <section className="py-4 sm:py-6">
      <div className="mx-auto w-full">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="mt-4 text-balance text-5xl font-normal tracking-[-0.04em] text-[#231f18] sm:text-6xl lg:text-7xl">
            Explore estimated solar potential of your community
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-[#6b6456] sm:text-base">
            Enter a state, county, city, or zip code to see a solar estimate for the area, based
            on the amount of usable sunlight and roof space.
          </p>
        </div>

        <div className="mt-7 relative min-h-130 overflow-hidden rounded-3xl">
          <Image src="/hero-roofs.jpg" alt="roofs" fill className="object-cover" priority />
          <div className="background-green-rad absolute inset-0 opacity-70" />
          <div className="absolute inset-0 grid place-content-center px-4">
            <AddressSearch />
          </div>
        </div>
      </div>
    </section>
  );
}
