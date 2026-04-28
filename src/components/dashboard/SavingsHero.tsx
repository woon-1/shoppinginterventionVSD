"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { SavingsLedger, UserConfig } from "@/lib/types";

interface Props {
  savings: SavingsLedger;
  config: UserConfig;
}

function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    // Animate up from current value to new target
    const start = value;
    const delta = target - start;
    if (delta === 0) return;
    let raf: number;
    const t0 = performance.now();
    const animate = (now: number) => {
      const elapsed = now - t0;
      const t = Math.min(1, elapsed / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(start + delta * eased);
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    startedRef.current = true;
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}

export function SavingsHero({ savings, config }: Props) {
  const goal = config.savingsGoal;
  const animated = useCountUp(savings.totalSaved);
  const goalPct = goal
    ? Math.min(100, Math.round((savings.totalSaved / goal.amount) * 100))
    : null;

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">
          Saved this week
        </span>
        <div className="flex items-end gap-6">
          <div className="text-[112px] font-extralight leading-[0.9] tracking-[-0.04em] text-ink num-tabular md:text-[144px]">
            {formatCurrency(animated)}
          </div>
        </div>
      </div>

      {goal && goalPct !== null && (
        <div className="space-y-1.5 max-w-md">
          <div className="flex items-baseline justify-between font-mono text-[12px] num-tabular text-ink-3">
            <span>
              <span className="text-ink-2">{goal.label}</span>{" "}
              <span className="text-ink-3">→</span>{" "}
              <span className="text-ink-2">{formatCurrency(goal.amount)}</span>
            </span>
            <span className="text-ink-2">{goalPct}%</span>
          </div>
          <div className="relative h-px w-full bg-ink-4">
            <div
              className="absolute inset-y-0 left-0 bg-accent"
              style={{ width: `${goalPct}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
