"use client";

import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SavingsLedger } from "@/lib/types";

export function SkipStreakCard({ savings }: { savings: SavingsLedger }) {
  return (
    <Card>
      <CardContent className="space-y-1 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Flame className="size-4 text-orange-500" />
          Current skip streak
        </div>
        <div className="font-mono text-3xl font-semibold tracking-tight">
          {savings.currentSkipStreak}
        </div>
        <p className="text-xs text-muted-foreground">
          {savings.longestSkipStreak > 0
            ? `Longest streak: ${savings.longestSkipStreak}`
            : "Each item you let expire grows your streak."}
        </p>
      </CardContent>
    </Card>
  );
}
