import type { FrictionLevel, WishlistItem } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { buildPurchaseFraming, goalSkipDeltaCopy } from "./cart-framing";
import { extractCartTotal } from "./cart-price";
import type { CartCheckoutKind } from "./cart-detection";
import { loadExtensionState } from "./utils";
import {
  deriveAdaptiveIntervention,
  loadStoredCartInterventionStats,
} from "@/lib/intervention-behavior";

const HOST_ATTR = "data-pause-cart-host";
const SESSION_PREFIX = "pause.cartCheckpoint:";
const DEFER_PREFIX = "pause.deferUntil:";

const styles = `
:host {
  all: initial;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.45;
  color: #171717;
}
*, *::before, *::after { box-sizing: border-box; }
button {
  font: inherit;
  cursor: pointer;
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
}
.panel {
  width: min(440px, 100%);
  max-height: min(92vh, 720px);
  overflow: auto;
  background: #fafafa;
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.18);
  outline: none;
}
.panel:focus-visible {
  box-shadow: 0 0 0 2px #fafafa, 0 0 0 4px #0f766e;
}
.inner {
  padding: 20px 20px 16px;
}
.eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #737373;
}
.title {
  margin-top: 8px;
  font-size: 18px;
  font-weight: 650;
  letter-spacing: -0.02em;
}
.lede {
  margin-top: 10px;
  font-size: 13px;
  color: #404040;
}
.goal-card {
  margin-top: 18px;
  padding: 14px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #e5e5e5;
}
.goal-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.ring-wrap {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
}
.ring-wrap svg { display: block; width: 72px; height: 72px; }
.goal-meta {
  flex: 1;
  min-width: 0;
}
.goal-label {
  font-size: 12px;
  font-weight: 600;
  color: #171717;
}
.goal-nums {
  margin-top: 4px;
  font-size: 12px;
  color: #525252;
  font-variant-numeric: tabular-nums;
}
.delta-note {
  margin-top: 10px;
  font-size: 12px;
  color: #525252;
}
.framing {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #e5e5e5;
}
.framing p {
  margin: 0 0 8px;
  font-size: 12px;
  color: #404040;
}
fieldset.prompts {
  margin: 16px 0 0;
  padding: 0;
  border: none;
}
.prompts legend {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #737373;
  margin-bottom: 8px;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  border: 1px solid #d4d4d4;
  background: #fff;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
  color: #262626;
}
.chip[aria-pressed="true"] {
  border-color: #0f766e;
  background: #ecfdf5;
  color: #115e59;
}
.actions {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid transparent;
  text-decoration: none;
}
.btn-primary {
  background: #0f766e;
  color: #fff;
}
.btn-primary:hover { filter: brightness(1.05); }
.btn-quiet {
  background: #fff;
  border-color: #d4d4d4;
  color: #262626;
}
.btn-quiet:hover { border-color: #a3a3a3; }
.btn-ghost {
  background: transparent;
  color: #525252;
  border: none;
  padding: 8px;
  font-weight: 500;
}
.btn-ghost:hover { color: #171717; text-decoration: underline; }
.footer-hint {
  margin-top: 10px;
  font-size: 11px;
  color: #737373;
}
.header-row {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  gap: 8px;
}
.close-btn {
  border: none;
  background: transparent;
  color: #737373;
  font-size: 22px;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 8px;
}
.close-btn:hover { background: #f5f5f5; color: #171717; }
.badge-rec {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #0f766e;
}
.widget {
  position: fixed;
  right: 16px;
  bottom: 16px;
  z-index: 2147483641;
  width: min(300px, calc(100vw - 32px));
  background: #fafafa;
  border: 1px solid #e5e5e5;
  border-radius: 14px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.16);
  padding: 12px;
}
.widget-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.widget-mini {
  font-size: 11px;
  color: #525252;
  font-variant-numeric: tabular-nums;
}
.widget-bar {
  margin-top: 8px;
  height: 4px;
  background: #e5e5e5;
  border-radius: 999px;
  overflow: hidden;
}
.widget-fill {
  height: 100%;
  background: #0f766e;
  border-radius: 999px;
}
.widget-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.widget-actions button {
  flex: 1;
  min-width: 120px;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #d4d4d4;
  background: #fff;
}
.widget-actions .accent {
  background: #ecfdf5;
  border-color: #99f6e4;
  color: #115e59;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  border: 0;
}
.light .prompts { opacity: 0.85; }
.light .chip { padding: 5px 10px; font-size: 11px; }
`;

function deferKey(host: string): string {
  return `${DEFER_PREFIX}${host}`;
}

