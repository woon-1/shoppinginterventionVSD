"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, ShoppingCart, BarChart3, Settings } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { remainingBudget } from "@/lib/budget";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const HIDDEN_PATHS = new Set(["/", "/setup"]);

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, hydrated } = useAppState();
  const hidden = HIDDEN_PATHS.has(pathname);

  if (hidden) return <>{children}</>;

  const remaining =
    state.config && hydrated
      ? remainingBudget(state.config, state.purchases)
      : null;
  const cartCount = state.cart.reduce((sum, l) => sum + l.qty, 0);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/shop" className="font-semibold tracking-tight">
            Pause<span className="text-primary">.</span>
          </Link>
          <div className="flex items-center gap-2">
            {state.config?.demoMode && (
              <Badge
                variant="secondary"
                className="hidden sm:inline-flex border-amber-500/40 bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
              >
                DEMO MODE · 60s cooling-off
              </Badge>
            )}
            {remaining !== null && (
              <Badge variant="outline" className="font-mono">
                {formatCurrency(remaining)} left
              </Badge>
            )}
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-2 pb-2">
          {NAV.map((n) => {
            const active = pathname === n.href;
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="size-4" />
                {n.label}
                {n.href === "/cart" && cartCount > 0 && (
                  <span
                    className={cn(
                      "ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-semibold",
                      active
                        ? "bg-primary-foreground text-primary"
                        : "bg-foreground text-background"
                    )}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
