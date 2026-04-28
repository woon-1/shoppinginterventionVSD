"use client";

import Image from "next/image";
import { Plus, Check } from "lucide-react";
import { CatalogItem } from "@/lib/types";
import { useAppState } from "@/context/AppStateContext";
import { isItemEssential } from "@/lib/intervention";
import { unsplashUrl } from "@/lib/catalog";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  item: CatalogItem;
  priority?: boolean;
}

export function ProductCard({ item, priority = false }: Props) {
  const { state, addToCart } = useAppState();
  const inCart = state.cart.find((l) => l.itemId === item.id);
  const essential = state.config
    ? isItemEssential(item.id, state.config)
    : item.defaultEssential;

  return (
    <article className="group/card relative flex flex-col overflow-hidden rounded-2xl border border-rule bg-card transition-transform duration-300 ease-out hover:-translate-y-0.5">
      <div className="relative aspect-square w-full overflow-hidden bg-paper-deep">
        <Image
          src={unsplashUrl(item.imageId, 600)}
          alt={item.name}
          fill
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 33vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-[1.04]"
          priority={priority}
        />
        {essential && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-sage/40 bg-sage-soft/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ink backdrop-blur-sm">
            Essential
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-subtle">
            {item.category}
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-heading text-[17px] leading-tight tracking-tight text-ink">
              {item.name}
            </h3>
            <span className="font-heading text-[17px] leading-tight tracking-tight text-ink num-tabular">
              {formatCurrency(item.price)}
            </span>
          </div>
        </div>
        <Button
          size="sm"
          variant={inCart ? "secondary" : "outline"}
          className={cn(
            "w-full justify-center border-ink/15 text-ink hover:bg-ink hover:text-paper",
            inCart &&
              "border-sage/30 bg-sage-soft text-ink hover:bg-sage-soft hover:text-ink"
          )}
          onClick={() => addToCart(item.id)}
        >
          {inCart ? (
            <>
              <Check className="size-3.5" />
              In cart · {inCart.qty}
            </>
          ) : (
            <>
              <Plus className="size-3.5" />
              Add to cart
            </>
          )}
        </Button>
      </div>
    </article>
  );
}
