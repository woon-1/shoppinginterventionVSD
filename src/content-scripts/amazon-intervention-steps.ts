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
  "Why do you need this?",
  "Would you still buy this tomorrow?",
  "What are you giving up by buying this now?",
  "Is this purchase planned, urgent, or emotional?",
];

const reasonOptions = ['Need', 'Want', 'Replacement', 'Gift', 'Stress/Boredom', 'Not sure'];

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

.pause-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 24px;
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
  modal.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    const actionButton = target.closest<HTMLButtonElement>('[data-pause-action]');
    if (!actionButton) {
      return;
    }

    const action = actionButton.dataset.pauseAction;
    const reason = actionButton.dataset.reason;

    if (action === 'next') {
      const steps: InterventionStep[] = ['pause', 'timer', 'reflection', 'impact', 'decision'];
      const idx = steps.indexOf(currentStep);
      if (idx < steps.length - 1) {
        currentStep = steps[idx + 1];
        renderStep();
      }
      return;
    }

    if (action === 'reason' && reason) {
      userResponses.reasonSelected = reason;
      userResponses.reflectionAnswered = true;

      modal.querySelectorAll<HTMLButtonElement>('[data-pause-action="reason"]').forEach((chip) => {
        chip.setAttribute('aria-pressed', chip.dataset.reason === reason ? 'true' : 'false');
      });
      return;
    }

    if (action === 'checkout') {
      console.log('[Pause] User chose to continue to checkout');
      modal.remove();
      return;
    }

    if (action === 'save-for-later') {
      console.log('[Pause] User chose to save for later', userResponses);
      modal.remove();
      // TODO: Implement save to wishlist / dashboard redirect
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
    }
  });
  
  let currentStep: InterventionStep = 'pause';
  let userResponses = {
    reflectionAnswered: false,
    reasonSelected: '',
  };

  // Inject styles
  if (!document.querySelector('style[data-pause-multi-steps]')) {
    const styleTag = document.createElement('style');
    styleTag.setAttribute('data-pause-multi-steps', '');
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);
  }

  function renderStep() {
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

        <button class="pause-btn pause-btn-primary" data-pause-action="next">
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

        <button class="pause-btn pause-btn-primary" id="pause-timer-btn" data-pause-action="next" disabled>
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
      html += `
        <p class="pause-eyebrow">Quick reflection</p>
        <h1 class="pause-title">What is this purchase for?</h1>
        
        <div class="pause-questions">
      `;
      
      for (let i = 0; i < config.reflectionCount && i < reflectionQuestions.length; i++) {
        html += `<div class="pause-question">${i + 1}. ${reflectionQuestions[i]}</div>`;
      }

      html += `
          <div class="pause-reason-chips">
            ${reasonOptions.map(reason => `
              <button class="pause-chip" data-pause-action="reason" data-reason="${reason}">
                ${reason}
              </button>
            `).join('')}
          </div>
        </div>

        <button class="pause-btn pause-btn-primary" data-pause-action="next">
          I've thought it through
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

        <button class="pause-btn pause-btn-primary" data-pause-action="next">
          Ready to decide
        </button>
      `;
    } else if (currentStep === 'decision') {
      html += `
        <p class="pause-eyebrow">What's your choice?</p>
        <h1 class="pause-title">Your call.</h1>
        
        <div class="pause-actions">
          <button class="pause-btn pause-btn-primary" data-pause-action="checkout">
            Continue to checkout
          </button>
          <button class="pause-btn pause-btn-secondary" data-pause-action="save-for-later">
            Wait / Save for later
          </button>
          <button class="pause-btn pause-btn-secondary" data-pause-action="review-plan">
            Review my spending plan
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
