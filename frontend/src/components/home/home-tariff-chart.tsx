import { TARIFF_SERIES } from "@/components/home/home-data";

function buildPath(key: "grid" | "solar", width: number, height: number) {
  const padding = { top: 28, right: 28, bottom: 42, left: 52 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...TARIFF_SERIES.map((point) => point[key]));
  const minValue = 0.95;

  const xFor = (index: number) => padding.left + (plotWidth * index) / (TARIFF_SERIES.length - 1);
  const yFor = (value: number) => {
    const clamped = Math.min(maxValue, Math.max(minValue, value));
    const ratio = (clamped - minValue) / (maxValue - minValue);
    return padding.top + plotHeight - ratio * plotHeight;
  };

  return TARIFF_SERIES.map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(point[key])}`).join(" ");
}

export function TariffChartSection() {
  const width = 860;
  const height = 420;
  const padding = { top: 28, right: 28, bottom: 42, left: 52 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...TARIFF_SERIES.map((point) => point.grid));
  const minValue = 0.95;

  const xFor = (index: number) => padding.left + (plotWidth * index) / (TARIFF_SERIES.length - 1);
  const yFor = (value: number) => {
    const clamped = Math.min(maxValue, Math.max(minValue, value));
    const ratio = (clamped - minValue) / (maxValue - minValue);
    return padding.top + plotHeight - ratio * plotHeight;
  };

  const gridPath = buildPath("grid", width, height);
  const solarPath = buildPath("solar", width, height);

  return (
    <section id="tariffs" className="py-8 sm:py-10">
      <div className="rounded-[34px] border border-black/10 bg-white/86 p-5 shadow-[0_22px_60px_-36px_rgba(89,72,34,0.45)] sm:p-6">
        <div className="flex flex-col gap-2">
          <div className="text-[10px] uppercase tracking-[0.24em] text-[#7f7865]">
            Tariff curve
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#231e17] sm:text-3xl">
            Normal electricity rises faster than solar
          </h2>
          <p className="max-w-3xl text-sm leading-7 text-[#666053] sm:text-base">
            The chart shows a simple exponential view of grid tariffs versus solar over the first
            1, 5, and 10 years so users can grasp the long-term value quickly.
          </p>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.18fr_.82fr]">
          <div
            className="overflow-hidden rounded-[30px] border border-black/10 bg-[#f7f2e7] p-4"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          >
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-auto w-full"
              role="img"
              aria-labelledby="tariff-title tariff-desc"
            >
              <title id="tariff-title">Electricity tariff and solar growth over time</title>
              <desc id="tariff-desc">
                An exponential chart comparing normal grid electricity growth to solar growth over
                ten years.
              </desc>

              {Array.from({ length: 4 }).map((_, index) => {
                const y = padding.top + (plotHeight * index) / 3;
                return (
                  <line
                    key={y}
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={y}
                    y2={y}
                    stroke="rgba(104, 94, 73, 0.15)"
                    strokeDasharray="5 9"
                  />
                );
              })}

              <line
                x1={padding.left}
                x2={padding.left}
                y1={padding.top}
                y2={height - padding.bottom}
                stroke="rgba(80, 72, 57, 0.26)"
              />
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={height - padding.bottom}
                y2={height - padding.bottom}
                stroke="rgba(80, 72, 57, 0.26)"
              />

              <path
                d={gridPath}
                fill="none"
                stroke="#e0892a"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={solarPath}
                fill="none"
                stroke="#4f7f48"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {TARIFF_SERIES.map((point, index) => {
                const x = xFor(index);
                const gridY = yFor(point.grid);
                const solarY = yFor(point.solar);
                const isMajor = point.year === 1 || point.year === 5 || point.year === 10;
                return (
                  <g key={point.year}>
                    <circle cx={x} cy={gridY} r={isMajor ? 6 : 4} fill="#e0892a" />
                    <circle cx={x} cy={solarY} r={isMajor ? 6 : 4} fill="#4f7f48" />
                    {isMajor ? (
                      <text
                        x={x}
                        y={height - 12}
                        textAnchor="middle"
                        fontSize="13"
                        fontFamily="var(--font-ibm-plex-mono)"
                        fill="#7d7563"
                      >
                        {point.year}y
                      </text>
                    ) : null}
                  </g>
                );
              })}

              <g fill="#7d7563" fontSize="13" fontFamily="var(--font-ibm-plex-mono)">
                <text x="10" y={yFor(3.3)}>
                  3.3x
                </text>
                <text x="10" y={yFor(2)}>
                  2.0x
                </text>
                <text x="10" y={yFor(1)}>
                  1.0x
                </text>
              </g>
            </svg>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[28px] border border-black/10 bg-[#fbf8ef] p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#8b816e]">1 year</div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <div className="text-sm text-[#776f5d]">Grid tariff</div>
                  <div className="text-3xl font-semibold text-[#e0892a]">1.00x</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#776f5d]">Solar</div>
                  <div className="text-3xl font-semibold text-[#4f7f48]">1.00x</div>
                </div>
              </div>
            </div>
            <div className="rounded-[28px] border border-black/10 bg-[#fbf8ef] p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#8b816e]">5 years</div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <div className="text-sm text-[#776f5d]">Grid tariff</div>
                  <div className="text-3xl font-semibold text-[#e0892a]">2.19x</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#776f5d]">Solar</div>
                  <div className="text-3xl font-semibold text-[#4f7f48]">1.13x</div>
                </div>
              </div>
            </div>
            <div className="rounded-[28px] border border-black/10 bg-[#fbf8ef] p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[#8b816e]">10 years</div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <div className="text-sm text-[#776f5d]">Grid tariff</div>
                  <div className="text-3xl font-semibold text-[#e0892a]">5.15x</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#776f5d]">Solar</div>
                  <div className="text-3xl font-semibold text-[#4f7f48]">1.34x</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
