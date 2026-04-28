"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/context/AppStateContext";
import { SavingsHero } from "@/components/dashboard/SavingsHero";
import { KpiStrip } from "@/components/dashboard/KpiStrip";
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
    return <p className="py-10 text-sm text-ink-3">Loading…</p>;
  }

  return (
    <div className="space-y-16">
      <SavingsHero savings={state.savings} config={state.config} />
      <KpiStrip state={state} />
      <WeeklyChart savings={state.savings} />
      <CoolingOffList />
    </div>
  );
}
