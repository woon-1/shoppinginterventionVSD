"use client";

import { useMemo, useState } from "react";
import { SavingsLedger } from "@/lib/types";
import { dayKey, formatCurrency } from "@/lib/format";

const DAYS_TO_SHOW = 7;

interface Datum {
  label: string;
  date: string;
  amount: number;
}

export function WeeklyChart({ savings }: { savings: SavingsLedger }) {
  const data = useMemo<Datum[]>(() => {
    const out: Datum[] = [];
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    for (let i = DAYS_TO_SHOW - 1; i >= 0; i--) {
      const ts = now - i * oneDay;
      const k = dayKey(ts);
      const d = new Date(ts);
      const label = d
        .toLocaleDateString("en-US", { weekday: "short" })
        .toUpperCase();
      out.push({ label, date: k, amount: savings.byDay[k] ?? 0 });
    }
    return out;
  }, [savings.byDay]);

  const max = Math.max(...data.map((d) => d.amount), 1);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between border-b border-ink-4 pb-2">
        <span className="text-[14px] font-medium text-ink">Last 7 days</span>
        <span className="font-mono text-[11px] text-ink-3">
          {hoverIdx !== null ? data[hoverIdx].date : ""}
        </span>
      </div>

      <div className="relative pt-6">
        {/* Hover value label */}
        {hoverIdx !== null && data[hoverIdx].amount > 0 && (
          <div
            className="absolute top-0 -translate-x-1/2 font-mono text-[12px] num-tabular text-ink"
            style={{
              left: `${((hoverIdx + 0.5) / data.length) * 100}%`,
            }}
          >
            {formatCurrency(data[hoverIdx].amount)}
          </div>
        )}
        <div className="flex h-[160px] items-end gap-1">
          {data.map((d, i) => {
            const heightPct = (d.amount / max) * 100;
            const active = hoverIdx === i;
            return (
              <button
                key={d.date}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                onFocus={() => setHoverIdx(i)}
                onBlur={() => setHoverIdx(null)}
                className="group relative flex flex-1 flex-col items-center gap-2 outline-none"
                aria-label={`${d.label}: ${formatCurrency(d.amount)}`}
              >
                <div className="flex h-[140px] w-full items-end">
                  <div
                    className={`w-full transition-colors ${
                      active ? "bg-accent" : "bg-ink-4 group-hover:bg-ink-3"
                    }`}
                    style={{ height: `${Math.max(heightPct, 1)}%` }}
                  />
                </div>
                <span
                  className={`font-mono text-[10px] tracking-[0.06em] num-tabular ${
                    active ? "text-ink" : "text-ink-3"
                  }`}
                >
                  {d.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
