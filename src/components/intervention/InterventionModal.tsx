"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingBag, Clock, ArrowRight } from "lucide-react";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LightPause } from "./LightPause";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NECESSITY_OPTIONS: { value: Necessity; label: string; hint: string }[] = [
  { value: "need", label: "Need", hint: "Essential to me" },
  { value: "want", label: "Want", hint: "Nice to have" },
  { value: "unsure", label: "Unsure", hint: "Still deciding" },
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

  // Light friction → 5-second pause overlay
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
          router.replace("/dashboard");
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
    router.replace("/dashboard");
  }

  function handleSave() {
    saveForLater(state.cart, necessity);
    toast.success("Saved for 24 hours", {
      description: config!.demoMode
        ? "Demo mode: items will resolve in ~60s."
        : "If you don't return to buy, the amount counts toward your savings.",
    });
    onOpenChange(false);
    router.replace("/dashboard");
  }

  const isStrict = decision.level === "strict";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl overflow-hidden border-rule bg-paper p-0 shadow-[0_24px_60px_-24px_rgba(20,20,30,0.25)]"
        showCloseButton={false}
      >
        <div className="space-y-6 p-7 sm:p-8">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
              <span className="size-1 rounded-full bg-[oklch(0.55_0.10_35)]" />
              {isStrict ? "A firm pause" : "A pause to reflect"}
            </div>
            <DialogTitle className="font-heading text-3xl leading-tight tracking-tight text-ink">
              <span className="italic">A small moment</span> before you buy.
            </DialogTitle>
            <DialogDescription className="font-heading text-base italic text-ink-muted">
              Take a breath. Nothing is locked.
            </DialogDescription>
          </DialogHeader>

          {/* Trigger-rule pull-quote */}
          <blockquote className="border-l-2 border-[oklch(0.55_0.10_35)] py-1 pl-4">
            <p className="text-[13px] leading-relaxed text-ink">
              <span className="text-ink-muted">Why this prompt — </span>
              {decision.reason}.{" "}
              {overBudget ? (
                <>
                  This would put you{" "}
                  <span className="text-alert">over your budget</span> for{" "}
                  {periodLabel(config.budgetPeriod)}.
                </>
              ) : (
                <>
                  You have{" "}
                  <span className="font-mono num-tabular text-ink">
                    {formatCurrency(remaining)}
                  </span>{" "}
                  left {periodLabel(config.budgetPeriod)}.
                </>
              )}
            </p>
          </blockquote>

          {/* Budget bar */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
                {periodLabel(config.budgetPeriod)}
              </span>
              <span className="font-mono text-xs num-tabular text-ink-muted">
                {formatCurrency(spent)}{" "}
                <span className="text-ink-subtle/60">→</span>{" "}
                <span
                  className={cn(
                    overBudget ? "text-alert" : "text-ink"
                  )}
                >
                  {formatCurrency(projectedSpent)}
                </span>
                <span className="text-ink-subtle/60">
                  {" "}
                  / {formatCurrency(config.budgetAmount)}
                </span>
              </span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-paper-deep">
              <div
                className="absolute inset-y-0 left-0 bg-ink/60"
                style={{ width: `${spentPct}%` }}
              />
              <div
                className={cn(
                  "absolute inset-y-0",
                  overBudget
                    ? "bg-alert/40"
                    : "bg-[oklch(0.55_0.10_35)]/50"
                )}
                style={{
                  left: `${spentPct}%`,
                  width: `${projectedPct - spentPct}%`,
                }}
              />
              <div
                className={cn(
                  "absolute -top-0.5 h-2.5 w-px",
                  overBudget ? "bg-alert" : "bg-[oklch(0.55_0.10_35)]"
                )}
                style={{ left: `${projectedPct}%` }}
              />
            </div>
          </div>

          {/* Necessity segmented control */}
          <div className="space-y-2">
            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
              Why do you want this?
            </div>
            <div
              role="radiogroup"
              className="grid grid-cols-3 overflow-hidden rounded-lg border border-rule"
            >
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
                      "group flex flex-col items-start gap-0.5 border-r border-rule px-4 py-3 text-left transition-colors last:border-r-0",
                      active
                        ? "bg-ink text-paper"
                        : "bg-card text-ink hover:bg-paper-deep"
                    )}
                  >
                    <span className="font-heading text-base tracking-tight">
                      {opt.label}
                    </span>
                    <span
                      className={cn(
                        "text-[11px]",
                        active ? "text-paper/70" : "text-ink-subtle"
                      )}
                    >
                      {opt.hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alternatives */}
          {showAlternatives && (
            <div className="space-y-2">
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
                In-budget alternatives
              </div>
              {alternatives.length === 0 ? (
                <p className="text-sm italic text-ink-muted">
                  No in-budget alternatives in this category. Save for 24 hours
                  is a quieter option.
                </p>
              ) : (
                <div className="divide-y divide-rule rounded-lg border border-rule bg-card">
                  {alternatives.map((alt) => {
                    const inCart = state.cart.find(
                      (l) => l.itemId === alt.id
                    );
                    return (
                      <div
                        key={alt.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-paper-deep">
                          <Image
                            src={unsplashUrl(alt.imageId, 96)}
                            alt={alt.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-heading text-sm tracking-tight text-ink">
                            {alt.name}
                          </div>
                          <div className="font-mono text-[11px] num-tabular text-ink-subtle">
                            {formatCurrency(alt.price)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={inCart ? "secondary" : "outline"}
                          className={cn(
                            "border-ink/15 text-ink hover:bg-ink hover:text-paper",
                            inCart &&
                              "border-sage/30 bg-sage-soft text-ink hover:bg-sage-soft hover:text-ink"
                          )}
                          onClick={() =>
                            inCart ? removeFromCart(alt.id) : addToCart(alt.id)
                          }
                        >
                          {inCart ? "Remove" : "Swap in"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action footer with subtle separator */}
        <div className="border-t border-rule bg-paper-deep/40 p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {!showAlternatives ? (
              <button
                type="button"
                onClick={() => setShowAlternatives(true)}
                className="text-left text-[12px] uppercase tracking-[0.18em] text-ink-muted underline-offset-4 hover:text-ink hover:underline"
              >
                See cheaper alternatives →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAlternatives(false)}
                className="text-left text-[12px] uppercase tracking-[0.18em] text-ink-muted underline-offset-4 hover:text-ink hover:underline"
              >
                ← Back
              </button>
            )}

            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <Button
                variant={isStrict ? "outline" : "ghost"}
                onClick={handleBuy}
                className={cn(
                  "justify-center",
                  isStrict
                    ? "border-rule text-ink-muted hover:bg-paper-deep hover:text-ink"
                    : "text-ink hover:bg-paper-deep"
                )}
              >
                <ShoppingBag className="size-4" />
                Buy now · {formatCurrency(breakdown.total)}
              </Button>
              <Button
                onClick={handleSave}
                className="justify-center bg-ink text-paper hover:bg-ink/90"
              >
                <Clock className="size-4" />
                Save for 24 hours
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
          {isStrict && (
            <p className="mt-3 text-right font-heading text-[12px] italic text-ink-muted">
              Strict mode — saving is the recommended path.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
