"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAUSE_SECONDS = 5;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function LightPause({ open, onOpenChange, onComplete }: Props) {
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
      if (e >= PAUSE_SECONDS) {
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [open]);

  const pct = Math.min(100, (elapsed / PAUSE_SECONDS) * 100);
  const done = elapsed >= PAUSE_SECONDS;
  const remaining = Math.max(0, PAUSE_SECONDS - elapsed).toFixed(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md border-rule bg-paper p-0 shadow-[0_24px_60px_-24px_rgba(20,20,30,0.25)]"
        showCloseButton={false}
      >
        <div className="flex flex-col items-center gap-6 px-8 py-12 text-center">
          <DialogTitle className="font-heading text-3xl italic leading-tight tracking-tight text-ink">
            Take a breath.
          </DialogTitle>

          <p className="max-w-xs text-sm text-ink-muted">
            A five-second pause. The shortest pause we offer.
          </p>

          <div className="relative h-px w-60 bg-rule">
            <div
              className="absolute inset-y-0 left-0 bg-[oklch(0.55_0.10_35)] transition-[width] duration-100 ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="font-mono text-xs num-tabular text-ink-subtle">
            {done ? "Ready when you are" : `${remaining}s`}
          </div>

          <div className="flex w-full justify-center gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-ink-muted hover:bg-paper-deep"
            >
              Cancel
            </Button>
            <Button
              onClick={onComplete}
              disabled={!done}
              className={cn(
                "bg-ink text-paper hover:bg-ink/90",
                !done && "opacity-50"
              )}
            >
              Continue to checkout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
