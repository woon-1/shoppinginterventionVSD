# Chrome Extension Expansion: E-Commerce Integration

## 📊 User Journey Overview

```
1. ONBOARDING (Existing)
   - Install extension
   - Set budget/categories/friction
   - Start shopping

2. E-COMMERCE BROWSING (NEW)
   - Visit Amazon/eBay/Etsy/Target/Walmart
   - Content script detects product
   - "Add to Wishlist" button appears
   - Click button → add item

3. WISHLIST MANAGEMENT (NEW)
   - Open extension popup
   - Click Wishlist tab
   - See all saved items with prices
   - Search, filter, sort
   - Delete or quick-add to cart

4. SHOPPING FLOW
   - Add items from wishlist to cart
   - Intervention triggers if needed
   - Complete purchase
   - Track savings on dashboard
```

---

## 🏗️ Technical Architecture

### Data Model Changes
```typescript
// src/lib/types.ts - ADD:
interface WishlistItem {
  id: string                    // uuid
  name: string                  // "Sony WH-CH720 Headphones"
  price: number                 // 47.99
  currency: string              // "USD"
  website: string               // "amazon" | "ebay" | "etsy" | "target" | "walmart"
  url: string                   // Full product URL
  imageUrl?: string             // Product thumbnail (optional)
  addedAt: number               // Timestamp
}

// Updated AppState:
interface AppState {
  config: UserConfig
  cart: CartLine[]
  purchases: PurchaseRecord[]
  coolingOff: CoolingOffEntry[]
  savings: SavingsLedger
  wishlist: WishlistItem[]      // NEW
  schemaVersion: number
}
```

### Message Flow Architecture
```
[E-Commerce Site]
      ↓
[Content Script]
  - Detect product page
  - Extract: name, price, URL, image
  - Inject "Add to Wishlist" button
  - Listen for clicks
      ↓
[chrome.runtime.sendMessage]
  - Send product data to background
      ↓
[Background Service Worker]
  - Receive product data
  - Generate ID + timestamp
  - Forward to popup/dashboard
      ↓
[Extension Storage]
  - Save to localStorage
  - Sync AppState.wishlist
```

---

## 📋 Complete To-Do List (37 Tasks)

### PHASE 1: Data Model (3 tasks)
- [ ] **1.1** Update `src/lib/types.ts` - Add `WishlistItem` interface
- [ ] **1.2** Update `src/lib/types.ts` - Add `wishlist: []` to `AppState`
- [ ] **1.3** Update `src/context/AppStateContext.tsx` - Add wishlist mutation functions:
  - `addToWishlist(item: WishlistItem)`
  - `removeFromWishlist(id: string)`
  - `getWishlistByWebsite(website: string)`
  - `clearWishlist()`

### PHASE 2: Content Scripts (5 tasks)
- [ ] **2.1** Create `src/content-scripts/amazon.ts` - Product scraper for Amazon
- [ ] **2.2** Create `src/content-scripts/ebay.ts` - Product scraper for eBay
- [ ] **2.3** Create `src/content-scripts/etsy.ts` - Product scraper for Etsy
- [ ] **2.4** Create `src/content-scripts/target.ts` - Product scraper for Target
- [ ] **2.5** Create `src/content-scripts/walmart.ts` - Product scraper for Walmart

### PHASE 3: Content Script Features (3 tasks)
- [ ] **3.1** Implement DOM selectors for product data extraction per site
  - Product name selector
  - Price selector
  - URL (use window.location.href)
  - Image selector (optional)
  - Website identifier
- [ ] **3.2** Create injected UI button ("Add to Wishlist")
  - Position button near "Add to Cart"
  - Styling matches site aesthetic
  - Show tooltip: "Save to Pause wishlist"
- [ ] **3.3** Implement click listener & message sending
  - Capture click event
  - Extract product data
  - Send to background via `chrome.runtime.sendMessage()`

