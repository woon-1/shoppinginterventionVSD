"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, FastForward, Lock, Database } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
  const {
    state,
    hydrated,
    updateConfig,
    fastForwardCoolingOff,
    wipe,
  } = useAppState();
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !state.config?.onboardingComplete) {
      router.replace("/setup");
    }
  }, [hydrated, state.config, router]);

  const storageJson = useMemo(() => JSON.stringify(state, null, 2), [state]);

  if (!hydrated || !state.config?.onboardingComplete) {
    return <p className="py-10 text-sm text-muted-foreground">Loading…</p>;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Edit your config and review what the prototype stores.
        </p>
      </div>

      {/* Budget */}
      <Card>
        <CardContent className="space-y-4 py-6">
          <h2 className="font-medium">Budget</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                value={config.budgetAmount}
                min={1}
                onChange={(e) =>
                  updateConfig({
                    budgetAmount: Number(e.target.value) || 0,
                  })
                }
                className="max-w-[10rem]"
              />
            </div>
            <RadioGroup
              value={config.budgetPeriod}
              onValueChange={(v) =>
                updateConfig({ budgetPeriod: v as Period })
              }
              className="flex flex-row gap-3"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="weekly" id="set-weekly" />
                <Label htmlFor="set-weekly" className="font-normal">
                  per week
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="monthly" id="set-monthly" />
                <Label htmlFor="set-monthly" className="font-normal">
                  per month
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Essentials */}
      <Card>
        <CardContent className="space-y-3 py-6">
          <h2 className="font-medium">Essential categories</h2>
          <p className="text-sm text-muted-foreground">
            Items in these categories bypass the reflection prompt.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ALL_CATEGORIES.map((cat) => {
              const checked = config.essentialCategories.includes(cat);
              return (
                <label
                  key={cat}
                  className="flex cursor-pointer items-center justify-between rounded-md border border-border px-3 py-2 hover:bg-muted/50"
                >
                  <span>{CATEGORY_LABELS[cat]}</span>
                  <Switch
                    checked={checked}
                    onCheckedChange={() => toggleCategory(cat)}
                  />
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Friction */}
      <Card>
        <CardContent className="space-y-3 py-6">
          <h2 className="font-medium">Friction level</h2>
          <RadioGroup
            value={config.friction}
            onValueChange={(v) =>
              updateConfig({ friction: v as FrictionLevel })
            }
            className="space-y-2"
          >
            {(["light", "standard", "strict"] as FrictionLevel[]).map((lvl) => (
              <label
                key={lvl}
                className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-3 py-2 hover:bg-muted/50"
              >
                <RadioGroupItem value={lvl} id={`set-${lvl}`} />
                <Label htmlFor={`set-${lvl}`} className="capitalize font-normal">
                  {lvl}
                </Label>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Demo mode */}
      <Card>
        <CardContent className="space-y-3 py-6">
          <h2 className="font-medium">Demo mode</h2>
          <div className="flex items-start justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              When on, the cooling-off period is shortened to ~60 seconds so you
              can see the savings flow within a short session.
            </div>
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
            >
              <FastForward className="size-4" />
              Fast-forward pending cooling-off
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Privacy / data panel */}
      <Card>
        <CardContent className="space-y-3 py-6">
          <h2 className="flex items-center gap-2 font-medium">
            <Lock className="size-4" />
            What we store and why
          </h2>
          <p className="text-sm text-muted-foreground">
            Every value the system uses comes from you. We do not infer
            emotional state, do not track which items you view, and do not send
            anything to a server. All data lives in this browser&apos;s
            <code className="mx-1 rounded bg-muted px-1 py-0.5 font-mono text-xs">
              localStorage
            </code>
            under the key{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              {STORAGE_KEY}
            </code>
            . Clearing this browser&apos;s site data, or pressing the button
            below, removes everything.
          </p>
          <details className="rounded-md border border-border">
            <summary className="cursor-pointer select-none px-3 py-2 text-sm font-medium">
              <Database className="mr-2 inline size-4" />
              Show stored data
            </summary>
            <pre className="max-h-72 overflow-auto px-3 py-2 text-xs">
              {storageJson}
            </pre>
          </details>
          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="size-4" />
            Delete all data
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          <Badge variant="outline" className="mr-1">
            v0.1
          </Badge>
          Pause prototype · created{" "}
          {new Date(config.createdAt).toLocaleDateString()}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete all data?</DialogTitle>
            <DialogDescription>
              This wipes your config, cart, cooling-off queue, purchases, and
              savings ledger. You&apos;ll be sent back to onboarding.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                wipe();
                router.replace("/setup");
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
