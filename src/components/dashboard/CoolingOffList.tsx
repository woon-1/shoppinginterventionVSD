"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppStateContext";
import { getCatalogItem, unsplashUrl } from "@/lib/catalog";
import { CoolingOffStatus } from "@/lib/types";
import { formatCurrency, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<Exclude<CoolingOffStatus, "pending">, string> = {
  "expired-saved": "Saved",
  purchased: "Bought",
  cancelled: "Cancelled",
};

const STATUS_DOT: Record<Exclude<CoolingOffStatus, "pending">, string> = {
  "expired-saved": "bg-sage",
  purchased: "bg-ink",
  cancelled: "bg-ink-subtle",
};

export function CoolingOffList() {
  const { state, buyCoolingOffEntry, cancelCoolingOffEntry } = useAppState();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const pending = state.coolingOff.filter((e) => e.status === "pending");
  const recent = state.coolingOff
    .filter((e) => e.status !== "pending")
    .slice(-6)
    .reverse();

  return (
    <section className="space-y-5">
      <div className="space-y-1">
        <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
          The queue
        </div>
        <h2 className="font-heading text-2xl tracking-tight text-ink">
          Cooling off.
        </h2>
      </div>

      {pending.length === 0 && recent.length === 0 ? (
        <div className="rounded-2xl border border-rule bg-card p-8 text-center">
          <p className="text-sm italic text-ink-muted">
            Nothing pending. Save an item for 24 hours and a countdown will
            appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="divide-y divide-rule rounded-2xl border border-rule bg-card">
              {pending.map((entry) => {
                const item = getCatalogItem(entry.itemId);
                if (!item) return null;
                const remaining = entry.expiresAt - now;
                return (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-paper-deep">
                      <Image
                        src={unsplashUrl(item.imageId, 128)}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-heading text-[15px] leading-tight tracking-tight text-ink">
                          {item.name}
                        </h3>
                        <span className="inline-flex shrink-0 items-center rounded-full border border-rule bg-paper-deep px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                          {entry.necessityTag}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-ink-subtle">
                        <span className="font-mono num-tabular text-ink-muted">
                          {formatCurrency(entry.totalPrice)}
                        </span>
                        <span className="text-ink-subtle/40">·</span>
                        <span>
                          expires in{" "}
                          <span className="font-mono num-tabular text-[oklch(0.55_0.10_35)]">
                            {formatRelativeTime(remaining)}
                          </span>
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-ink/15 text-ink hover:bg-ink hover:text-paper"
                      onClick={() => buyCoolingOffEntry(entry.id)}
                    >
                      <ShoppingBag className="size-3.5" />
                      Buy now
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-ink-subtle"
                      onClick={() => cancelCoolingOffEntry(entry.id)}
                      aria-label="Cancel"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {recent.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
                Recent outcomes
              </div>
              <div className="rounded-2xl border border-rule bg-card">
                {recent.map((entry) => {
                  const item = getCatalogItem(entry.itemId);
                  if (!item || entry.status === "pending") return null;
                  const status = entry.status as Exclude<
                    CoolingOffStatus,
                    "pending"
                  >;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 border-b border-rule px-5 py-3 last:border-b-0"
                    >
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          STATUS_DOT[status]
                        )}
                      />
                      <span className="flex-1 truncate text-sm text-ink">
                        {item.name}
                      </span>
                      <span className="font-mono text-[11px] num-tabular text-ink-subtle">
                        {formatCurrency(entry.totalPrice)}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                        {STATUS_LABEL[status]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
