"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MapPanel } from "@/components/map-panel";
import {
  estimateLocationToPlace,
  type EstimateLocation,
} from "@/lib/estimate-location";
import type { EstimateViewState } from "@/components/estimate/estimate-types";
import Link from "next/link";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
}

function getDefaultBill(location: EstimateLocation) {
  const latitude = Math.abs(location.latitude ?? 0);
  if (latitude >= 45) {
    return 320;
  }
  if (latitude >= 30) {
    return 225;
  }
  return 180;
}

function getSummaryBillOptions(defaultBill: number) {
  const options = [120, 180, 225, 320, 450];
  if (options.includes(defaultBill)) {
    return options;
  }

  return [defaultBill, ...options].sort((a, b) => a - b);
}

function SectionCard({
  title,
  eyebrow,
  className = "",
  children,
}: {
  title: string;
  eyebrow?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-[0_20px_60px_-40px_rgba(89,72,34,0.45)] ${className}`}
    >
      <div className="border-b border-black/5 px-5 py-4 sm:px-6">
        {eyebrow ? (
          <div className="text-[10px] uppercase tracking-[0.24em] text-[#917d5d]">{eyebrow}</div>
        ) : null}
        <h2 className="mt-2 text-xl font-normal tracking-[-0.03em] text-[#231f18] sm:text-2xl">
          {title}
        </h2>
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  className = "",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[24px] border border-black/8 bg-white/95 p-4 shadow-[0_16px_46px_-32px_rgba(89,72,34,0.35)] backdrop-blur ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[#fff7eb] text-[#b66a07]">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-[#917d5d]">{title}</div>
          <div className="mt-2 text-2xl font-medium tracking-[-0.04em] text-[#231f18]">
            {value}
          </div>
          <div className="mt-1 text-sm leading-6 text-[#6f6657]">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

function LocationSearchChrome({
  title,
  subtitle,
  details,
}: {
  title: string;
  subtitle: string;
  details: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-[#c8b59d] bg-white px-4 py-3 shadow-[0_10px_30px_-24px_rgba(89,72,34,0.45)]">
      <svg viewBox="0 0 24 24" fill="none" className="size-5 shrink-0 text-[#6b5f50]" aria-hidden>
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
        <path d="m20 20-3.4-3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium text-[#241f18]">{title}</div>
        <div className="truncate text-[12px] text-[#7d7564]">{subtitle || details}</div>
      </div>
      <Link href="/" className="grid size-7 place-items-center rounded-full border border-[#d4c6b4] text-[#6b5f50]">
        <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </Link>
    </div>
  );
}

function FinanceTabs({
  upfrontCost,
  benefits20y,
  savings20y,
  paybackYears,
}: {
  upfrontCost: number;
  benefits20y: number;
  savings20y: number;
  paybackYears: number;
}) {
  const [tab, setTab] = useState<"buy" | "lease" | "loan">("buy");

  const copy = {
    buy: {
      lead: "Pay up front, largest lifetime savings.",
      body:
        "You own the system outright, keep the incentives, and capture the highest long-term value.",
    },
    lease: {
      lead: "Lower upfront cost, predictable payments.",
      body:
        "A lease reduces the initial spend while still shifting part of your electricity use toward solar.",
    },
    loan: {
      lead: "Finance ownership over time.",
      body:
        "A loan balances cash flow and ownership so you can spread the install cost across monthly payments.",
    },
  }[tab];

  return (
    <div>
      <div className="flex border-b border-[#d8c8b2]">
        {(["buy", "lease", "loan"] as const).map((item) => {
          const active = item === tab;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`relative flex-1 py-4 text-center text-[17px] transition ${active ? "text-[#231f18]" : "text-[#6f6657]"
                }`}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
              <span
                className={`absolute inset-x-0 bottom-0 h-0.5 ${active ? "bg-[#b66a07]" : "bg-transparent"
                  }`}
              />
            </button>
          );
        })}
      </div>

      <div className="px-1 py-6">
        <p className="max-w-5xl text-base leading-8 text-[#4a4337]">
          <span className="font-semibold text-[#7b5eae]">{copy.lead}</span> {copy.body}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="text-center">
            <div className="text-2xl font-medium tracking-[-0.04em] text-[#231f18]">
              {formatCurrency(upfrontCost)}
            </div>
            <div className="mt-2 text-[15px] leading-6 text-[#7b63c6]">
              Upfront cost after incentives
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium tracking-[-0.04em] text-[#231f18]">
              {formatCurrency(benefits20y)}
            </div>
            <div className="mt-2 text-[15px] leading-6 text-[#7b63c6]">
              20 year benefits
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium tracking-[-0.04em] text-[#231f18]">
              {formatCurrency(savings20y)}
            </div>
            <div className="mt-2 text-[15px] leading-6 text-[#7b63c6]">
              Total 20 year savings
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium tracking-[-0.04em] text-[#231f18]">
              {formatNumber(paybackYears)}
            </div>
            <div className="mt-2 text-[15px] leading-6 text-[#7b63c6]">
              Years until payback
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImpactMetric({
  title,
  value,
  caption,
  icon,
}: {
  title: string;
  value: string;
  caption: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="grid size-14 place-items-center rounded-full border border-[#e9ddd0] bg-white text-[#b66a07] shadow-[0_12px_30px_-26px_rgba(89,72,34,0.45)]">
        {icon}
      </div>
      <div className="text-[15px] font-medium text-[#4b4337]">{title}</div>
      <div className="text-2xl font-medium tracking-[-0.04em] text-[#231f18]">{value}</div>
      <div className="max-w-[14rem] text-sm leading-6 text-[#6f6657]">{caption}</div>
    </div>
  );
}

function StatusRibbon({
  view,
  activityId,
}: {
  view: EstimateViewState;
  activityId: string;
}) {
  const label =
    view.status === "checking"
      ? `Checking task ${view.attempt} of 5`
      : view.status === "success"
        ? "Analysis complete"
        : "Analysis needs attention";

  return (
    <div className="rounded-full border border-black/10 bg-white/90 px-4 py-2 text-sm text-[#6f6657] shadow-[0_12px_30px_-24px_rgba(89,72,34,0.35)] backdrop-blur">
      <span className="font-medium text-[#231f18]">{label}</span>
      <span className="mx-2 text-[#c8b59d]">|</span>
      <span className="font-mono text-[12px] tracking-[0.12em] text-[#917d5d]">
        {activityId.slice(0, 10)}
      </span>
    </div>
  );
}

export function EstimatePageShell({
  activityId,
  location,
  view,
}: {
  activityId: string;
  location: EstimateLocation;
  view: EstimateViewState;
}) {
  const mapPlace = useMemo(() => estimateLocationToPlace(location), [location]);
  const [monthlyBill, setMonthlyBill] = useState(() => getDefaultBill(location));

  useEffect(() => {
    setMonthlyBill(getDefaultBill(location));
  }, [location]);

  const latitudeFactor = Math.max(0, 90 - Math.abs(location.latitude ?? 0));
  const sunlightHours = Math.round(920 + latitudeFactor * 2.1);
  const roofArea = Math.round(520 + latitudeFactor * 9.5);
  const solarSizeKw = Math.max(8.2, monthlyBill / 16.6 + latitudeFactor / 85);
  const arraySqFt = Math.round(solarSizeKw * 53);
  const upfrontCost = Math.round(solarSizeKw * 1700);
  const benefits20y = Math.round(monthlyBill * 12 * 20 * 0.92);
  const savings20y = benefits20y - upfrontCost;
  const paybackYears = upfrontCost / Math.max(monthlyBill * 12 * 0.85, 1);

  const impactCo2 = (solarSizeKw * 0.46).toFixed(1);
  const impactCars = (solarSizeKw * 0.18).toFixed(1);
  const impactTrees = Math.round(solarSizeKw * 12);

  const billingOptions = getSummaryBillOptions(getDefaultBill(location));

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[image:var(--gradient-page)] text-[#231f18]">
      <MapPanel place={mapPlace} />

      <header className="sticky top-0 z-30 border-b border-black/10 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex shrink-0 items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-[image:var(--gradient-solar)] ring-1 ring-[#dcc8a2]">
              <div className="size-4 rounded-full bg-white/75 shadow-[0_0_12px_2px_rgba(255,255,255,0.65)]" />
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-tight text-[#231f18]">
                SOLAR SAVE
              </div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-[#917d5d]">
                FortyGuard powered
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            <a href="#impact" className="text-sm font-medium text-[#b66a07]">
              About
            </a>
            <a href="#finance" className="text-sm font-medium text-[#b66a07]">
              Solar 101
            </a>
          </nav>

          <div className="ml-auto w-full md:max-w-[470px]">
            <LocationSearchChrome
              title={location.title}
              subtitle={location.subtitle}
              details={location.details}
            />
          </div>
        </div>
      </header>

      <div className="relative z-10">
        <section className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-[390px_minmax(0,1fr)]">
            <div className="space-y-3 lg:pt-4">
              <SectionCard
                eyebrow="Solar potential results for"
                title={location.title}
              >
                <p className="text-sm leading-7 text-[#6f6657]">{location.details}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-[#f8f4eb] p-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#917d5d]">
                      Place ID
                    </div>
                    <div className="mt-2 truncate font-medium text-[#231f18]">
                      {location.placeId || "Not provided"}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-[#f8f4eb] p-3">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#917d5d]">
                      Coordinates
                    </div>
                    <div className="mt-2 font-medium text-[#231f18]">
                      {location.latitude !== null && location.longitude !== null ? (
                        <>
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </>
                      ) : (
                        "Pending"
                      )}
                    </div>
                  </div>
                </div>
              </SectionCard>

              <MetricCard
                title="Usable sunlight"
                value={`${formatNumber(sunlightHours)} hours`}
                subtitle="Based on local weather and roof analysis."
                icon={
                  <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden>
                    <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.8" />
                    <path
                      d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                }
              />

              <MetricCard
                title="Solar footprint"
                value={`${formatNumber(roofArea)} sq ft`}
                subtitle="Estimated area that can support a rooftop system."
                icon={
                  <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden>
                    <path
                      d="M4 18.5h16M6.5 18.5V11l5.5-3 5.5 3v7.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9 18.5v-4.5h6v4.5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              />

              <MetricCard
                title="Estimated savings"
                value={formatCurrency(savings20y)}
                subtitle="Projected net savings across 20 years."
                icon={
                  <svg viewBox="0 0 24 24" fill="none" className="size-6" aria-hidden>
                    <path
                      d="M4 7.5h16v9H4z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path d="M8 12h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path
                      d="M12 10.5v3"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                }
              />
            </div>

            <div className="relative overflow-hidden rounded-[34px] border border-black/10 shadow-[0_24px_80px_-44px_rgba(89,72,34,0.55)]">
              <div className="relative min-h-[58vh] overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.18),rgba(255,255,255,0.0)),radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_40%)]" />

                <div className="absolute left-4 top-4 z-20 max-w-[32rem] space-y-3 sm:left-6 sm:top-6">
                  <SectionCard
                    eyebrow="Solar potential results for"
                    title={location.title}
                    className="bg-white/95 backdrop-blur"
                  >
                    <p className="text-sm leading-7 text-[#6f6657]">{location.details}</p>
                  </SectionCard>
                  <StatusRibbon view={view} activityId={activityId} />
                </div>

                <div className="absolute bottom-4 left-4 z-20 rounded-full border border-black/10 bg-white/90 px-4 py-2 text-sm text-[#7b5eae] shadow-[0_12px_30px_-24px_rgba(89,72,34,0.35)] backdrop-blur">
                  GHI of location powered by FortyGuard
                </div>

                <div className="absolute bottom-4 right-4 z-20 rounded-full border border-black/10 bg-white/90 px-4 py-2 shadow-[0_12px_30px_-24px_rgba(89,72,34,0.35)] backdrop-blur">
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-full px-1 py-1 text-sm font-medium text-[#b66a07]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
                      <path
                        d="M12 5.5v8M7.5 10l4.5 4.5L16.5 10"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M5 20h14"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 pt-10 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Your average monthly electric bill" eyebrow="">
              <p className="max-w-xl text-sm leading-7 text-[#6f6657]">
                We use your bill to estimate how much electricity you use based on typical utility
                rates in your area.
              </p>
              <div className="mt-8 flex justify-center">
                <label className="inline-flex flex-col items-stretch">
                  <span className="sr-only">Average monthly bill</span>
                  <select
                    value={monthlyBill}
                    onChange={(event) => setMonthlyBill(Number(event.target.value))}
                    className="min-w-[14rem] rounded-[12px] border border-[#bda98f] bg-white px-4 py-3 text-lg text-[#231f18] shadow-[0_8px_20px_-16px_rgba(89,72,34,0.45)] outline-none"
                  >
                    {billingOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </SectionCard>

            <SectionCard title="Your recommended solar installation size" eyebrow="">
              <p className="max-w-xl text-sm leading-7 text-[#6f6657]">
                This size should cover most of your electricity usage. Solar installations are
                measured in kilowatts (kW).
              </p>
              <div className="mt-7 text-center">
                <div className="text-4xl font-medium tracking-[-0.04em] text-[#231f18]">
                  {formatNumber(solarSizeKw)} kW
                </div>
                <div className="mt-3 text-lg text-[#6f6657]">({formatNumber(arraySqFt)} ft2)</div>
              </div>
            </SectionCard>
          </div>
        </section>

        <section
          id="impact"
          className="mx-auto mt-4 max-w-[1600px] px-4 sm:px-6 lg:px-8"
        >
          <SectionCard title="Your potential environmental impact" eyebrow="">
            <p className="text-center text-sm leading-7 text-[#6f6657]">
              Estimated annual environmental impact of the recommended solar installation size.
            </p>
            <div className="mt-8 grid gap-8 lg:grid-cols-3">
              <ImpactMetric
                title="Carbon dioxide"
                value={`${impactCo2}`}
                caption="metric tons"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden>
                    <circle cx="6" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="8" r="2.4" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="16.5" cy="15" r="2.4" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                }
              />
              <ImpactMetric
                title="Passenger cars"
                value={`${impactCars}`}
                caption="taken off the road for 1 yr"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" className="size-8" aria-hidden>
                    <path
                      d="M5 15h14l-1.4-4.5a2 2 0 0 0-1.9-1.4H8.3a2 2 0 0 0-1.9 1.4L5 15Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path d="M7 15v2M17 15v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="8" cy="17.5" r="1.2" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="16" cy="17.5" r="1.2" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                }
              />
              <ImpactMetric
                title="Tree seedlings"
                value={`${impactTrees}`}
                caption="grown for 10 yrs"
                icon={
                  <svg viewBox="0 0 24 24" fill="none" className="size-7" aria-hidden>
                    <path
                      d="M12 4c-3 2-4.5 4.5-4.5 7.5A4.5 4.5 0 0 0 12 16a4.5 4.5 0 0 0 4.5-4.5C16.5 8.5 15 6 12 4Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <path d="M12 16v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M8 21h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                }
              />
            </div>
          </SectionCard>
        </section>

        <section
          id="finance"
          className="mx-auto mt-4 max-w-[1600px] px-4 sm:px-6 lg:px-8"
        >
          <SectionCard title="Learn how to finance your solar panels" eyebrow="">
            <FinanceTabs
              upfrontCost={upfrontCost}
              benefits20y={benefits20y}
              savings20y={savings20y}
              paybackYears={paybackYears}
            />
          </SectionCard>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 py-12 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-normal tracking-[-0.04em] text-[#231f18] sm:text-4xl">
            Ready to get started?
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-7 text-[#6f6657] sm:text-lg">
            Find a solar provider in your area to get more information and begin discussing
            installation.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className="rounded-full bg-[#b66a07] px-7 py-3 text-base font-medium text-white shadow-[0_16px_36px_-20px_rgba(182,106,7,0.65)]"
            >
              Search for solar providers
            </button>
            <button
              type="button"
              className="rounded-full border border-black/10 bg-white px-7 py-3 text-base font-medium text-[#b66a07] shadow-[0_12px_30px_-24px_rgba(89,72,34,0.35)]"
            >
              Learn about going solar
            </button>
          </div>
        </section>

        <section className="mx-auto max-w-[1600px] px-4 pb-20 sm:px-6 lg:px-8">
          <SectionCard title="Task result" eyebrow="Technical details">
            {view.status === "success" ? (
              <pre className="overflow-x-auto rounded-[22px] bg-[#f8f4eb] p-4 text-sm leading-6 text-[#241f18]">
                {JSON.stringify(view.payload, null, 2)}
              </pre>
            ) : view.status === "checking" ? (
              <div className="rounded-[22px] border border-dashed border-black/10 bg-[#fbf7ef] p-5 text-sm text-[#6d6557]">
                We are checking FortyGuard for the analysis result. The live task will refresh
                automatically every 30 seconds.
              </div>
            ) : (
              <div className="rounded-[22px] border border-dashed border-[#d9b99a] bg-[#fff7ef] p-5 text-sm text-[#8d5d2c]">
                {view.message}
              </div>
            )}
          </SectionCard>
        </section>
      </div>
    </main>
  );
}
