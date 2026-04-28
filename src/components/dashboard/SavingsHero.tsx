"use client";

import { Sparkles, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import { SavingsLedger, UserConfig } from "@/lib/types";

interface Props {
  savings: SavingsLedger;
  config: UserConfig;
}

export function SavingsHero({ savings, config }: Props) {
  const goal = config.savingsGoal;
  const goalPct = goal
    ? Math.min(100, Math.round((savings.totalSaved / goal.amount) * 100))
    : null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary" />
          Total saved by not buying
        </div>
        <div className="font-mono text-4xl font-semibold tracking-tight">
          {formatCurrency(savings.totalSaved)}
        </div>
        {goal && goalPct !== null && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Target className="size-3.5" />
                {goal.label}
              </span>
              <span className="font-mono">
                {formatCurrency(savings.totalSaved)} /{" "}
                {formatCurrency(goal.amount)}
              </span>
            </div>
            <Progress value={goalPct} />
            <p className="text-xs text-muted-foreground">
              {goalPct}% of goal reached.
            </p>
          </div>
        )}
        {!goal && savings.totalSaved === 0 && (
          <p className="text-sm text-muted-foreground">
            When you save items for 24 hours and don&apos;t buy them, the amount
            you didn&apos;t spend shows up here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
