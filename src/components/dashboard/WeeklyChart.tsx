"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SavingsLedger } from "@/lib/types";
import { dayKey, formatCurrency } from "@/lib/format";

const DAYS_TO_SHOW = 7;

interface Datum {
  label: string;
  date: string;
  amount: number;
}

interface TooltipPayloadEntry {
  value?: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const value = Number(payload[0]?.value ?? 0);
  return (
    <div className="rounded-md border border-rule bg-card px-3 py-2 shadow-[0_8px_24px_-12px_rgba(20,20,30,0.12)]">
      <div className="font-heading text-xs italic text-ink-muted">{label}</div>
      <div className="font-mono text-sm num-tabular text-ink">
        {formatCurrency(value)}
      </div>
    </div>
  );
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
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      out.push({ label, date: k, amount: savings.byDay[k] ?? 0 });
    }
    return out;
  }, [savings.byDay]);

  const hasData = data.some((d) => d.amount > 0);

  return (
    <section className="rounded-2xl border border-rule bg-card p-6">
      <div className="space-y-1">
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
          The last seven days
        </div>
        <h3 className="font-heading text-xl tracking-tight text-ink">
          What you didn&apos;t spend.
        </h3>
      </div>

      <div className="mt-6">
        {hasData ? (
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
                barCategoryGap="22%"
              >
                <XAxis
                  dataKey="label"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: "var(--rule)" }}
                  tick={{ fill: "var(--ink-subtle)", fontFamily: "var(--font-mono)" }}
                />
                <YAxis
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fill: "var(--ink-subtle)", fontFamily: "var(--font-mono)" }}
                  width={36}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "var(--paper-deep)" }}
                />
                <Bar
                  dataKey="amount"
                  radius={[6, 6, 0, 0]}
                  fill="var(--accent)"
                  fillOpacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-6 text-sm italic text-ink-muted">
            Save an item for later — when it expires without being bought, it
            shows up here.
          </p>
        )}
      </div>
    </section>
  );
}
