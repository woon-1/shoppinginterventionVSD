"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SetupWizard } from "@/components/setup/SetupWizard";
import { OnboardingEducation } from "@/components/setup/OnboardingEducation";
import {
  loadSetupIntroComplete,
  setSetupIntroComplete,
} from "@/lib/setup-intro";

function SetupInner() {
  const searchParams = useSearchParams();
  const forceIntro = searchParams.get("intro") === "1";
  const [introDone, setIntroDone] = useState<boolean | null>(null);

  useEffect(() => {
    setIntroDone(forceIntro ? false : loadSetupIntroComplete());
  }, [forceIntro]);

  if (introDone === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-ink-3">
        Loading…
      </div>
    );
  }

  if (!introDone) {
    return (
      <OnboardingEducation
        onContinue={() => {
          setSetupIntroComplete();
          setIntroDone(true);
        }}
      />
    );
  }

  return <SetupWizard />;
}

export default function SetupContent() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-ink-3">
          Loading…
        </div>
      }
    >
      <SetupInner />
    </Suspense>
  );
}
