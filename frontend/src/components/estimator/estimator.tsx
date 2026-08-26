"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AddressSearch } from "@/components/estimator/address-search";
import { SavingsForecast } from "@/components/estimator/savings-forecast";
import { useGhi } from "@/components/estimator/use-ghi";
import { MapPanel } from "@/components/map/map-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import type { GeocodedPlace } from "@/lib/geocoding";
import type { IrradianceBasis } from "@/lib/ghi";
import { ASSUMED_PEAK_SUN_HOURS } from "@/lib/ghi";
import { SYSTEM_DEFAULTS, computeSolar, currency } from "@/lib/solar";

const BASIS_NOTE: Record<IrradianceBasis, string> = {
  annual: "Reported as an annual total.",
  daily: "Reported as a daily total, scaled to a year.",
  instantaneous: `Reported as a single-moment reading, extrapolated at ${ASSUMED_PEAK_SUN_HOURS} peak sun hours per day.`,
};

function Metric({
  label,
  value,
  unit,
  pending = false,
}: {
  label: string;
  value: string;
  unit?: string;
  pending?: boolean;
}) {
  return (
    <div className="rounded-lg bg-[image:var(--gradient-panel)] px-3.5 py-3 ring-1 ring-line shadow-[var(--shadow-soft)]">
      <div className="num text-[10px] uppercase tracking-[0.16em] text-mute">{label}</div>
      {pending ? (
        <div className="mt-1.5 h-6 w-16 animate-pulse rounded bg-line" />
      ) : (
        <div className="num mt-1 text-2xl font-medium leading-none text-paper">
          {value} {unit ? <span className="text-xs text-mute">{unit}</span> : null}
        </div>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  hint,
  hintTone = "mute",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  hint: string;
  hintTone?: "mute" | "solar" | "teal";
  onChange: (v: number) => void;
}) {
  const tone =
    hintTone === "solar" ? "text-solar" : hintTone === "teal" ? "text-teal" : "text-mute";

  return (
    <div>
      {/* The readout is wired in via aria-describedby so the value is
          announced with the control, not stranded next to it. */}
      <label className="block text-sm text-mute">
        {label}
        <div className="mt-1.5 flex items-center justify-between rounded-lg bg-panel2 px-3 py-2 ring-1 ring-line">
          <span className="num text-sm text-paper">{display}</span>
          <span className={`num text-xs ${tone}`}>{hint}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={`${display}, ${hint}`}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-line accent-solar"
        />
      </label>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl bg-[image:var(--gradient-panel)] ring-1 ring-line shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-3 border-b border-line/70 px-4 py-3">
        <h2 className="num text-[10px] uppercase tracking-[0.18em] text-mute">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Estimator() {
  const [place, setPlace] = useState<GeocodedPlace | null>(null);
  const [area, setArea] = useState<number>(SYSTEM_DEFAULTS.area);
  const [efficiency, setEfficiency] = useState<number>(SYSTEM_DEFAULTS.efficiency);
  const [tariff, setTariff] = useState<number>(SYSTEM_DEFAULTS.tariff);
  const [costPerKw, setCostPerKw] = useState<number>(SYSTEM_DEFAULTS.costPerKw);

  const { state, fetchFor, refresh } = useGhi(place);

  // Selecting an address immediately pulls its irradiance: the estimate is the
  // whole point of the search, so making people press a second button would
  // only add a step.
  const handleSelect = useCallback(
    (next: GeocodedPlace) => {
      setPlace(next);
      void fetchFor(next);
    },
    [fetchFor]
  );

  const ghi = state.status === "ready" ? state.irradiance : null;
  const loading = state.status === "loading";

  const r = useMemo(
    () =>
      ghi
        ? computeSolar({
            ghi: ghi.annualKwhPerM2,
            area,
            efficiency,
            tariff,
            costPerKw,
            latitude: place?.latitude ?? 0,
          })
        : null,
    [area, costPerKw, efficiency, ghi, place?.latitude, tariff]
  );

  const region =
    [place?.state, place?.country].filter(Boolean).join(", ") || place?.county || "—";

  return (
    <div className="min-h-dvh bg-dusk bg-[image:var(--gradient-page)] bg-fixed text-paper">
      <a
        href="#estimate"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:ring-1 focus:ring-line"
      >
        Skip to the estimate
      </a>

      <nav className="sticky top-0 z-30 border-b border-line bg-[image:var(--gradient-panel)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:h-16 lg:flex-nowrap lg:gap-4 lg:py-0 lg:px-8">
          <div className="flex shrink-0 items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-[image:var(--gradient-solar)] ring-1 ring-sage/50">
              <div className="size-3.5 rounded-full bg-solar shadow-[0_0_12px_1px_var(--solar)]" />
            </div>
            <div className="leading-tight">
              <h1 className="text-base font-semibold tracking-tight">SOLAR SAVE</h1>
              <div className="num text-[10px] uppercase tracking-[0.2em] text-mute">
                FortyGuard · Irradiance
              </div>
            </div>
          </div>

          {/* Search is the primary action, so it takes the centre and the most
              width at every breakpoint. */}
          <div className="order-last w-full lg:order-none lg:mx-auto lg:max-w-xl">
            <AddressSearch selectedPlace={place} onSelect={handleSelect} />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
            <ThemeToggle />
            <button
              type="button"
              onClick={refresh}
              disabled={!place || loading}
              aria-busy={loading || undefined}
              className="rounded-lg bg-[image:var(--gradient-solar)] px-3.5 py-2 text-sm font-medium text-paper ring-1 ring-sage/60 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? "Loading…" : "Refresh data"}
            </button>
          </div>
        </div>
      </nav>

      <div id="estimate" className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric
            label="GHI · annual"
            value={ghi ? ghi.annualKwhPerM2.toLocaleString("en-US") : "—"}
            unit="kWh/m²yr"
            pending={loading}
          />
          <Metric
            label="Peak sun hours"
            value={r ? r.peakSunHours.toFixed(1) : "—"}
            unit="h/day"
            pending={loading}
          />
          <Metric
            label="Array capacity"
            value={r ? r.capacityKw.toFixed(1) : "—"}
            unit="kW"
            pending={loading}
          />
          <Metric label="Region" value={region} pending={loading} />
        </header>

        {/* One slot carries every non-result state so the page never jumps. */}
        {!place ? (
          <EmptyState />
        ) : state.status === "error" ? (
          <ErrorState message={state.message} onRetry={refresh} />
        ) : state.status === "ready" && !ghi ? (
          <ErrorState
            message="The service answered for this location but reported no irradiance figure, so a savings estimate is not possible here."
            onRetry={refresh}
          />
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-7">
            <Panel
              title="Location · Live map"
              action={
                place ? (
                  <span className="num text-[11px] text-teal">
                    {Math.abs(place.latitude).toFixed(4)}° {place.latitude >= 0 ? "N" : "S"},{" "}
                    {Math.abs(place.longitude).toFixed(4)}° {place.longitude >= 0 ? "E" : "W"}
                  </span>
                ) : null
              }
            >
              <MapPanel place={place} />
              {place ? (
                <p className="border-t border-line/70 px-4 py-2.5 text-xs text-mute">
                  <span className="text-paper">{place.title}</span>
                  <span className="mx-1.5">·</span>
                  {place.displayName}
                </p>
              ) : null}
            </Panel>

            <Panel title="System configuration">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 px-4 py-5 sm:grid-cols-2">
                <Slider
                  label="Panel area"
                  value={area}
                  min={6}
                  max={120}
                  step={2}
                  display={`${area} m²`}
                  hint={r ? `${r.panels} panels` : "—"}
                  hintTone="solar"
                  onChange={setArea}
                />
                <Slider
                  label="Panel efficiency"
                  value={efficiency}
                  min={14}
                  max={24}
                  step={0.2}
                  display={`${efficiency.toFixed(1)} %`}
                  hint={efficiency >= 21 ? "bifacial" : "monocrystalline"}
                  hintTone="teal"
                  onChange={setEfficiency}
                />
                <Slider
                  label="Installed cost"
                  value={costPerKw}
                  min={900}
                  max={2600}
                  step={50}
                  display={`${currency(costPerKw)} /kW`}
                  hint={r ? `${currency(r.systemCost)} total` : "—"}
                  onChange={setCostPerKw}
                />
                <Slider
                  label="Electricity tariff"
                  value={tariff}
                  min={0.05}
                  max={0.6}
                  step={0.01}
                  display={`${currency(tariff, 2)} /kWh`}
                  hint="TOU"
                  onChange={setTariff}
                />
              </div>
            </Panel>
          </div>

          <div className="self-start lg:col-span-5 lg:sticky lg:top-20">
            {r && ghi ? (
              <div className="space-y-3">
                <SavingsForecast r={r} tariff={tariff} />

                <details className="group rounded-xl bg-[image:var(--gradient-panel)] px-4 py-3 ring-1 ring-line">
                  <summary className="num flex cursor-pointer list-none items-center justify-between gap-2 text-[10px] uppercase tracking-[0.16em] text-mute marker:content-['']">
                    Data provenance
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                      className="size-3.5 transition-transform group-open:rotate-180"
                    >
                      <path
                        d="m6 9 6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </summary>
                  <div className="mt-3 space-y-2 text-xs leading-5 text-mute">
                    <p>
                      FortyGuard returned{" "}
                      <span className="num text-paper">
                        {ghi.reportedValue} {ghi.reportedUnit}
                      </span>{" "}
                      at <span className="num">{ghi.sourceKey}</span>. {BASIS_NOTE[ghi.basis]}
                    </p>
                    {ghi.derived ? (
                      <p className="text-teal">
                        The annual figure above is inferred from that reading, not measured over a
                        year. Treat it as indicative.
                      </p>
                    ) : null}
                    <p>Address resolved by OpenStreetMap Nominatim.</p>
                    {state.status === "ready" && state.readings.length > 0 ? (
                      <dl className="mt-2 divide-y divide-line/70 border-t border-line/70 pt-1">
                        {state.readings.map((row) => (
                          <div key={row.key} className="flex justify-between gap-3 py-1">
                            <dt className="min-w-0 truncate" title={row.key}>
                              {row.label}
                            </dt>
                            <dd className="num shrink-0 text-[11px] text-paper">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    ) : null}
                  </div>
                </details>

                <p className="px-1 text-[11px] leading-5 text-mute">
                  Planning figures, not a quote. Roof pitch, shading, local incentives and your own
                  tariff will move the result.
                </p>
              </div>
            ) : (
              <ForecastPlaceholder loading={loading} hasPlace={Boolean(place)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <p className="mt-4 rounded-xl bg-[image:var(--gradient-panel)] px-4 py-3 text-sm text-mute ring-1 ring-line">
      Search any address above to pull its solar irradiance and model 25 years of production,
      savings and payback.
    </p>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[image:var(--gradient-panel)] px-4 py-3 ring-1 ring-destructive/40"
    >
      <p className="text-sm text-paper">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="shrink-0 rounded-lg bg-panel2 px-3 py-1.5 text-sm text-paper ring-1 ring-line hover:bg-panel"
      >
        Try again
      </button>
    </div>
  );
}

function ForecastPlaceholder({ loading, hasPlace }: { loading: boolean; hasPlace: boolean }) {
  return (
    <section className="rounded-xl bg-[image:var(--gradient-panel)] p-4 ring-1 ring-line shadow-[var(--shadow-soft)]">
      <h2 className="num text-[10px] uppercase tracking-[0.18em] text-mute">Savings forecast</h2>

      {loading ? (
        <>
          {/* Mirrors the finished layout so nothing shifts when data lands. */}
          <div aria-hidden className="mt-4 space-y-3">
            <div className="h-14 w-2/3 animate-pulse rounded-lg bg-line" />
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-line" />
              ))}
            </div>
            <div className="h-28 animate-pulse rounded-lg bg-line" />
          </div>
          <p className="sr-only" role="status" aria-live="polite">
            Fetching solar irradiance for this address.
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-mute">
          {hasPlace
            ? "No irradiance data for this address yet."
            : "Pick an address and the forecast appears here."}
        </p>
      )}
    </section>
  );
}
