import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl p-8">
      <header className="flex items-center justify-center gap-4 mb-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">About Solar Save</h1>
          <p className="text-sm text-gray-600 mt-2">
            Practical solar resource estimation and a transparent financial
            engine.
          </p>
        </div>
      </header>

      <section className="prose">
        <div className="mb-8">
          <h2 className="font-bold mb-2">What this project does</h2>
          <p className="mb-6">
            Uses FortyGuard environmental data to derive a representative
            solar irradiance sample for a location. Converts the GHI (global horizontal irradiance) measure into an annual irradiance estimate using state-level peak sun hours when a time-series isn't available. Estimates annual generation for a specified system size and a conservative performance ratio. Runs a transparent financial model (NPV, IRR, payback, lifetime savings) using live electricity prices (EIA) and a treasury-based discount rate (FRED).
          </p>
        </div>

        <div className="mb-8">
          <h2 className="font-bold mb-2">Engineering choices and limitations</h2>
          <p className="mb-6">
            Solar Save favors pragmatic, explainable estimation over opaque
            black-box models. When a single instantaneous GHI sample is used, the
            estimate is explicitly marked as extrapolated and accompanied by
            diagnostic information. For production-grade forecasts we recommend
            feeding a full hourly or daily irradiance time-series and using a
            module-level PV model (like NREL PVWatts).
          </p>
        </div>

      </section>
    </main>
  );
}
