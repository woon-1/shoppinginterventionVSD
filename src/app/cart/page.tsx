"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { getCatalogItem } from "@/lib/catalog";
import { isItemEssential } from "@/lib/intervention";
import { formatCurrency } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CartPage() {
  const router = useRouter();
  const { state, hydrated, setCartQty, removeFromCart } = useAppState();

  useEffect(() => {
    if (hydrated && !state.config?.onboardingComplete) {
      router.replace("/setup");
    }
  }, [hydrated, state.config, router]);

  if (!hydrated || !state.config?.onboardingComplete) {
    return <p className="py-10 text-sm text-muted-foreground">Loading…</p>;
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

  if (lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Cart is empty</h1>
        <p className="text-sm text-muted-foreground">
          Browse the shop to add items.
        </p>
        <Link href="/shop" className={cn(buttonVariants())}>
          Go to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>
        <p className="text-sm text-muted-foreground">
          Review before checkout. Essentials skip the reflection step.
        </p>
      </div>

      <div className="space-y-3">
        {lines.map(({ line, item, essential, subtotal }) => (
          <Card key={item.id}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="text-3xl">{item.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.name}</span>
                  {essential && (
                    <Badge
                      variant="secondary"
                      className="border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                    >
                      Essential
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(item.price)} each
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="size-7"
                  onClick={() => setCartQty(item.id, line.qty - 1)}
                  aria-label="Decrease quantity"
                >
                  <Minus className="size-3" />
                </Button>
                <span className="w-6 text-center text-sm font-medium">
                  {line.qty}
                </span>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-7"
                  onClick={() => setCartQty(item.id, line.qty + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus className="size-3" />
                </Button>
              </div>
              <div className="w-20 text-right font-mono text-sm">
                {formatCurrency(subtotal)}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={() => removeFromCart(item.id)}
                aria-label="Remove from cart"
              >
                <Trash2 className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <span className="text-base font-medium">Total</span>
          <span className="font-mono text-lg font-semibold">
            {formatCurrency(total)}
          </span>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" disabled>
          Checkout (intervention coming next)
        </Button>
      </div>
    </div>
  );
}
