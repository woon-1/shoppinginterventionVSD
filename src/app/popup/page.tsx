"use client";

import { PopupActive } from "@/components/popup/PopupActive";
import { PopupWelcome } from "@/components/popup/PopupWelcome";
import { useAppState } from "@/context/AppStateContext";

export default function PopupPage() {
  const { state, hydrated } = useAppState();

  if (!hydrated) {
    return (
      <div className="flex min-h-[200px] items-center justify-center px-4 py-8 text-sm text-ink-3">
        Loading…
      </div>
    );
  }

  if (!state.config?.onboardingComplete) {
    return <PopupWelcome />;
  }

  return <PopupActive />;
}
