"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CATALOG } from "@/lib/catalog";
import { ALL_CATEGORIES, CATEGORY_LABELS } from "@/lib/types";
import { ProductCard } from "@/components/shop/ProductCard";
import { useAppState } from "@/context/AppStateContext";

export default function ShopPage() {
  const router = useRouter();
  const { state, hydrated } = useAppState();

  useEffect(() => {
    if (hydrated && !state.config?.onboardingComplete) {
      router.replace("/setup");
    }
  }, [hydrated, state.config, router]);

  if (!hydrated) {
    return <p className="py-10 text-sm text-ink-subtle">Loading shop…</p>;
  }
  if (!state.config?.onboardingComplete) return null;

  let runningIndex = 0;

  return (
    <div className="space-y-14">
      <header className="max-w-2xl space-y-3">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
          The catalog
        </div>
        <h1 className="font-heading text-[44px] leading-[1.05] tracking-tight text-ink md:text-[56px]">
          A small shop, by design.
        </h1>
        <p className="font-heading text-lg italic text-ink-muted">
          Take what you need. Sit with what you want.
        </p>
      </header>

      {ALL_CATEGORIES.map((cat, sectionIdx) => {
        const items = CATALOG.filter((c) => c.category === cat);
        const sectionLabel = String(sectionIdx + 1).padStart(2, "0");
        return (
          <section key={cat} className="space-y-5">
            <div className="flex items-end justify-between border-b border-rule pb-3">
              <div className="space-y-1">
                <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
                  Section {sectionLabel}
                </div>
                <h2 className="font-heading text-2xl tracking-tight text-ink">
                  {CATEGORY_LABELS[cat]}
                </h2>
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-subtle num-tabular">
                {items.length} {items.length === 1 ? "item" : "items"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => {
                const idx = runningIndex++;
                return (
                  <ProductCard
                    key={item.id}
                    item={item}
                    priority={idx < 4}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
