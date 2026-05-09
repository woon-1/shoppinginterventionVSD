/**
 * Cart-page intervention overlay used by non-Amazon retailers (Walmart,
 * eBay, Etsy, Target). Visually matches the InterventionModal Pause design:
 * Pause + accent dot brand, friction Pill, accent-dot trigger line, the
 * three-segment budget bar, WHY? Need/Want/Unsure choice group, and a
 * Buy / RECOMMENDED / Save-for-24h footer.
 *
 * Rendered into a Shadow DOM so the host site's CSS can't bleed in or out.
 */

import type { FrictionLevel, WishlistItem } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { remainingBudget, periodLabel } from "@/lib/budget";
import { extractCartTotal } from "./cart-price";
import type { CartCheckoutKind } from "./cart-detection";
import { loadExtensionState } from "./utils";
import {
  deriveAdaptiveIntervention,
  loadStoredCartInterventionStats,
} from "@/lib/intervention-behavior";
import { deriveRecommendation } from "@/lib/intervention";

const HOST_ATTR = "data-pause-cart-host";
const DEFER_PREFIX = "pause.deferUntil:";

type Necessity = "need" | "want" | "unsure";

export interface CartInterventionItem {
  name: string;
  price: number | null;
  quantity: number;
}

export interface CartInterventionOptions {
  /** Optional line items (currently unused in the rendered UI; kept for API compat). */
  items?: CartInterventionItem[];
  /** Called when the user clicks "Buy" — caller resumes the original commit click. */
  onContinue?: () => void;
}

const styles = `
:host {
  all: initial;
  font-family: var(--font-geist-sans, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  font-size: 14px;
  line-height: 1.45;
  color: #0a0a0a;
}
*, *::before, *::after { box-sizing: border-box; }
button {
  font: inherit;
  cursor: pointer;
  border: none;
  background: transparent;
  color: inherit;
}

.backdrop {
  position: fixed;
  inset: 0;
  z-index: 2147483640;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  animation: fadeIn 0.18s ease-out;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.panel {
  width: min(440px, 100%);
  max-height: min(92vh, 720px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #d4d4d4;
  border-radius: 6px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.18);
  outline: none;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid #d4d4d4;
}
.brand {
  display: flex;
  align-items: center;
  gap: 6px;
}
.brand-text {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #0a0a0a;
}
.brand-dot {
  width: 4px;
  height: 4px;
  border-radius: 1px;
  background: #5b5cff;
}
.pill {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #d4d4d4;
  color: #525252;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Body */
.body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  overflow-y: auto;
}

.trigger {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.accent-dot {
  flex-shrink: 0;
  margin-top: 8px;
  width: 4px;
  height: 4px;
  border-radius: 1px;
  background: #5b5cff;
}
.trigger p {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: #0a0a0a;
}
.money {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}
.over-budget {
  display: block;
  margin-top: 2px;
  color: #dc2626;
  font-weight: 500;
}

/* Budget bar */
.budget {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.budget-labels {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: end;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
}
.budget-label-spent { text-align: left; color: #a3a3a3; }
.budget-label-projected { text-align: center; color: #0a0a0a; font-size: 15px; font-weight: 500; }
.budget-label-total { text-align: right; color: #a3a3a3; }

.budget-bar {
  position: relative;
  height: 6px;
  width: 100%;
  border-radius: 999px;
  background: rgba(212, 212, 212, 0.4);
  overflow: hidden;
}
.budget-bar-spent {
  position: absolute;
  inset: 0 auto 0 0;
  background: #a3a3a3;
}
.budget-bar-projected {
  position: absolute;
  top: 0;
  bottom: 0;
  background: #5b5cff;
}
.budget-bar-projected.over {
  background: #dc2626;
}
.budget-tick {
  position: absolute;
  top: -2px;
  width: 1px;
  height: 10px;
  background: #0a0a0a;
}

/* Why? */
.why {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.eyebrow {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #a3a3a3;
}
.choices {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}
.choice {
  height: 44px;
  border-radius: 6px;
  border: 1px solid #d4d4d4;
  background: #ffffff;
  color: #0a0a0a;
  font-size: 14px;
  font-weight: 500;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}
.choice:hover {
  border-color: #0a0a0a;
}
.choice[aria-checked="true"] {
  border-color: #5b5cff;
  background: #eeeeff;
  color: #5b5cff;
}
.choice:focus-visible {
  outline: 2px solid rgba(91, 92, 255, 0.4);
  outline-offset: 2px;
}

/* Footer */
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(245, 245, 245, 0.5);
  border-top: 1px solid #d4d4d4;
}
.footer-left {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: #a3a3a3;
  text-decoration: none;
  cursor: pointer;
  transition: color 0.15s ease;
}
.footer-left:hover {
  color: #0a0a0a;
  text-decoration: underline;
}
.footer-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.buy-text {
  font-size: 14px;
  font-weight: 500;
  color: #0a0a0a;
  cursor: pointer;
  padding: 0;
  transition: text-decoration 0.15s ease;
}
.buy-text:hover {
  text-decoration: underline;
}
.recommended {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #5b5cff;
}
.save-button {
  height: 38px;
  padding: 0 16px;
  border-radius: 6px;
  background: #5b5cff;
  color: #ffffff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.save-button:hover {
  background: rgba(91, 92, 255, 0.9);
}
.save-button:focus-visible {
  outline: 2px solid rgba(91, 92, 255, 0.4);
  outline-offset: 2px;
}
`;

