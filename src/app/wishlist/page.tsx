"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { WishlistItem } from "@/lib/types";
import { WishlistItemCard } from "@/components/wishlist/WishlistItemCard";

export default function WishlistPage() {
  const { state, addToCart, removeFromWishlist } = useAppState();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWebsite, setSelectedWebsite] = useState<
    WishlistItem["website"] | "all"
  >("all");
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "newest">(
    "newest"
  );

  const filteredItems = useMemo(() => {
    let items = [...state.wishlist];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.website.toLowerCase().includes(query)
      );
    }

    if (selectedWebsite !== "all") {
      items = items.filter((item) => item.website === selectedWebsite);
    }

    switch (sortBy) {
      case "price-low":
        items.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        items.sort((a, b) => b.price - a.price);
        break;
      case "newest":
      default:
        items.sort((a, b) => b.addedAt - a.addedAt);
        break;
    }

    return items;
  }, [state.wishlist, searchQuery, selectedWebsite, sortBy]);

  const websites = useMemo(() => {
    return Array.from(new Set(state.wishlist.map((w) => w.website)));
  }, [state.wishlist]);

  const totalValue = state.wishlist.reduce((sum, item) => sum + item.price, 0);
  const avgPrice =
    state.wishlist.length > 0
      ? (totalValue / state.wishlist.length).toFixed(2)
      : "0.00";

  const handleAddToCart = (item: WishlistItem) => {
    alert(`Added "${item.name}" to cart (feature integration pending)`);
  };

  if (!state.config?.onboardingComplete) {
    return (
      <div className="min-h-screen bg-paper px-4 py-8 text-ink">
        <div className="space-y-4 rounded-2xl border border-ink-4 bg-surface p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Wishlist</h1>
          <p className="text-ink-2">
            Complete setup to start using the wishlist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-6 text-ink">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Wishlist</h1>
          <p className="text-ink-2">
            {state.wishlist.length} item{state.wishlist.length !== 1 ? "s" : ""} saved · Total value:{" "}
            <span className="font-semibold">${totalValue.toFixed(2)}</span>
          </p>
        </div>

        {/* Stats Cards */}
        {state.wishlist.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-ink-4 bg-surface p-3">
              <div className="text-[10px] uppercase tracking-wider text-ink-3">Items</div>
              <div className="mt-1 text-xl font-bold text-ink">
                {state.wishlist.length}
              </div>
            </div>
            <div className="rounded-lg border border-ink-4 bg-surface p-3">
              <div className="text-[10px] uppercase tracking-wider text-ink-3">Total Value</div>
              <div className="mt-1 text-xl font-bold text-ink">
                ${totalValue.toFixed(2)}
              </div>
            </div>
            <div className="rounded-lg border border-ink-4 bg-surface p-3">
              <div className="text-[10px] uppercase tracking-wider text-ink-3">Avg Price</div>
              <div className="mt-1 text-xl font-bold text-ink">
                ${avgPrice}
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        {state.wishlist.length > 0 && (
          <div className="space-y-4 rounded-xl border border-ink-4 bg-surface p-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-3" />
              <input
                type="text"
                placeholder="Search wishlist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-paper border border-ink-4 rounded-lg pl-10 pr-4 py-2 text-sm text-ink placeholder-ink-3 focus:outline-none focus:ring-2 focus:ring-ink"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Website Filter */}
              <div className="flex-1">
                <label className="block text-[11px] uppercase tracking-wider text-ink-3 mb-2">
                  Website
                </label>
                <select
                  value={selectedWebsite}
                  onChange={(e) =>
                    setSelectedWebsite(
                      e.target.value as WishlistItem["website"] | "all"
                    )
                  }
                  className="w-full bg-paper border border-ink-4 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink"
                >
                  <option value="all">All Sites</option>
                  {websites.map((website) => (
                    <option key={website} value={website}>
                      {website.charAt(0).toUpperCase() + website.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="flex-1">
                <label className="block text-[11px] uppercase tracking-wider text-ink-3 mb-2">
                  Sort
                </label>
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as "price-low" | "price-high" | "newest")
                  }
                  className="w-full bg-paper border border-ink-4 rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-ink"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {state.wishlist.length === 0 ? (
          <div className="rounded-xl border border-ink-4 border-dashed bg-surface/50 p-12 text-center">
            <p className="text-ink-2">No items in wishlist yet</p>
            <p className="text-sm text-ink-3">
              Click "Add to Wishlist" on e-commerce sites to get started
            </p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            {filteredItems.length > 0 && filteredItems.length < state.wishlist.length && (
              <p className="text-sm text-ink-3">
                Showing {filteredItems.length} of {state.wishlist.length} items
              </p>
            )}

            {/* Items Grid */}
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map((item) => (
                  <WishlistItemCard
                    key={item.id}
                    item={item}
                    onRemove={removeFromWishlist}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-ink-4 border-dashed bg-surface/50 p-8 text-center">
                <p className="text-ink-2">No items match your search</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedWebsite("all");
                  }}
                  className="mt-3 text-sm text-ink-2 hover:text-ink underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
