/**
 * Multi-step Amazon cart intervention flow
 * Guides user through pause, reflection, and conscious decision
 */

import type { FrictionLevel } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import type { AmazonCartData } from "@/lib/amazon-cart-data";

type InterventionStep = 'pause' | 'timer' | 'reflection' | 'impact' | 'decision';

interface StepConfig {
  timerSeconds: number;
  reflectionCount: number;
  requireJustification: boolean;
}

const frictionConfigs: Record<FrictionLevel, StepConfig> = {
  light: { timerSeconds: 15, reflectionCount: 1, requireJustification: false },
  standard: { timerSeconds: 30, reflectionCount: 2, requireJustification: false },
  strict: { timerSeconds: 60, reflectionCount: 3, requireJustification: true },
};

const reflectionQuestions = [
  "Do I actually need this-or do I just want it right now?",
  "Would I feel good about this purchase tomorrow?",
  "What am I giving up by spending this today?",
];

const reflectionReasonGroups = [
  {
    label: 'Primary intent',
    options: ['Need', 'Replace something broken', 'Planned purchase'],
  },
  {
    label: 'Impulse signals',
    options: ['Want it right now', 'Bored / stressed', "It's a deal / urgency"],
  },
  {
    label: 'Uncertainty',
    options: ['Not sure yet'],
  },
] as const;

const impulseReasons = new Set(['Want it right now', 'Bored / stressed', "It's a deal / urgency"]);
const primaryIntentReasons = new Set(['Need', 'Replace something broken', 'Planned purchase']);

function isImpulseReasonSelected(reasons: string[]): boolean {
  return reasons.some((reason) => impulseReasons.has(reason));
}

function hasOnlyPrimaryIntent(reasons: string[]): boolean {
  return reasons.length > 0 && reasons.every((reason) => primaryIntentReasons.has(reason));
}

