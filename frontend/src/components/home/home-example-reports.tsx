const EXAMPLES = [
  {
    title: "Lagos, NG",
    subtitle: "Power the city",
    tone: "#f4a62a",
  },
  {
    title: "Abuja, NG",
    subtitle: "Community solar",
    tone: "#f0c94d",
  },
  {
    title: "Ibadan, NG",
    subtitle: "Sunny side of the street",
    tone: "#97bf73",
  },
];

function ExampleCircle({ tone }: { tone: string }) {
  return (
    <div
      className="relative mx-auto size-28 overflow-hidden rounded-full border border-black/10 shadow-[0_18px_42px_-26px_rgba(92,76,38,0.42)] sm:size-32"
      style={{
        background:
          "radial-gradient(circle at 22% 24%, rgba(255,255,255,0.18), transparent 16%), radial-gradient(circle at 74% 20%, rgba(255,255,255,0.08), transparent 18%), linear-gradient(145deg, #284334 0%, #3d5b43 50%, #22382b 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-95"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div
        className="absolute left-5 top-5 size-12 rounded-[18px] rotate-[-12deg]"
        style={{ background: tone }}
      />
      <div
        className="absolute right-6 top-8 size-10 rounded-[16px] rotate-[14deg]"
        style={{ background: "rgba(255,255,255,0.22)" }}
      />
      <div
        className="absolute bottom-4 left-8 h-8 w-16 rounded-[16px]"
        style={{ background: "rgba(255,255,255,0.12)" }}
      />
    </div>
  );
}

export function ExampleReportsSection() {
  return (
    <section id="examples" className="py-7 sm:py-9">
      <div className="text-center">
        <div className="text-[10px] uppercase tracking-[0.24em] text-[#7f7865]">
          Example reports
        </div>
        <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-[#6b6456] sm:text-base">
          Example reports
        </p>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {EXAMPLES.map((example) => (
          <article key={example.title} className="text-center">
            <ExampleCircle tone={example.tone} />
            <h3 className="mt-4 text-sm font-medium text-[#241f18] sm:text-base">{example.title}</h3>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[#7c7463]">
              {example.subtitle}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
