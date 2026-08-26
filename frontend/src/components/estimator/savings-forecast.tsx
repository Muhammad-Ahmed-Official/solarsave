"use client";

import { MONTH_LABELS, currency, type SolarResult } from "@/lib/solar";

const COMPARISON_YEARS = [1, 5, 10, 15, 25];

export function SavingsForecast({ r, tariff }: { r: SolarResult; tariff: number }) {
  const peakMonth = Math.max(...r.monthlyKwh);
  const maxGrid = Math.max(r.years[r.years.length - 1]!.grid, r.systemCost);

  return (
    <section className="overflow-hidden rounded-xl bg-[image:var(--gradient-panel)] ring-1 ring-line shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between border-b border-line/70 px-4 py-3">
        <h2 className="num text-[10px] uppercase tracking-[0.18em] text-mute">Savings forecast</h2>
        <div className="num flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-teal">
          <span className="size-1.5 rounded-full bg-teal" />
          Live
        </div>
      </div>

      {/* The number people came for, given the most weight on the page. */}
      <div className="relative px-4 pb-4 pt-5">
        <div className="glow absolute left-1/2 top-1 h-16 w-52 -translate-x-1/2 rounded-full bg-solar/20 blur-2xl" />
        <div className="relative">
          <h3 className="num text-[10px] uppercase tracking-[0.18em] text-mute">
            First-year savings
          </h3>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="num text-5xl font-semibold leading-none text-solar">
              {currency(r.firstYearSavings)}
            </span>
            <span className="num text-sm text-mute">/yr</span>
          </p>
          <p className="num mt-2 flex items-center gap-2 text-xs text-teal">
            <span className="size-1.5 rounded-full bg-teal" />
            {r.roi.toFixed(0)}% ROI over 25 yr · {r.annualKwh.toFixed(0)} kWh/yr
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-px border-y border-line/70 bg-line/60">
        <div className="bg-panel px-3 py-2.5">
          <dt className="num text-[9px] uppercase tracking-[0.14em] text-mute">Payback</dt>
          <dd className="num mt-0.5 text-lg font-medium leading-tight">
            {r.payback ? r.payback.toFixed(1) : "—"} <span className="text-xs text-mute">yr</span>
          </dd>
        </div>
        <div className="bg-panel px-3 py-2.5">
          <dt className="num text-[9px] uppercase tracking-[0.14em] text-mute">CO₂ offset</dt>
          <dd className="num mt-0.5 text-lg font-medium leading-tight">
            {r.co2Tonnes.toFixed(1)} <span className="text-xs text-mute">t/yr</span>
          </dd>
        </div>
        <div className="bg-panel px-3 py-2.5">
          <dt className="num text-[9px] uppercase tracking-[0.14em] text-mute">Net 25yr</dt>
          <dd className="num mt-0.5 text-lg font-medium leading-tight text-teal">
            {`${currency(r.lifetimeNet / 1000, 1)}k`}
          </dd>
        </div>
      </dl>

      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          <h3 className="num text-[10px] uppercase tracking-[0.16em] text-mute">
            Monthly production
          </h3>
          <span className="num text-[10px] text-mute">kWh</span>
        </div>

        <ul className="mt-3 flex h-28 items-end gap-1.5">
          {r.monthlyKwh.map((v, i) => {
            const h = peakMonth > 0 ? (v / peakMonth) * 100 : 0;
            const tone =
              h > 85
                ? "bg-[image:linear-gradient(to_top,var(--sage),var(--lime))]"
                : h > 60
                  ? "bg-[image:linear-gradient(to_top,var(--sage),var(--cream))]"
                  : "bg-[image:linear-gradient(to_top,var(--sage),var(--mist))]";
            return (
              <li
                key={MONTH_LABELS[i]}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              >
                {/* The bar itself is decorative — the title exposes the value
                    on hover, the sr-only span below reads it out. */}
                <div
                  className={`sweep w-full rounded-[3px] ${tone}`}
                  style={{ height: `${h}%` }}
                  title={`${MONTH_LABELS[i]}: ${v.toFixed(0)} kWh`}
                />
                <span className="num text-[8px] text-mute" aria-hidden>
                  {MONTH_LABELS[i]}
                </span>
                <span className="sr-only">
                  Month {i + 1}: {v.toFixed(0)} kilowatt hours
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center justify-between">
          <h3 className="num text-[10px] uppercase tracking-[0.16em] text-mute">
            Grid vs solar cost
          </h3>
          <div className="num flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1.5 text-mute">
              <span className="size-2 rounded-[2px] bg-mute/60" />
              Grid
            </span>
            <span className="flex items-center gap-1.5 text-solar">
              <span className="size-2 rounded-[2px] bg-solar" />
              Solar
            </span>
          </div>
        </div>

        <ul className="mt-3 space-y-1.5">
          {COMPARISON_YEARS.map((y) => {
            const row = r.years[y - 1]!;
            const gridW = maxGrid > 0 ? (row.grid / maxGrid) * 100 : 0;
            const solarW = maxGrid > 0 ? (row.solar / maxGrid) * 100 : 0;
            const isPayback = r.payback > 0 && Math.ceil(r.payback) === y;
            return (
              <li key={y} className="flex items-center gap-2">
                <span className={`num w-6 text-[10px] ${isPayback ? "text-teal" : "text-mute"}`}>
                  Y{y}
                </span>
                <div className="relative h-2.5 flex-1 rounded-[2px] bg-mute/25">
                  <div
                    className="absolute left-0 top-0 h-full rounded-[2px] bg-mute/60"
                    style={{ width: `${Math.min(100, gridW)}%` }}
                  />
                  <div
                    className="absolute left-0 top-0 h-full rounded-[2px] bg-[image:var(--gradient-solar)]"
                    style={{ width: `${Math.min(100, solarW)}%` }}
                  />
                </div>
                <span className="sr-only">
                  Year {y}: cumulative grid cost {currency(row.grid)}, cumulative solar cost{" "}
                  {currency(row.solar)}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="num mt-2 flex items-center gap-2 text-[10px] text-teal">
          <span className="size-1.5 shrink-0 rounded-full bg-teal" />
          {r.payback
            ? `Payback reached year ${r.payback.toFixed(1)} — system cost ${currency(r.systemCost)}`
            : `No payback within 25 yr at ${currency(tariff, 2)}/kWh`}
        </p>
      </div>
    </section>
  );
}
