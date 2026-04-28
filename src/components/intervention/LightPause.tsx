"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

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
    }, 100);
    return () => clearInterval(interval);
  }, [open]);

  const pct = Math.min(100, (elapsed / PAUSE_SECONDS) * 100);
  const done = elapsed >= PAUSE_SECONDS;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>A short pause</DialogTitle>
          <DialogDescription>
            Light friction: a {PAUSE_SECONDS}-second moment to reflect before
            checkout.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Progress value={pct} />
          <p className="text-center text-sm text-muted-foreground">
            {done
              ? "Done. Continue when ready."
              : `${Math.max(0, PAUSE_SECONDS - elapsed).toFixed(1)}s remaining`}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onComplete} disabled={!done}>
            Continue to checkout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
