import type { FrictionLevel, WishlistItem } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { buildPurchaseFraming, goalSkipDeltaCopy } from "./cart-framing";
import { extractCartTotal } from "./cart-price";
import type { CartCheckoutKind } from "./cart-detection";
import { loadExtensionState } from "./utils";

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
}) {
  try {
    chrome.runtime.sendMessage({
      action: "recordCartIntervention",
      payload,
    });
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
): Promise<void> {
  if (typeof document === "undefined" || !document.body) return;
  if (document.querySelector(`[${HOST_ATTR}]`)) return;

  const state = await loadExtensionState();
  const config = state?.config;
  if (!config?.onboardingComplete) return;

  const hostName = location.hostname;
  const until = readDeferUntil(hostName);
  if (until != null && until > Date.now()) return;

  const sk = sessionKey();
  if (sessionStorage.getItem(sk)) return;

  let cartTotal = extractCartTotal(website);
  if (cartTotal == null || cartTotal <= 0) {
    await new Promise((r) => setTimeout(r, 600));
    cartTotal = extractCartTotal(website);
  }

  const friction = config.friction ?? "standard";
  const savings = state!.savings;
  const goal = config.savingsGoal;
  const goalAmount = goal?.amount ?? 0;
  const saved = savings.totalSaved;
  const goalPct =
    goalAmount > 0 ? Math.min(100, Math.round((saved / goalAmount) * 100)) : 0;

  const framing = buildPurchaseFraming(cartTotal, config, state!.purchases);
  const skipCopy =
    goal && goalAmount > 0
      ? goalSkipDeltaCopy(cartTotal, saved, goalAmount, goal.label)
      : null;

  const goalType =
    config.interventionPreferences?.goalTypeLabel?.trim() || goal?.label;

  const host = document.createElement("div");
  host.setAttribute(HOST_ATTR, "true");
  host.setAttribute(
    "aria-live",
    friction === "light" ? "polite" : "assertive"
  );

  const shadow = mountShadow(host);
  document.body.appendChild(host);

  const place = kind === "checkout" ? "checkout" : "cart";

  let detachEscape: (() => void) | null = null;

  function collapseToWidget(mode: "wait" | "idle") {
    detachEscape?.();
    detachEscape = null;
    sessionStorage.setItem(sk, "1");
    shadow.innerHTML = "";
    const style = document.createElement("style");
    style.textContent = styles;
    shadow.appendChild(style);

    const w = document.createElement("aside");
    w.className = "widget";
    w.setAttribute("role", "complementary");
    w.setAttribute(
      "aria-label",
      "Pause: savings progress and quick actions"
    );

    const row = document.createElement("div");
    row.className = "widget-row";
    const left = document.createElement("div");
    const wTitle = document.createElement("div");
    wTitle.style.fontWeight = "650";
    wTitle.style.fontSize = "13px";
    wTitle.style.color = "#171717";
    wTitle.textContent = "Pause";
    const wSub = document.createElement("div");
    wSub.className = "widget-mini";
    wSub.textContent = goalType
      ? `${goalType} · ${goalPct}%`
      : `Progress toward your goal · ${goalPct}%`;
    left.append(wTitle, wSub);
    row.appendChild(left);

    const bar = document.createElement("div");
    bar.className = "widget-bar";
    const fill = document.createElement("div");
    fill.className = "widget-fill";
    fill.style.width = `${goalPct}%`;
    bar.appendChild(fill);

    const actions = document.createElement("div");
    actions.className = "widget-actions";

    const reopen = document.createElement("button");
    reopen.type = "button";
    reopen.className = "accent";
    reopen.textContent = "Open pause";
    reopen.addEventListener("click", () => {
      sessionStorage.removeItem(sk);
      host.remove();
      void mountCartIntervention(website, kind);
    });

    const cont = document.createElement("button");
    cont.type = "button";
    cont.textContent = "Continue shopping";
    cont.addEventListener("click", () => {
      host.remove();
    });

    actions.append(reopen, cont);
    w.append(row, bar, actions);

    if (mode === "wait") {
      const note = document.createElement("p");
      note.style.cssText =
        "margin:10px 0 0;font-size:11px;color:#525252;line-height:1.4";
      note.textContent =
        "You chose a 24-hour pause on this site. Come back anytime; this chip stays out of your way.";
      w.appendChild(note);
    }

    shadow.appendChild(w);
  }

  function renderModal() {
    const wrap = document.createElement("div");
    wrap.className = `backdrop ${friction === "light" ? "light" : ""}`;

    const panel = document.createElement("div");
    panel.className = "panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "pause-dialog-title");
    panel.setAttribute("aria-describedby", "pause-dialog-desc");
    panel.tabIndex = -1;

    const inner = document.createElement("div");
    inner.className = "inner";

    const headerRow = document.createElement("div");
    headerRow.className = "header-row";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "close-btn";
    closeBtn.setAttribute("aria-label", "Minimize pause panel");
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", () => {
      sendInterventionEvent({
        kind: "minimize",
        host: hostName,
        cartTotal,
        friction,
      });
      collapseToWidget("idle");
    });

    headerRow.appendChild(closeBtn);

    const eyebrow = document.createElement("div");
    eyebrow.className = "eyebrow";
    eyebrow.textContent =
      place === "checkout" ? "At checkout" : "In your cart";

    const title = document.createElement("h2");
    title.className = "title";
    title.id = "pause-dialog-title";
    title.textContent = "A pause, not a stop";

    const lede = document.createElement("p");
    lede.className = "lede";
    lede.id = "pause-dialog-desc";
    lede.textContent =
      friction === "light"
        ? "A short checkpoint so your spending can follow what you care about — you can always continue."
        : "You’re in control. This is a gentle checkpoint to align this moment with your goals — without shame or pressure.";

    inner.append(headerRow, eyebrow, title, lede);

    if (goal && goalAmount > 0) {
      const gc = document.createElement("div");
      gc.className = "goal-card";
      const row = document.createElement("div");
      row.className = "goal-row";

      const ring = document.createElement("div");
      ring.className = "ring-wrap";
      ring.innerHTML = svgProgressRing(goalPct);
      ring.setAttribute("aria-hidden", "true");

      const meta = document.createElement("div");
      meta.className = "goal-meta";

      const gl = document.createElement("div");
      gl.className = "goal-label";
      gl.textContent = goal.label;

      const nums = document.createElement("div");
      nums.className = "goal-nums";
      nums.textContent = `${formatCurrency(saved)} of ${formatCurrency(
        goalAmount
      )} · ${goalPct}%`;

      meta.append(gl, nums);
      row.append(ring, meta);
      gc.appendChild(row);

      if (skipCopy && friction !== "light") {
        const dn = document.createElement("p");
        dn.className = "delta-note";
        dn.textContent = skipCopy;
        gc.appendChild(dn);
      }

      inner.appendChild(gc);
    } else if (friction !== "light") {
      const hint = document.createElement("div");
      hint.className = "goal-card";
      const hl = document.createElement("div");
      hl.className = "goal-label";
      hl.textContent = "Savings snapshot";
      const sub = document.createElement("div");
      sub.className = "goal-nums";
      sub.style.marginTop = "6px";
      sub.textContent =
        "You haven't set a named goal in Pause yet — totals still help you reflect.";
      hint.append(hl, sub);
      inner.appendChild(hint);
    }

    const framingEl = document.createElement("div");
    framingEl.className = "framing";
    const fh = document.createElement("p");
    fh.style.fontWeight = "600";
    fh.style.color = "#262626";
    fh.style.fontSize = "13px";
    fh.textContent = framing.headline;
    framingEl.appendChild(fh);
    for (const line of framing.supportingLines) {
      const p = document.createElement("p");
      p.textContent = line;
      framingEl.appendChild(p);
    }
    inner.appendChild(framingEl);

    if (friction !== "light") {
      const fs = document.createElement("fieldset");
      fs.className = "prompts";
      const leg = document.createElement("legend");
      leg.textContent = "Optional reflections";
      fs.appendChild(leg);

      const chips = document.createElement("div");
      chips.className = "chips";

      const prompts: { id: string; label: string }[] = [
        { id: "tomorrow", label: "Still want this after a day?" },
        { id: "priorities", label: "Fits my priorities right now?" },
        { id: "elsewhere", label: "What else could this cover?" },
      ];

      for (const pr of prompts) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.setAttribute("aria-pressed", "false");
        b.textContent = pr.label;
        b.addEventListener("click", () => {
          const pressed = b.getAttribute("aria-pressed") === "true";
          b.setAttribute("aria-pressed", pressed ? "false" : "true");
        });
        chips.appendChild(b);
      }
      fs.appendChild(chips);
      inner.appendChild(fs);
    }

    const actions = document.createElement("div");
    actions.className = "actions";

    const waitRow = document.createElement("div");
    waitRow.style.display = "flex";
    waitRow.style.alignItems = "center";
    waitRow.style.gap = "8px";
    waitRow.style.width = "100%";

    const waitBtn = document.createElement("button");
    waitBtn.type = "button";
    waitBtn.className = "btn btn-primary";
    waitBtn.style.flex = "1";
    waitBtn.textContent = "Wait 24 hours";

    if (friction === "strict") {
      const rec = document.createElement("span");
      rec.className = "badge-rec";
      rec.textContent = "Suggested";
      waitRow.appendChild(waitBtn);
      waitRow.appendChild(rec);
    } else {
      waitRow.appendChild(waitBtn);
    }

    const continueBtn = document.createElement("button");
    continueBtn.type = "button";
    continueBtn.className = "btn btn-quiet";
    continueBtn.textContent = "Continue to checkout";

    const saveLater = document.createElement("button");
    saveLater.type = "button";
    saveLater.className = "btn btn-ghost";
    saveLater.textContent = "Save for later on this device";

    waitBtn.addEventListener("click", () => {
      try {
        localStorage.setItem(deferKey(hostName), String(Date.now() + 86400000));
      } catch {
        /* ignore */
      }
      sendInterventionEvent({
        kind: "wait_24h",
        host: hostName,
        cartTotal,
        friction,
      });
      collapseToWidget("wait");
    });

    continueBtn.addEventListener("click", () => {
      sendInterventionEvent({
        kind: "continue",
        host: hostName,
        cartTotal,
        friction,
      });
      collapseToWidget("idle");
    });

    saveLater.addEventListener("click", () => {
      sendInterventionEvent({
        kind: "minimize",
        host: hostName,
        cartTotal,
        friction,
      });
      collapseToWidget("idle");
    });

    actions.appendChild(waitRow);
    actions.appendChild(continueBtn);
    actions.appendChild(saveLater);

    const hint = document.createElement("p");
    hint.className = "footer-hint";
    hint.textContent =
      "Nothing here locks checkout — Pause only adds space to choose.";

    inner.appendChild(actions);
    inner.appendChild(hint);

    panel.appendChild(inner);
    wrap.appendChild(panel);

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      sendInterventionEvent({
        kind: "minimize",
        host: hostName,
        cartTotal,
        friction,
      });
      collapseToWidget("idle");
    };
    document.addEventListener("keydown", onKey);
    detachEscape = () => document.removeEventListener("keydown", onKey);

    shadow.appendChild(wrap);

    requestAnimationFrame(() => {
      panel.focus();
    });
  }

  renderModal();
}
