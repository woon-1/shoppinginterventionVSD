"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppState } from "@/context/AppStateContext";
import { remainingBudget } from "@/lib/budget";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/cart", label: "Cart" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings", label: "Settings" },
];

const HIDDEN_PATHS = new Set(["/", "/setup", "/popup", "/popup.html"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normalizedPathname = pathname?.replace(/\.html$/, "") ?? pathname;
  const { state, hydrated } = useAppState();
  const hidden = HIDDEN_PATHS.has(normalizedPathname);

  if (hidden) return <>{children}</>;

  const budgetAmount = state.config?.budgetAmount ?? 0;
  const remaining =
    state.config && hydrated
      ? remainingBudget(state.config, state.purchases)
      : null;
  const cartCount = state.cart.reduce((sum, l) => sum + l.qty, 0);
  const wishlistCount = state.wishlist.length;
  const spent =
    remaining !== null && budgetAmount > 0 ? budgetAmount - remaining : 0;
  const spentPct =
    remaining !== null && budgetAmount > 0
      ? Math.min(100, Math.round((spent / budgetAmount) * 100))
      : 0;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-4 bg-paper">
        <div className="mx-auto flex h-12 max-w-7xl items-center gap-8 px-6">
          {/* Wordmark */}
          <Link
            href="/shop"
            className="flex items-center gap-1.5 text-[15px] font-semibold tracking-tight text-ink"
          >
            Pause
            <span className="size-1 rounded-[1px] bg-accent" />
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-6">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "relative text-[13px] font-medium transition-colors",
                    active ? "text-ink" : "text-ink-3 hover:text-ink"
                  )}
                >
                  {n.label}
                  {n.href === "/cart" && cartCount > 0 && (
                    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-ink px-1 font-mono text-[10px] font-medium text-paper num-tabular">
                      {cartCount}
                    </span>
                  )}
                  {n.href === "/wishlist" && wishlistCount > 0 && (
                    <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-sm bg-accent px-1 font-mono text-[10px] font-medium text-paper num-tabular">
                      {wishlistCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-3">
            {state.config?.demoMode && (
              <span className="hidden items-center rounded border border-ink-4 px-1.5 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-ink-2 sm:inline-flex">
                Demo · 60s
              </span>
            )}
            {remaining !== null && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] num-tabular text-ink-2">
                  <span className="text-ink">
                    {formatCurrency(remaining)}
                  </span>
                  <span className="text-ink-3"> / {formatCurrency(budgetAmount)}</span>
                </span>
                <div className="relative h-1 w-16 bg-ink-4">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0",
                      spentPct >= 100 ? "bg-negative" : "bg-ink"
                    )}
                    style={{ width: `${spentPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pt-12 pb-24">
        {children}
      </main>

      <footer className="border-t border-ink-4 px-6 py-4">
        <div className="mx-auto max-w-7xl font-mono text-[11px] text-ink-3">
          Pause · local-only · v0.1
        </div>
      </footer>
    </div>
  );
}
