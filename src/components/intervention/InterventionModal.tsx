"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Clock, Sparkles, Info } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LightPause } from "./LightPause";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

  // Light friction: replace modal with a 5-second pause overlay
  if (decision.level === "light") {
    return (
      <LightPause
        open={open}
        onOpenChange={onOpenChange}
        onComplete={() => {
          // After the pause, complete the purchase as-is
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
  const budgetPct = Math.min(
    100,
    Math.round(
      ((config.budgetAmount - remaining + breakdown.nonEssentialsTotal) /
        Math.max(config.budgetAmount, 1)) *
        100
    )
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
        : "If you don't buy within 24h, the amount counts toward your savings.",
    });
    onOpenChange(false);
    router.replace("/dashboard");
  }

  const isStrict = decision.level === "strict";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            A pause to reflect
          </DialogTitle>
          <DialogDescription>
            Take a moment before completing this checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 py-4">
              <div className="flex items-start gap-2 text-sm">
                <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Why this prompt?
                  </span>{" "}
                  {decision.reason}.{" "}
                  {overBudget
                    ? `This would put you over your ${periodLabel(
                        config.budgetPeriod
                      )} budget.`
                    : `You have ${formatCurrency(remaining)} left ${periodLabel(
                        config.budgetPeriod
                      )}.`}
                </div>
              </div>

              <Separator />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Non-essentials in cart
                  </span>
                  <span className="font-mono font-medium">
                    {formatCurrency(breakdown.nonEssentialsTotal)}
                  </span>
                </div>
                {breakdown.essentialsTotal > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Essentials</span>
                    <span className="font-mono">
                      {formatCurrency(breakdown.essentialsTotal)}
                    </span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    {periodLabel(config.budgetPeriod)} progress
                  </span>
                  <span className="font-mono text-sm">
                    {formatCurrency(config.budgetAmount - remaining)} /{" "}
                    {formatCurrency(config.budgetAmount)}
                  </span>
                </div>
                <Progress
                  value={budgetPct}
                  className={cn(overBudget && "[&>*]:bg-destructive")}
                />
                {overBudget && (
                  <p className="text-xs text-destructive">
                    This purchase exceeds your remaining budget by{" "}
                    {formatCurrency(breakdown.nonEssentialsTotal - remaining)}.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {breakdown.essentials.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Your {breakdown.essentials.length} essential item
              {breakdown.essentials.length === 1 ? "" : "s"} will be purchased
              regardless of which option you choose.
            </p>
          )}

          <div className="space-y-2">
            <Label className="text-sm">Why do you want this?</Label>
            <RadioGroup
              value={necessity}
              onValueChange={(v) => setNecessity(v as Necessity)}
              className="grid grid-cols-3 gap-2"
            >
              {(["need", "want", "unsure"] as Necessity[]).map((n) => (
                <label
                  key={n}
                  className={cn(
                    "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm capitalize transition-colors",
                    necessity === n
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  )}
                >
                  <RadioGroupItem value={n} id={`necessity-${n}`} />
                  <span>{n}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {showAlternatives && alternatives.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm">In-budget alternatives</Label>
              <div className="space-y-2">
                {alternatives.map((alt) => {
                  const inCart = state.cart.find((l) => l.itemId === alt.id);
                  return (
                    <Card key={alt.id}>
                      <CardContent className="flex items-center gap-3 py-3">
                        <div className="text-2xl">{alt.emoji}</div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{alt.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(alt.price)}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={inCart ? "secondary" : "outline"}
                          onClick={() =>
                            inCart
                              ? removeFromCart(alt.id)
                              : addToCart(alt.id)
                          }
                        >
                          {inCart ? "Remove" : "Swap in"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {showAlternatives && alternatives.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No in-budget alternatives in this category. Try Save for 24h.
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          {!showAlternatives && (
            <Button
              variant="outline"
              onClick={() => setShowAlternatives(true)}
              className="sm:mr-auto"
            >
              Show alternatives
            </Button>
          )}
          <Button
            variant={isStrict ? "outline" : "outline"}
            onClick={handleBuy}
          >
            <ShoppingBag className="size-4" />
            Buy now
          </Button>
          <Button
            variant={isStrict ? "default" : "default"}
            onClick={handleSave}
          >
            <Clock className="size-4" />
            Save for 24h
          </Button>
        </DialogFooter>

        {isStrict && (
          <p className="text-xs text-muted-foreground">
            Strict mode: Save-for-24h is the recommended action. Buy now is
            still available.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
