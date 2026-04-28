"use client";

import { formatCurrency } from "@/lib/format";
import { SavingsLedger, UserConfig } from "@/lib/types";

interface Props {
  savings: SavingsLedger;
  config: UserConfig;
}

export function SavingsHero({ savings, config }: Props) {
  const goal = config.savingsGoal;
  const goalPct = goal
    ? Math.min(100, Math.round((savings.totalSaved / goal.amount) * 100))
    : null;

  // Split currency into dollars and cents for editorial layout
  const dollars = Math.floor(savings.totalSaved);
  const cents = Math.round((savings.totalSaved - dollars) * 100);
  const centsStr = String(cents).padStart(2, "0");

  return (
    <section className="relative overflow-hidden rounded-2xl border border-rule bg-gradient-to-br from-paper-deep via-paper to-accent-soft/50 p-8 md:p-10">
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
          <span className="size-1 rounded-full bg-[oklch(0.55_0.10_35)]" />
          Saved by not buying
        </div>

        <div className="flex items-baseline gap-1 font-heading tracking-tight text-ink num-tabular">
          <span className="self-start pt-3 text-2xl font-medium text-ink-muted md:pt-4 md:text-3xl">
            $
          </span>
          <span className="text-[64px] leading-none md:text-[88px]">
            {dollars.toLocaleString()}
          </span>
          <span className="self-start pt-3 text-2xl font-medium text-ink-muted md:pt-5 md:text-3xl">
            .{centsStr}
          </span>
        </div>

        <p className="max-w-md text-sm leading-relaxed text-ink-muted">
          {savings.totalSaved === 0
            ? "When you save items for 24 hours and don't return to buy them, the amount you didn't spend appears here."
            : `From ${savings.longestSkipStreak === 0 ? 0 : savings.longestSkipStreak} skip${savings.longestSkipStreak === 1 ? "" : "s"} so far. Quietly accumulating.`}
        </p>

        {goal && goalPct !== null && (
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-heading italic text-ink">
                {goal.label}
              </span>
              <span className="font-mono num-tabular text-ink-subtle">
                {formatCurrency(savings.totalSaved)}{" "}
                <span className="text-ink-subtle/60">/</span>{" "}
                {formatCurrency(goal.amount)}
              </span>
            </div>
            <div className="relative h-px w-full bg-rule">
              <div
                className="absolute inset-y-0 left-0 h-px bg-[oklch(0.55_0.10_35)]"
                style={{ width: `${goalPct}%` }}
              />
              <div
                className="absolute -top-[3px] size-2 -translate-x-1/2 rounded-full bg-[oklch(0.55_0.10_35)]"
                style={{ left: `${goalPct}%` }}
              />
            </div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
              {goalPct}% of goal
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
