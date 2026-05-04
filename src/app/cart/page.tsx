"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, X, ArrowRight } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { getCatalogItem, unsplashUrl } from "@/lib/catalog";
import {
  breakdownCart,
  decideIntervention,
  isItemEssential,
} from "@/lib/intervention";
import { formatCurrency } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InterventionModal } from "@/components/intervention/InterventionModal";
import { toast } from "sonner";
import { extensionAwareReplace } from "@/lib/extension-nav";

export default function CartPage() {
  const router = useRouter();
  const { state, hydrated, setCartQty, removeFromCart, purchaseCart } =
    useAppState();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !state.config?.onboardingComplete) {
      extensionAwareReplace(router, "/setup");
    }
  }, [hydrated, state.config, router]);

  if (!hydrated || !state.config?.onboardingComplete) {
    return <p className="py-10 text-sm text-ink-3">Loading…</p>;
  }

  const config = state.config;
  const lines = state.cart
    .map((line) => {
      const item = getCatalogItem(line.itemId);
      if (!item) return null;
      return {
        line,
        item,
        essential: isItemEssential(item.id, config),
        subtotal: item.price * line.qty,
      };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const total = lines.reduce((sum, l) => sum + l.subtotal, 0);
  const totalQty = lines.reduce((s, l) => s + l.line.qty, 0);
  const essentialCount = lines.filter((l) => l.essential).length;
  const reviewCount = lines.length - essentialCount;

  const decision = useMemo(
    () => decideIntervention(breakdownCart(state.cart, config), config),
    [state.cart, config]
  );

  function handleCheckout() {
    if (decision.triggered) {
      setModalOpen(true);
      return;
    }
    purchaseCart(state.cart, { need: 1 }, true);
    toast.success("Purchase complete", {
      description: `${formatCurrency(total)} · essentials only.`,
    });
    extensionAwareReplace(router, "/dashboard");
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-start gap-6 py-12">
        <h1 className="text-[96px] font-semibold leading-[0.95] tracking-[-0.04em] text-ink">
          Cart.
        </h1>
        <p className="text-base text-ink-2">Cart is empty.</p>
        <Link
          href="/shop"
          className={cn(
            buttonVariants({ variant: "outline" }),
            "border-ink-4 text-ink hover:bg-surface-2"
          )}
        >
          Go to shop
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <header className="space-y-3">
        <h1 className="text-[96px] font-semibold leading-[0.95] tracking-[-0.04em] text-ink">
          Cart.
        </h1>
        <p className="font-mono text-[12px] text-ink-3">
          {totalQty} {totalQty === 1 ? "item" : "items"} ·{" "}
          {essentialCount} essential{essentialCount === 1 ? "" : "s"}
          {reviewCount > 0 ? `, ${reviewCount} for review` : ""}
        </p>
      </header>

      {/* Data table */}
      <div className="border-t border-ink-4">
        {lines.map(({ line, item, essential, subtotal }, idx) => (
          <div
            key={item.id}
            className="group flex h-14 items-center gap-4 border-b border-ink-4 px-2 transition-colors hover:bg-surface-2"
          >
            <span className="hidden w-6 font-mono text-[11px] text-ink-3 num-tabular sm:inline-block">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div className="relative size-8 shrink-0 overflow-hidden rounded-sm bg-surface-2">
              <Image
                src={unsplashUrl(item.imageId, 64)}
                alt=""
                fill
                sizes="32px"
                className="object-cover"
              />
            </div>
            <div className="flex flex-1 min-w-0 items-center gap-2">
              <span className="truncate text-[14px] font-medium text-ink">
                {item.name}
              </span>
              {essential ? (
                <span className="hidden rounded border border-ink-4 px-1 py-px font-mono text-[9px] uppercase tracking-[0.06em] text-ink-2 md:inline-block">
                  Essential
                </span>
              ) : (
                <span className="hidden text-[12px] text-ink-3 md:inline-block">
                  · {item.category}
                </span>
              )}
            </div>
            <div className="hidden items-center gap-1 sm:flex">
              <button
                onClick={() => setCartQty(item.id, line.qty - 1)}
                className="flex size-7 items-center justify-center rounded-sm text-ink-2 hover:bg-ink-4/30 hover:text-ink"
                aria-label="Decrease"
              >
                <Minus className="size-3" />
              </button>
              <span className="w-5 text-center font-mono text-[12px] num-tabular">
                {line.qty}
              </span>
              <button
                onClick={() => setCartQty(item.id, line.qty + 1)}
                className="flex size-7 items-center justify-center rounded-sm text-ink-2 hover:bg-ink-4/30 hover:text-ink"
                aria-label="Increase"
              >
                <Plus className="size-3" />
              </button>
            </div>
            <span className="hidden w-20 text-right font-mono text-[12px] num-tabular text-ink-2 sm:inline-block">
              {formatCurrency(item.price)}
            </span>
            <span className="w-20 text-right font-mono text-[13px] font-medium num-tabular text-ink">
              {formatCurrency(subtotal)}
            </span>
            <button
              onClick={() => removeFromCart(item.id)}
              className="flex size-7 items-center justify-center rounded-sm text-ink-3 opacity-0 hover:bg-ink-4/30 hover:text-negative group-hover:opacity-100"
              aria-label="Remove"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Total — the loud moment */}
      <div className="flex flex-col items-end gap-2 pt-8">
        <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
          Total
        </span>
        <span className="text-[80px] font-medium leading-none tracking-[-0.04em] text-ink num-tabular">
          {formatCurrency(total)}
        </span>
        {decision.triggered && (
          <span className="font-mono text-[11px] text-ink-3">
            {reviewCount} {reviewCount === 1 ? "candidate" : "candidates"} for review
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Link
          href="/shop"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "text-ink-2 hover:bg-surface-2 hover:text-ink"
          )}
        >
          Continue shopping
        </Link>
        <Button
          onClick={handleCheckout}
          className="bg-ink text-paper hover:bg-ink/90"
        >
          Check out
          <ArrowRight className="size-3.5" />
        </Button>
      </div>

      <InterventionModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
