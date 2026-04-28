"use client";

import { useEffect, useState } from "react";
import { Clock, ShoppingBag, X, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppState } from "@/context/AppStateContext";
import { getCatalogItem } from "@/lib/catalog";
import { formatCurrency, formatRelativeTime } from "@/lib/format";

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
    .slice(-5)
    .reverse();

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Cooling-off queue</h2>

      {pending.length === 0 && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              Nothing pending. When you save an item for 24 hours, it shows up
              here with a countdown.
            </p>
          </CardContent>
        </Card>
      )}

      {pending.map((entry) => {
        const item = getCatalogItem(entry.itemId);
        if (!item) return null;
        const remaining = entry.expiresAt - now;
        return (
          <Card key={entry.id}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="text-2xl">{item.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {entry.necessityTag}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(entry.totalPrice)} · expires in{" "}
                  <span className="font-mono">
                    {formatRelativeTime(remaining)}
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => buyCoolingOffEntry(entry.id)}
              >
                <ShoppingBag className="size-4" />
                Buy now
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-8 text-muted-foreground"
                onClick={() => cancelCoolingOffEntry(entry.id)}
                aria-label="Cancel"
              >
                <X className="size-4" />
              </Button>
            </CardContent>
          </Card>
        );
      })}

      {recent.length > 0 && (
        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Recent outcomes
          </h3>
          {recent.map((entry) => {
            const item = getCatalogItem(entry.itemId);
            if (!item) return null;
            return (
              <div
                key={entry.id}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm"
              >
                <span className="text-base">{item.emoji}</span>
                <span className="flex-1 truncate">{item.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatCurrency(entry.totalPrice)}
                </span>
                {entry.status === "expired-saved" && (
                  <Badge
                    variant="secondary"
                    className="border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                  >
                    <CheckCircle2 className="size-3" />
                    Saved
                  </Badge>
                )}
                {entry.status === "purchased" && (
                  <Badge variant="secondary">Bought</Badge>
                )}
                {entry.status === "cancelled" && (
                  <Badge variant="outline">Cancelled</Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
