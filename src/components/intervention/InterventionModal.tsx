"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAppState } from "@/context/AppStateContext";
import {
  CartBreakdown,
  breakdownCart,
  decideIntervention,
  findAlternatives,
} from "@/lib/intervention";
import { remainingBudget, periodLabel } from "@/lib/budget";
import { formatCurrency } from "@/lib/format";
import { Necessity } from "@/lib/types";
import { unsplashUrl } from "@/lib/catalog";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LightPause } from "./LightPause";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { extensionAwareReplace } from "@/lib/extension-nav";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NECESSITY_OPTIONS: { value: Necessity; label: string }[] = [
  { value: "need", label: "Need" },
  { value: "want", label: "Want" },
  { value: "unsure", label: "Unsure" },
];

export function InterventionModal({ open, onOpenChange }: Props) {
  const router = useRouter();
  const { state, purchaseCart, saveForLater, addToCart, removeFromCart } =
    useAppState();
  const [necessity, setNecessity] = useState<Necessity>("want");
  const [showAlternatives, setShowAlternatives] = useState(false);

  useEffect(() => {
    if (open) {
      setNecessity("want");
      setShowAlternatives(false);
    }
  }, [open]);

  const config = state.config;
  const breakdown: CartBreakdown | null = useMemo(
    () => (config ? breakdownCart(state.cart, config) : null),
    [state.cart, config]
  );
  const decision = useMemo(
    () => (config && breakdown ? decideIntervention(breakdown, config) : null),
    [breakdown, config]
  );
  const remaining = useMemo(
    () => (config ? remainingBudget(config, state.purchases) : 0),
    [config, state.purchases]
  );
  const alternatives = useMemo(
    () =>
      breakdown && config ? findAlternatives(breakdown, remaining, config) : [],
    [breakdown, config, remaining]
  );

  if (!open || !config || !breakdown || !decision) return null;

  if (decision.level === "light") {
    return (
      <LightPause
        open={open}
        onOpenChange={onOpenChange}
        onComplete={() => {
          purchaseCart(state.cart, { [necessity]: 1 }, false);
          toast.success("Purchase complete", {
            description: `${formatCurrency(breakdown.total)} charged.`,
          });
          onOpenChange(false);
          extensionAwareReplace(router, "/dashboard");
        }}
      />
    );
  }

  const overBudget = breakdown.nonEssentialsTotal > remaining;
  const spent = config.budgetAmount - remaining;
  const projectedSpent = spent + breakdown.nonEssentialsTotal;
  const spentPct = Math.min(
    100,
    Math.round((spent / Math.max(config.budgetAmount, 1)) * 100)
  );
  const projectedPct = Math.min(
    100,
    Math.round((projectedSpent / Math.max(config.budgetAmount, 1)) * 100)
  );

  function handleBuy() {
    purchaseCart(state.cart, { [necessity]: 1 }, false);
    toast.success("Purchase complete", {
      description: `${formatCurrency(breakdown!.total)} charged.`,
    });
    onOpenChange(false);
    extensionAwareReplace(router, "/dashboard");
  }

  function handleSave() {
    saveForLater(state.cart, necessity);
    toast.success("Saved for 24 hours", {
      description: config!.demoMode
        ? "Demo mode: items will resolve in ~60s."
        : "If you don't return to buy, the amount counts toward your savings.",
    });
    onOpenChange(false);
    extensionAwareReplace(router, "/dashboard");
  }

  const isStrict = decision.level === "strict";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md gap-0 overflow-hidden rounded-md border border-ink-4 bg-surface p-0 shadow-none"
        showCloseButton={false}
      >
        {/* Header strip */}
        <div className="flex items-center justify-between border-b border-ink-4 px-5 py-3">
          <DialogTitle className="flex items-center gap-1.5 text-[14px] font-semibold tracking-tight text-ink">
            Pause<span className="size-1 rounded-[1px] bg-accent" />
          </DialogTitle>
          <span className="rounded border border-ink-4 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-ink-2">
            {isStrict ? "Strict" : "Standard"}
          </span>
        </div>

        <div className="space-y-5 px-5 py-5">
          {/* Trigger */}
          <div className="flex items-start gap-2">
            <span className="mt-1.5 size-1 shrink-0 rounded-[1px] bg-accent" />
            <p className="text-[13px] leading-relaxed text-ink">
              {formatCurrency(breakdown.nonEssentialsTotal)} in cart,{" "}
              <span className="font-mono num-tabular">
                {formatCurrency(remaining)}
              </span>{" "}
              left {periodLabel(config.budgetPeriod)}.
              {overBudget && (
                <>
                  {" "}
                  <span className="text-negative">Over budget.</span>
                </>
              )}
            </p>
          </div>

          {/* Compact budget meter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-mono text-[11px] num-tabular text-ink-3">
              <span>{formatCurrency(spent)}</span>
              <span className="text-ink-2">{formatCurrency(projectedSpent)}</span>
              <span>{formatCurrency(config.budgetAmount)}</span>
            </div>
            <div className="relative h-1 w-full bg-surface-2">
              <div
                className="absolute inset-y-0 left-0 bg-ink-3"
                style={{ width: `${spentPct}%` }}
              />
              <div
                className={cn(
                  "absolute inset-y-0",
                  overBudget ? "bg-negative" : "bg-accent"
                )}
                style={{
                  left: `${spentPct}%`,
                  width: `${projectedPct - spentPct}%`,
                }}
              />
              <div
                className="absolute -top-0.5 h-2 w-px bg-ink"
                style={{ left: `${projectedPct}%` }}
              />
            </div>
          </div>

          {/* Necessity */}
          <div className="space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
              Why?
            </span>
            <div role="radiogroup" className="grid grid-cols-3 gap-1.5">
              {NECESSITY_OPTIONS.map((opt) => {
                const active = necessity === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setNecessity(opt.value)}
                    className={cn(
                      "h-8 rounded border px-2 text-[12px] font-medium transition-colors",
                      active
                        ? "border-accent bg-accent-fade text-accent"
                        : "border-ink-4 bg-surface text-ink-2 hover:border-ink hover:text-ink"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alternatives */}
          {showAlternatives && (
            <div className="space-y-2 border-t border-ink-4 pt-4">
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
                Cheaper alternatives
              </span>
              {alternatives.length === 0 ? (
                <p className="font-mono text-[12px] text-ink-3">
                  None within budget. Save for 24h instead.
                </p>
              ) : (
                <div className="border-t border-ink-4">
                  {alternatives.map((alt) => {
                    const inCart = state.cart.find(
                      (l) => l.itemId === alt.id
                    );
                    return (
                      <div
                        key={alt.id}
                        className="flex h-12 items-center gap-3 border-b border-ink-4"
                      >
                        <div className="relative size-7 shrink-0 overflow-hidden rounded-sm bg-surface-2">
                          <Image
                            src={unsplashUrl(alt.imageId, 64)}
                            alt=""
                            fill
                            sizes="28px"
                            className="object-cover"
                          />
                        </div>
                        <span className="flex-1 truncate text-[13px] text-ink">
                          {alt.name}
                        </span>
                        <span className="font-mono text-[12px] num-tabular text-ink-2">
                          {formatCurrency(alt.price)}
                        </span>
                        <button
                          onClick={() =>
                            inCart
                              ? removeFromCart(alt.id)
                              : addToCart(alt.id)
                          }
                          className={cn(
                            "h-7 rounded border px-2 font-mono text-[11px] transition-colors",
                            inCart
                              ? "border-accent bg-accent-fade text-accent"
                              : "border-ink-4 text-ink-2 hover:border-ink hover:bg-ink hover:text-paper"
                          )}
                        >
                          {inCart ? "Remove" : "Swap"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="flex flex-col gap-2 border-t border-ink-4 bg-surface-2/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          {!showAlternatives ? (
            <button
              type="button"
              onClick={() => setShowAlternatives(true)}
              className="text-left font-mono text-[11px] text-ink-3 hover:text-ink hover:underline"
            >
              See alternatives →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowAlternatives(false)}
              className="text-left font-mono text-[11px] text-ink-3 hover:text-ink hover:underline"
            >
              ← Back
            </button>
          )}

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleBuy}
              className="text-ink-2 hover:bg-surface-2 hover:text-ink"
            >
              Buy now
            </Button>
            <div className="flex items-center gap-1.5">
              {isStrict && (
                <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-accent">
                  Recommended
                </span>
              )}
              <Button
                onClick={handleSave}
                className="bg-accent text-white hover:bg-accent/90"
              >
                Save for 24h
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