### PHASE 4: Background Service Worker (2 tasks)
- [ ] **4.1** Create `src/service-worker/index.ts`
  - Listen for messages: `chrome.runtime.onMessage.addListener()`
  - Add received products to AppState
  - Sync to localStorage
  - Send response back to content script
- [ ] **4.2** Implement cross-context communication
  - Connect to popup: `chrome.runtime.connect()`
  - Forward wishlist updates to popup
  - Handle service worker persistence

### PHASE 5: Manifest Updates (4 tasks)
- [ ] **5.1** Update `public/manifest.json` - Add content_scripts
  ```json
  "content_scripts": [
    { "matches": ["*://www.amazon.com/*"], "js": ["content-amazon.js"] },
    { "matches": ["*://www.ebay.com/*"], "js": ["content-ebay.js"] },
    ...
  ]
  ```
- [ ] **5.2** Update manifest - Add host_permissions
  ```json
  "host_permissions": [
    "*://www.amazon.com/*",
    "*://www.ebay.com/*",
    "*://www.etsy.com/*",
    "*://www.target.com/*",
    "*://www.walmart.com/*"
  ]
  ```
- [ ] **5.3** Update manifest - Add background service worker
  ```json
  "background": { "service_worker": "service-worker.js" }
  ```
- [ ] **5.4** Update manifest - Add web_accessible_resources if injecting styles

### PHASE 6: Popup & Navigation (4 tasks)
- [ ] **6.1** Update `src/app/popup/page.tsx`
  - Add Wishlist link to nav
  - Show wishlist item count as badge
  - New button: "View Wishlist"
- [ ] **6.2** Update `src/components/AppShell.tsx`
  - Add `/wishlist` to navigation
  - Show badge with wishlist count
  - Link to wishlist page
- [ ] **6.3** Create `src/app/wishlist/page.tsx` - Wishlist page
  - List all wishlist items
  - Show: name, price, website, link
  - Actions: remove, quick-add to cart
- [ ] **6.4** Create wishlist item card component
  - `src/components/wishlist/WishlistItemCard.tsx`
  - Display product info
  - Link to original product
  - Remove button
  - Add to cart button

### PHASE 7: Wishlist Features (3 tasks)
- [ ] **7.1** Implement search/filter functionality
  - Search by product name
  - Filter by website (Amazon, eBay, etc.)
  - Filter by price range
- [ ] **7.2** Implement sort functionality
  - Sort by price (low→high, high→low)
  - Sort by date added (newest, oldest)
  - Sort by website
- [ ] **7.3** Implement remove from wishlist
  - Confirmation dialog: "Remove [product]?"
  - Delete action
  - Update UI immediately

### PHASE 8: Integration with Shopping (3 tasks)
- [ ] **8.1** Update cart/checkout flow
  - Show if item is from wishlist: "📌 On your wishlist: $X.XX"
  - Quick add from wishlist link
  - Show wishlist source in cart
- [ ] **8.2** Update intervention modal
  - Show wishlist items vs impulse buys
  - Distinguish in breakdown
  - Add wishlist reference in reflection prompt
- [ ] **8.3** Update dashboard
  - Show wishlist items count
  - "Wishlist" stat in KPI strip
  - Quick link to add more items

### PHASE 9: Currency & Formatting (1 task)
- [ ] **9.1** Handle currency conversion/display
  - Detect currency from price format ($, €, £, ¥)
  - Store currency in WishlistItem
  - Display with currency symbol
  - Convert to USD for budget calc (optional: use API)

### PHASE 10: Error Handling (2 tasks)
- [ ] **10.1** Implement duplicate detection
  - Check if URL already in wishlist before adding
  - Show: "Already in wishlist"
  - Suggest update price if different
- [ ] **10.2** Add error handling for content scripts
  - Failed product detection
  - Network errors during save
  - Graceful fallbacks
  - Toast notifications: "Failed to add, try again"

