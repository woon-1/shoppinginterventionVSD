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
    return (
      <p className="py-10 text-sm text-muted-foreground">Loading shop…</p>
    );
  }
  if (!state.config?.onboardingComplete) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Shop</h1>
        <p className="text-sm text-muted-foreground">
          Add items to your cart. Essentials are tagged based on your setup.
        </p>
      </div>
      {ALL_CATEGORIES.map((cat) => {
        const items = CATALOG.filter((c) => c.category === cat);
        return (
          <section key={cat} className="space-y-3">
            <h2 className="text-lg font-medium">{CATEGORY_LABELS[cat]}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {items.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
