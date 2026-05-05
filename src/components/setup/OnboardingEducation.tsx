"use client";

import { Button } from "@/components/ui/button";
import { HintTooltip } from "@/components/ui/hint-tooltip";

type Props = {
  onContinue: () => void;
};

export function OnboardingEducation({ onContinue }: Props) {
  return (
    <div className="min-h-screen bg-paper px-6 py-16 text-ink">
      <div className="mx-auto max-w-lg space-y-12">
        <header className="space-y-3">
          <div className="flex items-center gap-1.5 text-[14px] font-semibold tracking-tight">
            Pause<span className="size-1 rounded-[1px] bg-accent" />
          </div>
          <h1 className="text-[32px] font-medium leading-tight tracking-tight">
            A gentler way to shop online
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-2">
            Pause helps you notice impulse buys before checkout — with prompts you
            control, not rules that shame you. You stay in charge of every purchase.
          </p>
        </header>

        <section className="space-y-4 rounded-2xl border border-ink-4 bg-surface p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-3">
            How it works on shopping sites
            <HintTooltip content="On supported stores (Amazon, eBay, Etsy, Target, Walmart), Pause can show a small reflection card on product pages and add optional tools like adding items to your in-extension wishlist. More sites can be added over time." />
          </h2>
          <ul className="space-y-3 text-[14px] leading-relaxed text-ink-2">
            <li className="flex gap-2">
              <span className="mt-0.5 text-accent">·</span>
              <span>
                Detects shopping contexts like{" "}
                <strong className="font-medium text-ink">product pages</strong>,{" "}
                <strong className="font-medium text-ink">carts</strong>, and{" "}
                <strong className="font-medium text-ink">checkout flows</strong> so
                prompts appear when you are close to a decision — not everywhere on
                the web.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-accent">·</span>
              <span>
                Optional{" "}
                <strong className="font-medium text-ink">reflection prompts</strong>{" "}
                and a{" "}
                <strong className="font-medium text-ink">cooling-off timer</strong>{" "}
                give you space to decide if a purchase fits your budget and values.
                <HintTooltip
                  className="ml-1"
                  content="Cooling-off timer: puts non-essential items on hold for a period you choose (24 hours by default, shorter in demo mode) so you can leave the site and return with a clearer head."
                />
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-0.5 text-accent">·</span>
              <span>
                Nothing here blocks purchases outright — you can always{" "}
                <strong className="font-medium text-ink">bypass</strong> when a buy
                is intentional or necessary (like essentials you marked in setup).
                <HintTooltip
                  className="ml-1"
                  content="Bypass: complete checkout anyway when you have decided the purchase is worth it. Pause is a pause button, not a lock."
                />
              </span>
            </li>
          </ul>
        </section>

        <section className="space-y-4 rounded-2xl border border-ink-4 bg-surface p-6 shadow-sm">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-3">
            Your data
          </h2>
          <p className="text-[14px] leading-relaxed text-ink-2">
            Budget, wishlist, and shopping preferences stay{" "}
            <strong className="font-medium text-ink">on your device</strong>{" "}
            (Chrome local storage). We do not send your browsing or purchases to a
            server. What you save is yours — Pause does not sell data or train models
            on your habits.
          </p>
        </section>

        <section className="space-y-4 rounded-2xl border border-ink-4 bg-surface p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-3">
            Friction you choose
            <HintTooltip content="Friction level sets how strong the pause feels — from a short breath (light) to a stronger nudge with save-for-later (strict). You can change this anytime in Settings." />
          </h2>
          <p className="text-[14px] leading-relaxed text-ink-2">
            Next, you will set a discretionary budget, essentials, and how much
            interruption feels right. Higher friction adds more reflection — never
            punishment. The goal is{" "}
            <strong className="font-medium text-ink">supportive awareness</strong>,
            not control.
          </p>
        </section>

        <div className="flex justify-end pt-4">
          <Button
            type="button"
            onClick={onContinue}
            className="bg-ink px-6 text-paper hover:bg-ink/90"
          >
            Continue to setup
          </Button>
        </div>
      </div>
    </div>
  );
}
