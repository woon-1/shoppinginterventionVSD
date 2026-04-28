"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FRICTION_META: Record<FrictionLevel, { name: string; desc: string }> = {
  light: { name: "Light", desc: "Five-second pause." },
  standard: { name: "Standard", desc: "Reflection prompt." },
  strict: { name: "Strict", desc: "Save-for-24h recommended." },
};

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
    return <p className="py-10 text-sm text-ink-3">Loading…</p>;
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

  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-[40px] font-semibold leading-tight tracking-[-0.03em] text-ink">
          Settings
        </h1>
      </header>

      <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
        {/* Left — config */}
        <div className="space-y-10">
          <Section title="Budget">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[14px] text-ink-3">$</span>
              <Input
                type="number"
                value={config.budgetAmount}
                min={1}
                onChange={(e) =>
                  updateConfig({
                    budgetAmount: Number(e.target.value) || 0,
                  })
                }
                className="h-9 max-w-[10rem] rounded-none border-0 border-b border-ink-4 bg-transparent px-0 text-[14px] font-medium shadow-none focus:border-accent focus-visible:ring-0"
              />
              <div className="flex gap-1.5">
                {(["weekly", "monthly"] as Period[]).map((p) => {
                  const active = config.budgetPeriod === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateConfig({ budgetPeriod: p })}
                      className={cn(
                        "h-7 rounded border px-2.5 text-[12px] font-medium transition-colors",
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
          </Section>

          <Section title="Essential categories">
            <div className="border-t border-ink-4">
              {ALL_CATEGORIES.map((cat) => {
                const checked = config.essentialCategories.includes(cat);
                return (
                  <label
                    key={cat}
                    className="flex h-11 cursor-pointer items-center justify-between border-b border-ink-4"
                  >
                    <span className="text-[13px] text-ink">
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
          </Section>

          <Section title="Friction level">
            <div className="space-y-1.5">
              {(["light", "standard", "strict"] as FrictionLevel[]).map(
                (lvl) => {
                  const active = config.friction === lvl;
                  const meta = FRICTION_META[lvl];
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => updateConfig({ friction: lvl })}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded border px-3 py-2.5 text-left transition-colors",
                        active
                          ? "border-accent bg-accent-fade"
                          : "border-ink-4 hover:border-ink"
                      )}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span
                          className={cn(
                            "text-[13px] font-medium",
                            active ? "text-accent" : "text-ink"
                          )}
                        >
                          {meta.name}
                        </span>
                        <span className="text-[12px] text-ink-2">
                          {meta.desc}
                        </span>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          </Section>

          <Section title="Demo mode">
            <div className="flex items-center justify-between">
              <p className="max-w-sm text-[12px] text-ink-2">
                When on, cooling-off shortens to ~60s for testing sessions.
              </p>
              <Switch
                checked={config.demoMode}
                onCheckedChange={(v) => updateConfig({ demoMode: v })}
              />
            </div>
            {state.coolingOff.some((e) => e.status === "pending") && (
              <button
                onClick={() => {
                  fastForwardCoolingOff();
                  toast.success("Fast-forwarded all pending items");
                }}
                className="mt-3 font-mono text-[11px] text-ink-3 hover:text-ink hover:underline"
              >
                Fast-forward pending →
              </button>
            )}
          </Section>
        </div>

        {/* Right — privacy */}
        <div className="space-y-10">
          <Section title="What we store">
            <p className="text-[13px] leading-relaxed text-ink-2">
              Every value comes from you. We do not infer emotional state, do
              not track items you view, and do not send anything to a server.
              All data lives in this browser&apos;s{" "}
              <code className="rounded-sm bg-surface-2 px-1 font-mono text-[11px] text-ink">
                localStorage
              </code>{" "}
              under{" "}
              <code className="rounded-sm bg-surface-2 px-1 font-mono text-[11px] text-ink">
                {STORAGE_KEY}
              </code>
              .
            </p>
          </Section>

          <Section
            title="Stored data"
            action={
              <button
                onClick={copyJson}
                className="flex items-center gap-1 font-mono text-[11px] text-ink-3 hover:text-ink"
              >
                {copied ? (
                  <>
                    <Check className="size-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3" />
                    Copy
                  </>
                )}
              </button>
            }
          >
            <pre className="max-h-72 overflow-auto rounded-sm bg-surface-2 p-3 font-mono text-[11px] leading-relaxed text-ink-2">
              {storageJson}
            </pre>
          </Section>

          <Section title="Reset">
            <p className="text-[13px] text-ink-2">
              Wipe config, cart, queue, purchases, and savings ledger.
            </p>
            <button
              onClick={() => setConfirmOpen(true)}
              className="mt-3 font-mono text-[12px] text-negative hover:underline"
            >
              Delete all data
            </button>
          </Section>

          <div className="border-t border-ink-4 pt-6 font-mono text-[11px] text-ink-3">
            v0.1 · created{" "}
            {new Date(config.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm rounded-md border border-ink-4 bg-surface p-5 shadow-none">
          <DialogTitle className="text-[16px] font-semibold tracking-tight text-ink">
            Delete all data?
          </DialogTitle>
          <p className="mt-2 text-[13px] text-ink-2">
            Wipes config, cart, queue, purchases, and savings ledger.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              className="text-ink-2 hover:bg-surface-2 hover:text-ink"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                wipe();
                router.replace("/setup");
              }}
              className="bg-negative text-white hover:bg-negative/90"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between border-b border-ink-4 pb-2">
        <h2 className="text-[13px] font-medium text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
