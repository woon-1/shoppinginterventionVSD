"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppState } from "@/context/AppStateContext";

function Gate() {
  const router = useRouter();
  const search = useSearchParams();
  const { state, hydrated, wipe } = useAppState();

  useEffect(() => {
    if (!hydrated) return;
    if (search.get("reset") === "1") {
      wipe();
      router.replace("/setup");
      return;
    }
    if (state.config?.onboardingComplete) {
      router.replace("/shop");
    } else {
      router.replace("/setup");
    }
  }, [hydrated, state.config, search, router, wipe]);

  return null;
}

export default function HomePage() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <p className="text-sm text-ink-subtle">Loading…</p>
      <Suspense>
        <Gate />
      </Suspense>
    </div>
  );
}
