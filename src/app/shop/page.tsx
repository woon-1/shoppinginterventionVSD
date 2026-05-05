"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Check } from "lucide-react";
import { CATALOG, unsplashUrl } from "@/lib/catalog";
import { ALL_CATEGORIES, CATEGORY_LABELS, CatalogItem } from "@/lib/types";
import { useAppState } from "@/context/AppStateContext";
import { isItemEssential } from "@/lib/intervention";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { extensionAwareReplace } from "@/lib/extension-nav";

export default function ShopPage() {
  const router = useRouter();
  const { state, hydrated } = useAppState();

  useEffect(() => {
    if (hydrated && !state.config?.onboardingComplete) {
      extensionAwareReplace(router, "/setup");
    }
  }, [hydrated, state.config, router]);

  if (!hydrated) {
    return <p className="py-10 text-sm text-ink-3">Loading shop…</p>;
  }
  if (!state.config?.onboardingComplete) return null;

  const totalItems = CATALOG.length;
  const totalCategories = ALL_CATEGORIES.length;

  return (
    <div className="space-y-16">
      {/* Hero */}
      <header className="space-y-3">
        <h1 className="text-[96px] font-semibold leading-[0.95] tracking-[-0.04em] text-ink">
          Shop.
        </h1>
        <p className="font-mono text-[12px] text-ink-3">
          {totalItems} items · {totalCategories} categories
        </p>
      </header>

      {/* Categories */}
      <div className="space-y-12">
        {ALL_CATEGORIES.map((cat) => {
          const items = CATALOG.filter((c) => c.category === cat);
          const count = String(items.length).padStart(2, "0");
          return (
            <section key={cat}>
              <div className="flex items-baseline justify-between border-b border-ink-4 pb-2">
                <h2 className="text-[14px] font-medium text-ink">
                  {CATEGORY_LABELS[cat]}
                </h2>
                <span className="font-mono text-[11px] text-ink-3 num-tabular">
                  {count}
                </span>
              </div>
              <div>
                {items.map((item) => (
                  <CatalogRow key={item.id} item={item} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function CatalogRow({ item }: { item: CatalogItem }) {
  const { state, addToCart } = useAppState();
  const inCart = state.cart.find((l) => l.itemId === item.id);
  const essential = state.config
    ? isItemEssential(item.id, state.config)
    : item.defaultEssential;

  return (
    <div className="group flex h-14 items-center gap-4 border-b border-ink-4 px-2 transition-colors hover:bg-surface-2">
      <div className="relative size-9 shrink-0 overflow-hidden rounded-sm bg-surface-2">
        <Image
          src={unsplashUrl(item.imageId, 80)}
          alt=""
          fill
          sizes="36px"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 min-w-0 items-center gap-2">
        <span className="truncate text-[14px] font-medium text-ink">
          {item.name}
        </span>
        {essential && (
          <span className="hidden rounded border border-ink-4 px-1 py-px font-mono text-[9px] uppercase tracking-[0.06em] text-ink-2 sm:inline-block">
            Essential
          </span>
        )}
        <span className="hidden text-[12px] text-ink-3 md:inline-block">
          · {item.category}
        </span>
      </div>
      <span className="w-20 text-right font-mono text-[13px] num-tabular text-ink">
        {formatCurrency(item.price)}
      </span>
      <button
        onClick={() => addToCart(item.id)}
        className={cn(
          "flex h-7 items-center gap-1 rounded border px-2.5 font-mono text-[11px] transition-colors",
          inCart
            ? "border-accent bg-accent-fade text-accent"
            : "border-ink-4 text-ink-2 hover:border-ink hover:bg-ink hover:text-paper"
        )}
      >
        {inCart ? (
          <>
            <Check className="size-3" />
            In cart · {inCart.qty}
          </>
        ) : (
          <>
            <Plus className="size-3" />
            Add
          </>
        )}
      </button>
    </div>
  );
}
