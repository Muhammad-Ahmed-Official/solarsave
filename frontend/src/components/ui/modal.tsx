"use client";

import type { ReactNode } from "react";
import { LuX } from "react-icons/lu";

type ModalTone = "pending" | "error";

export function WorkflowModal({
  open,
  title,
  message,
  tone = "pending",
  dismissible = false,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  message: string;
  tone?: ModalTone;
  dismissible?: boolean;
  onClose?: () => void;
  children?: ReactNode;
}) {
  if (!open) {
    return null;
  }

  const accent = tone === "error" ? "#b45309" : "#4a7c46";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workflow-modal-title"
      aria-describedby="workflow-modal-message"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_30px_80px_-38px_rgba(43,36,23,0.55)]">
        <div className="flex items-start justify-between gap-4 border-b border-black/5 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <span
              className="mt-1 size-3 rounded-full"
              style={{
                background: accent,
                boxShadow: `0 0 0 6px color-mix(in oklab, ${accent} 16%, transparent)`,
              }}
            />
            <div>
              <h2 id="workflow-modal-title" className="text-lg font-medium text-[#241f18]">
                {title}
              </h2>
              <p id="workflow-modal-message" className="mt-1 text-sm leading-6 text-[#6f6657]">
                {message}
              </p>
            </div>
          </div>

          {dismissible && onClose ? (
            <link
              type="button"
              onClick={onClose}
              className="grid size-9 shrink-0 place-items-center rounded-full text-[#7c7363] transition hover:bg-[#f5efe4] hover:text-[#2c261f]"
              aria-label="Close modal"
            >
              <LuX size={16} />
            </link>
          ) : null}
        </div>

        {children ? <div className="px-5 py-5 sm:px-6">{children}</div> : null}
      </div>
    </div>
  );
}
