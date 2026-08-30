"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkflowModal } from "@/components/ui/modal";
import { EstimatePageShell } from "@/components/estimate/estimate-page-shell";
import type { EstimateLocation } from "@/lib/estimate-location";
import type { EstimateViewState } from "@/components/estimate/estimate-types";
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

export function TaskStatusView({
  activityId,
  location,
}: {
  activityId: string;
  location: EstimateLocation;
}) {
  const router = useRouter();
  const [view, setView] = useState<EstimateViewState>({ status: "checking", attempt: 1 });

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    console.log("location:", {location})

    async function poll(attempt: number) {
      if (cancelled) {
        return;
      }

      setView({ status: "checking", attempt });

      try {
        const response = await fetch(`/api/fortyguard/status/${encodeURIComponent(activityId)}`, {
          method: "GET",
          cache: "no-store",
        });

        const payload = (await response.json()) as StatusResult;
        if (cancelled) {
          return;
        }

        if (!response.ok || !payload.ok) {
          throw new Error(payload.message || "Unable to check task status.");
        }

        const status = normalizeStatus(payload.data?.status);
        if (status === "completed" || status === "succeeded") {
          setView({
            status: "success",
            payload: payload.data?.result ?? payload.data ?? payload.raw,
          });
          return;
        }

        if (status === "failed" || status === "error") {
          setView({
            status: "error",
            message: payload.message || "The solar task failed while processing.",
          });
          return;
        }

        if (attempt >= MAX_ATTEMPTS) {
          setView({
            status: "error",
            message: "The task is still processing after several checks. Please try again later.",
          });
          return;
        }

        timeoutId = window.setTimeout(() => {
          void poll(attempt + 1);
        }, POLL_INTERVAL_MS);
      } catch (error) {
        if (cancelled) {
          return;
        }

        if (attempt >= MAX_ATTEMPTS) {
          setView({
            status: "error",
            message:
              error instanceof Error ? error.message : "Unable to check the task status again.",
          });
          return;
        }

        timeoutId = window.setTimeout(() => {
          poll(attempt + 1);
        }, POLL_INTERVAL_MS);
      }
    }

     poll(1);

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [activityId]);

  const modalMessage = useMemo(() => {
    if (view.status === "checking") {
      return `Checking task status. Attempt ${view.attempt} of ${MAX_ATTEMPTS}.`;
    }
    if (view.status === "error") {
      return view.message;
    }
    return "";
  }, [view]);

  return (
    <>
      {/* <EstimatePageShell activityId={activityId} location={location} view={view} /> */}

      <Result activityId={activityId} location={location} fortyGuardResult={view.payload} />

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