function getMicroFeedback(reasons: string[]): string | null {
  if (reasons.includes('Bored / stressed')) {
    return 'This feeling might pass-want to give it a bit?';
  }
  if (reasons.includes('Want it right now')) {
    return 'Impulse fades quickly. You can always come back.';
  }
  if (reasons.includes("It's a deal / urgency")) {
    return 'Urgency can feel loud in the moment. A short wait can clarify things.';
  }
  if (reasons.includes('Not sure yet')) {
    return "That's usually a good moment to wait.";
  }
  if (reasons.includes('Need')) {
    return 'Makes sense-just double check timing.';
  }
  if (reasons.includes('Planned purchase')) {
    return 'Planned helps. Check if now is still the best moment.';
  }
  if (reasons.includes('Replace something broken')) {
    return 'Totally fair-if it can wait a little, you can still choose with a clear head.';
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function sendMessage<T>(message: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    const runtime = (globalThis as any).chrome?.runtime;
    if (!runtime?.sendMessage) {
      reject(new Error('chrome.runtime.sendMessage unavailable'));
      return;
    }

    runtime.sendMessage(message, (response: T) => {
      const lastError = (globalThis as any).chrome?.runtime?.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

function dashboardUrl(): string {
  const runtime = (globalThis as any).chrome?.runtime;
  return runtime?.getURL ? runtime.getURL('dashboard.html') : '/dashboard';
}

const styles = `
:root {
  --pause-primary: #0f766e;
  --pause-secondary: #ecfdf5;
  --pause-bg: #fafafa;
  --pause-border: #e5e5e5;
  --pause-text: #171717;
  --pause-muted: #525252;
}

.pause-intervention-modal {
  position: fixed;
  inset: 0;
  z-index: 2147483640;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.5);
  padding: 24px;
  font-family: system-ui, -apple-system, sans-serif;
}

.pause-panel {
  width: min(480px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  background: var(--pause-bg);
  border: 1px solid var(--pause-border);
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
  padding: 32px;
}

.pause-eyebrow {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #737373;
  margin-bottom: 8px;
}

.pause-title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--pause-text);
  margin: 0 0 16px;
}

.pause-description {
  font-size: 14px;
  line-height: 1.5;
  color: var(--pause-muted);
  margin-bottom: 24px;
}

.pause-card {
  background: #fff;
  border: 1px solid var(--pause-border);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.pause-card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.pause-card-row:last-child {
  margin-bottom: 0;
}

.pause-card-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--pause-muted);
}

.pause-card-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--pause-text);
}

.pause-timer {
  text-align: center;
  margin: 32px 0;
}

.pause-timer-display {
  font-size: 64px;
  font-weight: 700;
  color: var(--pause-primary);
  line-height: 1;
  margin-bottom: 8px;
}

.pause-timer-label {
  font-size: 14px;
  color: var(--pause-muted);
}

.pause-timer-bar {
  width: 100%;
  height: 6px;
  background: var(--pause-border);
  border-radius: 999px;
  overflow: hidden;
  margin-top: 12px;
}

.pause-timer-fill {
  height: 100%;
  background: var(--pause-primary);
  border-radius: 999px;
  transition: width 0.1s linear;
}

.pause-questions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.pause-question {
  font-size: 14px;
  font-weight: 600;
  color: var(--pause-text);
  margin-bottom: 8px;
}

.pause-question-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pause-reason-group {
  margin-top: 12px;
}

.pause-reason-group-label {
  display: inline-block;
  margin-bottom: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #737373;
}

.pause-reason-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.pause-chip {
  border: 1px solid var(--pause-border);
  background: #fff;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.pause-chip:hover {
  border-color: var(--pause-primary);
  background: var(--pause-secondary);
}

.pause-chip[aria-pressed="true"] {
  border-color: var(--pause-primary);
  background: var(--pause-secondary);
  color: var(--pause-primary);
}

.pause-micro-feedback {
  margin-top: 10px;
  font-size: 13px;
  color: #0f766e;
  background: #ecfdf5;
  border: 1px solid #99f6e4;
  border-radius: 10px;
  padding: 10px 12px;
}

.pause-required-note {
  margin-top: 10px;
  font-size: 12px;
  color: #737373;
}

.pause-required-note.alert {
  color: #b91c1c;
}

.pause-spend-callout {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #99f6e4;
  background: #ecfdf5;
  font-size: 18px;
  font-weight: 700;
  color: #0f766e;
  text-align: center;
}

.pause-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 24px;
}

.pause-saving-log {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
  font-size: 13px;
  color: var(--pause-text);
}

.pause-saving-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid var(--pause-border);
}

.pause-saving-line.done {
  border-color: var(--pause-primary);
  color: var(--pause-primary);
  font-weight: 700;
}

.pause-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.pause-btn-primary {
  background: var(--pause-primary);
  color: #fff;
}

.pause-btn-hero {
  padding: 16px 18px;
  font-size: 16px;
  box-shadow: 0 10px 20px rgba(15, 118, 110, 0.18);
}

.pause-btn-wait-emphasis {
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.2), 0 12px 22px rgba(15, 118, 110, 0.24);
}

.pause-btn-primary:hover:not(:disabled) {
  filter: brightness(1.05);
}

.pause-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pause-btn-secondary {
  background: #fff;
  border: 1px solid var(--pause-border);
  color: var(--pause-text);
}

.pause-btn-quiet {
  padding: 10px 14px;
  font-size: 13px;
  opacity: 0.92;
}

.pause-btn-secondary:hover {
  border-color: var(--pause-primary);
  color: var(--pause-primary);
}

.pause-progress {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  font-size: 12px;
  color: var(--pause-muted);
}

.pause-step-indicator {
  display: flex;
  gap: 8px;
}

.pause-step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--pause-border);
  transition: all 0.2s;
}

.pause-step-dot.active {
  background: var(--pause-primary);
  transform: scale(1.25);
}

.pause-step-dot.complete {
  background: var(--pause-primary);
}
`;

export async function mountAmazonInterventionSteps(
  cartData: AmazonCartData,
  friction: FrictionLevel,
  savingsGoal: { amount: number; label: string; saved: number } | null
) {
  // Prevent duplicates
  if (document.querySelector('[data-pause-intervention]')) {
    return;
  }

  const config = frictionConfigs[friction];
  const modal = document.createElement('div');
  modal.setAttribute('data-pause-intervention', 'true');
  let currentStep: InterventionStep = 'pause';
  let userResponses = {
    reflectionAnswered: false,
    selectedReasons: [] as string[],
  };
  let reflectionTriedWithoutSelection = false;
  let isSaving = false;
  let saveLines: string[] = [];
  let savedCount = 0;

  async function handleSaveForLater() {
    if (isSaving) return;
    isSaving = true;
    savedCount = 0;

    saveLines = ['Saving items to your Pause wishlist...'];

    for (let index = 0; index < cartData.items.length; index += 1) {
      savedCount = index + 1;
      saveLines = [...saveLines, `Saved ${index + 1} of ${cartData.items.length}`];
      renderStep();
      await sleep(180);
    }

    if (cartData.items.length === 0) {
      saveLines = [...saveLines, 'Saved 0 of 0'];
    }

    saveLines = [...saveLines, 'Done'];
    renderStep();
  await sleep(250);

    const payload = {
      id: `amazon-pause-${Date.now()}`,
      sourceSite: 'amazon' as const,
      sourceUrl: window.location.href,
      pausedAt: Date.now(),
      cartSubtotal: cartData.subtotal,
      itemCount: cartData.itemCount,
      amountAvoided: cartData.subtotal ?? 0,
      currency: cartData.currency,
      items: cartData.items.map((item, index) => ({
        id: `${Date.now()}-${index}-${item.name.slice(0, 12).replace(/\s+/g, '-')}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        productUrl: item.productUrl,
        imageUrl: item.imageUrl,
        pausedAt: Date.now(),
        sourceSite: 'amazon' as const,
      })),
    };

    try {
      const response = await sendMessage<{ ok: boolean; error?: string }>({
        action: 'saveAmazonPauseCart',
        payload,
      });

      if (!response?.ok) {
        throw new Error(response?.error || 'Failed to save Amazon pause session');
      }
    } catch (err) {
      console.warn('[Pause] could not save pause session through extension', err);
      window.location.assign(dashboardUrl());
    }
  }

  modal.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (!target || isSaving) {
      return;
    }

    const actionButton = target.closest<HTMLButtonElement>('[data-pause-action]');
    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.pauseAction;
    const reason = actionButton.dataset.reason;

    if (action === 'back') {
      const steps: InterventionStep[] = ['pause', 'timer', 'reflection', 'impact', 'decision'];
      const idx = steps.indexOf(currentStep);
      if (idx > 0) {
        currentStep = steps[idx - 1];
        renderStep();
      }
      return;
    }

    if (action === 'next') {
      if (currentStep === 'reflection') {
        if (userResponses.selectedReasons.length === 0) {
          reflectionTriedWithoutSelection = true;
          renderStep();
          return;
        }

        reflectionTriedWithoutSelection = false;
        userResponses.reflectionAnswered = true;
        currentStep = hasOnlyPrimaryIntent(userResponses.selectedReasons) ? 'decision' : 'impact';
        renderStep();
        return;
      }

      const steps: InterventionStep[] = ['pause', 'timer', 'reflection', 'impact', 'decision'];
      const idx = steps.indexOf(currentStep);
      if (idx < steps.length - 1) {
        currentStep = steps[idx + 1];
        renderStep();
      }
      return;
    }

    if (action === 'reason' && reason) {
      if (userResponses.selectedReasons.includes(reason)) {
        userResponses.selectedReasons = userResponses.selectedReasons.filter((item) => item !== reason);
      } else {
        userResponses.selectedReasons = [...userResponses.selectedReasons, reason];
      }
      if (userResponses.selectedReasons.length > 0) {
        reflectionTriedWithoutSelection = false;
      }
      renderStep();
      return;
    }

    if (action === 'checkout') {
      console.log('[Pause] User chose to continue to checkout');
      modal.remove();
      return;
    }

    if (action === 'save-for-later') {
      void handleSaveForLater();
      return;
    }

    if (action === 'review-plan') {
      console.log('[Pause] User chose to review spending plan');
      try {
        const runtime = (globalThis as any).chrome?.runtime;
        runtime?.sendMessage({ action: 'openDashboard' });
      } catch (err) {
        console.warn('[Pause] could not open dashboard', err);
        window.location.href = '/dashboard';
      }
      return;
    }
  });

  // Inject styles
  if (!document.querySelector('style[data-pause-multi-steps]')) {
    const styleTag = document.createElement('style');
    styleTag.setAttribute('data-pause-multi-steps', '');
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);
  }

  function renderStep() {
    if (isSaving) {
      modal.innerHTML = `
        <div class="pause-intervention-modal">
          <div class="pause-panel">
            <p class="pause-eyebrow">Saving pause</p>
            <h1 class="pause-title">Saving items to your Pause wishlist...</h1>
            <p class="pause-description">Please hold while we store this cart in your extension dashboard.</p>
            <div class="pause-card">
              <div class="pause-card-row">
                <span class="pause-card-label">Progress</span>
                <span class="pause-card-value">${savedCount} of ${cartData.items.length}</span>
              </div>
            </div>
            <div class="pause-saving-log">
              ${saveLines.map((line) => `<div class="pause-saving-line ${line === 'Done' ? 'done' : ''}">${line}</div>`).join('')}
            </div>
          </div>
        </div>
      `;
      return;
    }

    let html = '';
    const stepIndex = ['pause', 'timer', 'reflection', 'impact', 'decision'].indexOf(currentStep);
    const totalSteps = 5;

    // Progress indicator
    html += `
      <div class="pause-progress">
        <span>Step ${stepIndex + 1} of ${totalSteps}</span>
        <div class="pause-step-indicator">
    `;
    for (let i = 0; i < totalSteps; i++) {
      const isBefore = i < stepIndex;
      const isCurrent = i === stepIndex;
      html += `<div class="pause-step-dot ${isBefore ? 'complete' : ''} ${isCurrent ? 'active' : ''}"></div>`;
    }
    html += `</div></div>`;

    if (currentStep === 'pause') {
      html += `
        <p class="pause-eyebrow">Cart checkpoint</p>
        <h1 class="pause-title">Pause before checkout.</h1>
        <p class="pause-description">This is a decision point, not a block. Take a moment before continuing.</p>
        
        <div class="pause-card">
          <div class="pause-card-row">
            <span class="pause-card-label">Items in cart</span>
            <span class="pause-card-value">${cartData.itemCount}</span>
          </div>
          <div class="pause-card-row">
            <span class="pause-card-label">Subtotal</span>
            <span class="pause-card-value">${cartData.subtotal ? formatCurrency(cartData.subtotal) : 'Unknown'}</span>
          </div>
          ${savingsGoal ? `
          <div class="pause-card-row">
            <span class="pause-card-label">Toward your goal</span>
            <span class="pause-card-value">${Math.round((savingsGoal.saved / savingsGoal.amount) * 100)}%</span>
          </div>
          ` : ''}
        </div>

        <button class="pause-btn pause-btn-primary pause-btn-hero" data-pause-action="next">
          Take a pause
        </button>
      `;
    } else if (currentStep === 'timer') {
      const timerKey = `__pauseTimer_${Date.now()}`;
      html += `
        <p class="pause-eyebrow">Give yourself a moment</p>
        <h1 class="pause-title">Count to ${config.timerSeconds}.</h1>
        <p class="pause-description">Let the impulse settle. After the timer, you can choose what to do.</p>
        
        <div class="pause-timer">
          <div class="pause-timer-display" id="pause-timer-count">${config.timerSeconds}</div>
          <div class="pause-timer-label">seconds</div>
          <div class="pause-timer-bar">
            <div class="pause-timer-fill" id="pause-timer-fill"></div>
          </div>
        </div>

        <button class="pause-btn pause-btn-primary pause-btn-quiet" id="pause-timer-btn" data-pause-action="next" disabled>
          Continue (wait...)
        </button>
      `;

      // Timer logic (will be set up after DOM update)
      setTimeout(() => {
        const timerDisplay = document.getElementById('pause-timer-count');
        const timerFill = document.getElementById('pause-timer-fill');
        const timerBtn = document.getElementById('pause-timer-btn') as HTMLButtonElement | null;
        if (!timerDisplay || !timerFill || !timerBtn) return;

        let remaining = config.timerSeconds;
        const interval = setInterval(() => {
          remaining--;
          const pct = (1 - remaining / config.timerSeconds) * 100;
          timerDisplay.textContent = String(Math.max(0, remaining));
          timerFill.style.width = `${pct}%`;

          if (remaining <= 0) {
            clearInterval(interval);
            timerBtn.disabled = false;
            timerBtn.textContent = 'Continue';
          }
        }, 1000);
      }, 50);
    } else if (currentStep === 'reflection') {
      const activeQuestions = reflectionQuestions.slice(0, Math.max(2, Math.min(3, config.reflectionCount)));
      const selectedCount = userResponses.selectedReasons.length;
      const microFeedback = getMicroFeedback(userResponses.selectedReasons);
      const subtotalText = cartData.subtotal ? formatCurrency(cartData.subtotal) : 'this total';
      html += `
        <p class="pause-eyebrow">Pause check</p>
        <h1 class="pause-title">Pause-what's really behind this?</h1>
        <p class="pause-description">Be honest-this is just for you.</p>
        
        <div class="pause-questions">
      `;
      
      html += `<div class="pause-question-list">`;
      for (let i = 0; i < activeQuestions.length; i++) {
        html += `<div class="pause-question">${i + 1}. ${activeQuestions[i]}</div>`;
      }
      html += `</div>`;

      html += `
          ${reflectionReasonGroups.map((group) => `
            <div class="pause-reason-group">
              <span class="pause-reason-group-label">${group.label}</span>
              <div class="pause-reason-chips">
                ${group.options.map((reason) => `
                  <button
                    class="pause-chip"
                    data-pause-action="reason"
                    data-reason="${reason}"
                    aria-pressed="${userResponses.selectedReasons.includes(reason) ? 'true' : 'false'}"
                  >
                    ${reason}
                  </button>
                `).join('')}
              </div>
            </div>
          `).join('')}

          ${microFeedback ? `<p class="pause-micro-feedback">${microFeedback}</p>` : ''}

          <div class="pause-spend-callout">You're about to spend ${subtotalText}.</div>

          <p class="pause-required-note ${reflectionTriedWithoutSelection ? 'alert' : ''}">
            ${selectedCount > 0 ? `Selected ${selectedCount} signal${selectedCount === 1 ? '' : 's'}.` : 'Select at least one signal to continue.'}
          </p>
        </div>

        <button class="pause-btn pause-btn-secondary pause-btn-quiet" data-pause-action="next" ${selectedCount === 0 ? 'disabled' : ''}>
          I still want this
        </button>
      `;
    } else if (currentStep === 'impact') {
      const impact = cartData.subtotal && savingsGoal
        ? ((cartData.subtotal / savingsGoal.amount) * 100).toFixed(1)
        : null;

      html += `
        <p class="pause-eyebrow">How this affects your goal</p>
        <h1 class="pause-title">Your purchase impact.</h1>
        
        ${impact && savingsGoal ? `
          <div class="pause-card">
            <div class="pause-card-row">
              <span class="pause-card-label">This purchase</span>
              <span class="pause-card-value">${formatCurrency(cartData.subtotal || 0)}</span>
            </div>
            <div class="pause-card-row">
              <span class="pause-card-label">% of your goal</span>
              <span class="pause-card-value">${impact}%</span>
            </div>
            <div class="pause-card-row">
              <span class="pause-card-label">${savingsGoal.label}</span>
              <span class="pause-card-value">${Math.round((savingsGoal.saved / savingsGoal.amount) * 100)}%</span>
            </div>
          </div>
        ` : `
          <div class="pause-card">
            <div class="pause-card-row">
              <span class="pause-card-label">Cart total</span>
              <span class="pause-card-value">${cartData.subtotal ? formatCurrency(cartData.subtotal) : 'Unknown'}</span>
            </div>
          </div>
        `}

        <p class="pause-description">
          ${impact && parseFloat(impact) > 10 ? 'This is a significant purchase. ' : ''}
          Saving this for later keeps you closer to your plan.
        </p>

        <button class="pause-btn pause-btn-primary pause-btn-hero" data-pause-action="next">
          Ready to decide
        </button>
      `;
    } else if (currentStep === 'decision') {
      const impulseSelected = isImpulseReasonSelected(userResponses.selectedReasons);
      html += `
        <p class="pause-eyebrow">What's your choice?</p>
        <h1 class="pause-title">Your call.</h1>
        ${cartData.subtotal ? `<div class="pause-spend-callout">You're about to spend ${formatCurrency(cartData.subtotal)}.</div>` : ''}
        ${impulseSelected ? `<p class="pause-micro-feedback">You flagged an impulse signal. Waiting 24 hours may make this choice easier.</p>` : ''}
        
        <div class="pause-actions">
          <button class="pause-btn pause-btn-secondary pause-btn-quiet" data-pause-action="checkout">
            Continue anyway
          </button>
          <button class="pause-btn pause-btn-primary pause-btn-hero ${impulseSelected ? 'pause-btn-wait-emphasis' : ''}" data-pause-action="save-for-later">
            Wait / Save for later
          </button>
          <button class="pause-btn pause-btn-secondary pause-btn-quiet" data-pause-action="review-plan">
            Review my spending plan
          </button>
          <button class="pause-btn pause-btn-secondary pause-btn-quiet" data-pause-action="back">
            Back
          </button>
        </div>
      `;
    }

    modal.innerHTML = `<div class="pause-intervention-modal"><div class="pause-panel">${html}</div></div>`;
  }

  renderStep();
  document.body.appendChild(modal);
  console.log('[Pause] Multi-step intervention mounted');
}