### PHASE 11: Testing (6 tasks)
- [ ] **11.1** Test Amazon product detection & scraping
  - Find random Amazon product page
  - Verify button appears
  - Click and verify data captured correctly
- [ ] **11.2** Test eBay product detection & scraping
- [ ] **11.3** Test Etsy product detection & scraping
- [ ] **11.4** Test Wishlist persistence
  - Add item, close extension, reopen
  - Verify item still there
  - Check localStorage key `shoppingintervention.v1`
- [ ] **11.5** Test message passing
  - Content script → Background → Storage
  - Verify each step works
  - Check DevTools for message logs
- [ ] **11.6** Test full user flow
  - Install extension
  - Complete setup
  - Visit e-commerce site
  - Add item to wishlist
  - View wishlist page
  - Add to cart
  - Trigger intervention

### PHASE 12: Documentation (2 tasks)
- [ ] **12.1** Document content script selectors
  - Create `SCRAPER_SELECTORS.md`
  - List each site's DOM selectors
  - Include fallbacks
  - Link to MDN docs for each site's structure
- [ ] **12.2** Create extension README
  - Supported sites list
  - Installation instructions
  - User guide: how to use wishlist
  - Feature overview

---

## 🚀 Quick Start (First Steps)

### Step 1: Update Data Model (10 min)
```bash
# 1.1 - Add to src/lib/types.ts
interface WishlistItem {
  id: string
  name: string
  price: number
  currency: string
  website: string
  url: string
  imageUrl?: string
  addedAt: number
}

# 1.2 - Add to AppState in types.ts
wishlist: WishlistItem[]

# 1.3 - Add functions to AppStateContext.tsx
const addToWishlist = (item) => { ... }
const removeFromWishlist = (id) => { ... }
```

### Step 2: Create First Content Script (20 min)
```bash
# 2.1 - Create src/content-scripts/amazon.ts
# Detect product page
# Extract: name, price, URL, image
# Inject button
# Send message on click
```

### Step 3: Create Background Worker (15 min)
```bash
# 4.1 - Create src/service-worker/index.ts
# Listen for messages
# Add to AppState.wishlist
# Sync to storage
```

### Step 4: Update Manifest (10 min)
```bash
# 5.1-5.4 - Update public/manifest.json
# Add content_scripts
# Add host_permissions
# Add background
```

---

## 📁 File Structure After Completion

```
src/
  app/
    wishlist/
      page.tsx                 # NEW - Wishlist page
  components/
    wishlist/
      WishlistItemCard.tsx     # NEW - Item card
      WishlistFilter.tsx       # NEW - Filter UI
      WishlistSearch.tsx       # NEW - Search UI
  content-scripts/             # NEW directory
    amazon.ts
    ebay.ts
    etsy.ts
    target.ts
    walmart.ts
  service-worker/              # NEW directory
    index.ts
  lib/
    types.ts                   # UPDATED - Add WishlistItem
  context/
    AppStateContext.tsx        # UPDATED - Add wishlist functions

public/
  manifest.json                # UPDATED - Add scripts, permissions
  service-worker.js            # Generated from build

SCRAPER_SELECTORS.md           # NEW - DOM selector reference
EXTENSION_EXPANSION.md         # NEW - This file
```

---

## ⚙️ Build & Integration

After completing tasks, the build process will:
1. Compile content scripts to `out/content-amazon.js`, etc.
2. Compile service worker to `out/service-worker.js`
3. Copy manifest with scripts registered
4. Postbuild cleanup removes `_` prefixes

Load in Chrome:
```
chrome://extensions/ → Load unpacked → Select /out folder
```

---

## 🎯 Success Criteria

✅ User can click "Add to Wishlist" on Amazon product page
✅ Product data captured: name, price, URL, image
✅ Item appears in extension's Wishlist page
✅ Wishlist persists across extension close/reopen
✅ Can remove items from wishlist
✅ Can quick-add wishlist items to cart
✅ All 5 e-commerce sites supported
✅ No console errors or crashes
