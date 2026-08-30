"use client";

import { useMemo } from "react";
import { Chart } from "@tanstack/react-charts";
import { areaY, defineChart, stackRowsY } from "@tanstack/charts";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { scaleOrdinal } from "@tanstack/charts/scales/ordinal";
import { formatCurrency } from "@/lib/estimate-calculations";
import type { SolarComparisonSeries } from "@/lib/solar-comparison";

const SERIES_COLORS = {
  grid: "#4a7c46",
  buy: "#d15d46",
  lease: "#6084c7",
} as const;

export function FinanceComparisonChart({
  series,
  title = "Thought for 7s",
}: {
  series: SolarComparisonSeries | null;
  title?: string;
}) {
  const chartDefinition = useMemo(() => {
    if (!series) return null;

    const rows: Array<{ year: number; series: "grid" | "buy" | "lease"; value: number }> = series.points.flatMap((point) => [
      { year: point.year, series: "grid" as const, value: point.grid },
      { year: point.year, series: "buy" as const, value: point.buy },
      { year: point.year, series: "lease" as const, value: point.lease },
    ]);

    const stacked = stackRowsY(rows as any, {
      x: (row: any) => row.year,
      y: (row: any) => row.value,
      z: (row: any) => row.series,
    }) as any;

    const dColor = scaleOrdinal<string, string>()
      .domain(["grid", "buy", "lease"])
      .range([SERIES_COLORS.grid, SERIES_COLORS.buy, SERIES_COLORS.lease]);

    return defineChart({
      marks: [
        areaY(stacked as any, {
          x: "x" as any,
          y1: "y1" as any,
          y2: "y2" as any,
          z: "z" as any,
          color: "z" as any,
          fillOpacity: 0.18,
          strokeWidth: 1.5,
        }) as any,
      ],
      scales: {
        x: { scale: scaleLinear, domain: [0, 25], nice: false },
        y: { scale: scaleLinear, nice: true, grid: true },
      },
      color: { scale: dColor },
    });
  }, [series]);

  if (!series || !chartDefinition) return null;

  const totalValue = series.points.reduce((max, point) => Math.max(max, point.grid + point.buy + point.lease), 0);

  return (
    <div className="rounded-[22px] border border-[#e7dcc7] bg-[#f9f4ed] p-4 text-[#231f18] shadow-[0_20px_30px_rgba(0,0,0,0.08)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-[15px] font-medium text-[#231f18]">{title}</div>
        <div className="flex items-center gap-4 text-[11px] text-[#5f594f]">
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#4a7c46]" />Staying on grid</div>
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#d15d46]" />Going solar</div>
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#6084c7]" />Lease</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white/30">
        <Chart
          definition={chartDefinition as any}
          height={340}
          ariaLabel="Comparison of cumulative costs for staying on grid, buying solar, and leasing solar"
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[#5f594f]">
        <span>Range: {formatCurrency(0)}–{formatCurrency(totalValue)}</span>
        <span>{series.paybackYear ? `Payback year: ${series.paybackYear}` : "No payback within model horizon"}</span>
      </div>
    </div>
  );
}
