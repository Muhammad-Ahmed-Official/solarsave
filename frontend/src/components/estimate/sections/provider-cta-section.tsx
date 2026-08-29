export function ProviderCtaSection() {
  return (
    <section className="mx-auto max-w-[1600px] px-4 py-12 text-center sm:px-6 lg:px-8">
      <h2 className="text-3xl font-normal tracking-[-0.04em] text-[#231f18] sm:text-4xl">
        Ready to get started?
      </h2>
      <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-[#6f6657] sm:text-lg">
        Find a solar provider in your area to get more information and begin discussing
        installation.
      </p>
      <div className="mt-7 flex flex-col items-center gap-3">
        <button
          type="button"
          className="w-full max-w-md rounded-full bg-[#b66a07] px-7 py-3 text-base font-medium text-white shadow-[0_16px_36px_-20px_rgba(182,106,7,0.65)]"
        >
          Search for solar providers
        </button>
        <button
          type="button"
          className="w-full max-w-md rounded-full border border-black/10 bg-white px-7 py-3 text-base font-medium text-[#b66a07] shadow-[0_12px_30px_-24px_rgba(89,72,34,0.35)]"
        >
          Learn about going solar
        </button>
      </div>
    </section>
  );
}
