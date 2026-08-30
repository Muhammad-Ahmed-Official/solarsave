import type { ReactNode } from "react";

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11v5M12 8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function SectionCard({
  title,
  showInfo = false,
  infoText,
  className = "",
  children,
}: {
  title: string;
  showInfo?: boolean;
  infoText?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-[0_20px_60px_-40px_rgba(89,72,34,0.45)] ${className}`}
    >
      <div className="border-b border-black/5 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-normal tracking-[-0.03em] text-[#231f18] sm:text-2xl">
            {title}
          </h2>
          {showInfo ? (
            <div className="group relative text-[#948a77]">
              <span aria-label={infoText || "Session information"}>
                <InfoIcon />
              </span>
              {infoText ? (
                <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-xl border border-black/5 bg-[#231f18] px-3 py-2 text-left text-xs leading-5 text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  {infoText}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}
