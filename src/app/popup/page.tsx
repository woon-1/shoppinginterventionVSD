"use client";

import { Bookmark, LayoutDashboard, Settings, ShoppingCart, Store } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { remainingBudget } from "@/lib/budget";
import { formatCurrency } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function getPageUrl(page: string) {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(page);
  }

  return `/${page}`;
}

export default function PopupPage() {
  const { state, hydrated } = useAppState();

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4 text-sm text-ink-3">
        Loading…
      </div>
    );
  }

  if (!state.config?.onboardingComplete) {
    return (
      <div className="min-h-screen bg-paper px-4 py-4 text-ink">
        <div className="space-y-4 rounded-2xl border border-ink-4 bg-surface p-4 shadow-sm">
          <div className="space-y-1">
            <div className="font-semibold tracking-tight">Pause</div>
            <p className="text-sm text-ink-2">
              Set up your budget and friction settings before using the
              extension.
            </p>
          </div>
          <a
            href={getPageUrl("setup.html")}
            className={cn(
              buttonVariants({ variant: "default" }),
              "no-underline w-full bg-ink text-paper hover:bg-ink/90"
            )}
          >
            Start setup
          </a>
        </div>
      </div>
    );
  }

  const config = state.config;
  const remaining = remainingBudget(config, state.purchases);
  const pending = state.coolingOff.filter((entry) => entry.status === "pending");
  const cartQty = state.cart.reduce((sum, line) => sum + line.qty, 0);
  const wishlistQty = state.wishlist.length;

  return (
    <div className="min-h-screen bg-paper px-4 py-4 text-ink">
      <div className="space-y-4 rounded-2xl border border-ink-4 bg-surface p-4 shadow-sm">
        <header className="space-y-1">
          <div className="flex items-center justify-between">
            <div className="font-semibold tracking-tight">Pause</div>
            {config.demoMode && (
              <span className="rounded border border-ink-4 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-2">
                Demo
              </span>
            )}
          </div>
          <p className="text-sm text-ink-2">
            Local-only shopping friction for values-based checkout.
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Remaining" value={formatCurrency(remaining)} />
          <Stat label="Budget" value={formatCurrency(config.budgetAmount)} />
          <Stat label="Cart" value={`${cartQty} item${cartQty === 1 ? "" : "s"}`} />
          <Stat label="Wishlist" value={`${wishlistQty} saved`} />
        </div>

        <div className="space-y-2">
          <a
            href={getPageUrl("dashboard.html")}
            className={cn(
              buttonVariants({ variant: "default" }),
              "no-underline w-full bg-ink text-paper hover:bg-ink/90"
            )}
          >
            <LayoutDashboard className="size-3.5" />
            Dashboard
          </a>
          <a
            href={getPageUrl("shop.html")}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "no-underline w-full border-ink-4 text-ink hover:bg-surface-2"
            )}
          >
            <Store className="size-3.5" />
            Shop
          </a>
          <a
            href={getPageUrl("cart.html")}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "no-underline w-full border-ink-4 text-ink hover:bg-surface-2"
            )}
          >
            <ShoppingCart className="size-3.5" />
            Cart
          </a>
          <a
            href={getPageUrl("wishlist.html")}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "no-underline w-full border-ink-4 text-ink hover:bg-surface-2"
            )}
          >
            <Bookmark className="size-3.5" />
            Wishlist
          </a>
          <a
            href={getPageUrl("settings.html")}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "no-underline w-full justify-start text-ink-2 hover:bg-surface-2 hover:text-ink"
            )}
          >
            <Settings className="size-3.5" />
            Settings
          </a>
        </div>

        {pending.length > 0 && (
          <p className="font-mono text-[11px] text-ink-3">
            {pending.length} item{pending.length === 1 ? "" : "s"} are cooling
            off right now.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-4 bg-paper px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
        {label}
      </div>
      <div className="mt-1 text-[15px] font-medium text-ink">{value}</div>
    </div>
  );
}