function deferKey(host: string): string {
  return `${DEFER_PREFIX}${host}`;
}

function readDeferUntil(host: string): number | null {
  try {
    const raw = localStorage.getItem(deferKey(host));
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/**
 * Click-intercept callers should check this BEFORE preventing the user's
 * commit click — otherwise a stale defer turns into a trapped user (click
 * blocked, modal silently bails).
 */
export function isHostInterventionDeferred(host: string): boolean {
  const until = readDeferUntil(host);
  return until != null && until > Date.now();
}

/**
 * For debugging: clear any active defer. Surfaced as
 * `window.__pauseClearDefer()` so users can run it from DevTools to reset
 * a stuck state without diving into localStorage manually.
 */
declare global {
  interface Window {
    __pauseClearDefer?: () => void;
  }
}
if (typeof window !== "undefined") {
  window.__pauseClearDefer = () => {
    try {
      localStorage.removeItem(deferKey(location.hostname));
      console.log(`[Pause] defer cleared for ${location.hostname}`);
    } catch (err) {
      console.warn("[Pause] defer clear failed", err);
    }
  };
}

function sendInterventionEvent(payload: {
  kind: "wait_24h" | "continue" | "minimize";
  host: string;
  cartTotal: number | null;
  friction: FrictionLevel;
  engagedPrompt?: boolean;
  necessity?: Necessity;
}) {
  try {
    const runtime = (
      globalThis as typeof globalThis & {
        chrome?: { runtime?: { sendMessage: (message: unknown) => void } };
      }
    ).chrome?.runtime;
    runtime?.sendMessage({ action: "recordCartIntervention", payload });
  } catch {
    /* ignore */
  }
}

function frictionPillLabel(friction: FrictionLevel): string {
  if (friction === "light") return "Light";
  if (friction === "strict") return "Strict";
  return "Standard";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function mountCartIntervention(
  website: WishlistItem["website"],
  kind: CartCheckoutKind,
  options: CartInterventionOptions = {}
) {
  const { onContinue } = options;
  if (document.querySelector(`[${HOST_ATTR}]`)) return;

  const state = await loadExtensionState();
  const friction = state?.config?.friction || "standard";
  const cartTotal = extractCartTotal(website);

  const stats = await loadStoredCartInterventionStats();
  const adaptive = deriveAdaptiveIntervention(friction, stats, cartTotal);
  const effectiveFriction = adaptive.friction;

  // Budget math — same shape as InterventionModal so the UI feels uniform.
  const config = state?.config ?? null;
  const remaining = config ? remainingBudget(config, state?.purchases ?? []) : null;
  const spent =
    config && remaining != null
      ? Math.max(0, config.budgetAmount - remaining)
      : null;
  const cartContribution = cartTotal ?? 0;
  const projectedSpent =
    spent != null ? spent + cartContribution : null;
  const overBudget =
    remaining != null && cartTotal != null && cartTotal > remaining;

  const spentPct =
    config && spent != null
      ? Math.min(100, Math.round((spent / Math.max(config.budgetAmount, 1)) * 100))
      : 0;
  const projectedPct =
    config && projectedSpent != null
      ? Math.min(
          100,
          Math.round((projectedSpent / Math.max(config.budgetAmount, 1)) * 100)
        )
      : spentPct;

  // Trigger line — assemble explicitly so missing pieces don't make awkward copy.
  const triggerParts: string[] = [];
  if (cartTotal != null) {
    triggerParts.push(
      `<span class="money">${escapeHtml(formatCurrency(cartTotal))}</span> in cart`
    );
  } else {
    triggerParts.push("Items in cart");
  }
  if (config && remaining != null) {
    triggerParts.push(
      `<span class="money">${escapeHtml(formatCurrency(remaining))}</span> left ${escapeHtml(periodLabel(config.budgetPeriod))}`
    );
  }

  // Host + shadow root for full CSS isolation from the retailer page.
  const host = document.createElement("div");
  host.setAttribute(HOST_ATTR, "");
  const shadow = host.attachShadow({ mode: "open" });
  const styleEl = document.createElement("style");
  styleEl.textContent = styles;
  shadow.appendChild(styleEl);

  const panel = document.createElement("div");
  panel.className = "backdrop";

  const triggerHtml =
    triggerParts.join(", ") +
    "." +
    (overBudget ? ` <span class="over-budget">Over budget.</span>` : "");

  const projectedLabel =
    projectedSpent != null
      ? formatCurrency(projectedSpent)
      : cartTotal != null
        ? formatCurrency(cartTotal)
        : "—";
  const totalLabel = config ? formatCurrency(config.budgetAmount) : "—";
  const spentLabel = spent != null ? formatCurrency(spent) : "—";

  const recommendation = deriveRecommendation({
    cartTotal,
    remaining,
    friction: effectiveFriction,
  });

  panel.innerHTML = `
    <div class="panel" tabindex="-1" role="dialog" aria-modal="true" aria-label="Pause checkpoint">
      <div class="header">
        <div class="brand">
          <span class="brand-text">Pause</span>
          <span class="brand-dot" aria-hidden="true"></span>
        </div>
        <span class="pill">${frictionPillLabel(effectiveFriction)}</span>
      </div>

      <div class="body">
        <div class="trigger">
          <span class="accent-dot" aria-hidden="true"></span>
          <p>${triggerHtml}</p>
        </div>

        <div class="budget">
          <div class="budget-labels">
            <span class="budget-label-spent">${escapeHtml(spentLabel)}</span>
            <span class="budget-label-projected">${escapeHtml(projectedLabel)}</span>
            <span class="budget-label-total">${escapeHtml(totalLabel)}</span>
          </div>
          <div class="budget-bar" aria-hidden="true">
            <div class="budget-bar-spent" style="width: ${spentPct}%"></div>
            <div class="budget-bar-projected ${overBudget ? "over" : ""}"
                 style="left: ${spentPct}%; width: ${Math.max(0, projectedPct - spentPct)}%"></div>
            <div class="budget-tick" style="left: ${projectedPct}%"></div>
          </div>
        </div>

        <div class="why">
          <span class="eyebrow">Why?</span>
          <div class="choices" role="radiogroup" aria-label="Why are you buying this?">
            <button class="choice" data-necessity="need" type="button" role="radio" aria-checked="false">Need</button>
            <button class="choice" data-necessity="want" type="button" role="radio" aria-checked="true">Want</button>
            <button class="choice" data-necessity="unsure" type="button" role="radio" aria-checked="false">Unsure</button>
          </div>
        </div>
      </div>

      <div class="footer">
        <button class="footer-left" data-action="dismiss" type="button">Maybe later</button>
        <div class="footer-right">
          ${
            recommendation === "buy"
              ? `<span class="recommended">Recommended</span>`
              : ""
          }
          <button class="buy-text" data-action="buy" type="button">Buy</button>
          ${
            recommendation === "save"
              ? `<span class="recommended">Recommended</span>`
              : ""
          }
          <button class="save-button" data-action="save-24h" type="button">Save for 24h</button>
        </div>
      </div>
    </div>
  `;

  shadow.appendChild(panel);
  document.body.appendChild(host);

  // Default selection
  let necessity: Necessity = "want";
  const setActive = (n: Necessity) => {
    necessity = n;
    const buttons = panel.querySelectorAll<HTMLButtonElement>(".choice");
    for (const btn of buttons) {
      btn.setAttribute(
        "aria-checked",
        btn.dataset.necessity === n ? "true" : "false"
      );
    }
  };
  // Set initial active state in DOM (HTML defaults to want=true; ensure consistent)
  setActive("want");

  panel.querySelectorAll<HTMLButtonElement>(".choice").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const next = (btn.dataset.necessity as Necessity | undefined) ?? "want";
      setActive(next);
    });
  });

  function close() {
    host.remove();
    document.removeEventListener("keydown", onKey, true);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      sendInterventionEvent({
        kind: "minimize",
        host: location.hostname,
        cartTotal,
        friction: effectiveFriction,
        necessity,
      });
      close();
    }
  }
  document.addEventListener("keydown", onKey, true);

  // Backdrop click closes (clicking inside the panel does not bubble out).
  panel.addEventListener("click", (e) => {
    if (e.target === panel) {
      sendInterventionEvent({
        kind: "minimize",
        host: location.hostname,
        cartTotal,
        friction: effectiveFriction,
        necessity,
      });
      close();
    }
  });

  // Action wiring
  panel
    .querySelector<HTMLButtonElement>('[data-action="buy"]')
    ?.addEventListener("click", () => {
      sendInterventionEvent({
        kind: "continue",
        host: location.hostname,
        cartTotal,
        friction: effectiveFriction,
        necessity,
        engagedPrompt: necessity !== "want",
      });
      close();
      onContinue?.();
    });

  panel
    .querySelector<HTMLButtonElement>('[data-action="save-24h"]')
    ?.addEventListener("click", () => {
      try {
        localStorage.setItem(
          deferKey(location.hostname),
          String(Date.now() + 24 * 60 * 60 * 1000)
        );
      } catch {
        /* ignore quota errors */
      }
      sendInterventionEvent({
        kind: "wait_24h",
        host: location.hostname,
        cartTotal,
        friction: effectiveFriction,
        necessity,
        engagedPrompt: true,
      });
      close();
    });

  panel
    .querySelector<HTMLButtonElement>('[data-action="dismiss"]')
    ?.addEventListener("click", () => {
      try {
        localStorage.setItem(
          deferKey(location.hostname),
          String(Date.now() + 30 * 60 * 1000)
        );
      } catch {
        /* ignore */
      }
      sendInterventionEvent({
        kind: "minimize",
        host: location.hostname,
        cartTotal,
        friction: effectiveFriction,
        necessity,
      });
      close();
    });

  // Auto-focus the panel for screen readers / keyboard users.
  const panelEl = panel.querySelector<HTMLElement>(".panel");
  panelEl?.focus();
}
