"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import {
  reverseGeocode,
  searchPlaces,
  type GeocodedPlace,
} from "@/lib/geocoding";

/** Below this, suggestions are noise and the geocoder is being spammed. */
const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 400;

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "results"; places: GeocodedPlace[] };

export function AddressSearch({
  selectedPlace,
  onSelect,
  initialQuery = "",
}: {
  selectedPlace: GeocodedPlace | null;
  onSelect: (place: GeocodedPlace) => void;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [state, setState] = useState<SearchState>({ status: "idle" });
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [locating, setLocating] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const trimmed = query.trim();
  const isSearchable = trimmed.length >= MIN_QUERY_LENGTH;
  const places = state.status === "results" ? state.places : [];
  const showList =
    isOpen && isSearchable && (places.length > 0 || state.status === "loading");

  useEffect(() => {
    if (!isSearchable) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      // Every setState here lives inside the async callback, never in the
      // effect body, so typing cannot trigger a cascading render.
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
            message:
              "Could not reach the address service. Check your connection and retry.",
          });
          setActiveIndex(-1);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isSearchable, trimmed]);

  // Clicking the map, or anything else outside, dismisses the suggestions.
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

  function updateQuery(value: string) {
    setQuery(value);
    setIsOpen(true);

    // Clearing here rather than in an effect stops stale suggestions from
    // lingering under a query that no longer matches them.
    if (value.trim().length < MIN_QUERY_LENGTH) {
      setState({ status: "idle" });
      setActiveIndex(-1);
    }
  }

  function choose(place: GeocodedPlace) {
    onSelect(place);
    setQuery(place.title);
    setState({ status: "idle" });
    setActiveIndex(-1);
    setIsOpen(false);
    inputRef.current?.blur();
  }

  function clearInput() {
    setQuery("");
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
      case "Enter": {
        const place = places[activeIndex];
        if (showList && place) {
          event.preventDefault();
          choose(place);
        }
        break;
      }
      case "Escape":
        event.preventDefault();
        // First Escape dismisses the list, a second clears the field — the
        // behaviour people already know from a browser address bar.
        if (showList) {
          setIsOpen(false);
        } else if (query) {
          clearInput();
        }
        break;
    }
  }

  async function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setState({
        status: "error",
        message: "This browser cannot share your location.",
      });
      return;
    }

    setLocating(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 12_000,
          });
        },
      );

      const place = await reverseGeocode(
        position.coords.latitude,
        position.coords.longitude,
      );
      if (place) {
        choose(place);
      } else {
        setState({
          status: "error",
          message: "Found you, but could not name that spot.",
        });
      }
    } catch {
      setState({
        status: "error",
        message:
          "Could not get your location. You can still search for an address.",
      });
    } finally {
      setLocating(false);
    }
  }

  let hint: string;
  if (state.status === "error") {
    hint = state.message;
  } else if (state.status === "loading") {
    hint = "Searching addresses…";
  } else if (state.status === "results" && places.length === 0) {
    hint = "No address matched. Try adding a city or postcode.";
  } else if (state.status === "results") {
    const n = places.length;
    hint = `${n} suggestion${n === 1 ? "" : "s"}. Use the arrow keys to review them.`;
  } else if (selectedPlace) {
    hint = `Showing ${selectedPlace.title}. Search again to compare another property.`;
  } else {
    hint = `Type at least ${MIN_QUERY_LENGTH} characters to search any address worldwide.`;
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <label htmlFor={`${baseId}-input`} className="sr-only">
        Search a property address
      </label>

      <div className="flex items-center gap-2 rounded-lg bg-panel2 px-3 py-2 ring-1 ring-line focus-within:ring-2 focus-within:ring-solar">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="size-4 shrink-0 text-mute"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path
            d="m20 20-3.5-3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        <input
          id={`${baseId}-input`}
          ref={inputRef}
          /* type="search" would add a second, unlabelled native clear button. */
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          value={query}
          placeholder="Search property address or city…"
          onChange={(e) => updateQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          aria-expanded={showList}
          aria-controls={showList ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && activeIndex >= 0 ? optionId(activeIndex) : undefined
          }
          aria-describedby={`${baseId}-hint`}
          /* 16px on small screens stops iOS Safari zooming in on focus. */
          className="w-full min-w-0 bg-transparent text-base text-paper outline-none placeholder:text-mute sm:text-sm"
        />

        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clearInput}
            className="num shrink-0 rounded px-1 text-[11px] text-mute hover:text-paper"
          >
            CLEAR
          </button>
        ) : (
          <button
            type="button"
            aria-label="Use my current location"
            title="Use my current location"
            onClick={useMyLocation}
            disabled={locating}
            aria-busy={locating || undefined}
            className="shrink-0 rounded p-0.5 text-mute hover:text-solar disabled:opacity-50"
          >
            {locating ? (
              <svg
                viewBox="0 0 24 24"
                className="size-4 animate-spin"
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  opacity="0.25"
                />
                <path
                  d="M21 12a9 9 0 0 0-9-9"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="size-4"
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="12"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <path
                  d="M12 2v3M12 19v3M2 12h3M19 12h3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* One live region owns every transient message, so a screen reader hears
          exactly one update per state change. */}
      <p
        id={`${baseId}-hint`}
        role="status"
        aria-live="polite"
        className={`num mt-1 hidden px-1 text-[10px] leading-4 lg:block ${
          state.status === "error" ? "text-destructive" : "text-mute"
        }`}
      >
        {hint}
      </p>

      {showList ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-lg bg-panel shadow-lg ring-1 ring-line">
          {state.status === "loading" ? (
            <ul className="p-2" aria-hidden>
              {[0, 1, 2].map((row) => (
                <li key={row} className="flex items-center gap-3 px-1 py-2">
                  <span className="size-3 shrink-0 animate-pulse rounded-full bg-line" />
                  <span className="flex-1 space-y-1.5">
                    <span className="block h-2.5 w-2/5 animate-pulse rounded bg-line" />
                    <span className="block h-2 w-4/5 animate-pulse rounded bg-line" />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <ul
              id={listboxId}
              role="listbox"
              aria-label="Address suggestions"
              className="scroll-slim max-h-72 overflow-y-auto py-1"
            >
              {places.map((place, index) => (
                <li
                  key={place.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeIndex}
                  onClick={() => {
                    setQuery(place.title);
                    setIsOpen(false);
                  }}
                  className={`flex cursor-pointer items-start gap-3 px-3 py-2 ${
                    index === activeIndex ? "bg-panel2" : ""
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className={`mt-0.5 size-3.5 shrink-0 ${
                      index === activeIndex ? "text-solar" : "text-mute"
                    }`}
                  >
                    <path
                      d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle
                      cx="12"
                      cy="10"
                      r="2.4"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-paper">
                      {place.title}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-mute">
                      {place.subtitle}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
