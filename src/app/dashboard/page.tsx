"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/context/AppStateContext";
import { extensionAwareReplace } from "@/lib/extension-nav";
import { SavingsHero } from "@/components/dashboard/SavingsHero";
import { AmazonPauseSuccess } from "@/components/dashboard/AmazonPauseSuccess";
import { KpiStrip } from "@/components/dashboard/KpiStrip";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { CoolingOffList } from "@/components/dashboard/CoolingOffList";

export default function DashboardPage() {
  const router = useRouter();
  const { state, hydrated } = useAppState();
  const latestAmazonPause = state.amazonPauseSessions.at(-1) ?? null;

  useEffect(() => {
    if (hydrated && !state.config?.onboardingComplete) {
      extensionAwareReplace(router, "/setup");
    }
  }, [hydrated, state.config, router]);

  if (!hydrated || !state.config?.onboardingComplete) {
    return <p className="py-10 text-sm text-ink-3">Loading…</p>;
  }

  return (
    <div className="space-y-16">
      {latestAmazonPause && state.config ? (
        <AmazonPauseSuccess
          session={latestAmazonPause}
          config={state.config}
          savings={state.savings}
        />
      ) : null}
      <SavingsHero savings={state.savings} config={state.config} />
      <KpiStrip state={state} />
      <WeeklyChart savings={state.savings} />
      <CoolingOffList />
    </div>
  );
}
