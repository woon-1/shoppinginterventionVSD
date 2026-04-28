"use client";

import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppStateContext";
import { useRouter } from "next/navigation";

export default function SettingsPlaceholder() {
  const { wipe } = useAppState();
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Full editor coming in Phase 7.</p>
      </div>
      <Button
        variant="destructive"
        onClick={() => {
          wipe();
          router.replace("/setup");
        }}
      >
        Wipe all data
      </Button>
    </div>
  );
}
