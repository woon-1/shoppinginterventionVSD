"use client";

import { PopupActive } from "@/components/popup/PopupActive";
import { PopupWelcome } from "@/components/popup/PopupWelcome";
import { useAppState } from "@/context/AppStateContext";

export default function PopupPage() {
  const { state, hydrated } = useAppState();

  return (
    <div className="extension-popup-panel box-border w-full min-w-0 max-w-full">
      {!hydrated ? (
        <div className="flex min-h-[280px] items-center justify-center px-4 py-10 text-sm text-ink-3">
          Loading…
        </div>
      ) : !state.config?.onboardingComplete ? (
        <PopupWelcome />
      ) : (
        <PopupActive />
      )}
    </div>
  );
}
