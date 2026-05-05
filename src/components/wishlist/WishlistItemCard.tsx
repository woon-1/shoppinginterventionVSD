"use client";

import { ExternalLink, Trash2 } from "lucide-react";
import { WishlistItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface WishlistItemCardProps {
  item: WishlistItem;
  onRemove: (id: string) => void;
  onAddToCart: (item: WishlistItem) => void;
}

export function WishlistItemCard({
  item,
  onRemove,
  onAddToCart,
}: WishlistItemCardProps) {
  const handleOpenProduct = () => {
    window.open(item.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rounded-xl border border-ink-4 bg-surface p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-ink line-clamp-2">{item.name}</h3>
            <span className="inline-block mt-1 rounded bg-ink-4 px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-ink-2">
              {item.website}
            </span>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-ink-4 text-ink-3 hover:text-ink transition-colors"
            title="Remove from wishlist"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-ink">
            {item.currency === "USD" ? "$" : item.currency}
            {item.price.toFixed(2)}
          </span>
          <span className="text-sm text-ink-3">{item.currency}</span>
        </div>

        <div className="text-[11px] text-ink-3">
          Added {new Date(item.addedAt).toLocaleDateString()}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onAddToCart(item)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "bg-ink text-paper hover:bg-ink/90"
            )}
          >
            Add to Cart
          </button>
          <button
            onClick={handleOpenProduct}
            className={cn(
              "flex-shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "border border-ink-4 text-ink hover:bg-surface-2"
            )}
            title="Open original product page"
          >
            <ExternalLink className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
