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
    return <p className="py-10 text-sm text-ink-subtle">Loading…</p>;
  }

  return (
    <div className="space-y-12">
      <header className="max-w-2xl space-y-2">
        <div className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-subtle">
          The dashboard
        </div>
        <h1 className="font-heading text-4xl leading-tight tracking-tight text-ink md:text-5xl">
          What you didn&apos;t buy.
        </h1>
        <p className="font-heading text-lg italic text-ink-muted">
          Quiet credit for the purchases you let go.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SavingsHero savings={state.savings} config={state.config} />
        </div>
        <SkipStreakCard savings={state.savings} />
      </div>

      <WeeklyChart savings={state.savings} />

      <CoolingOffList />
    </div>
  );
}
