"use client";

import { useRouter } from "next/navigation";
import { useAppState } from "@/context/AppStateContext";
import { ALL_CATEGORIES } from "@/lib/types";
import { Button } from "@/components/ui/button";

export default function SetupStubPage() {
  const router = useRouter();
  const { setConfig } = useAppState();

  function quickStart() {
    setConfig({
      budgetAmount: 50,
      budgetPeriod: "weekly",
      essentialCategories: ["groceries", "hygiene"],
      essentialItemOverrides: {},
      friction: "standard",
      demoMode: true,
      createdAt: Date.now(),
      onboardingComplete: true,
    });
    router.replace("/shop");
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center gap-6 p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Pause</h1>
      <p className="text-sm text-muted-foreground">
        Onboarding wizard is coming next. For now, use defaults to explore the
        prototype.
      </p>
      <Button onClick={quickStart}>Continue with defaults</Button>
      <p className="text-xs text-muted-foreground">
        Defaults: $50/week budget, {ALL_CATEGORIES.length} categories,{" "}
        groceries + hygiene marked essential, standard friction, demo mode on.
      </p>
    </div>
  );
}
