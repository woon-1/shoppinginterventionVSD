"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/context/AppStateContext";
import { SavingsHero } from "@/components/dashboard/SavingsHero";
import { SkipStreakCard } from "@/components/dashboard/SkipStreakCard";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { CoolingOffList } from "@/components/dashboard/CoolingOffList";

export default function DashboardPage() {
  const router = useRouter();
  const { state, hydrated } = useAppState();

  useEffect(() => {
    if (hydrated && !state.config?.onboardingComplete) {
      router.replace("/setup");
    }
  }, [hydrated, state.config, router]);

  if (!hydrated || !state.config?.onboardingComplete) {
    return <p className="py-10 text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your savings, streak, and what&apos;s in the cooling-off queue.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SavingsHero savings={state.savings} config={state.config} />
        <div className="grid gap-4">
          <SkipStreakCard savings={state.savings} />
        </div>
      </div>

      <WeeklyChart savings={state.savings} />

      <CoolingOffList />
    </div>
  );
}
