"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/estimate-calculations";
import type { SolarComparisonPoint, SolarComparisonSeries } from "@/lib/solar-comparison";

const SERIES_COLORS = {
  grid: "#4a7c46",
  buy: "#d15d46",
  lease: "#6084c7",
} as const;

const LABELS = {
  grid: "Staying on grid",
  buy: "Solar (instant install)",
  lease: "Solar (lease)",
} as const;

function buildLinePath(points: SolarComparisonPoint[], key: "grid" | "buy" | "lease", width: number, height: number, maxY: number) {
  if (!points.length || maxY <= 0) return "";
  return points
    .map((point, index) => {
      const x = (point.year / 25) * width;
      const value = point[key];
      const y = height - (value / maxY) * height;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
}

export function FinanceComparisonChart({
  series,
  title = "Cumulative cost by year",
}: {
  series: SolarComparisonSeries | null;
  title?: string;
}) {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  const chart = useMemo(() => {
    if (!series) return null;

    const width = 920;
    const height = 340;
    const maxY = Math.max(
      1,
      ...series.points.flatMap((point) => [point.grid, point.buy, point.lease]),
    );

    return {
      width,
      height,
      maxY,
      gridPath: buildLinePath(series.points, "grid", width, height, maxY),
      buyPath: buildLinePath(series.points, "buy", width, height, maxY),
      leasePath: buildLinePath(series.points, "lease", width, height, maxY),
    };
  }, [series]);

  if (!series || !chart) return null;

  const hoveredPoint =
    hoveredYear === null
      ? null
      : series.points.find((point) => point.year === hoveredYear) ?? null;

  const totalValue = series.points.reduce(
    (max, point) => Math.max(max, point.grid, point.buy, point.lease),
    0,
  );

  return (
    <div className="rounded-[22px] border border-[#e7dcc7] bg-[#f9f4ed] p-4 text-[#231f18] shadow-[0_20px_30px_rgba(0,0,0,0.08)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-[15px] font-medium text-[#231f18]">{title}</div>
        <div className="flex items-center gap-4 text-[11px] text-[#5f594f]">
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#4a7c46]" />{LABELS.grid}</div>
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#d15d46]" />{LABELS.buy}</div>
          <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#6084c7]" />{LABELS.lease}</div>
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-xl bg-white/30 p-3"
        onMouseLeave={() => setHoveredYear(null)}
      >
        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          className="h-[340px] w-full"
          role="img"
          aria-label="Comparison of cumulative costs for staying on grid, buying solar, and leasing solar"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = chart.height - chart.height * ratio;
            const value = chart.maxY * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={0}
                  y1={y}
                  x2={chart.width}
                  y2={y}
                  stroke="rgba(35,31,24,0.12)"
                  strokeWidth={1}
                />
                <text
                  x={8}
                  y={Math.max(12, y - 6)}
                  textAnchor="start"
                  fontSize="11"
                  fill="#5f594f"
                >
                  {formatCurrency(value)}
                </text>
              </g>
            );
          })}

          {[0, 5, 10, 15, 20, 25].map((year) => {
            const x = (year / 25) * chart.width;
            return (
              <g key={year}>
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={chart.height}
                  stroke="rgba(35,31,24,0.08)"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={chart.height - 8}
                  textAnchor={year === 0 ? "start" : year === 25 ? "end" : "middle"}
                  fontSize="11"
                  fill="#5f594f"
                >
                  {year}
                </text>
              </g>
            );
          })}

          <path d={chart.gridPath} fill="none" stroke={SERIES_COLORS.grid} strokeWidth={4} strokeLinecap="round" />
          <path d={chart.buyPath} fill="none" stroke={SERIES_COLORS.buy} strokeWidth={4} strokeLinecap="round" />
          <path d={chart.leasePath} fill="none" stroke={SERIES_COLORS.lease} strokeWidth={4} strokeLinecap="round" />

          {series.points.map((point) => {
            const x = (point.year / 25) * chart.width;
            const gridY = chart.height - (point.grid / chart.maxY) * chart.height;
            const buyY = chart.height - (point.buy / chart.maxY) * chart.height;
            const leaseY = chart.height - (point.lease / chart.maxY) * chart.height;
            const active = hoveredYear === point.year;
            const isLastPoint = point.year === series.points[series.points.length - 1]?.year;

            return (
              <g key={point.year}>
                {active ? (
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={chart.height}
                    stroke="rgba(35,31,24,0.22)"
                    strokeWidth={2}
                    strokeDasharray="6 6"
                  />
                ) : null}
                <circle cx={x} cy={gridY} r={active ? 6 : 4} fill={SERIES_COLORS.grid} />
                <circle cx={x} cy={buyY} r={active ? 6 : 4} fill={SERIES_COLORS.buy} />
                <circle cx={x} cy={leaseY} r={active ? 6 : 4} fill={SERIES_COLORS.lease} />
                {isLastPoint ? (
                  <>
                    <text
                      x={Math.max(8, x - 10)}
                      y={Math.max(16, gridY - 10)}
                      textAnchor="end"
                      fontSize="12"
                      fontWeight="600"
                      fill={SERIES_COLORS.grid}
                    >
                      {LABELS.grid}
                    </text>
                    <text
                      x={Math.max(8, x - 10)}
                      y={Math.max(16, buyY - 10)}
                      textAnchor="end"
                      fontSize="12"
                      fontWeight="600"
                      fill={SERIES_COLORS.buy}
                    >
                      {LABELS.buy}
                    </text>
                    <text
                      x={Math.max(8, x - 10)}
                      y={Math.max(16, leaseY - 10)}
                      textAnchor="end"
                      fontSize="12"
                      fontWeight="600"
                      fill={SERIES_COLORS.lease}
                    >
                      {LABELS.lease}
                    </text>
                  </>
                ) : null}
                <rect
                  x={Math.max(0, x - 12)}
                  y={0}
                  width={24}
                  height={chart.height}
                  fill="transparent"
                  onMouseEnter={() => setHoveredYear(point.year)}
                  onFocus={() => setHoveredYear(point.year)}
                />
              </g>
            );
          })}
        </svg>

        {hoveredPoint ? (
          <div className="pointer-events-none absolute right-4 top-4 w-52 rounded-xl border border-black/5 bg-[#231f18] px-3 py-2 text-xs text-white shadow-xl">
            <div className="space-y-1.5 leading-4">
              <div className="font-medium text-white">Year {hoveredPoint.year}</div>
              <div>{LABELS.grid}: {formatCurrency(hoveredPoint.grid)}</div>
              <div>{LABELS.buy}: {formatCurrency(hoveredPoint.buy)}</div>
              <div>{LABELS.lease}: {formatCurrency(hoveredPoint.lease)}</div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[#5f594f]">
        <span>Range: {formatCurrency(0)}–{formatCurrency(totalValue)}</span>
        <span>{series.paybackYear ? `Payback year: ${series.paybackYear}` : "No payback within model horizon"}</span>
      </div>
    </div>
  );
}
