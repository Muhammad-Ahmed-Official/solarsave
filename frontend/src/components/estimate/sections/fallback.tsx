import Link from "next/link";
import React from "react";

export function FallbackSection({
  reason,
}: {
  reason: "location" | "analysis";
}) {
  const content =
    reason === "location"
      ? {
          badge: "No location selected",
          title: "Choose a place to see your solar estimate.",
          description:
            "This section is essentially just meant to show the user that there isn’t a location selected yet, so there’s no analysis result to display.",
        }
      : {
          badge: "No analysis result",
          title: "We couldn’t generate a solar analysis for this property yet.",
          description:
            "This section is essentially just meant to show the user that there’s no analysis result available for this location yet.",
        };

  return (

      <div className="mt-[10%] mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 text-center ">
        <div className="rounded-[28px] border border-[#e6dfd4] bg-white/80 p-6 shadow-[0_18px_50px_rgba(26,23,20,0.08)] backdrop-blur-sm sm:p-8">
          <div className="inline-flex rounded-full border border-[#d6c8b1] bg-[#f6f0e8] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#4b413a]">
            {content.badge}
          </div>

          <h2 className="mt-5 text-2xl font-medium tracking-[-0.04em] text-[#231f18] sm:text-3xl">
            {content.title}
          </h2>

          <p className="mt-3 max-w-xl text-base leading-7 text-[#514a43]">
            {content.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 ">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-[#231f18] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#3b332d]"
            >
              Back to homepage
            </Link>
          </div>
        </div>
      </div>
  );
}
