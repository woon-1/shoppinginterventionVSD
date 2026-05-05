"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DEFAULT_PAUSE_SECONDS = 5;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  pauseSeconds?: number;
}

export function LightPause({
  open,
  onOpenChange,
  onComplete,
  pauseSeconds = DEFAULT_PAUSE_SECONDS,
}: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!open) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      const e = (Date.now() - start) / 1000;
      setElapsed(e);
      if (e >= pauseSeconds) {
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [open, pauseSeconds]);

  const pct = Math.min(100, (elapsed / pauseSeconds) * 100);
  const done = elapsed >= pauseSeconds;
  const remaining = Math.max(0, pauseSeconds - elapsed).toFixed(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-sm gap-0 rounded-md border border-ink-4 bg-surface p-0 shadow-none"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Light pause</DialogTitle>
        <div className="flex flex-col items-center gap-6 px-8 py-12">
          <div className="text-[96px] font-medium leading-none tracking-[-0.04em] text-ink num-tabular">
            {remaining}
          </div>
          <div className="relative h-px w-60 bg-ink-4">
            <div
              className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-100 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">
            Hold to checkout · {pauseSeconds.toFixed(0)}s
          </div>
          {done && (
            <div className="flex w-full justify-center gap-2 border-t border-ink-4 pt-4">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-ink-2 hover:bg-surface-2 hover:text-ink"
              >
                Cancel
              </Button>
              <Button
                onClick={onComplete}
                className="bg-accent text-white hover:bg-accent/90"
              >
                Continue
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
