"use client";

import { AmazonPauseSession, SavingsLedger, UserConfig } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface Props {
  session: AmazonPauseSession;
  config: UserConfig;
  savings: SavingsLedger;
}

export function AmazonPauseSuccess({ session, config }: Props) {
  const goal = config.savingsGoal;
  const goalProtectedPct = goal
    ? Math.min(100, Math.round((session.amountAvoided / Math.max(goal.amount, 1)) * 100))
    : null;

  return (
    <section className="space-y-5 rounded-3xl border border-accent/25 bg-accent-fade/60 px-5 py-5 shadow-sm">
      <div className="space-y-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
          Amazon pause saved
        </p>
        <h2 className="text-[32px] font-semibold leading-[0.95] tracking-[-0.04em] text-ink">
          Nice pause.
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-ink-2">
          You saved these items for later instead of deciding in the heat of the moment.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-ink-4 bg-paper px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
            Cart paused
          </div>
          <div className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">
            {formatCurrency(session.amountAvoided)}
          </div>
        </div>
        <div className="rounded-2xl border border-ink-4 bg-paper px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
            Items saved
          </div>
          <div className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">
            {session.items.length}
          </div>
        </div>
        <div className="rounded-2xl border border-ink-4 bg-paper px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
            Goal progress protected
          </div>
          <div className="mt-2 text-xl font-semibold tracking-[-0.03em] text-ink">
            {goalProtectedPct !== null ? `${goalProtectedPct}%` : "—"}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-3 border-b border-ink-4 pb-2">
          <span className="text-[14px] font-medium text-ink">Pause wishlist</span>
          <span className="font-mono text-[11px] text-ink-3 num-tabular">
            {session.itemCount} item{session.itemCount === 1 ? "" : "s"}
          </span>
        </div>
        <div className="space-y-2">
          {session.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-ink-4 bg-paper px-3 py-3"
            >
              <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="size-full object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink">
                  {item.name}
                </div>
                <div className="mt-1 font-mono text-[11px] text-ink-3">
                  Qty {item.quantity}
                  {item.productUrl ? " · Amazon item" : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-medium text-ink num-tabular">
                  {formatCurrency((item.price ?? 0) * item.quantity)}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
                  saved
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}