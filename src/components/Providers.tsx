"use client";

import { AppStateProvider } from "@/context/AppStateContext";
import { Toaster } from "@/components/ui/sonner";
import { useCoolingOffTicker } from "@/hooks/useCoolingOffTicker";

function TickerHost() {
  useCoolingOffTicker();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppStateProvider>
      <TickerHost />
      {children}
      <Toaster richColors position="top-center" />
    </AppStateProvider>
  );
}
