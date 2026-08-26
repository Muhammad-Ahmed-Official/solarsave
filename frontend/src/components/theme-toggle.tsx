"use client";

import { useTheme, type ThemePreference } from "@/components/theme-provider";

const OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  {
    value: "light",
    label: "Light",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-3.5" aria-hidden>
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    value: "system",
    label: "System",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-3.5" aria-hidden>
        <rect x="2.5" y="4" width="19" height="12.5" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8.5 20h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="size-3.5" aria-hidden>
        <path
          d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

/**
 * Three explicit choices rather than a two-state flip: "system" is a real
 * preference, and hiding it behind a toggle makes it unreachable once someone
 * has picked either side.
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();

  return (
    <fieldset className="shrink-0">
      <legend className="sr-only">Colour theme</legend>
      <div className="flex items-center gap-0.5 rounded-lg bg-panel2 p-0.5 ring-1 ring-line">
        {OPTIONS.map((option) => {
          const active = preference === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setPreference(option.value)}
              aria-pressed={active}
              title={`${option.label} theme`}
              className={`grid size-7 place-items-center rounded-md transition-colors ${
                active
                  ? "bg-panel text-solar ring-1 ring-line"
                  : "text-mute hover:text-paper"
              }`}
            >
              {option.icon}
              <span className="sr-only">{option.label} theme</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
