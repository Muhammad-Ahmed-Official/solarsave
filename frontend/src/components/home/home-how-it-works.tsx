import { HOME_STEPS } from "@/components/home/home-data";

export function HowItWorksSection() {
  return (
    <section className="py-8 sm:py-10">
      <div className="rounded-[34px] border border-black/10 bg-white/84 p-5 shadow-[0_22px_60px_-36px_rgba(89,72,34,0.45)] sm:p-6">
        <div className="flex flex-col gap-2">
          <div className="text-[10px] uppercase tracking-[0.24em] text-[#7f7865]">
            How it works
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#231e17] sm:text-3xl">
            Three steps from address to clean energy estimate
          </h2>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {HOME_STEPS.map((item) => (
            <article
              key={item.step}
              className="rounded-[28px] border border-black/10 bg-[#fbf8ef] p-5"
            >
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#8b816e]">
                {item.step}
              </div>
              <h3 className="mt-2 text-xl font-semibold text-[#241f18]">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#6c6558]">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
