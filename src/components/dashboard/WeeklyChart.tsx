"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { SavingsLedger } from "@/lib/types";
import { dayKey, formatCurrency } from "@/lib/format";

const DAYS_TO_SHOW = 7;

export function WeeklyChart({ savings }: { savings: SavingsLedger }) {
  const data = useMemo(() => {
    const out: { label: string; date: string; amount: number }[] = [];
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
    <Card>
      <CardContent className="space-y-3 py-6">
        <div className="text-sm text-muted-foreground">
          Saved over the last 7 days
        </div>
        {hasData ? (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  formatter={(v) => [formatCurrency(Number(v) || 0), "Saved"]}
                />
                <Bar
                  dataKey="amount"
                  radius={[4, 4, 0, 0]}
                  fill="var(--primary)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">
            Save an item for later — when it expires without being bought, it
            shows up here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
