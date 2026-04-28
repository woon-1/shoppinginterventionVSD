"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  FastForward,
  Lock,
  Database,
  Copy,
  Check,
  Wind,
  Waves,
  Mountain,
} from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  FrictionLevel,
  ItemCategory,
  Period,
  STORAGE_KEY,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const { state, hydrated, updateConfig, fastForwardCoolingOff, wipe } =
    useAppState();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (hydrated && !state.config?.onboardingComplete) {
      router.replace("/setup");
    }
  }, [hydrated, state.config, router]);

  const storageJson = useMemo(() => JSON.stringify(state, null, 2), [state]);

  if (!hydrated || !state.config?.onboardingComplete) {
    return <p className="py-10 text-sm text-ink-subtle">Loading…</p>;
  }
  const config = state.config;

  function toggleCategory(cat: ItemCategory) {
    const has = config.essentialCategories.includes(cat);
    updateConfig({
      essentialCategories: has
        ? config.essentialCategories.filter((c) => c !== cat)
        : [...config.essentialCategories, cat],
    });
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(storageJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  }

  const FRICTION_ICON: Record<FrictionLevel, typeof Wind> = {
    light: Wind,
    standard: Waves,
    strict: Mountain,
  };

  return (
    <div className="space-y-12">
      <header className="max-w-2xl space-y-2">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
          The settings
        </div>
        <h1 className="font-heading text-4xl leading-tight tracking-tight text-ink md:text-5xl">
          Adjust your intentions.
        </h1>
        <p className="font-heading text-lg italic text-ink-muted">
          Edit anytime. Nothing leaves this browser.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
        {/* Left column — config editor */}
        <div className="space-y-10">
          {/* Budget */}
          <section className="space-y-3">
            <h2 className="border-b border-rule pb-2 font-heading text-xl italic tracking-tight text-ink">
              Budget
            </h2>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="font-heading text-xl italic text-ink-muted">$</span>
              <Input
                type="number"
                value={config.budgetAmount}
                min={1}
                onChange={(e) =>
                  updateConfig({
                    budgetAmount: Number(e.target.value) || 0,
                  })
                }
                className="max-w-[10rem] h-10 rounded-none border-0 border-b-2 border-rule bg-transparent px-1 font-heading text-lg shadow-none focus:border-[oklch(0.55_0.10_35)] focus-visible:ring-0"
              />
              <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-rule">
                {(["weekly", "monthly"] as Period[]).map((p) => {
                  const active = config.budgetPeriod === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateConfig({ budgetPeriod: p })}
                      className={cn(
                        "border-r border-rule px-4 py-2 text-sm transition-colors last:border-r-0",
                        active
                          ? "bg-ink text-paper"
                          : "bg-card text-ink hover:bg-paper-deep"
                      )}
                    >
                      Per {p === "weekly" ? "week" : "month"}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Essentials */}
          <section className="space-y-3">
            <h2 className="border-b border-rule pb-2 font-heading text-xl italic tracking-tight text-ink">
              Essential categories
            </h2>
            <p className="text-sm text-ink-muted">
              Items in these categories bypass the reflection prompt.
            </p>
            <div className="space-y-2 pt-2">
              {ALL_CATEGORIES.map((cat) => {
                const checked = config.essentialCategories.includes(cat);
                return (
                  <label
                    key={cat}
                    className={cn(
                      "flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 transition-colors",
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
          </section>

          {/* Friction */}
          <section className="space-y-3">
            <h2 className="border-b border-rule pb-2 font-heading text-xl italic tracking-tight text-ink">
              Friction level
            </h2>
            <div className="space-y-2 pt-2">
              {(["light", "standard", "strict"] as FrictionLevel[]).map(
                (lvl) => {
                  const active = config.friction === lvl;
                  const Icon = FRICTION_ICON[lvl];
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => updateConfig({ friction: lvl })}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                        active
                          ? "border-[oklch(0.55_0.10_35)] bg-[oklch(0.55_0.10_35)]/5"
                          : "border-rule bg-card hover:bg-paper-deep"
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-md",
                          active
                            ? "bg-[oklch(0.55_0.10_35)] text-paper"
                            : "bg-paper-deep text-ink-muted"
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <span className="font-heading text-base capitalize tracking-tight text-ink">
                        {lvl}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </section>

          {/* Demo mode */}
          <section className="space-y-3">
            <h2 className="border-b border-rule pb-2 font-heading text-xl italic tracking-tight text-ink">
              Demo mode
            </h2>
            <div className="flex items-start justify-between gap-4 pt-2">
              <p className="text-sm text-ink-muted">
                When on, cooling-off shortens to ~60 seconds so you can see the
                savings flow within a session.
              </p>
              <Switch
                checked={config.demoMode}
                onCheckedChange={(v) => updateConfig({ demoMode: v })}
              />
            </div>
            {state.coolingOff.some((e) => e.status === "pending") && (
              <Button
                variant="outline"
                onClick={() => {
                  fastForwardCoolingOff();
                  toast.success("Fast-forwarded all pending items");
                }}
                className="border-rule"
              >
                <FastForward className="size-4" />
                Fast-forward pending cooling-off
              </Button>
            )}
          </section>
        </div>

        {/* Right column — privacy & data */}
        <div className="space-y-10">
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 border-b border-rule pb-2 font-heading text-xl italic tracking-tight text-ink">
              <Lock className="size-4 text-[oklch(0.55_0.10_35)]" />
              What we store, and why
            </h2>
            <p className="text-sm leading-relaxed text-ink-muted">
              Every value the system uses comes from you. We do not infer
              emotional state, do not track items you view, and do not send
              anything to a server. All data lives in this browser&apos;s{" "}
              <code className="rounded bg-paper-deep px-1 py-0.5 font-mono text-xs text-ink">
                localStorage
              </code>{" "}
              under the key{" "}
              <code className="rounded bg-paper-deep px-1 py-0.5 font-mono text-xs text-ink">
                {STORAGE_KEY}
              </code>
              . Clearing site data — or pressing the button below — removes
              everything.
            </p>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-rule pb-2">
              <h2 className="flex items-center gap-2 font-heading text-xl italic tracking-tight text-ink">
                <Database className="size-4 text-ink-muted" />
                Stored data
              </h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyJson}
                className="text-ink-muted hover:bg-paper-deep hover:text-ink"
              >
                {copied ? (
                  <>
                    <Check className="size-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="max-h-72 overflow-auto rounded-lg border border-rule bg-paper-deep p-4 font-mono text-[11px] leading-relaxed text-ink">
              {storageJson}
            </pre>
          </section>

          <section className="space-y-3">
            <h2 className="border-b border-rule pb-2 font-heading text-xl italic tracking-tight text-ink">
              Reset
            </h2>
            <p className="text-sm text-ink-muted">
              Wipe your config, cart, cooling-off queue, purchases, and savings
              ledger. You&apos;ll be sent back to onboarding.
            </p>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(true)}
              className="border-alert/50 text-alert hover:bg-alert hover:text-paper"
            >
              <Trash2 className="size-4" />
              Delete all data
            </Button>
          </section>

          <section className="border-t border-rule pt-6 text-[11px] uppercase tracking-[0.18em] text-ink-subtle">
            <span className="font-mono num-tabular">v0.1</span>{" "}
            <span className="text-ink-subtle/60">·</span> Created{" "}
            {new Date(config.createdAt).toLocaleDateString()}
          </section>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm border-rule bg-paper">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl italic tracking-tight text-ink">
              Delete all data?
            </DialogTitle>
            <DialogDescription className="text-ink-muted">
              This wipes your config, cart, cooling-off queue, purchases, and
              savings ledger. You&apos;ll be sent back to onboarding.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              className="text-ink-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                wipe();
                router.replace("/setup");
              }}
              className="bg-alert text-paper hover:bg-alert/90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
