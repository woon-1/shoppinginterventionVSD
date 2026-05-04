"use client";

import { Bookmark, ChevronRight, ShoppingCart } from "lucide-react";

const relatedItems = [
  "Noise-canceling headphones",
  "Desk lamp",
  "Laptop stand",
  "Travel mug",
];

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-[#f5f1ea] text-[#171717]">
      <div className="border-b border-black/10 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 text-sm">
          <div className="font-semibold tracking-tight">Marketplace</div>
          <div className="text-black/35">/</div>
          <div className="text-black/55">Product detail</div>
          <div className="ml-auto hidden items-center gap-2 text-xs text-black/55 sm:flex">
            <span className="rounded-full bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
              Pause injected
            </span>
            <span>Example of the content-script button on a product page</span>
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[28px] border border-black/10 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.06)]">
          <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="rounded-[24px] bg-[#ece7de] p-4">
              <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#b6a68f] to-[#7d6c58] p-6 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.15),transparent_30%)]" />
                <div className="relative flex h-[340px] flex-col justify-between rounded-[18px] border border-white/20 bg-black/10 p-5 backdrop-blur-[1px]">
                  <div>
                    <div className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                      Featured item
                    </div>
                    <div className="max-w-[220px] text-3xl font-semibold leading-[1.05] tracking-tight">
                      Wireless Headphones
                    </div>
                    <p className="mt-3 max-w-[250px] text-sm text-white/85">
                      Everyday focus, long battery life, and a clean profile for work or travel.
                    </p>
                  </div>

                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/65">
                        Price
                      </div>
                      <div className="text-3xl font-semibold">$129.00</div>
                    </div>
                    <div className="h-28 w-28 rounded-full bg-white/15 blur-2xl" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs text-black/50">
                  <span>Audio</span>
                  <ChevronRight className="size-3" />
                  <span>Headphones</span>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Wireless noise-canceling headphones
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-black/65">
                  High-fidelity sound, all-day comfort, and adaptive noise control.
                  This layout is a preview of the extension state when a content
                  script detects a product page.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-4xl font-semibold tracking-tight">$129</div>
                <div className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-black/65">
                  4.8 stars · 2,418 reviews
                </div>
              </div>

              <div className="rounded-[22px] border border-black/10 bg-[#faf8f3] p-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
                  Pause extension button
                </div>
                <button className="inline-flex items-center gap-2 rounded-xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition-colors hover:bg-[#0b1220]">
                  <Bookmark className="size-4" />
                  Add to Wishlist
                </button>
                <p className="mt-3 max-w-lg text-sm text-black/55">
                  On a real Amazon, eBay, Etsy, Target, or Walmart product page,
                  the extension injects this button near the purchase controls.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InfoCard label="Shipping" value="Free in 2 days" />
                <InfoCard label="Returns" value="30-day policy" />
                <InfoCard label="Stock" value="In stock" />
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_18px_48px_rgba(0,0,0,0.05)]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
              What the user sees
            </div>
            <div className="mt-3 space-y-3 text-sm text-black/70">
              <p>
                A clear product page with Pause adding a single action button in the
                purchase area.
              </p>
              <p>
                Clicking the button saves the item to the extension wishlist, then
                the popup and wishlist page reflect the new item count.
              </p>
            </div>
          </div>

          <div className="rounded-[24px] border border-black/10 bg-white p-5 shadow-[0_18px_48px_rgba(0,0,0,0.05)]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-black/45">
              Wishlist preview
            </div>
            <div className="mt-4 space-y-3">
              {relatedItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-xl border border-black/8 bg-[#fbfaf7] px-4 py-3 text-sm"
                >
                  <span>{item}</span>
                  <span className="text-black/40">Save</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-black/10 bg-[#111827] p-5 text-white shadow-[0_18px_48px_rgba(0,0,0,0.12)]">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
              Extension package
            </div>
            <p className="mt-3 text-sm leading-6 text-white/78">
              This preview is included in the exported app so you can show how the
              injected UI looks without visiting a live store.
            </p>
            <button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90">
              <ShoppingCart className="size-4" />
              Open Wishlist
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-black/40">
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-black/75">{value}</div>
    </div>
  );
}
