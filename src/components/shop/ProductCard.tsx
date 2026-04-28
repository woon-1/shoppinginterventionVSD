"use client";

import { CatalogItem } from "@/lib/types";
import { useAppState } from "@/context/AppStateContext";
import { isItemEssential } from "@/lib/intervention";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Plus, Check } from "lucide-react";

export function ProductCard({ item }: { item: CatalogItem }) {
  const { state, addToCart } = useAppState();
  const inCart = state.cart.find((l) => l.itemId === item.id);
  const essential = state.config
    ? isItemEssential(item.id, state.config)
    : item.defaultEssential;

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col items-center gap-3 pt-6">
        <div className="text-5xl">{item.emoji}</div>
        <div className="text-center">
          <div className="font-medium">{item.name}</div>
          <div className="text-sm text-muted-foreground capitalize">
            {item.category}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            {formatCurrency(item.price)}
          </span>
          {essential && (
            <Badge
              variant="secondary"
              className="border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
            >
              Essential
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          size="sm"
          variant={inCart ? "secondary" : "default"}
          className="w-full"
          onClick={() => addToCart(item.id)}
        >
          {inCart ? (
            <>
              <Check className="size-4" />
              In cart ({inCart.qty})
            </>
          ) : (
            <>
              <Plus className="size-4" />
              Add to cart
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
