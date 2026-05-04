"use client";

import { PopupActive } from "@/components/popup/PopupActive";
import { PopupWelcome } from "@/components/popup/PopupWelcome";
import { useAppState } from "@/context/AppStateContext";

export default function PopupPage() {
  const { state, hydrated } = useAppState();

  if (!hydrated) {
    return (
      <div className="flex min-h-[120px] items-center justify-center bg-paper px-4 py-8 text-sm text-ink-3">
        Loading…
      </div>
    );
  }

  if (!state.config?.onboardingComplete) {
    return (
      <div className="max-h-[min(560px,calc(100vh-12px))] overflow-y-auto overflow-x-hidden bg-paper">
        <PopupWelcome />
      </div>
    );
  }

  return (
    <div className="max-h-[min(560px,calc(100vh-12px))] overflow-y-auto overflow-x-hidden bg-paper">
      <PopupActive />
    </div>
  );
}
