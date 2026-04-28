"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  FrictionLevel,
  ItemCategory,
  Period,
  UserConfig,
} from "@/lib/types";
import { useAppState } from "@/context/AppStateContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

const STEPS = ["Budget", "Essentials", "Friction", "Goal"] as const;

interface DraftConfig {
  budgetAmount: number;
  budgetPeriod: Period;
  essentialCategories: ItemCategory[];
  friction: FrictionLevel;
  savingsGoalLabel: string;
  savingsGoalAmount: number | null;
}

const FRICTION_DESCRIPTIONS: Record<FrictionLevel, { name: string; desc: string }> = {
  light: {
    name: "Light",
    desc: "A 5-second pause before checkout. The lightest reflection.",
  },
  standard: {
    name: "Standard",
    desc: "A reflection prompt with budget context, necessity tag, and three actions.",
  },
  strict: {
    name: "Strict",
    desc: "Same prompt as Standard, but Save-for-24h is the default action.",
  },
};

export function SetupWizard() {
  const router = useRouter();
  const { setConfig } = useAppState();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<DraftConfig>({
    budgetAmount: 50,
    budgetPeriod: "weekly",
    essentialCategories: ["groceries", "hygiene"],
    friction: "standard",
    savingsGoalLabel: "",
    savingsGoalAmount: null,
  });

  function next() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function complete() {
    const config: UserConfig = {
      budgetAmount: draft.budgetAmount,
      budgetPeriod: draft.budgetPeriod,
      essentialCategories: draft.essentialCategories,
      essentialItemOverrides: {},
      friction: draft.friction,
      savingsGoal:
        draft.savingsGoalLabel && draft.savingsGoalAmount
          ? {
              label: draft.savingsGoalLabel,
              amount: draft.savingsGoalAmount,
            }
          : undefined,
      demoMode: true,
      createdAt: Date.now(),
      onboardingComplete: true,
    };
    setConfig(config);
    router.replace("/shop");
  }

  function toggleCategory(cat: ItemCategory) {
    setDraft((d) => {
      const has = d.essentialCategories.includes(cat);
      return {
        ...d,
        essentialCategories: has
          ? d.essentialCategories.filter((c) => c !== cat)
          : [...d.essentialCategories, cat],
      };
    });
  }

  const canAdvance =
    step !== 0 || (draft.budgetAmount > 0 && Number.isFinite(draft.budgetAmount));

  return (
    <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-xl flex-col gap-6 px-4 py-8">
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      <Card className="flex-1">
        <CardContent className="space-y-6 py-6">
          {step === 0 && (
            <BudgetStep
              draft={draft}
              setDraft={setDraft}
            />
          )}
          {step === 1 && (
            <EssentialsStep
              draft={draft}
              toggleCategory={toggleCategory}
            />
          )}
          {step === 2 && (
            <FrictionStep
              draft={draft}
              setDraft={setDraft}
            />
          )}
          {step === 3 && (
            <GoalStep
              draft={draft}
              setDraft={setDraft}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={back}
          disabled={step === 0}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} disabled={!canAdvance}>
            Next
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={complete}>
            <Check className="size-4" />
            Start shopping
          </Button>
        )}
      </div>
    </div>
  );
}

function BudgetStep({
  draft,
  setDraft,
}: {
  draft: DraftConfig;
  setDraft: React.Dispatch<React.SetStateAction<DraftConfig>>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">What's your discretionary budget?</h2>
        <p className="text-sm text-muted-foreground">
          This is for non-essentials. The system never blocks essentials.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="budget">Amount</Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">$</span>
          <Input
            id="budget"
            type="number"
            min={1}
            step={1}
            value={draft.budgetAmount}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                budgetAmount: Number(e.target.value) || 0,
              }))
            }
            className="max-w-[10rem]"
          />
          <RadioGroup
            value={draft.budgetPeriod}
            onValueChange={(v) =>
              setDraft((d) => ({ ...d, budgetPeriod: v as Period }))
            }
            className="ml-2 flex flex-row gap-3"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="weekly" id="weekly" />
              <Label htmlFor="weekly" className="font-normal">
                per week
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="monthly" id="monthly" />
              <Label htmlFor="monthly" className="font-normal">
                per month
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}

function EssentialsStep({
  draft,
  toggleCategory,
}: {
  draft: DraftConfig;
  toggleCategory: (c: ItemCategory) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Which categories are essentials?</h2>
        <p className="text-sm text-muted-foreground">
          Essentials skip the reflection step. You can override individual items
          later from the shop.
        </p>
      </div>
      <div className="space-y-2">
        {ALL_CATEGORIES.map((cat) => {
          const checked = draft.essentialCategories.includes(cat);
          return (
            <label
              key={cat}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-md border border-border px-4 py-3 transition-colors",
                checked
                  ? "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-900/20"
                  : "hover:bg-muted/50"
              )}
            >
              <span className="font-medium">{CATEGORY_LABELS[cat]}</span>
              <Switch
                checked={checked}
                onCheckedChange={() => toggleCategory(cat)}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function FrictionStep({
  draft,
  setDraft,
}: {
  draft: DraftConfig;
  setDraft: React.Dispatch<React.SetStateAction<DraftConfig>>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">How much friction do you want?</h2>
        <p className="text-sm text-muted-foreground">
          You can change this anytime. Stricter friction means more reflection
          before non-essential purchases.
        </p>
      </div>
      <RadioGroup
        value={draft.friction}
        onValueChange={(v) =>
          setDraft((d) => ({ ...d, friction: v as FrictionLevel }))
        }
        className="space-y-2"
      >
        {(Object.keys(FRICTION_DESCRIPTIONS) as FrictionLevel[]).map((level) => {
          const checked = draft.friction === level;
          const meta = FRICTION_DESCRIPTIONS[level];
          return (
            <label
              key={level}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border border-border px-4 py-3 transition-colors",
                checked ? "border-primary bg-primary/5" : "hover:bg-muted/50"
              )}
            >
              <RadioGroupItem value={level} id={level} className="mt-0.5" />
              <div>
                <Label htmlFor={level} className="font-medium">
                  {meta.name}
                </Label>
                <p className="text-sm text-muted-foreground">{meta.desc}</p>
              </div>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}

function GoalStep({
  draft,
  setDraft,
}: {
  draft: DraftConfig;
  setDraft: React.Dispatch<React.SetStateAction<DraftConfig>>;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Optional savings goal</h2>
        <p className="text-sm text-muted-foreground">
          Naming a goal makes the savings dashboard feel more concrete. Leave
          blank to skip.
        </p>
      </div>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="goal-label">What are you saving for?</Label>
          <Input
            id="goal-label"
            placeholder="e.g. Trip in June"
            value={draft.savingsGoalLabel}
            onChange={(e) =>
              setDraft((d) => ({ ...d, savingsGoalLabel: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="goal-amount">Goal amount (optional)</Label>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">$</span>
            <Input
              id="goal-amount"
              type="number"
              min={0}
              placeholder="e.g. 500"
              value={draft.savingsGoalAmount ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  savingsGoalAmount: e.target.value
                    ? Number(e.target.value)
                    : null,
                }))
              }
              className="max-w-[10rem]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
