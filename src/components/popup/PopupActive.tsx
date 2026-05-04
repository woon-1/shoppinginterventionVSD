"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Clock,
  LayoutDashboard,
  Leaf,
  PauseCircle,
  Settings,
  ShoppingCart,
  Sparkles,
  Store,
} from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { remainingBudget } from "@/lib/budget";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { UserConfig } from "@/lib/types";
import { HintTooltip } from "@/components/ui/hint-tooltip";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getExtensionPageUrl } from "@/lib/extension-url";

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

  const dashboardUrl = getExtensionPageUrl("dashboard.html");
  const shopUrl = getExtensionPageUrl("shop.html");
  const cartUrl = getExtensionPageUrl("cart.html");
  const wishlistUrl = getExtensionPageUrl("wishlist.html");
  const settingsUrl = getExtensionPageUrl("settings.html");
  const setupIntroUrl = getExtensionPageUrl("setup.html?intro=1");

  const withinBudget = remaining >= 0;

  return (
    <div className="w-[min(22rem,calc(100vw-1rem))] space-y-4 px-3 py-4 text-ink">
      <header className="flex items-start gap-2">
        <Leaf className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-[15px] font-semibold tracking-tight">Pause</h1>
            {config.demoMode ? (
              <span className="shrink-0 rounded border border-ink-4 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wide text-ink-3">
                Demo
              </span>
            ) : null}
          </div>
          <p className="text-[11px] leading-relaxed text-ink-3">
            You choose when to pause — we support the decision, not shame it.
          </p>
        </div>
      </header>

      {/* Pause status */}
      <section
        className="rounded-xl border border-ink-4 bg-paper px-3 py-3"
        aria-label="Spending pause status"
      >
        <div className="flex items-center justify-between gap-2 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3">
          <span className="flex items-center gap-1">
            Pause status
            <HintTooltip content="Shows discretionary budget room left this period. Essentials use their own path in the demo shop." />
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5 font-mono text-[10px] normal-case tracking-normal",
              withinBudget
                ? "bg-accent-fade text-ink"
                : "bg-negative/10 text-negative"
            )}
          >
            {withinBudget ? "Within budget" : "Over budget line"}
          </span>
        </div>
        <div className="mt-2 font-mono text-[20px] font-medium tabular-nums text-ink">
          {formatCurrency(remaining)}{" "}
          <span className="text-[12px] font-normal text-ink-3">
            left of {formatCurrency(config.budgetAmount)}
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
      </section>

      {/* Cooling-off */}
      {pending.length > 0 && nextCoolingDeadline ? (
        <section className="flex items-start gap-2 rounded-xl border border-ink-4 bg-surface px-3 py-2.5 text-[12px]">
          <Clock className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
          <div>
            <div className="font-medium text-ink">
              Cooling off · {pending.length} item
              {pending.length === 1 ? "" : "s"}
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-ink-2">
              Next window closes in{" "}
              {formatRelativeTime(nextCoolingDeadline - now)}
            </div>
          </div>
        </section>
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
          <div className="rounded-xl border border-accent/30 bg-accent-fade/50 px-3 py-3">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3">
              <Sparkles className="size-3.5" aria-hidden />
              Quick reflection
            </div>
            <ul className="space-y-2 text-[12px] leading-snug text-ink-2">
              {REFLECTION_PROMPTS.map((q) => (
                <li key={q} className="flex gap-2">
                  <span className="text-accent">·</span>
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
        <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-3">
          Open full pages
        </p>
        <div className="flex flex-col gap-1.5">
          <a
            href={dashboardUrl}
            className={cn(
              buttonVariants({ variant: "default" }),
              "no-underline w-full justify-center gap-2 bg-ink text-[13px] text-paper hover:bg-ink/90"
            )}
          >
            <LayoutDashboard className="size-3.5" />
            Open full dashboard
          </a>
          <a
            href={shopUrl}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "no-underline w-full justify-center gap-2 border-ink-4 text-[13px]"
            )}
          >
            <Store className="size-3.5" />
            Demo shop
          </a>
          <a
            href={cartUrl}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "no-underline w-full justify-center gap-2 border-ink-4 text-[13px]"
            )}
          >
            <ShoppingCart className="size-3.5" />
            Cart{cartQty > 0 ? ` (${cartQty})` : ""}
          </a>
          <a
            href={wishlistUrl}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "no-underline w-full justify-center gap-2 border-ink-4 text-[13px]"
            )}
          >
            <Bookmark className="size-3.5" />
            Wishlist{wishlistQty > 0 ? ` (${wishlistQty})` : ""}
          </a>
          <a
            href={settingsUrl}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "no-underline w-full justify-center gap-2 border-ink-4 text-[13px]"
            )}
          >
            <Settings className="size-3.5" />
            Settings &amp; onboarding
          </a>
          <a
            href={setupIntroUrl}
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
