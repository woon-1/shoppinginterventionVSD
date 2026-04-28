"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
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

export default function CartPage() {
  const router = useRouter();
  const { state, hydrated, setCartQty, removeFromCart, purchaseCart } =
    useAppState();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !state.config?.onboardingComplete) {
      router.replace("/setup");
    }
  }, [hydrated, state.config, router]);

  if (!hydrated || !state.config?.onboardingComplete) {
    return <p className="py-10 text-sm text-ink-subtle">Loading…</p>;
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
      description: `${formatCurrency(total)} · essentials only, no friction.`,
    });
    router.replace("/dashboard");
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 py-24 text-center">
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
          Empty cart
        </div>
        <h1 className="font-heading text-3xl tracking-tight text-ink">
          Nothing to reflect on yet.
        </h1>
        <p className="text-sm text-ink-muted">
          Browse the shop and add something. Your essentials will pass through;
          everything else gets a small pause.
        </p>
        <Link
          href="/shop"
          className={cn(buttonVariants(), "mt-2")}
        >
          Go to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="max-w-2xl space-y-2">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
          The cart
        </div>
        <h1 className="font-heading text-4xl leading-tight tracking-tight text-ink md:text-5xl">
          Before you check out.
        </h1>
        <p className="font-heading text-lg italic text-ink-muted">
          Essentials skip the reflection. Everything else gets a quiet pause.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="divide-y divide-rule rounded-2xl border border-rule bg-card">
          {lines.map(({ line, item, essential, subtotal }) => (
            <div
              key={item.id}
              className="flex items-center gap-4 px-4 py-4 sm:gap-5 sm:px-5"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-paper-deep sm:size-16">
                <Image
                  src={unsplashUrl(item.imageId, 128)}
                  alt={item.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-heading text-[15px] leading-tight tracking-tight text-ink">
                    {item.name}
                  </h3>
                  {essential && (
                    <span className="inline-flex shrink-0 items-center rounded-full border border-sage/40 bg-sage-soft px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-ink">
                      Essential
                    </span>
                  )}
                </div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
                  {item.category} · {formatCurrency(item.price)} each
                </div>
              </div>
              <div className="hidden items-center gap-1 sm:flex">
                <Button
                  size="icon-sm"
                  variant="outline"
                  className="border-rule"
                  onClick={() => setCartQty(item.id, line.qty - 1)}
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-3" />
                </Button>
                <span className="w-6 text-center font-mono text-sm num-tabular">
                  {line.qty}
                </span>
                <Button
                  size="icon-sm"
                  variant="outline"
                  className="border-rule"
                  onClick={() => setCartQty(item.id, line.qty + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus className="size-3" />
                </Button>
              </div>
              <div className="hidden w-20 text-right font-heading text-base num-tabular text-ink sm:block">
                {formatCurrency(subtotal)}
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                className="text-ink-subtle hover:text-alert"
                onClick={() => removeFromCart(item.id)}
                aria-label="Remove from cart"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>

        <aside className="sticky top-32 space-y-4 rounded-2xl border border-rule bg-paper-deep p-5">
          <div className="space-y-1">
            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
              Order
            </div>
            <h2 className="font-heading text-xl tracking-tight text-ink">
              Summary
            </h2>
          </div>
          <dl className="space-y-2 border-y border-rule py-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-ink-muted">Items</dt>
              <dd className="font-mono num-tabular text-ink">
                {lines.reduce((s, l) => s + l.line.qty, 0)}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="font-mono num-tabular text-ink">
                {formatCurrency(total)}
              </dd>
            </div>
          </dl>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] uppercase tracking-[0.22em] text-ink-subtle">
              Total
            </span>
            <span className="font-heading text-3xl tracking-tight text-ink num-tabular">
              {formatCurrency(total)}
            </span>
          </div>
          <Button
            size="lg"
            className="w-full justify-center bg-ink text-paper hover:bg-ink/90"
            onClick={handleCheckout}
          >
            <span className="size-1.5 rounded-full bg-[oklch(0.55_0.10_35)]" />
            Check out
            <ArrowRight className="size-4" />
          </Button>
          <p className="text-center text-[11px] italic text-ink-subtle">
            {decision.triggered
              ? "A small pause is waiting on the next step."
              : "Essentials only — no pause needed."}
          </p>
        </aside>
      </div>

      <InterventionModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
