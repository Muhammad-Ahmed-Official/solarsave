import { ElectricityPrice } from "../types/finance";

const eiaUrl =
  "https://api.eia.gov/v2/electricity/retail-sales/data/";

type EiaRow = {
  period: string;
  stateid: string;
  stateDescription: string;
  sectorid: string;
  price: string | number;
};

type EiaResponse = {
  response?: {
    data?: EiaRow[];
  };
};

type CachedPrice = {
  value: ElectricityPrice;
  expiresAt: number;
};

const stateCodes: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
};

const priceCache = new Map<string, CachedPrice>();
const cacheTime = 12 * 60 * 60 * 1000;

function normalizeState(value: string) {
  const cleaned = value.trim();

  if (/^[A-Za-z]{2}$/.test(cleaned)) {
    return cleaned.toUpperCase();
  }

  const code = stateCodes[cleaned.toLowerCase()];

  if (!code) {
    throw new Error("Invalid US state");
  }

  return code;
}

export async function getResidentialElectricityPrice(
  stateValue: string
): Promise<ElectricityPrice> {
  const apiKey = process.env.EIA_API_KEY;

  if (!apiKey) {
    throw new Error("EIA_API_KEY is missing");
  }

  const state = normalizeState(stateValue);
  const cached = priceCache.get(state);

  if (cached && Date.now() < cached.expiresAt) {
    return cached.value;
  }

  const params = new URLSearchParams();

  params.set("api_key", apiKey);
  params.append("data[]", "price");
  params.append("facets[stateid][]", state);
  params.append("facets[sectorid][]", "RES");
  params.set("frequency", "monthly");
  params.set("sort[0][column]", "period");
  params.set("sort[0][direction]", "desc");
  params.set("length", "1");

  const response = await fetch(`${eiaUrl}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`EIA request failed with status ${response.status}`);
  }

  const body = (await response.json()) as EiaResponse;
  const latest = body.response?.data?.[0];

  if (!latest) {
    throw new Error(`No residential electricity data found for ${state}`);
  }

  const centsPerKwh = Number(latest.price);

  if (!Number.isFinite(centsPerKwh)) {
    throw new Error("Invalid electricity price returned by EIA");
  }

  const dollarsPerKwh =
    Math.round((centsPerKwh / 100) * 10000) / 10000;

  const value: ElectricityPrice = {
    stateCode: latest.stateid,
    stateName: latest.stateDescription,
    period: latest.period,
    centsPerKwh,
    dollarsPerKwh,
  };

  priceCache.set(state, {
    value,
    expiresAt: Date.now() + cacheTime,
  });

  return value;
}
