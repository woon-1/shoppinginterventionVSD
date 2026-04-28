import { Period, PurchaseRecord, UserConfig } from "./types";

export function periodStart(period: Period, now: number = Date.now()): number {
  const d = new Date(now);
  if (period === "weekly") {
    const day = d.getDay();
    const diff = (day + 6) % 7;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function spentThisPeriod(
  purchases: PurchaseRecord[],
  period: Period,
  now: number = Date.now()
): number {
  const start = periodStart(period, now);
  return purchases
    .filter((p) => p.purchasedAt >= start)
    .reduce((sum, p) => sum + p.total, 0);
}

export function remainingBudget(
  config: UserConfig,
  purchases: PurchaseRecord[],
  now: number = Date.now()
): number {
  const spent = spentThisPeriod(purchases, config.budgetPeriod, now);
  return Math.max(0, config.budgetAmount - spent);
}

export function periodLabel(period: Period): string {
  return period === "weekly" ? "this week" : "this month";
}
