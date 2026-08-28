import Link from "next/link";

export function HomeCTA() {
  return (
    <section className="py-8 sm:py-10">
      <div
        className="overflow-hidden rounded-[36px] border border-black/10 p-6 shadow-[0_22px_60px_-34px_rgba(89,72,34,0.45)] sm:p-8"
        style={{
          background:
            "linear-gradient(135deg, rgba(35, 32, 26, 0.96), rgba(40, 59, 45, 0.94))",
        }}
      >
        <div className="max-w-3xl">
          <div className="text-[10px] uppercase tracking-[0.24em] text-[#c6bfad]">
            Ready to estimate?
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#faf4e6] sm:text-4xl">
            Turn your address into a clean energy savings story.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#d4cfbf] sm:text-base">
            Keep the Sunroof-style simplicity, but tailor the estimate to solar savings, rising
            tariffs, and local irradiance from FortyGuard.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/estimate"
            className="rounded-full bg-[#f6d36e] px-6 py-3.5 text-sm font-medium text-[#1f1d18] transition-transform hover:-translate-y-0.5"
          >
            Start estimate
          </Link>
          <a
            href="#examples"
            className="rounded-full border border-white/18 px-6 py-3.5 text-sm font-medium text-[#faf4e6] transition-colors hover:bg-white/8"
          >
            Review examples
          </a>
        </div>
      </div>
    </section>
  );
}
