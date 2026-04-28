"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Wind, Waves, Mountain } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
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

const FRICTION_META: Record<
  FrictionLevel,
  { name: string; desc: string; icon: typeof Wind }
> = {
  light: {
    name: "Light",
    desc: "A five-second pause before checkout. The shortest reflection.",
    icon: Wind,
  },
  standard: {
    name: "Standard",
    desc: "A reflection prompt with budget context, necessity tag, and three actions.",
    icon: Waves,
  },
  strict: {
    name: "Strict",
    desc: "Same prompt as Standard, but Save-for-24h is the recommended path.",
    icon: Mountain,
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

  const stepNum = String(step + 1).padStart(2, "0");
  const totalSteps = String(STEPS.length).padStart(2, "0");
  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-6 py-16">
      <div className="w-full max-w-xl">
        {/* Brand line */}
        <div className="mb-12 text-center">
          <span className="font-heading text-2xl italic tracking-tight text-ink">
            Pause<span className="text-[oklch(0.55_0.10_35)]">.</span>
          </span>
        </div>

        {/* Step indicator */}
        <div className="mb-10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-subtle num-tabular">
              {stepNum} / {totalSteps} — {STEPS[step]}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-subtle">
              Setting intentions
            </span>
          </div>
          <div className="relative h-px w-full bg-rule">
            <div
              className="absolute inset-y-0 left-0 bg-[oklch(0.55_0.10_35)] transition-[width] duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="min-h-[280px]">
          {step === 0 && <BudgetStep draft={draft} setDraft={setDraft} />}
          {step === 1 && (
            <EssentialsStep draft={draft} toggleCategory={toggleCategory} />
          )}
          {step === 2 && <FrictionStep draft={draft} setDraft={setDraft} />}
          {step === 3 && <GoalStep draft={draft} setDraft={setDraft} />}
        </div>

        {/* Nav */}
        <div className="mt-12 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === 0}
            className="text-ink-muted disabled:opacity-30 hover:bg-paper-deep"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button
              onClick={next}
              disabled={!canAdvance}
              className="bg-ink text-paper hover:bg-ink/90"
            >
              Next
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              onClick={complete}
              className="bg-ink text-paper hover:bg-ink/90"
            >
              Begin
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHeading({ title, sub }: { title: string; sub: string }) {
  return (
    <header className="mb-8 space-y-2">
      <h1 className="font-heading text-3xl italic leading-tight tracking-tight text-ink md:text-4xl">
        {title}
      </h1>
      <p className="text-sm text-ink-muted">{sub}</p>
    </header>
  );
}

function PaperInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <Input
      {...props}
      className={cn(
        "h-11 rounded-none border-0 border-b-2 border-rule bg-transparent px-1 font-heading text-lg tracking-tight text-ink shadow-none focus:border-[oklch(0.55_0.10_35)] focus-visible:ring-0",
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
        title="What's your discretionary budget?"
        sub="The amount available for non-essentials. Essentials are never blocked."
      />
      <div className="space-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="budget"
            className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-subtle"
          >
            Amount
          </Label>
          <div className="flex items-center gap-3">
            <span className="font-heading text-2xl italic text-ink-muted">$</span>
            <PaperInput
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
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
            Period
          </span>
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-rule">
            {(["weekly", "monthly"] as Period[]).map((p) => {
              const active = draft.budgetPeriod === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, budgetPeriod: p }))}
                  className={cn(
                    "border-r border-rule px-4 py-3 text-left transition-colors last:border-r-0",
                    active
                      ? "bg-ink text-paper"
                      : "bg-card text-ink hover:bg-paper-deep"
                  )}
                >
                  <div className="font-heading text-base tracking-tight">
                    Per {p === "weekly" ? "week" : "month"}
                  </div>
                  <div
                    className={cn(
                      "text-[11px]",
                      active ? "text-paper/70" : "text-ink-subtle"
                    )}
                  >
                    {p === "weekly"
                      ? "Resets each Monday"
                      : "Resets on the 1st"}
                  </div>
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
        title="Which categories are essentials?"
        sub="Essentials skip the reflection prompt entirely. You can override individual items later."
      />
      <div className="space-y-2">
        {ALL_CATEGORIES.map((cat) => {
          const checked = draft.essentialCategories.includes(cat);
          return (
            <label
              key={cat}
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3.5 transition-colors",
                checked
                  ? "border-sage/40 bg-sage-soft"
                  : "border-rule bg-card hover:bg-paper-deep"
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    checked ? "bg-sage" : "bg-ink-subtle/30"
                  )}
                />
                <span className="font-heading text-base tracking-tight text-ink">
                  {CATEGORY_LABELS[cat]}
                </span>
              </div>
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
        title="How much friction do you want?"
        sub="You can change this anytime. Stricter friction means more pause before non-essentials."
      />
      <div className="space-y-2">
        {(Object.keys(FRICTION_META) as FrictionLevel[]).map((level) => {
          const active = draft.friction === level;
          const meta = FRICTION_META[level];
          const Icon = meta.icon;
          return (
            <button
              key={level}
              type="button"
              onClick={() =>
                setDraft((d) => ({ ...d, friction: level }))
              }
              className={cn(
                "flex w-full items-start gap-4 rounded-lg border px-4 py-4 text-left transition-colors",
                active
                  ? "border-[oklch(0.55_0.10_35)] bg-[oklch(0.55_0.10_35)]/5"
                  : "border-rule bg-card hover:bg-paper-deep"
              )}
            >
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-md",
                  active
                    ? "bg-[oklch(0.55_0.10_35)] text-paper"
                    : "bg-paper-deep text-ink-muted"
                )}
              >
                <Icon className="size-5" />
              </div>
              <div className="space-y-1">
                <div className="font-heading text-lg tracking-tight text-ink">
                  {meta.name}
                </div>
                <p className="text-sm text-ink-muted">{meta.desc}</p>
              </div>
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
        title="What are you saving for?"
        sub="Optional. Naming a goal makes the dashboard feel more concrete. Leave blank to skip."
      />
      <div className="space-y-6">
        <div className="space-y-2">
          <Label
            htmlFor="goal-label"
            className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-subtle"
          >
            Goal
          </Label>
          <PaperInput
            id="goal-label"
            placeholder="e.g. Trip in June"
            value={draft.savingsGoalLabel}
            onChange={(e) =>
              setDraft((d) => ({ ...d, savingsGoalLabel: e.target.value }))
            }
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="goal-amount"
            className="text-[10px] font-medium uppercase tracking-[0.22em] text-ink-subtle"
          >
            Amount
          </Label>
          <div className="flex items-center gap-3">
            <span className="font-heading text-2xl italic text-ink-muted">$</span>
            <PaperInput
              id="goal-amount"
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
