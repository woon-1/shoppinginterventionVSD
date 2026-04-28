"use client";

import { AppStateProvider } from "@/context/AppStateContext";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppStateProvider>
      {children}
      <Toaster richColors position="top-center" />
    </AppStateProvider>
  );
}
