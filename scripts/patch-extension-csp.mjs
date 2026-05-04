/**
 * Chrome extension MV3 extension_pages CSP allows script-src 'self' only — inline
 * script blocks (used heavily by Next.js static export) are blocked unless each
 * body is allowed via a sha256 hash. This script walks all HTML under out/,
 * hashes inline scripts, and writes content_security_policy into out/manifest.json.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const rootPath = fileURLToPath(new URL("../out/", import.meta.url));
const manifestPath = join(rootPath, "manifest.json");

function walkHtmlFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkHtmlFiles(p, acc);
    else if (name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

/** Inline scripts only (skip external src=). Body is exact bytes Chrome hashes (UTF-8). */
function* inlineScriptBodies(html) {
  let i = 0;
  while (i < html.length) {
    const start = html.indexOf("<script", i);
    if (start === -1) break;
    const tagEnd = html.indexOf(">", start);
    if (tagEnd === -1) break;
    const openTag = html.slice(start, tagEnd + 1);
    if (/\ssrc\s*=/i.test(openTag)) {
      i = tagEnd + 1;
      continue;
    }
    const close = html.indexOf("</script>", tagEnd);
    if (close === -1) break;
    const body = html.slice(tagEnd + 1, close);
    yield body;
    i = close + "</script>".length;
  }
}

function cspHash(scriptBody) {
  const digest = createHash("sha256").update(scriptBody, "utf8").digest("base64");
  return `'sha256-${digest}'`;
}

function main() {
  if (!existsSync(manifestPath)) {
    console.warn("[CSP] out/manifest.json missing; skip.");
    process.exit(0);
  }

  const htmlFiles = walkHtmlFiles(rootPath);
  const hashes = new Set();

  for (const file of htmlFiles) {
    const html = readFileSync(file, "utf8");
    for (const body of inlineScriptBodies(html)) {
      hashes.add(cspHash(body));
    }
  }

  const sorted = [...hashes].sort();
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

  // wasm-unsafe-eval: some builds / deps; hashes cover Next flight inline scripts.
  const extensionPages = [
    "script-src",
    "'self'",
    "'wasm-unsafe-eval'",
    ...sorted,
    ";",
    "object-src",
    "'self'",
  ].join(" ");

  manifest.content_security_policy = {
    extension_pages: extensionPages,
  };

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(
    `[CSP] Patched manifest.json with ${sorted.length} inline script hash(es) from ${htmlFiles.length} HTML file(s).`
  );
}

main();
