"use client";

import { SavingsLedger } from "@/lib/types";

export function SkipStreakCard({ savings }: { savings: SavingsLedger }) {
  return (
    <section className="rounded-2xl border border-rule bg-card p-6">
      <div className="space-y-4">
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
          Current streak
        </div>
        <div className="font-heading text-6xl tracking-tight text-ink num-tabular">
          {savings.currentSkipStreak}
        </div>
        <p className="text-sm text-ink-muted">
          {savings.currentSkipStreak === 0
            ? "Skips in a row. None yet."
            : `Skip${savings.currentSkipStreak === 1 ? "" : "s"} in a row.`}
        </p>
        {savings.longestSkipStreak > 0 && (
          <p className="border-t border-rule pt-3 text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
            Longest · {savings.longestSkipStreak}
          </p>
        )}
      </div>
    </section>
  );
}
