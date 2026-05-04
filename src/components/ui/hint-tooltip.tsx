"use client";

import { useId, useState } from "react";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  /** Short explanatory copy shown in the tooltip panel */
  content: string;
  className?: string;
};

/**
 * Compact info affordance for popup/extension surfaces: tap or hover focus to
 * read definitions without leaving the flow.
 */
export function HintTooltip({ content, className }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <span className={cn("relative inline-flex align-middle", className)}>
      <button
        type="button"
        className="rounded p-0.5 text-ink-3 outline-none hover:bg-surface-2 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent"
        aria-expanded={open}
        aria-controls={id}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <CircleHelp className="size-3.5 shrink-0" aria-hidden />
        <span className="sr-only">Explain</span>
      </button>
      {open ? (
        <span
          id={id}
          role="tooltip"
          className="absolute left-1/2 top-full z-[100] mt-1.5 w-[min(17rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-ink-4 bg-surface px-3 py-2 text-left text-[11px] leading-snug text-ink-2 shadow-lg"
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
