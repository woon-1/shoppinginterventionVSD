"use client";

import { Leaf } from "lucide-react";
import { HintTooltip } from "@/components/ui/hint-tooltip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { extensionFullPageLinkProps } from "@/lib/extension-url";

export function PopupWelcome() {
  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-4 px-3 py-4 text-ink">
      <div className="flex items-start gap-2">
        <Leaf
          className="mt-0.5 size-5 shrink-0 text-accent"
          aria-hidden
        />
        <div className="space-y-1">
          <h1 className="text-[15px] font-semibold tracking-tight">
            Welcome to Pause
          </h1>
          <p className="text-[12px] leading-relaxed text-ink-2">
            A small companion for kinder online shopping — pause, reflect, then
            decide. Nothing here judges you; you stay in control.
          </p>
        </div>
      </div>

      <ul className="space-y-2.5 border-y border-ink-4 py-3 text-[12px] leading-snug text-ink-2">
        <li className="flex gap-2">
          <span className="text-accent">·</span>
          <span>
            Helps you{" "}
            <strong className="font-medium text-ink">slow down</strong> before
            impulse buys — especially on stores like Amazon, clothing or electronics
            retailers, and other shops we support.
            <HintTooltip
              className="ml-1"
              content="Reflection prompts: short questions that help you check whether this purchase fits your goals and budget — optional on supported sites."
            />
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-accent">·</span>
          <span>
            Works when it matters:{" "}
            <strong className="font-medium text-ink">product pages</strong>,{" "}
            <strong className="font-medium text-ink">cart</strong>, and checkout —
            so prompts appear near purchase decisions, not on every tab.
          </span>
        </li>
        <li className="flex gap-2">
          <span className="text-accent">·</span>
          <span>
            Adds optional{" "}
            <strong className="font-medium text-ink">cooling-off time</strong>, wishlist
            saves, and budget awareness — tuned by you in setup.
            <HintTooltip
              className="ml-1"
              content="Cooling-off timer: gives you time to decide before buying non-essentials. Essentials you marked can move faster."
            />
          </span>
        </li>
      </ul>

      <p className="text-[11px] leading-relaxed text-ink-3">
        Next step is a short full-page setup (budget, essentials, friction). Your
        data stays on this device.
      </p>

      <a
        {...extensionFullPageLinkProps("setup.html")}
        className={cn(
          buttonVariants({ variant: "default" }),
          "no-underline inline-flex w-full justify-center bg-ink text-paper hover:bg-ink/90"
        )}
      >
        Start full setup
      </a>
    </div>
  );
}
