import Image from "next/image";

const STEPS = [
  {
    step: 1,
    title: "Search for your home",
    body: "We find the property, get the solar irradiance and other environmental paramters, and anchor the estimate to your local solar resource.",
    accent: "#f4a62a",
    kind: "search" as const,
  },
  {
    step: 2,
    title: "Personalize your solar analysis",
    body: "Adjust your bill, roof size, and assumptions so the savings estimate feels specific to your home.",
    accent: "#4a7c46",
    kind: "tune" as const,
  },
  {
    step: 3,
    title: "Compare finance options",
    body: "Review the paths available for your system and see how the costs compare over time. ",
    accent: "#f0c94d",
    kind: "finance" as const,
  },
];

function StepVisual({
  kind,
  accent,
}: {
  kind: "search" | "tune" | "finance";
  accent: string;
}) {
  if (kind === "search") {
    return (
      <div
        className="relative overflow-hidden rounded-[24px] border border-black/5"
        style={{
          minHeight: 172,
          background:
            "linear-gradient(180deg, #1f392c 0%, #274538 54%, #355142 100%)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-80"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <svg viewBox="0 0 320 172" className="absolute inset-0 h-full w-full" aria-hidden>
          <path d="M0 34H320M0 70H320M0 106H320M0 142H320" stroke="rgba(255,255,255,0.08)" />
          <path d="M40 0V172M104 0V172M168 0V172M232 0V172M296 0V172" stroke="rgba(255,255,255,0.08)" />
          <path
            d="M60 118 C102 84, 146 74, 192 90 S260 116, 304 90"
            stroke="#f4a62a"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M94 58 C116 50, 136 52, 158 66"
            stroke="#f0c94d"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          <g transform="translate(194 34)">
            <circle cx="34" cy="34" r="30" fill={accent} opacity="0.16" />
            <path
              d="M34 4c-12 0-22 10-22 22 0 20 22 46 22 46s22-26 22-46c0-12-10-22-22-22Z"
              fill={accent}
            />
            <circle cx="34" cy="26" r="7" fill="#fff" />
          </g>
          <path
            d="M110 126c18 0 28-12 40-24 12-12 25-18 44-18"
            stroke="rgba(255,255,255,0.24)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="226" y="120" width="66" height="20" rx="10" fill="rgba(255,255,255,0.14)" />
          <text x="259" y="134" textAnchor="middle" fill="white" fontSize="11" fontFamily="var(--font-ibm-plex-mono)">
            Search
          </text>
        </svg>
      </div>
    );
  }

  if (kind === "tune") {
    return (
      <div
        className="relative overflow-hidden rounded-[24px] border border-black/5"
        style={{
          minHeight: 172,
          background:
            "linear-gradient(180deg, #f9f4e8 0%, #f6efe2 56%, #f2e8d5 100%)",
        }}
      >
        <svg viewBox="0 0 320 172" className="absolute inset-0 h-full w-full" aria-hidden>
          <rect x="28" y="120" width="264" height="14" rx="7" fill="#e8dcc8" />
          <rect x="54" y="120" width="144" height="14" rx="7" fill="#f4a62a" />
          <circle cx="196" cy="127" r="16" fill="#fff" stroke="#4a7c46" strokeWidth="4" />
          <path d="M68 127h128" stroke="#4a7c46" strokeWidth="4" strokeLinecap="round" />
          <path d="M160 32v74" stroke="#4a7c46" strokeWidth="5" strokeLinecap="round" />
          <circle cx="160" cy="70" r="18" fill="#4a7c46" />
          <path d="M152 70h16M160 62v16" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          <g transform="translate(228 24)">
            <rect x="0" y="0" width="62" height="62" rx="18" fill="#fff" stroke="#eadfc8" />
            <path
              d="M14 40 27 24l10 8 11-16"
              stroke={accent}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="14" cy="40" r="4" fill="#4a7c46" />
            <circle cx="37" cy="32" r="4" fill="#4a7c46" />
          </g>
          <rect x="44" y="34" width="82" height="10" rx="5" fill="#d8e6d3" />
          <rect x="44" y="54" width="56" height="10" rx="5" fill="#f0c94d" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-[24px] border border-black/5"
      style={{
        minHeight: 172,
        background:
          "linear-gradient(180deg, #f9f3e3 0%, #f7efd9 54%, #f1e3c5 100%)",
      }}
    >
      <svg viewBox="0 0 320 172" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect x="30" y="30" width="78" height="106" rx="18" fill="#fff" stroke="#eadfc8" />
        <rect x="121" y="20" width="78" height="116" rx="18" fill="#fff" stroke="#eadfc8" />
        <rect x="212" y="42" width="78" height="94" rx="18" fill="#fff" stroke="#eadfc8" />

        <rect x="44" y="50" width="52" height="10" rx="5" fill="#f0c94d" />
        <rect x="44" y="72" width="36" height="10" rx="5" fill="#e5d8bf" />
        <rect x="44" y="94" width="42" height="10" rx="5" fill="#e5d8bf" />

        <rect x="135" y="40" width="52" height="10" rx="5" fill="#4a7c46" />
        <rect x="135" y="62" width="36" height="10" rx="5" fill="#d9e7d4" />
        <rect x="135" y="84" width="28" height="10" rx="5" fill="#d9e7d4" />

        <rect x="226" y="62" width="52" height="10" rx="5" fill="#f4a62a" />
        <rect x="226" y="84" width="36" height="10" rx="5" fill="#f2dfbd" />

        <path d="M22 148H298" stroke="#d8ccba" strokeWidth="2" />
        <path d="M60 24v-10M152 14V4M244 36V24" stroke="#c7b89f" strokeWidth="3" strokeLinecap="round" />
        <circle cx="252" cy="108" r="18" fill={accent} opacity="0.16" />
        <path d="M244 108h16M252 100v16" stroke={accent} strokeWidth="4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function StepCard({
  step,
  title,
  body,
  accent,
  kind,
  totalStep
}: {
  step: number;
  totalStep: number;
  title: string;
  body: string;
  accent: string;
  kind: "search" | "tune" | "finance";
}) {

  console.log({step, totalStep})

  return (
    <article className="flex h-full flex-col rounded-[30px]  bg-white/90 p-5 sm:p-6">

      <div className="mt-4">
        <StepVisual kind={kind} accent={accent} />
      </div>

      <div className="mt-5 flex-1">
        <h3 className="text-xl font-medium tracking-[-0.02em] text-[#241f18]">{title}</h3>
        <p className="mt-3 max-w-md text-sm leading-7 text-[#6e6658]">{body}</p>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-[#efe6d4]">
          <div className="h-2 rounded-full" style={{ width: `${step/totalStep*100}%`, background: accent }} />
        </div>
      </div>
    </article>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-7 sm:py-9">
      <div className="rounded-[34px]  bg-white/84 p-5 shadow-[0_22px_60px_-36px_rgba(89,72,34,0.42)] sm:p-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mt-3 text-3xl font-normal tracking-[-0.04em] text-[#231f18] sm:text-4xl">
            Your own personalized solar savings estimator, powered by {" "}
            <a href="http://fortyguard.com" target="_blank">
            <Image
            src="/fortyguard.png"
            alt="fortyguard"
            width={100}
            height={30}
            className="inline-block align-middle"
          />
          </a>
          </h2>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {STEPS.map((item) => (
            <StepCard key={item.title} {...item} totalStep={STEPS.length} />
          ))}
        </div>
      </div>
    </section>
  );
}
