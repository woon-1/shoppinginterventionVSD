// Watch mode for content scripts + service worker.
//
// `npm run build` is still required at least once to produce out/ (HTML,
// manifest, next/ assets). After that, `npm run dev:ext` keeps the SW and
// content-script bundles fresh on save. Reload the unpacked extension at
// chrome://extensions/ after each rebuild.
//
// UI changes (popup, settings, dashboard, etc.) still need a full
// `npm run build` because they go through Next's static export.

import esbuild from "esbuild";
import { existsSync } from "node:fs";
import path from "node:path";

const OUT_DIR = "out";

const ENTRIES = [
  { entry: "src/service-worker/index.ts", outfile: "service-worker.js" },
  { entry: "src/content-scripts/amazon.ts", outfile: "content-amazon.js" },
  { entry: "src/content-scripts/ebay.ts", outfile: "content-ebay.js" },
  { entry: "src/content-scripts/etsy.ts", outfile: "content-etsy.js" },
  { entry: "src/content-scripts/target.ts", outfile: "content-target.js" },
  { entry: "src/content-scripts/walmart.ts", outfile: "content-walmart.js" },
];

if (!existsSync(OUT_DIR)) {
  console.error(
    `[watch] ${OUT_DIR}/ not found. Run \`npm run build\` once before \`npm run dev:ext\`.`
  );
  process.exit(1);
}

const contexts = await Promise.all(
  ENTRIES.map(({ entry, outfile }) =>
    esbuild.context({
      entryPoints: [entry],
      bundle: true,
      outfile: path.join(OUT_DIR, outfile),
      format: "iife",
      target: "es2020",
      platform: "browser",
      logLevel: "info",
    })
  )
);

await Promise.all(contexts.map((c) => c.watch()));

console.log(
  "[watch] esbuild watching content scripts + service worker. Reload the extension after each rebuild."
);
