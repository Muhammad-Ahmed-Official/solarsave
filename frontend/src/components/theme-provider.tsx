"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type ThemePreference = "light" | "dark" | "system";
type Resolved = "light" | "dark";

const STORAGE_KEY = "solarsave-theme";
/** Same-tab notification; the native `storage` event only fires cross-tab. */
const CHANGE_EVENT = "solarsave-theme-change";

interface ThemeContextValue {
  preference: ThemePreference;
  /** What is actually on screen once "system" is resolved. */
  resolvedTheme: Resolved;
  setPreference: (next: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/*
 * Both the stored preference and the OS setting are external stores, so they
 * are read with useSyncExternalStore rather than mirrored into state via an
 * effect. That keeps the server snapshot and the first client render in
 * agreement and avoids a cascading render on mount.
 */

function subscribePreference(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function getPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Private mode can refuse storage reads.
  }
  return "system";
}

function subscribeSystem(onChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getSystemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * The palette uses a class-based dark variant (`&:is(.dark *)`), so something
 * has to own that class. This does, and mirrors it onto <html> plus
 * `color-scheme` so form controls and scrollbars follow too.
 *
 * The matching no-flash script in layout.tsx sets the same class before paint.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  // The server cannot know either value, so both fall back to the same
  // defaults the no-flash script assumes.
  const preference = useSyncExternalStore<ThemePreference>(
    subscribePreference,
    getPreference,
    () => "system"
  );
  const systemDark = useSyncExternalStore(subscribeSystem, getSystemDark, () => false);

  const resolvedTheme: Resolved =
    preference === "system" ? (systemDark ? "dark" : "light") : preference;

  // Writing to the DOM is what an effect is actually for.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable; the dispatch below still applies the
      // choice for this session.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider.");
  }

  return context;
}
