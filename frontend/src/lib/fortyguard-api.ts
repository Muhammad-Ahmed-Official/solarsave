export interface FortyGuardSubmitInput {
  latitude: number;
  longitude: number;
}

export interface FortyGuardSubmitResult {
  activityId: string;
  raw: unknown;
}

export interface FortyGuardStatusResult {
  raw: unknown;
  data: unknown;
}

const API_BASE = "https://api.fortyguard.com/v1";
const SUBMIT_URL = `${API_BASE}/env_params`;
const STATUS_URL = `${API_BASE}/status`;
const REQUEST_TIMEOUT_MS = 20_000;

function getApiKey() {
  const apiKey = process.env.FORTYGUARD_API_KEY;
  if (!apiKey) {
    throw new Error("FORTYGUARD_API_KEY is not set");
  }
  return apiKey;
}

async function readJson(response: Response) {
  const text = await response.text();

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function submitFortyGuardTask(
  input: FortyGuardSubmitInput
): Promise<FortyGuardSubmitResult> {

  // Use yesterday as the single-day start_date for filter_type 3 (no end_date)
  const pad = (n: number) => String(n).padStart(2, "0");
  const formatYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const response = await fetch(SUBMIT_URL, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": getApiKey(),
    },

    body: JSON.stringify({
      latitude: input.latitude,
      longitude: input.longitude,
      temperature: 10,
      date_time: {
        start_date: formatYmd(yesterday),
        filter_type: 3,
      },
    }),
  });

  const raw = await readJson(response);
  if (!response.ok) {
    const message =
      typeof raw === "object" && raw && "message" in raw
        ? String((raw as { message?: unknown }).message ?? "")
        : "The solar analysis request could not be started.";
    throw new Error(message || "The solar analysis request could not be started.");
  }

  const activityId = String(
    typeof raw === "object" && raw && "data" in raw && raw.data && typeof raw.data === "object"
      ? (raw.data as { activity_id?: unknown; activityId?: unknown }).activity_id ??
          (raw.data as { activity_id?: unknown; activityId?: unknown }).activityId ??
          ""
      : ""
  );

  if (!activityId) {
    throw new Error("FortyGuard did not return an activity id.");
  }

  return { activityId, raw };
}

export async function fetchFortyGuardStatus(activityId: string): Promise<FortyGuardStatusResult> {
  const response = await fetch(`${STATUS_URL}/${encodeURIComponent(activityId)}`, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      Accept: "application/json",
      "api-key": getApiKey(),
    },
  });

  const raw = await readJson(response);
  if (!response.ok) {
    const message =
      typeof raw === "object" && raw && "message" in raw
        ? String((raw as { message?: unknown }).message ?? "")
        : "The solar analysis status could not be checked.";
    throw new Error(message || "The solar analysis status could not be checked.");
  }

  const data = typeof raw === "object" && raw && "data" in raw ? (raw as { data: unknown }).data : raw;
  return { raw, data };
}
