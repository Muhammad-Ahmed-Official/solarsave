import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 sm:px-8 lg:px-10">
      <article className="mx-auto max-w-4xl">
        <header className="mb-10">
          <p className="text-sm uppercase tracking-[0.18em] text-[#7c725f]">
            About the project
          </p>
          <h1 className="mt-3 text-4xl font-normal tracking-[-0.04em] text-[#231f18] sm:text-5xl">
            SolarSave helps people understand clean energy and what they could save by switching to solar.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#4a4337] sm:text-lg">
            The project is designed to educate, not overwhelm. It helps someone explore how the sun,
            household electricity use, and long-term energy costs come together — so they can better
            understand the practical value of moving toward clean and renewable energy.
          </p>
        </header>

        <section className="space-y-5 text-[16px] leading-8 text-[#4a4337]">
          <p>
            At the center of the project is a simple but important question: <span className="text-[#231f18]">if a home in this place used the power of the sun, how much clean energy could it produce, and how much money could it save over time?</span>
            {" "}SolarSave answers that with a lightweight model that is deliberately easy to inspect.
          </p>
          <p>
            It starts with GHI — global horizontal irradiance — which is used here as the solar
            resource signal for a location. The GHI data is from{" "}
            <a href="fortyguard" className="text-[#1f5f3b] underline underline-offset-4">
              fortyguard
            </a>
            , and that value is combined with a state-level peak sun hours assumption to derive an
            annual generation estimate.
          </p>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <h2 className="text-2xl font-normal tracking-[-0.03em] text-[#231f18]">
              From sunlight data to yearly production
            </h2>
            <p className="mt-4 text-[16px] leading-8 text-[#4a4337]">
              SolarSave uses a live irradiance sample and turns it into an annual estimate instead
              of pretending to run a full engineering simulation. In plain terms, it takes the
              location&apos;s GHI, applies peak sun hours for the state, extends that across the year,
              and then scales the result by system size and performance ratio. The aim is to help
              people see, in a concrete way, how sunlight can become usable household energy.
            </p>
            <p className="mt-4 text-[16px] leading-8 text-[#4a4337]">
              That means the project can clearly separate <span className="text-[#231f18]">grid annual consumption</span>
              {" "}from <span className="text-[#231f18]">estimated annual generation</span>. One describes how much
              electricity the household is expected to use; the other describes how much the solar
              system may produce under the current assumptions.
            </p>
          </div>

          <figure className="overflow-hidden rounded-[28px] border border-black/5 bg-[#f9f4ed] shadow-[0_20px_50px_-30px_rgba(89,72,34,0.35)]">
            <Image
              src="/ghi.jpg"
              alt="Illustration of global horizontal irradiance used in the SolarSave model"
              width={1200}
              height={900}
              className="h-auto w-full object-cover"
            />
            <figcaption className="px-5 py-4 text-sm leading-6 text-[#5c5549]">
              <span className="font-medium text-[#231f18]">GHI illustration.</span> SolarSave uses
              FortyGuard-derived GHI as the sunlight input that anchors the generation model.
            </figcaption>
          </figure>
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <figure className="overflow-hidden rounded-[28px] border border-black/5 bg-[#f9f4ed] shadow-[0_20px_50px_-30px_rgba(89,72,34,0.35)]">
            <Image
              src="/peaksunhours.png"
              alt="Illustration of peak sun hours by state used in the SolarSave model"
              width={1200}
              height={900}
              className="h-auto w-full object-cover"
            />
            <figcaption className="px-5 py-4 text-sm leading-6 text-[#5c5549]">
              <span className="font-medium text-[#231f18]">Peak sun hours illustration.</span> This
              state-based assumption helps convert a live irradiance sample into a practical yearly
              estimate.
            </figcaption>
          </figure>

          <div>
            <h2 className="text-2xl font-normal tracking-[-0.03em] text-[#231f18]">
              Why peak sun hours matter
            </h2>
            <p className="mt-4 text-[16px] leading-8 text-[#4a4337]">
              A single irradiance value on its own does not tell the full story of a year. SolarSave
              therefore uses peak sun hours as a bridge between a point-in-time GHI sample and a
              yearly production estimate. It is a practical simplification that keeps the model
              understandable while still grounding it in real environmental data for educational use.
            </p>
            <p className="mt-4 text-[16px] leading-8 text-[#4a4337]">
              The finance side of the project then takes that generation estimate and compares it
              against grid electricity costs, installation cost, and lease cost over time. The app
              surfaces payback, NPV, IRR, ROI, and cumulative cost comparisons so the result is not
              just “how much sunlight is available,” but also “how much switching to clean energy may save.”
            </p>
          </div>
        </section>

        <section className="mt-12 rounded-[28px] border border-[#e7dcc7] bg-[#fcfaf7] px-6 py-7 shadow-[0_16px_40px_-30px_rgba(89,72,34,0.28)] sm:px-8">
          <h2 className="text-2xl font-normal tracking-[-0.03em] text-[#231f18]">
            What this project is really about
          </h2>
          <div className="mt-4 space-y-4 text-[16px] leading-8 text-[#4a4337]">
            <p>
              SolarSave is a transparent educational estimation tool. It is designed to help a person understand
              the relationship between <span className="text-[#231f18]">place, sunlight, electricity use, clean energy, and long-term cost</span>
              without burying the assumptions inside a black box.
            </p>
            <p>
              It does not claim to be the final word on solar engineering. Instead, it offers a
              readable, explainable first-pass model that helps more people understand how renewable
              energy from the sun can reduce reliance on the grid and create long-term savings.
            </p>
            <p>
              As the project evolves, one of the clearest improvements will be moving from a single
              GHI sample to time-series irradiance data. That would make the annual generation
              derivation more precise and push the model closer to production-grade forecasting.
            </p>
          </div>
        </section>
      </article>
    </main>
  );
}
