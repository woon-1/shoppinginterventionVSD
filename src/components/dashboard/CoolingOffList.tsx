"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { getCatalogItem, unsplashUrl } from "@/lib/catalog";
import { CoolingOffStatus } from "@/lib/types";
import { formatCurrency, formatRelativeTime } from "@/lib/format";

const STATUS_LABEL: Record<Exclude<CoolingOffStatus, "pending">, string> = {
  "expired-saved": "SAVED",
  purchased: "BOUGHT",
  cancelled: "CANCELLED",
};

const STATUS_COLOR: Record<Exclude<CoolingOffStatus, "pending">, string> = {
  "expired-saved": "text-accent",
  purchased: "text-ink-3",
  cancelled: "text-ink-3",
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

  if (pending.length === 0 && recent.length === 0) {
    return (
      <section>
        <div className="border-b border-ink-4 pb-2">
          <span className="text-[14px] font-medium text-ink">Queue</span>
        </div>
        <div className="py-12 text-center">
          <p className="font-mono text-[12px] text-ink-3">
            No items in cooling-off.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-12">
      {pending.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between border-b border-ink-4 pb-2">
            <span className="text-[14px] font-medium text-ink">
              Cooling off
            </span>
            <span className="font-mono text-[11px] text-ink-3 num-tabular">
              {String(pending.length).padStart(2, "0")}
            </span>
          </div>
          {pending.map((entry, idx) => {
            const item = getCatalogItem(entry.itemId);
            if (!item) return null;
            const remaining = entry.expiresAt - now;
            return (
              <div
                key={entry.id}
                className="group flex h-12 items-center gap-3 border-b border-ink-4 px-2 transition-colors hover:bg-surface-2"
              >
                <span className="hidden w-6 font-mono text-[11px] text-ink-3 num-tabular sm:inline-block">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className="relative size-7 shrink-0 overflow-hidden rounded-sm bg-surface-2">
                  <Image
                    src={unsplashUrl(item.imageId, 64)}
                    alt=""
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                </div>
                <span className="flex-1 truncate text-[13px] text-ink">
                  {item.name}
                </span>
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.06em] text-ink-3 md:inline-block">
                  {entry.necessityTag}
                </span>
                <span className="hidden w-20 text-right font-mono text-[12px] num-tabular text-ink-2 md:inline-block">
                  {formatCurrency(entry.totalPrice)}
                </span>
                <span className="w-16 text-right font-mono text-[12px] num-tabular text-accent">
                  {formatRelativeTime(remaining)}
                </span>
                <button
                  onClick={() => buyCoolingOffEntry(entry.id)}
                  className="ml-2 hidden h-7 items-center rounded border border-ink-4 px-2 font-mono text-[11px] text-ink-2 hover:border-ink hover:bg-ink hover:text-paper sm:inline-flex"
                >
                  Buy now
                </button>
                <button
                  onClick={() => cancelCoolingOffEntry(entry.id)}
                  className="flex size-7 items-center justify-center rounded-sm text-ink-3 opacity-0 hover:bg-ink-4/30 hover:text-ink group-hover:opacity-100"
                  aria-label="Cancel"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <div className="border-b border-ink-4 pb-2">
            <span className="text-[14px] font-medium text-ink">Recent</span>
          </div>
          {recent.map((entry) => {
            const item = getCatalogItem(entry.itemId);
            if (!item || entry.status === "pending") return null;
            const status = entry.status as Exclude<CoolingOffStatus, "pending">;
            return (
              <div
                key={entry.id}
                className="flex h-10 items-center gap-3 border-b border-ink-4 px-2 text-[13px]"
              >
                <span className="flex-1 truncate text-ink-2">{item.name}</span>
                <span className="font-mono text-[11px] num-tabular text-ink-3">
                  {formatCurrency(entry.totalPrice)}
                </span>
                <span
                  className={`w-20 text-right font-mono text-[10px] uppercase tracking-[0.08em] ${STATUS_COLOR[status]}`}
                >
                  {STATUS_LABEL[status]}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
