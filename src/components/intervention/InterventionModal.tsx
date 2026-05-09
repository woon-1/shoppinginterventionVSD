"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAppState } from "@/context/AppStateContext";
import {
  CartBreakdown,
  breakdownCart,
  decideIntervention,
  deriveRecommendation,
  findAlternatives,
} from "@/lib/intervention";
import { remainingBudget, periodLabel } from "@/lib/budget";
import { formatCurrency } from "@/lib/format";
import { FrictionLevel, Necessity } from "@/lib/types";
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
import {
  deriveAdaptiveIntervention,
  loadStoredCartInterventionStats,
  type AdaptiveIntervention,
  type CartInterventionPayload,
} from "@/lib/intervention-behavior";
import {
  AccentDot,
  Eyebrow,
  Money,
  Pill,
} from "@/components/pause";

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
  const [justification, setJustification] = useState("");
  const [adaptive, setAdaptive] = useState<AdaptiveIntervention | null>(null);

  useEffect(() => {
    if (open) {
      setNecessity("want");
      setShowAlternatives(false);
      setJustification("");
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

  useEffect(() => {
    if (!open || !state.config || !breakdown) {
      setAdaptive(null);
      return;
    }

    const configFriction = state.config.friction;
    const cartTotal = breakdown.total;

    let active = true;
    void loadStoredCartInterventionStats().then((stats) => {
      if (!active) return;
      setAdaptive(deriveAdaptiveIntervention(configFriction, stats, cartTotal));
    });

    return () => {
      active = false;
    };
  }, [open, state.config, breakdown]);

  if (!open || !config || !breakdown || !decision) return null;

  const baseFriction: FrictionLevel =
    decision.level === "none" ? config.friction : decision.level;
  const effectiveFriction = adaptive?.friction ?? baseFriction;
  const pauseSeconds = Math.max(
    1.5,
    (adaptive?.pauseMs ?? (decision.level === "strict" ? 4200 : 1600)) / 1000
  );
  const requiresJustification =
    adaptive?.requireJustification ?? decision.level === "strict";
  const canProceed = !requiresJustification || justification.trim().length > 0;

  if (effectiveFriction === "light") {
    return (
      <LightPause
        open={open}
        onOpenChange={onOpenChange}
        pauseSeconds={pauseSeconds}
        onComplete={() => {
          purchaseCart(state.cart, { [necessity]: 1 }, false);
          toast.success("Purchase complete", {
            description: `${formatCurrency(breakdown.total)} charged.`,
          });
          if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
            void chrome.runtime.sendMessage({
              action: "recordCartIntervention",
              payload: {
                kind: "continue",
                host: location.hostname,
                cartTotal: breakdown.total,
                friction: effectiveFriction,
                engagedPrompt: necessity !== "want" || showAlternatives,
              } satisfies CartInterventionPayload,
            });
          }
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
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      void chrome.runtime.sendMessage({
        action: "recordCartIntervention",
        payload: {
          kind: "continue",
          host: location.hostname,
          cartTotal: breakdown!.total,
          friction: effectiveFriction,
          engagedPrompt: necessity !== "want" || showAlternatives,
        } satisfies CartInterventionPayload,
      });
    }
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
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      void chrome.runtime.sendMessage({
        action: "recordCartIntervention",
        payload: {
          kind: "wait_24h",
          host: location.hostname,
          cartTotal: breakdown!.total,
          friction: effectiveFriction,
          engagedPrompt: necessity !== "want" || showAlternatives,
        } satisfies CartInterventionPayload,
      });
    }
    onOpenChange(false);
    extensionAwareReplace(router, "/dashboard");
  }

  const isStrict = effectiveFriction === "strict";
  const recommendation = deriveRecommendation({
    cartTotal: breakdown.nonEssentialsTotal,
    remaining,
    friction: effectiveFriction,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md gap-0 overflow-hidden rounded-md border border-ink-4 bg-surface p-0 shadow-none"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-ink-4 px-5 py-3">
          <DialogTitle className="flex items-center gap-1.5">
            <span className="text-[15px] font-semibold tracking-tight text-ink">
              Pause
            </span>
            <span
              aria-hidden
              className="size-1 shrink-0 rounded-[1px] bg-accent"
            />
          </DialogTitle>
          <Pill variant="outline">{isStrict ? "Strict" : "Standard"}</Pill>
        </div>

        <div className="space-y-5 px-5 py-5">
          {/* Trigger line */}
          <div className="flex items-start gap-2">
            <AccentDot className="mt-2" />
            <p className="text-[14px] leading-relaxed text-ink">
              <Money amount={breakdown.nonEssentialsTotal} className="text-[14px] text-ink" />{" "}
              in cart,{" "}
              <Money amount={remaining} className="text-[14px] text-ink" />{" "}
              left {periodLabel(config.budgetPeriod)}.
              {overBudget && (
                <>
                  <br />
                  <span className="text-negative">Over budget.</span>
                </>
              )}
            </p>
          </div>

          {/* Budget bar with prominent labels */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 items-end text-[13px] num-tabular">
              <span className="text-left font-mono text-ink-3">
                {formatCurrency(spent)}
              </span>
              <span className="text-center font-mono text-[15px] font-medium text-ink">
                {formatCurrency(projectedSpent)}
              </span>
              <span className="text-right font-mono text-ink-3">
                {formatCurrency(config.budgetAmount)}
              </span>
            </div>
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-ink-4/40">
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
                className="absolute -top-0.5 h-2.5 w-px bg-ink"
                style={{ left: `${projectedPct}%` }}
              />
            </div>
          </div>

          {/* Why? */}
          <div className="space-y-2.5">
            <Eyebrow>Why?</Eyebrow>
            <div role="radiogroup" className="grid grid-cols-3 gap-2">
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
                      "h-11 rounded-md border text-[14px] font-medium transition-colors",
                      active
                        ? "border-accent bg-accent-fade text-accent"
                        : "border-ink-4 bg-surface text-ink hover:border-ink"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            {requiresJustification && (
              <div className="space-y-2 pt-2">
                <Eyebrow as="label">One sentence: why now?</Eyebrow>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="min-h-20 w-full rounded-md border border-ink-4 bg-surface px-3 py-2 text-[13px] text-ink outline-none transition-colors focus:border-accent"
                  placeholder="What makes this worth buying today?"
                />
              </div>
            )}
          </div>

          {/* Alternatives */}
          {showAlternatives && (
            <div className="space-y-2 border-t border-ink-4 pt-4">
              <Eyebrow>Cheaper alternatives</Eyebrow>
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
        <div className="flex items-center justify-between gap-3 border-t border-ink-4 bg-surface-2/50 px-5 py-3">
          <button
            type="button"
            onClick={() => setShowAlternatives((v) => !v)}
            className="font-mono text-[12px] text-ink-3 transition-colors hover:text-ink hover:underline"
          >
            {showAlternatives ? "← Back" : "See alternatives →"}
          </button>

          <div className="flex items-center gap-3">
            {recommendation === "buy" && (
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-accent">
                Recommended
              </span>
            )}
            <button
              type="button"
              onClick={handleBuy}
              disabled={!canProceed}
              className="text-[14px] font-medium text-ink transition-colors hover:underline disabled:cursor-not-allowed disabled:text-ink-3"
            >
              Buy
            </button>
            {recommendation === "save" && (
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-accent">
                Recommended
              </span>
            )}
            <Button
              variant="accent"
              size="lg"
              onClick={handleSave}
              disabled={!canProceed}
              className="px-4"
            >
              Save for 24h
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
