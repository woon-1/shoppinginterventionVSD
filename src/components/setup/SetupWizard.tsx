"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { extensionAwareReplace } from "@/lib/extension-nav";

const STEPS = ["Budget", "Essentials", "Friction", "Goal"] as const;

interface DraftConfig {
  budgetAmount: number;
  budgetPeriod: Period;
  essentialCategories: ItemCategory[];
  friction: FrictionLevel;
  savingsGoalLabel: string;
  savingsGoalAmount: number | null;
}

const FRICTION_META: Record<
  FrictionLevel,
  { name: string; desc: string }
> = {
  light: {
    name: "Light",
    desc: "Five-second pause before checkout.",
  },
  standard: {
    name: "Standard",
    desc: "Reflection prompt with budget context and three actions.",
  },
  strict: {
    name: "Strict",
    desc: "Same prompt; Save-for-24h is the recommended path.",
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
    extensionAwareReplace(router, "/shop");
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

  const stepNum = String(step + 1).padStart(2, "0");
  const totalSteps = String(STEPS.length).padStart(2, "0");
  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-24">
      <div className="w-full max-w-md space-y-12">
        {/* Brand */}
        <div className="flex items-center gap-1.5 text-[14px] font-semibold tracking-tight text-ink">
          Pause<span className="size-1 rounded-[1px] bg-accent" />
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between font-mono text-[11px] text-ink-3 num-tabular">
            <span>
              {stepNum} — {totalSteps}
            </span>
            <span>{STEPS[step]}</span>
          </div>
          <div className="relative h-px bg-ink-4">
            <div
              className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="min-h-[200px]">
          {step === 0 && <BudgetStep draft={draft} setDraft={setDraft} />}
          {step === 1 && (
            <EssentialsStep draft={draft} toggleCategory={toggleCategory} />
          )}
          {step === 2 && <FrictionStep draft={draft} setDraft={setDraft} />}
          {step === 3 && <GoalStep draft={draft} setDraft={setDraft} />}
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={back}
            disabled={step === 0}
            className="font-mono text-[12px] text-ink-3 hover:text-ink disabled:opacity-30"
          >
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={next}
              disabled={!canAdvance}
              className="bg-ink text-paper hover:bg-ink/90"
            >
              Continue
            </Button>
          ) : (
            <Button
              onClick={complete}
              className="bg-ink text-paper hover:bg-ink/90"
            >
              Start
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <header className="mb-8 space-y-1.5">
      <h1 className="text-[28px] font-medium leading-tight tracking-tight text-ink">
        {title}
      </h1>
      <p className="text-[13px] text-ink-2">{sub}</p>
    </header>
  );
}

function BareInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <Input
      {...props}
      className={cn(
        "h-9 rounded-none border-0 border-b border-ink-4 bg-transparent px-0 text-[16px] font-medium text-ink shadow-none focus:border-accent focus-visible:ring-0",
        props.className
      )}
    />
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
    <div>
      <StepHeading
        title="Discretionary budget"
        sub="The amount available for non-essentials. Essentials are never blocked."
      />
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
            Amount
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[16px] text-ink-3">$</span>
            <BareInput
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
          </div>
        </div>
        <div className="space-y-2">
          <label className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
            Period
          </label>
          <div className="flex gap-1.5">
            {(["weekly", "monthly"] as Period[]).map((p) => {
              const active = draft.budgetPeriod === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, budgetPeriod: p }))}
                  className={cn(
                    "h-8 rounded border px-3 text-[12px] font-medium transition-colors",
                    active
                      ? "border-ink bg-ink text-paper"
                      : "border-ink-4 text-ink-2 hover:border-ink hover:text-ink"
                  )}
                >
                  Per {p === "weekly" ? "week" : "month"}
                </button>
              );
            })}
          </div>
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
    <div>
      <StepHeading
        title="Essential categories"
        sub="Items in these categories skip the reflection prompt."
      />
      <div className="border-t border-ink-4">
        {ALL_CATEGORIES.map((cat) => {
          const checked = draft.essentialCategories.includes(cat);
          return (
            <label
              key={cat}
              className="flex h-12 cursor-pointer items-center justify-between border-b border-ink-4"
            >
              <span className="text-[14px] font-medium text-ink">
                {CATEGORY_LABELS[cat]}
              </span>
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
    <div>
      <StepHeading
        title="Friction level"
        sub="Editable later. More friction means more pause before non-essentials."
      />
      <div className="space-y-1.5">
        {(Object.keys(FRICTION_META) as FrictionLevel[]).map((level) => {
          const active = draft.friction === level;
          const meta = FRICTION_META[level];
          return (
            <button
              key={level}
              type="button"
              onClick={() => setDraft((d) => ({ ...d, friction: level }))}
              className={cn(
                "flex w-full flex-col gap-1 rounded border px-4 py-3 text-left transition-colors",
                active
                  ? "border-accent bg-accent-fade"
                  : "border-ink-4 bg-surface hover:border-ink"
              )}
            >
              <span
                className={cn(
                  "text-[14px] font-medium",
                  active ? "text-accent" : "text-ink"
                )}
              >
                {meta.name}
              </span>
              <span className="text-[12px] text-ink-2">{meta.desc}</span>
            </button>
          );
        })}
      </div>
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
    <div>
      <StepHeading
        title="Savings goal"
        sub="Optional. Naming a goal makes the dashboard more concrete."
      />
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
            Goal
          </label>
          <BareInput
            placeholder="Trip in June"
            value={draft.savingsGoalLabel}
            onChange={(e) =>
              setDraft((d) => ({ ...d, savingsGoalLabel: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <label className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
            Amount
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[16px] text-ink-3">$</span>
            <BareInput
              type="number"
              min={0}
              placeholder="500"
              value={draft.savingsGoalAmount ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  savingsGoalAmount: e.target.value
                    ? Number(e.target.value)
                    : null,
                }))
              }
              className="max-w-[12rem]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
