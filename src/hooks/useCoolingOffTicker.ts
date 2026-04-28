"use client";

import { useEffect } from "react";
import { useAppState } from "@/context/AppStateContext";

export function useCoolingOffTicker() {
  const { state, hydrated, resolveExpiredCoolingOff } = useAppState();
  const demoMode = state.config?.demoMode ?? false;
  const hasPending = state.coolingOff.some((e) => e.status === "pending");

  useEffect(() => {
    if (!hydrated) return;
    if (!hasPending) return;

    // Resolve once immediately so a long-tab returns up-to-date numbers
    resolveExpiredCoolingOff();

    const intervalMs = demoMode ? 1000 : 60_000;
    const id = window.setInterval(() => {
      resolveExpiredCoolingOff();
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [hydrated, hasPending, demoMode, resolveExpiredCoolingOff]);
}
