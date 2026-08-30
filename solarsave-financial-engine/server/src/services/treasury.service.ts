import { TreasuryRate } from "../types/finance";

let cachedRate: {
  value: TreasuryRate;
  expiresAt: number;
} | null = null;

const cacheTime = 6 * 60 * 60 * 1000;

function getStartDate() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 45);
  return date.toISOString().slice(0, 10);
}

export async function getLatestTenYearTreasury(): Promise<TreasuryRate> {
  if (cachedRate && Date.now() < cachedRate.expiresAt) {
    return cachedRate.value;
  }

  const startDate = getStartDate();
  const url =
    `https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10&cosd=${startDate}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Treasury request failed with status ${response.status}`
    );
  }

  const csv = await response.text();
  const lines = csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .reverse();

  for (const line of lines) {
    const [date, rawValue] = line.split(",");
    const ratePercent = Number(rawValue);

    if (!date || !Number.isFinite(ratePercent)) {
      continue;
    }

    const value: TreasuryRate = {
      date,
      rate: ratePercent / 100,
      ratePercent,
    };

    cachedRate = {
      value,
      expiresAt: Date.now() + cacheTime,
    };

    return value;
  }

  throw new Error("No valid 10 year Treasury rate found");
}
