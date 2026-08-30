import Image from 'next/image'

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <header className="flex items-center gap-4 mb-6">
        <Image src="/solarsave-icon.png" alt="Solar Save" width={64} height={64} />
        <div>
          <h1 className="text-3xl font-semibold">About Solar Save</h1>
          <p className="text-sm text-gray-600">Practical solar resource estimation and a transparent financial engine.</p>
        </div>
      </header>

      <section className="prose">
        <h2>What this project does</h2>
        <ul>
          <li>Uses FortyGuard environmental data to derive a representative irradiance sample for a location.</li>
          <li>Converts a single GHI (global horizontal irradiance) measure into an annual irradiance estimate using state-level peak sun hours when a time-series isn't available.</li>
          <li>Estimates annual generation for a specified system size and a conservative performance ratio.</li>
          <li>Runs a transparent financial model (NPV, IRR, payback, lifetime savings) using live electricity prices (EIA) and a treasury-based discount rate (FRED).</li>
        </ul>

        <h2>Engineering choices and limitations</h2>
        <p>
          Solar Save favors pragmatic, explainable estimation over opaque black-box models. When a single instantaneous GHI sample is used,
          the estimate is explicitly marked as extrapolated and accompanied by diagnostic information. For production-grade forecasts we recommend
          feeding a full hourly or daily irradiance time-series and using a module-level PV model (like NREL PVWatts).
        </p>

        <h2>Open-source & extensible</h2>
        <p>
          The repository contains a lightweight Next.js frontend and a financial engine that can be reused or migrated as a standalone service. The
          content and finance guidance cards are served from a small content API to keep content editable without code deploys.
        </p>

        <h2>How to contribute</h2>
        <ul>
          <li>Add more precise state or timezone inference for prior-day submissions.</li>
          <li>Replace the simplified single-sample extrapolation with PVWatts or a module-level simulation.</li>
          <li>Add unit and integration tests for the financial engine endpoints.</li>
        </ul>

        <p>If you'd like this post reworded, expanded into multiple posts, or turned into a downloadable PDF, tell me and I'll generate it.</p>
      </section>
    </main>
  );
}
