/**
 * Amazon cart data extraction
 * Flexible, fallback-safe scraping of cart subtotal, item count, and item details
 */

export interface AmazonCartData {
  subtotal: number | null;
  itemCount: number;
  items: Array<{ name: string; price: number | null }>;
  currency: string;
}

function extractCurrencySymbol(): string {
  const text = document.body.innerText.slice(0, 5000);
  if (text.includes('$')) return '$';
  if (text.includes('€')) return '€';
  if (text.includes('£')) return '£';
  return '$';
}

function parsePrice(str: string): number | null {
  if (!str) return null;
  const match = str.match(/[\d,.]+/);
  if (!match) return null;
  const num = match[0].replace(/,/g, '');
  const parsed = parseFloat(num);
  return isFinite(parsed) ? parsed : null;
}

export function extractAmazonCartData(): AmazonCartData {
  const result: AmazonCartData = {
    subtotal: null,
    itemCount: 0,
    items: [],
    currency: extractCurrencySymbol(),
  };

  try {
    // Attempt 1: Find subtotal via ID
    let subtotalEl = document.querySelector('#sc-subtotal-amount-activecart, #sc-subtotal-amount');
    if (!subtotalEl) {
      // Attempt 2: Search for text "Subtotal"
      const allText = document.querySelectorAll('*');
      for (const el of allText) {
        if (el.textContent?.includes('Subtotal')) {
          const sibling = el.nextElementSibling || el.parentElement?.querySelector('[class*="price"]');
          if (sibling) {
            subtotalEl = sibling;
            break;
          }
        }
      }
    }
    if (subtotalEl) {
      const subtotalText = subtotalEl.textContent || '';
      result.subtotal = parsePrice(subtotalText);
    }
  } catch (e) {
    console.warn('[Pause] subtotal extraction error', e);
  }

  try {
    // Extract item count
    // Look for "X items in cart" text or count badge
    const bodyText = document.body.innerText;
    const itemMatch = bodyText.match(/(\d+)\s+items?\s+in\s+cart/i);
    if (itemMatch) {
      result.itemCount = parseInt(itemMatch[1], 10);
    } else {
      // Fallback: count visible item rows
      const itemRows = document.querySelectorAll('[data-item-index], .sc-list-item, [class*="cart-item"]');
      result.itemCount = itemRows.length;
    }
  } catch (e) {
    console.warn('[Pause] item count extraction error', e);
  }

  try {
    // Extract individual items
    const itemContainers = document.querySelectorAll('[data-item-index], .sc-list-item');
    for (const container of itemContainers) {
      try {
        // Item name
        const nameEl = container.querySelector('h4, .a-size-base, [class*="title"]');
        const name = (nameEl?.textContent || '').trim().slice(0, 100);
        if (!name) continue;

        // Item price
        let price: number | null = null;
        const priceEl = container.querySelector('[class*="price"], .a-price-whole');
        if (priceEl) {
          price = parsePrice(priceEl.textContent || '');
        }

        result.items.push({ name, price });
      } catch (itemErr) {
        console.warn('[Pause] item extraction error', itemErr);
      }
    }
  } catch (e) {
    console.warn('[Pause] items list extraction error', e);
  }

  console.log('[Pause] Amazon cart data extracted', result);
  return result;
}

/**
 * Retry cart extraction with backoff if initial attempt yields incomplete data
 */
export async function extractAmazonCartDataWithRetry(
  maxRetries = 3,
  delayMs = 500
): Promise<AmazonCartData> {
  for (let i = 0; i < maxRetries; i++) {
    const data = extractAmazonCartData();
    if (data.subtotal !== null || data.itemCount > 0) {
      return data;
    }
    if (i < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  return extractAmazonCartData();
}
