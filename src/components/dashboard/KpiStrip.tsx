"use client";

import { AppState } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface Props {
  state: AppState;
}

export function KpiStrip({ state }: Props) {
  const pending = state.coolingOff.filter((e) => e.status === "pending");
  const pendingValue = pending.reduce((s, e) => s + e.totalPrice, 0);

  // 7-day average from byDay
  const days = Object.keys(state.savings.byDay).slice(-7);
  const avg =
    days.length === 0
      ? 0
      : days.reduce((s, k) => s + (state.savings.byDay[k] ?? 0), 0) /
        Math.max(days.length, 1);

  // Goal-at-this-rate projection
  let projection = "—";
  const goal = state.config?.savingsGoal;
  if (goal && avg > 0) {
    const remaining = Math.max(0, goal.amount - state.savings.totalSaved);
    const daysOut = Math.ceil(remaining / Math.max(avg, 0.01));
    if (Number.isFinite(daysOut) && daysOut < 365) {
      const eta = new Date(Date.now() + daysOut * 24 * 60 * 60 * 1000);
      projection = eta.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  }

  const tiles = [
    {
      label: "Skip streak",
      value: String(state.savings.currentSkipStreak),
      delta:
        state.savings.longestSkipStreak > 0
          ? `Longest ${state.savings.longestSkipStreak}`
          : "—",
    },
    {
      label: "Pending",
      value:
        pending.length === 0
          ? "0 items"
          : `${pending.length} ${pending.length === 1 ? "item" : "items"}`,
      delta: pending.length > 0 ? formatCurrency(pendingValue) : "—",
    },
    {
      label: "7-day avg",
      value: formatCurrency(avg),
      delta: days.length > 0 ? `${days.length}d window` : "no data yet",
    },
    {
      label: "Goal at this rate",
      value: projection,
      delta: goal ? goal.label : "set a goal",
    },
  ];

  return (
    <div className="grid grid-cols-2 border-t border-ink-4 md:grid-cols-4">
      {tiles.map((t, i) => (
        <div
          key={t.label}
          className={`flex flex-col gap-2 px-4 py-5 ${
            i < tiles.length - 1 ? "md:border-r md:border-ink-4" : ""
          } ${i % 2 === 0 ? "border-r border-ink-4 md:border-r" : ""} ${
            i < 2 ? "border-b border-ink-4 md:border-b-0" : ""
          }`}
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
            {t.label}
          </span>
          <span className="text-[26px] font-medium leading-none tracking-[-0.02em] text-ink num-tabular">
            {t.value}
          </span>
          <span className="font-mono text-[11px] num-tabular text-ink-3">
            {t.delta}
          </span>
        </div>
      ))}
    </div>
  );
}
