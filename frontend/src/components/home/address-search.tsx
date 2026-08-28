"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { searchPlaces, type GeocodedPlace } from "@/lib/geocoding";
import { buildEstimateHref } from "@/lib/estimate-location";
import { WorkflowModal } from "@/components/ui/modal";
import { LuX } from "react-icons/lu";

const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 350;

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "results"; places: GeocodedPlace[] };

type WorkflowState =
  | { status: "idle" }
  | { status: "pending"; title: string; message: string }
  | { status: "error"; title: string; message: string };

export function AddressSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<GeocodedPlace | null>(null);
  const [state, setState] = useState<SearchState>({ status: "idle" });
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [workflow, setWorkflow] = useState<WorkflowState>({ status: "idle" });

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const trimmed = query.trim();
  const isSearchable = trimmed.length >= MIN_QUERY_LENGTH;
  const places = state.status === "results" ? state.places : [];
  const showList = isOpen && isSearchable && (state.status === "loading" || places.length > 0);
  const canSearch = selectedPlace !== null;
  const isSubmitting = workflow.status === "pending";

  useEffect(() => {
    if (!isSearchable) {
      return undefined;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setState({ status: "loading" });

      try {
        const found = await searchPlaces(trimmed, controller.signal);
        if (controller.signal.aborted) {
          return;
        }

        setState({ status: "results", places: found });
        setActiveIndex(found.length > 0 ? 0 : -1);
      } catch {
        if (!controller.signal.aborted) {
          setState({
            status: "error",
            message: "We could not fetch address suggestions right now.",
          });
          setActiveIndex(-1);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [isSearchable, trimmed]);

  useEffect(() => {
    if (!showList) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showList]);

  function choosePlace(place: GeocodedPlace) {
    const address = place.displayName || place.title;
    setQuery(address);
    setSelectedPlace(place);
    setState({ status: "idle" });
    setActiveIndex(-1);
    setIsOpen(false);
  }

  async function submitAnalysis(place: GeocodedPlace) {
    const response = await fetch("/api/fortyguard/env-params", {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        latitude: place.latitude,
        longitude: place.longitude,
      }),
    });

    const payload = (await response.json()) as
      | { ok: true; activityId: string }
      | { ok: false; message?: string };

    if (!response.ok || !payload.ok) {
      const errorMessage =
        "message" in payload && payload.message
          ? payload.message
          : "The solar analysis could not be started.";
      throw new Error(errorMessage);
    }

    if (!payload.activityId) {
      throw new Error("FortyGuard did not return a task id.");
    }

    router.push(buildEstimateHref(payload.activityId, place));
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmed) {
      inputRef.current?.focus();
      return;
    }

    if (isSubmitting || !selectedPlace) {
      return;
    }

    setWorkflow({
      status: "pending",
      title: "Preparing your solar analysis",
      message: "We are finding your address and starting the FortyGuard task.",
    });

    try {
      await submitAnalysis(selectedPlace);
    } catch (error) {
      setWorkflow({
        status: "error",
        title: "We could not start the analysis",
        message:
          error instanceof Error ? error.message : "Please try again with a different address.",
      });
    }
  }

  function updateQuery(value: string) {
    setQuery(value);
    setSelectedPlace(null);
    setIsOpen(true);

    if (value.trim().length < MIN_QUERY_LENGTH) {
      setState({ status: "idle" });
      setActiveIndex(-1);
    }
  }

  function clearInput() {
    if (isSubmitting) {
      return;
    }

    setQuery("");
    setSelectedPlace(null);
    setState({ status: "idle" });
    setActiveIndex(-1);
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function move(delta: number) {
    if (places.length === 0) {
      return;
    }

    setIsOpen(true);
    setActiveIndex((current) => {
      const next = current + delta;
      if (next < 0) return places.length - 1;
      if (next >= places.length) return 0;
      return next;
    });
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        move(-1);
        break;
      case "Home":
        if (showList) {
          event.preventDefault();
          setActiveIndex(0);
        }
        break;
      case "End":
        if (showList) {
          event.preventDefault();
          setActiveIndex(places.length - 1);
        }
        break;
      case "Escape":
        event.preventDefault();
        if (showList) {
          setIsOpen(false);
        } else if (query) {
          clearInput();
        }
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative w-full max-w-2xl overflow-visible">
      <form
        onSubmit={submitSearch}
        className="overflow-visible rounded-3xl border border-black/10 bg-white shadow-[0_20px_48px_-30px_rgba(79,62,30,0.45)]"
      >
        <div className="flex items-center gap-3 px-4 py-3 sm:px-5">
          <svg viewBox="0 0 24 24" fill="none" className="size-4 shrink-0 text-[#8d856f]" aria-hidden>
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="m20 20-3.4-3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>

          <label htmlFor={`${baseId}-input`} className="sr-only">
            Search a property address
          </label>

          <input
            id={`${baseId}-input`}
            ref={inputRef}
            type="text"
            role="combobox"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            value={query}
            placeholder="Search address, county or city"
            onChange={(event) => updateQuery(event.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={onKeyDown}
            aria-expanded={showList}
            aria-controls={showList ? listboxId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={showList && activeIndex >= 0 ? optionId(activeIndex) : undefined}
            className="w-full min-w-0 bg-transparent text-[15px] text-[#241f18] outline-none placeholder:text-[#948a77] sm:text-base"
          />

          <div className="flex size-8 shrink-0 items-center justify-center">
            {query ? (
              <button
                type="button"
                onClick={clearInput}
                aria-label="Clear address"
                className="grid size-8 place-items-center rounded-full text-[#756c59] transition hover:bg-[#f5efe4] hover:text-[#2c261f]"
              >
                <LuX size={16} />
              </button>
            ) : (
              <span aria-hidden className="block size-8" />
            )}
          </div>

          <button
            type="submit"
            className="rounded-full bg-[#4a7c46] px-4 py-2.5 text-sm font-medium text-white shadow-[0_14px_30px_-18px_rgba(74,124,70,0.7)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!canSearch || isSubmitting}
          >
            Search
          </button>
        </div>
      </form>

      {state.status === "error" ? (
        <p className="mt-2 px-1 text-sm text-[#b45309]">{state.message}</p>
      ) : null}

      {showList ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 max-h-50 overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-[0_18px_45px_-26px_rgba(79,62,30,0.45)]">
          {state.status === "loading" ? (
            <div className="space-y-1.5 p-2.5" aria-hidden>
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center gap-3 rounded-[14px] px-2 py-2">
                  <span className="size-3 shrink-0 animate-pulse rounded-full bg-[#e7dcc8]" />
                  <span className="flex-1 space-y-1.5">
                    <span className="block h-2.5 w-2/5 animate-pulse rounded bg-[#e7dcc8]" />
                    <span className="block h-2 w-4/5 animate-pulse rounded bg-[#e7dcc8]" />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Address suggestions"
              className="scroll-slim max-h-60 overflow-y-auto py-1"
            >
              {places.map((place, index) => (
                <li
                  key={place.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => choosePlace(place)}
                  className={`cursor-pointer px-4 py-2.5 transition ${
                    index === activeIndex ? "bg-[#f6f1e6]" : "hover:bg-[#faf7f0]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                      className="mt-0.5 size-4 shrink-0 text-[#4a7c46]"
                    >
                      <path
                        d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[#241f18]">
                        {place.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-[#7d7564]">
                        {place.subtitle}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <WorkflowModal
        open={workflow.status === "pending"}
        title={workflow.status === "pending" ? workflow.title : "Preparing your solar analysis"}
        message={
          workflow.status === "pending"
            ? workflow.message
            : "We are finding your address and starting the FortyGuard task."
        }
        tone="pending"
      >
        <div className="flex items-center gap-3 rounded-[20px] bg-[#f8f4eb] px-4 py-3">
          <span className="size-4 animate-spin rounded-full border-2 border-[#4a7c46] border-t-transparent" />
          <div className="text-sm text-[#6d6557]">
            Please keep this window open while we prepare your estimate.
          </div>
        </div>
      </WorkflowModal>

      <WorkflowModal
        open={workflow.status === "error"}
        title={workflow.status === "error" ? workflow.title : "We could not start the analysis"}
        message={
          workflow.status === "error"
            ? workflow.message
            : "Please try again with a different address."
        }
        tone="error"
        dismissible={true}
        onClose={() => setWorkflow({ status: "idle" })}
      >
        <button
          type="button"
          onClick={() => setWorkflow({ status: "idle" })}
          className="rounded-full bg-[#4a7c46] px-4 py-2.5 text-sm font-medium text-white"
        >
          Close
        </button>
      </WorkflowModal>
    </div>
  );
}
