import type { ReactNode } from "react";

export function ImpactMetric({
  title,
  value,
  caption,
  icon,
}: {
  title: string;
  value: string;
  caption: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="grid size-14 place-items-center rounded-full border border-[#e9ddd0] bg-white text-[#b66a07] shadow-[0_12px_30px_-26px_rgba(89,72,34,0.45)]">
        {icon}
      </div>
      <div className="text-[15px] font-medium text-[#4b4337]">{title}</div>
      <div className="text-2xl font-medium tracking-[-0.04em] text-[#231f18]">{value}</div>
      <div className="max-w-[14rem] text-sm leading-6 text-[#6f6657]">{caption}</div>
    </div>
  );
}
