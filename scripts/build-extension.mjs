// Build script to compile content scripts and service worker for Chrome extension

import esbuild from "esbuild";
import fs from "fs";
import path from "path";

const OUT_DIR = "out";
const SERVICE_WORKER_ENTRY = "src/service-worker/index.ts";
const CONTENT_SCRIPT_ENTRIES = {
  amazon: "src/content-scripts/amazon.ts",
  ebay: "src/content-scripts/ebay.ts",
  etsy: "src/content-scripts/etsy.ts",
  target: "src/content-scripts/target.ts",
  walmart: "src/content-scripts/walmart.ts",
};

async function buildExtensionScripts() {
  console.log("[Build] Compiling extension scripts...");

  // Compile service worker
  try {
    console.log(`[Build] Compiling service worker...`);
    await esbuild.build({
      entryPoints: [SERVICE_WORKER_ENTRY],
      bundle: true,
      outfile: path.join(OUT_DIR, "service-worker.js"),
      format: "iife",
      target: "es2020",
      platform: "browser",
      external: [],
    });
    console.log(`[Build] ✓ Service worker compiled`);
  } catch (error) {
    console.error("[Build] ✗ Failed to compile service worker:", error);
    process.exit(1);
  }

  // Compile content scripts
  for (const [name, entry] of Object.entries(CONTENT_SCRIPT_ENTRIES)) {
    try {
      console.log(`[Build] Compiling content script: ${name}...`);
      await esbuild.build({
        entryPoints: [entry],
        bundle: true,
        outfile: path.join(OUT_DIR, `content-${name}.js`),
        format: "iife",
        target: "es2020",
        platform: "browser",
        external: [],
      });
      console.log(`[Build] ✓ Content script compiled: ${name}`);
    } catch (error) {
      console.error(`[Build] ✗ Failed to compile content script (${name}):`, error);
      process.exit(1);
    }
  }

  console.log("[Build] ✓ All extension scripts compiled successfully");
}

buildExtensionScripts().catch((error) => {
  console.error("[Build] Fatal error:", error);
  process.exit(1);
});
