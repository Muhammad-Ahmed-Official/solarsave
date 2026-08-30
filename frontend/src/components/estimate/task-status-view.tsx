"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkflowModal } from "@/components/ui/modal";
import type { EstimateLocation } from "@/lib/estimate-location";
import type { EstimateViewState } from "@/components/estimate/estimate-types";
import { EstimateSessionProvider, useEstimateSession } from "@/components/estimate/estimate-session-context";
import { getDefaultBill, computeEstimateMetrics } from "@/lib/estimate-calculations";
import { normalizeState } from "@/lib/financial-engine";
import Result from "./result";

const POLL_INTERVAL_MS = 30_000;
const MAX_ATTEMPTS = 5;

type StatusResult = {
  ok: boolean;
  message?: string;
  data?: {
    status?: string;
    result?: unknown;
    activity_id?: string;
    activityId?: string;
  };
  raw?: unknown;
};

function normalizeStatus(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function TaskStatusViewContent({
  activityId,
  location,
}: {
  activityId: string;
  location: EstimateLocation;
}) {
  const router = useRouter();
  const session = useEstimateSession();
  const { setActivityId, setFortyGuardResult, setAnalysisResult, setAnalysisLoading, setStateCode, fortyGuardResult } = session;
  const [view, setView] = useState<EstimateViewState>({ status: "checking", attempt: 1 });
  const analysisRequestedRef = useRef(false);

  useEffect(() => {
    analysisRequestedRef.current = false;
    setActivityId(activityId);
  }, [activityId, setActivityId]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    async function poll(attempt: number) {
      if (cancelled) return;
      setView({ status: "checking", attempt });

      try {
        const response = await fetch(`/api/fortyguard/status/${encodeURIComponent(activityId)}`, {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json()) as StatusResult;
        if (cancelled) return;

        if (!response.ok || !payload.ok) {
          throw new Error(payload.message || "Unable to check task status.");
        }

        const status = normalizeStatus(payload.data?.status);
        if (status === "completed" || status === "succeeded") {
          const result = payload.data?.result ?? payload.data ?? payload.raw;
          setFortyGuardResult(result);
          setView({ status: "success", payload: result });
          return;
        }

        if (status === "failed" || status === "error") {
          setView({ status: "error", message: payload.message || "The solar task failed while processing." });
          return;
        }

        if (attempt >= MAX_ATTEMPTS) {
          setView({ status: "error", message: "The task is still processing after several checks. Please try again later." });
          return;
        }

        timeoutId = window.setTimeout(() => {
          void poll(attempt + 1);
        }, POLL_INTERVAL_MS);
      } catch (error) {
        if (cancelled) return;

        if (attempt >= MAX_ATTEMPTS) {
          setView({
            status: "error",
            message: error instanceof Error ? error.message : "Unable to check the task status again.",
          });
          return;
        }

        timeoutId = window.setTimeout(() => {
          void poll(attempt + 1);
        }, POLL_INTERVAL_MS);
      }
    }

    void poll(1);

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [activityId, setFortyGuardResult]);

  useEffect(() => {
    if (view.status !== "success" || !fortyGuardResult || analysisRequestedRef.current) {
      return;
    }

    let cancelled = false;

    async function runAnalysis() {
      const defaultBill = getDefaultBill(location);
      const metrics = computeEstimateMetrics(location, defaultBill);
      const subtitleParts = String(location.subtitle ?? "")
        .split("•")
        .map((part) => part.trim())
        .filter(Boolean);
      const stateCandidate = subtitleParts[subtitleParts.length - 1] || location.title || "";

      let stateCode: string | undefined;
      try {
        stateCode = normalizeState(stateCandidate);
      } catch {
        // ignore if state is unavailable; this prevents a stale fallback from running
      }

      if (!stateCode) {
        return;
      }

      setStateCode(stateCode);
      setAnalysisLoading(true);

      try {
        const response = await fetch("/api/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stateCode,
            installationCost: metrics.upfrontCost,
            systemCapacityKw: metrics.solarSizeKw,
            performanceRatio: 0.75,
            fortyGuardResult,
          }),
        });

        if (cancelled) return;

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        if (cancelled) return;
        setAnalysisResult(payload.result ?? null);
      } finally {
        if (!cancelled) {
          setAnalysisLoading(false);
          analysisRequestedRef.current = true;
        }
      }
    }

    void runAnalysis();

    return () => {
      cancelled = true;
    };
  }, [location, fortyGuardResult, setAnalysisLoading, setAnalysisResult, setStateCode, view.status]);

  const modalMessage = useMemo(() => {
    if (view.status === "checking") {
      return `Checking task status. Attempt ${view.attempt} of ${MAX_ATTEMPTS}.`;
    }
    if (view.status === "error") {
      return view.message;
    }
    return "";
  }, [view]);

  const activeFortyGuardResult =
    view.status === "success" ? view.payload : fortyGuardResult;

  return (
    <>
      <Result activityId={activityId} location={location} fortyGuardResult={activeFortyGuardResult} />

      <WorkflowModal
        open={view.status === "checking"}
        title="Checking your solar task"
        message={modalMessage}
        tone="pending"
      >
        <div className="flex items-center gap-3 rounded-[20px] bg-[#f8f4eb] px-4 py-3">
          <span className="size-4 animate-spin rounded-full border-2 border-[#4a7c46] border-t-transparent" />
          <div className="text-sm text-[#6d6557]">
            The request is still processing. We will check again automatically.
          </div>
        </div>
      </WorkflowModal>

      <WorkflowModal
        open={view.status === "error"}
        title="Task check failed"
        message={view.status === "error" ? view.message : ""}
        tone="error"
        dismissible={true}
        onClose={() => router.push("/")}
      >
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-full bg-[#4a7c46] px-4 py-2.5 text-sm font-medium text-white"
        >
          Return home
        </button>
      </WorkflowModal>
    </>
  );
}

export function TaskStatusView(props: { activityId: string; location: EstimateLocation }) {
  return (
    <EstimateSessionProvider>
      <TaskStatusViewContent {...props} />
    </EstimateSessionProvider>
  );
}
