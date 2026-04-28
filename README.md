# Pause — Online Shopping Intervention Prototype

Final-project deliverable for **COMPSCI 2760: Design, Technology, and Social Impact** (Harvard, Spring 2026). Authors: Aaron Contreras, Hannah Park, James Lee. Faculty sponsor: Dr. Krzysztof Gajos.

A working prototype that applies **Value Sensitive Design** to online-shopping addiction. The product introduces deterministic, user-controlled friction at the point of purchase. There is no LLM, no behavior tracking, and no backend — every value the system uses comes from the user explicitly during onboarding.

## Live demo

Deployed via Vercel at the team's project URL.

## What the prototype does

Three surfaces, each tied to a feature derived from the team's Milestone 2 survey signals:

1. **Setup ("Setting Intentions")** — a four-step onboarding wizard captures budget, essential categories, friction intensity, and an optional savings goal.
2. **Checkout layer** — when a non-essentials cart is checked out, a reflection modal appears. It shows the trigger rule plainly, the cart against remaining budget, a one-tap necessity prompt, and three actions: *Buy now*, *Save for 24 hours*, or *Show alternatives*. Friction intensity (Light / Standard / Strict) parameterizes this single surface.
3. **Savings dashboard** — total saved by not buying, current skip streak, a 7-day chart, and a live cooling-off queue with countdowns.

## Cross-cutting design properties

- **No hard blocks.** Every prompt has a visible *Buy now* path.
- **Trigger rules are always visible.** Every interruption explains itself in the user's own units (e.g. "$45 cart, $30 left this week").
- **Local-only data.** Everything lives in `localStorage` under the key `shoppingintervention.v1`. The settings panel shows the raw stored data and offers a one-click delete.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On a fresh browser you will land on the onboarding wizard.

## User-testing notes

- **Demo mode** is on by default. While demo mode is on, the cooling-off period is shortened to ~60 seconds so a tester can see the savings flow within a single session. A "DEMO MODE" badge appears in the header.
- **Reset between sessions** by appending `?reset=1` to the home URL. This wipes `localStorage` and routes back to onboarding.
- **Fast-forward** any pending cooling-off items from `Settings → Demo mode → Fast-forward pending cooling-off`.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui · recharts. State is held in a single React context backed by `localStorage`. No server, no auth, no API routes.

## Project structure

```
src/
  app/                # Next App Router pages (/, /setup, /shop, /cart, /dashboard, /settings)
  components/
    AppShell.tsx      # Persistent nav with budget pill and demo badge
    Providers.tsx     # AppStateProvider + Toaster + cooling-off ticker
    setup/            # SetupWizard and its 4 steps
    shop/             # ProductCard
    intervention/     # InterventionModal + LightPause
    dashboard/        # SavingsHero, SkipStreakCard, WeeklyChart, CoolingOffList
    ui/               # shadcn primitives
  context/            # AppStateContext (the entire state tree)
  hooks/              # useCoolingOffTicker
  lib/                # types, catalog, intervention rules, budget math, format helpers
```
