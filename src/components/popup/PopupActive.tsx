"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Clock,
  LayoutDashboard,
  PauseCircle,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
} from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { remainingBudget } from "@/lib/budget";
import { formatRelativeTime } from "@/lib/format";
import { UserConfig } from "@/lib/types";
import { HintTooltip } from "@/components/ui/hint-tooltip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { extensionFullPageLinkProps } from "@/lib/extension-url";
import {
  AccentDot,
  BrandMark,
  Card,
  CardBody,
  CardHeader,
  Eyebrow,
  Money,
  Pill,
} from "@/components/pause";

const REFLECTION_PROMPTS = [
  "Do I need this?",
  "Can I wait 24 hours?",
  "Is this in my budget?",
  "Am I buying this because of stress, boredom, or urgency?",
] as const;

function frictionLabel(config: UserConfig): string {
  switch (config.friction) {
    case "light":
      return "Light pause — a short breath before checkout.";
    case "strict":
      return "Stronger nudge — save-for-later is highlighted.";
    default:
      return "Balanced — reflection with clear choices.";
  }
}

function frictionPillLabel(config: UserConfig): string {
  switch (config.friction) {
    case "light":
      return "Light";
    case "strict":
      return "Strict";
    default:
      return "Standard";
  }
}

export function PopupActive() {
  const { state } = useAppState();
  const config = state.config!;
  const remaining = remainingBudget(config, state.purchases);
  const pending = state.coolingOff.filter((e) => e.status === "pending");
  const cartQty = state.cart.reduce((sum, line) => sum + line.qty, 0);
  const wishlistQty = state.wishlist.length;
  const spentPct =
    config.budgetAmount > 0
      ? Math.min(
          100,
          Math.round(
            ((config.budgetAmount - remaining) / config.budgetAmount) * 100
          )
        )
      : 0;

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const nextCoolingDeadline = useMemo(() => {
    const future = pending
      .map((e) => e.expiresAt)
      .filter((t) => t > now)
      .sort((a, b) => a - b);
    return future[0] ?? null;
  }, [pending, now]);

  const [showPauseKit, setShowPauseKit] = useState(false);

  const withinBudget = remaining >= 0;

  return (
    <div className="box-border w-full min-w-0 max-w-full space-y-4 px-3 py-4 text-ink">
      <BrandMark
        trailing={
          <Pill variant="outline">
            {config.demoMode ? "Demo" : frictionPillLabel(config)}
          </Pill>
        }
      />

      {/* Pause status */}
      <Card aria-label="Spending pause status">
        <CardHeader>
          <Eyebrow as="span" className="flex min-w-0 flex-1 items-center gap-1">
            Pause status
            <HintTooltip content="Shows discretionary budget room left this period. Essentials use their own path in the demo shop." />
          </Eyebrow>
          <Pill variant={withinBudget ? "accent" : "negative"}>
            {withinBudget ? "Within budget" : "Over budget"}
          </Pill>
        </CardHeader>
        <CardBody>
          <div className="break-words text-[20px] font-medium tabular-nums text-ink">
            <Money amount={remaining} className="text-[20px] text-ink" />{" "}
            <span className="text-[12px] font-normal text-ink-3">
              left of <Money amount={config.budgetAmount} />
            </span>
          </div>
          <div className="mt-2 h-1 w-full overflow-hidden rounded bg-ink-4">
            <div
              className="h-full bg-ink transition-[width]"
              style={{ width: `${Math.min(100, spentPct)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] leading-snug text-ink-2">
            {frictionLabel(config)}
          </p>
        </CardBody>
      </Card>

      {/* Cooling-off */}
      {pending.length > 0 && nextCoolingDeadline ? (
        <Card>
          <CardBody className="flex min-w-0 items-start gap-2 text-[12px]">
            <Clock className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
            <div className="min-w-0">
              <div className="font-medium text-ink">
                Cooling off · {pending.length} item
                {pending.length === 1 ? "" : "s"}
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-ink-2">
                Next window closes in{" "}
                {formatRelativeTime(nextCoolingDeadline - now)}
              </div>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {/* Pause before buying */}
      <section className="space-y-2">
        <div className="flex w-full items-center gap-1">
          <button
            type="button"
            onClick={() => setShowPauseKit((v) => !v)}
            className={cn(
              buttonVariants({ variant: "default" }),
              "min-w-0 flex-1 gap-2 bg-ink text-[13px] text-paper hover:bg-ink/90"
            )}
          >
            <PauseCircle className="size-4 shrink-0" aria-hidden />
            Pause before buying
          </button>
          <HintTooltip content="Opens quick prompts you can run in your head before you click Buy — use anytime, on any site." />
        </div>

        {showPauseKit ? (
          <div className="rounded-md border border-accent/30 bg-accent-fade/50 px-3 py-3">
            <Eyebrow className="mb-2 flex items-center gap-1.5">
              <Sparkles className="size-3.5" aria-hidden />
              Quick reflection
            </Eyebrow>
            <ul className="space-y-2 text-[12px] leading-snug text-ink-2">
              {REFLECTION_PROMPTS.map((q) => (
                <li key={q} className="flex items-start gap-2">
                  <AccentDot className="mt-1.5" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-ink-3">
              There are no wrong answers — noticing the urge is already a win.
            </p>
          </div>
        ) : null}
      </section>

      {/* Full page links */}
      <section className="space-y-2 border-t border-ink-4 pt-3">
        <Eyebrow size="xs">Open full pages</Eyebrow>
        <div className="flex flex-col gap-1.5">
          <a
            {...extensionFullPageLinkProps("dashboard.html")}
            className={cn(
              buttonVariants({ variant: "default" }),
              "no-underline w-full justify-center gap-2 bg-ink text-[13px] text-paper hover:bg-ink/90"
            )}
          >
            <LayoutDashboard className="size-3.5" />
            Open full dashboard
          </a>
          <a
            {...extensionFullPageLinkProps("shop.html")}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "no-underline w-full justify-center gap-2 border-ink-4 text-[13px]"
            )}
          >
            <Store className="size-3.5" />
            Demo shop
          </a>
          <a
            {...extensionFullPageLinkProps("cart.html")}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "no-underline w-full justify-center gap-2 border-ink-4 text-[13px]"
            )}
          >
            <ShoppingCart className="size-3.5" />
            Cart{cartQty > 0 ? ` (${cartQty})` : ""}
          </a>
          <a
            {...extensionFullPageLinkProps("wishlist.html")}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "no-underline w-full justify-center gap-2 border-ink-4 text-[13px]"
            )}
          >
            <Bookmark className="size-3.5" />
            Wishlist{wishlistQty > 0 ? ` (${wishlistQty})` : ""}
          </a>
          <a
            {...extensionFullPageLinkProps("settings.html")}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "no-underline w-full justify-center gap-2 border-ink-4 text-[13px]"
            )}
          >
            <Settings className="size-3.5" />
            Settings &amp; onboarding
          </a>
          <a
            {...extensionFullPageLinkProps("setup.html?intro=1")}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "no-underline w-full justify-center text-[12px] text-ink-3 hover:text-ink"
            )}
          >
            Replay introduction
          </a>
        </div>
      </section>
    </div>
  );
}
