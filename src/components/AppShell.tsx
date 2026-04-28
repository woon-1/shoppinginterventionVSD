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
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings", label: "Settings" },
];

const HIDDEN_PATHS = new Set(["/", "/setup"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, hydrated } = useAppState();
  const hidden = HIDDEN_PATHS.has(pathname);

  if (hidden) return <>{children}</>;

  const budgetAmount = state.config?.budgetAmount ?? 0;
  const remaining =
    state.config && hydrated
      ? remainingBudget(state.config, state.purchases)
      : null;
  const cartCount = state.cart.reduce((sum, l) => sum + l.qty, 0);

  let healthDot: "sage" | "sand" | "alert" = "sage";
  if (remaining !== null && budgetAmount > 0) {
    const pctLeft = remaining / budgetAmount;
    if (pctLeft <= 0) healthDot = "alert";
    else if (pctLeft <= 0.25) healthDot = "sand";
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <Link
            href="/shop"
            className="font-heading text-[22px] italic font-medium leading-none tracking-tight text-ink"
          >
            Pause
            <span className="text-[1.2em] text-[oklch(0.55_0.10_35)]">.</span>
          </Link>
          <div className="flex items-center gap-2">
            {state.config?.demoMode && (
              <span className="hidden items-center gap-1.5 rounded-full border border-sand bg-sand/40 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-ink sm:inline-flex">
                <span className="size-1 rounded-full bg-ink/60" />
                Demo · 60s holds
              </span>
            )}
            {remaining !== null && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-card px-3 py-1 text-xs text-ink">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    healthDot === "sage" && "bg-sage",
                    healthDot === "sand" && "bg-sand",
                    healthDot === "alert" && "bg-alert"
                  )}
                />
                <span className="font-mono num-tabular">
                  {formatCurrency(remaining)}
                </span>
                <span className="text-ink-subtle">left</span>
              </span>
            )}
          </div>
        </div>
        <div className="border-t border-[oklch(0.55_0.10_35)]/15">
          <nav className="mx-auto flex max-w-6xl gap-6 px-6">
            {NAV.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 py-3 text-[13px] font-medium tracking-[0.04em] transition-colors",
                    active
                      ? "text-ink"
                      : "text-ink-muted hover:text-ink"
                  )}
                >
                  <span>{n.label}</span>
                  {n.href === "/cart" && cartCount > 0 && (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-paper">
                      {cartCount}
                    </span>
                  )}
                  {active && (
                    <span className="absolute inset-x-0 bottom-0 h-px bg-[oklch(0.55_0.10_35)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 md:py-14">
        {children}
      </main>
      <footer className="border-t border-rule px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-xs text-ink-subtle">
          <span className="font-heading italic">
            Pause<span className="text-[oklch(0.55_0.10_35)]">.</span>
          </span>
          <span>A small reflection at checkout.</span>
        </div>
      </footer>
    </div>
  );
}
