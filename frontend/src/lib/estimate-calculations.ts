import type { EstimateLocation } from "@/lib/estimate-location";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
}

export function getDefaultBill(location: EstimateLocation) {
  const latitude = Math.abs(location.latitude ?? 0);
  if (latitude >= 45) return 320;
  if (latitude >= 30) return 225;
  return 180;
}

export function getSummaryBillOptions(defaultBill: number) {
  const options = [120, 180, 225, 320, 450];
  if (options.includes(defaultBill)) return options;
  return [defaultBill, ...options].sort((a, b) => a - b);
}

export function computeEstimateMetrics(
  location: EstimateLocation,
  monthlyBill: number,
) {
  const latitudeFactor = Math.max(0, 90 - Math.abs(location.latitude ?? 0));
  const solarSizeKw = Math.max(8.2, monthlyBill / 16.6 + latitudeFactor / 85);
  const arraySqFt = Math.round(solarSizeKw * 53);
  const coveragePct = Math.min(99, Math.round((monthlyBill / (monthlyBill + 50)) * 100));
  const upfrontCost = Math.round(solarSizeKw * 1700);
  const benefits20y = Math.round(monthlyBill * 12 * 20 * 0.92);
  const savings20y = benefits20y - upfrontCost;
  const paybackYears = upfrontCost / Math.max(monthlyBill * 12 * 0.85, 1);
  const impactCo2 = (solarSizeKw * 0.46).toFixed(1);
  const impactCars = Math.round(solarSizeKw * 0.18);
  const impactTrees = (solarSizeKw * 6.9).toFixed(1);

  return {
    solarSizeKw,
    arraySqFt,
    coveragePct,
    upfrontCost,
    benefits20y,
    savings20y,
    paybackYears,
    impactCo2,
    impactCars,
    impactTrees,
  };
}