function sessionKey(): string {
  return `${SESSION_PREFIX}${location.hostname}${location.pathname}`;
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

function svgProgressRing(pct: number): string {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return `
    <svg viewBox="0 0 72 72" aria-hidden="true">
      <circle cx="36" cy="36" r="${r}" fill="none" stroke="#e5e5e5" stroke-width="6" />
      <circle cx="36" cy="36" r="${r}" fill="none" stroke="#0f766e" stroke-width="6"
        stroke-dasharray="${c}"
        stroke-dashoffset="${offset}"
        transform="rotate(-90 36 36)" />
    </svg>
  `;
}

function sendInterventionEvent(payload: {
  kind: "wait_24h" | "continue" | "minimize";
  host: string;
  cartTotal: number | null;
  friction: FrictionLevel;
  engagedPrompt?: boolean;
}) {
  try {
    const runtime = (globalThis as typeof globalThis & {
      chrome?: { runtime?: { sendMessage: (message: unknown) => void } };
    }).chrome?.runtime;
    runtime?.sendMessage({ action: "recordCartIntervention", payload });
  } catch {
    /* ignore */
  }
}

function mountShadow(host: HTMLElement): ShadowRoot {
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = styles;
  root.appendChild(style);
  return root;
}

export async function mountCartIntervention(
  website: WishlistItem["website"],
  kind: CartCheckoutKind
) {
  // Prevent duplicate overlays
  if (document.querySelector(`[${HOST_ATTR}]`)) return;

  // Load user state (savings goal, friction level, etc.)
  const state = await loadExtensionState();
  const goal = state?.config?.savingsGoal;
  const friction = state?.config?.friction || "standard";

  // Extract cart context (total, items)
  const cart = extractCartTotal(website);
  const cartTotal = cart ?? null;

  const deferUntil = readDeferUntil(location.hostname);
  if (deferUntil && deferUntil > Date.now()) {
    return;
  }

  const stats = await loadStoredCartInterventionStats();
  const adaptive = deriveAdaptiveIntervention(friction, stats, cartTotal);
  const pauseSeconds = Math.max(1.5, adaptive.pauseMs / 1000);
  const framing = state?.config
    ? buildPurchaseFraming(cartTotal, state.config, state.purchases)
    : null;
  const goalDelta =
    goal && cartTotal != null && state?.savings
      ? goalSkipDeltaCopy(
          cartTotal,
          state.savings.totalSaved,
          goal.amount,
          goal.label
        )
      : null;
  const supportingLines = [
    ...(goalDelta ? [goalDelta] : []),
    ...(framing?.supportingLines ?? []),
  ].slice(0, 3);
  const progressPct =
    goal && state?.savings
      ? Math.max(0, Math.min(100, (state.savings.totalSaved / goal.amount) * 100))
      : 0;
  const totalText =
    cartTotal == null
      ? "We could not read the cart total."
      : formatCurrency(cartTotal);
  const kindLabel = kind === "checkout" ? "Checkout checkpoint" : "Cart checkpoint";
  const frictionLabel =
    adaptive.friction === "strict"
      ? "Strong"
      : adaptive.friction === "light"
        ? "Light"
        : "Standard";

  // Create overlay
  const host = document.createElement("div");
  host.setAttribute(HOST_ATTR, "");
  host.innerHTML = `
    <div class="backdrop">
      <div class="panel" tabindex="-1">
        <div class="inner">
          <p class="eyebrow">${kindLabel}</p>
          <h1 class="title">${
            adaptive.friction === "strict"
              ? "Take the strong pause."
              : "Does this purchase still feel intentional?"
          }</h1>
          <p class="lede">${adaptive.explanation}</p>

          <div class="goal-card">
            <div class="goal-row">
              <div class="ring-wrap">
                ${svgProgressRing(progressPct)}
              </div>
              <div class="goal-meta">
                <p class="goal-label">${goal ? goal.label : "Your goal"}</p>
                <p class="goal-nums">${
                  goal
                    ? `${formatCurrency(state?.savings?.totalSaved ?? 0)} saved · ${formatCurrency(goal.amount)} goal`
                    : `${frictionLabel} friction`
                }</p>
              </div>
            </div>
            <p class="delta-note">${totalText}</p>
            ${supportingLines.map((line) => `<p class="lede">${line}</p>`).join("")}
          </div>

          <p class="footer-hint" data-pause-countdown>Hold to checkout · ${pauseSeconds.toFixed(0)}s</p>

          <div class="actions">
            <button class="btn-wait">Wait / Save for later</button>
            <button class="btn-continue" disabled>Continue to checkout</button>
            <button class="btn-close">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Inject styles into document
  if (!document.querySelector('style[data-pause-styles]')) {
    const styleTag = document.createElement('style');
    styleTag.setAttribute('data-pause-styles', '');
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);
    console.log('[Pause] style tag injected');
  }

  // Append to DOM
  console.log('[Pause] appending cart intervention overlay to DOM', { host: location.hostname });
  document.body.appendChild(host);
  console.log('[Pause] overlay appended', { exists: !!document.querySelector('[data-pause-cart-host]') });

  const continueButton = host.querySelector(
    ".btn-continue"
  ) as HTMLButtonElement | null;
  const countdown = host.querySelector("[data-pause-countdown]");
  if (continueButton) {
    const holdMs = pauseSeconds * 1000;
    const start = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, holdMs - elapsed);
      const remainingSeconds = Math.max(0, Math.ceil(remaining / 1000));
      if (countdown) {
        countdown.textContent = `Hold to checkout · ${remainingSeconds}s`;
      }
      if (remaining <= 0) {
        continueButton.disabled = false;
        window.clearInterval(interval);
      }
    }, 100);
  }

  // Add event listeners
  host.querySelector(".btn-wait")?.addEventListener("click", () => {
    localStorage.setItem(
      deferKey(location.hostname),
      String(Date.now() + 30 * 60 * 1000)
    );
    sendInterventionEvent({
      kind: "wait_24h",
      host: location.hostname,
      cartTotal,
      friction: adaptive.friction,
    });
    host.remove();
  });

  host.querySelector(".btn-continue")?.addEventListener("click", () => {
    sendInterventionEvent({
      kind: "continue",
      host: location.hostname,
      cartTotal,
      friction: adaptive.friction,
      engagedPrompt: true,
    });
    host.remove();
  });

  host.querySelector(".btn-close")?.addEventListener("click", () => {
    localStorage.setItem(
      deferKey(location.hostname),
      String(Date.now() + 10 * 60 * 1000)
    );
    sendInterventionEvent({
      kind: "minimize",
      host: location.hostname,
      cartTotal,
      friction: adaptive.friction,
    });
    host.remove();
  });
}
