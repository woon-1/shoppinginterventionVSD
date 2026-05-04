/**
 * MV3 extension_pages CSP does NOT accept sha256-* in manifest (rejected as
 * "insecure"). Next.js static HTML embeds many inline <script> blocks; we move
 * each body to next/static/inline/*.js and replace with <script src="..."> so
 * script-src 'self' is enough (no custom CSP in manifest).
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const outRoot = fileURLToPath(new URL("../out/", import.meta.url));
const inlineDir = join(outRoot, "next/static/inline");

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

/** Relative URL from htmlPath file to outRoot-relative target (POSIX slashes, ./ prefix). */
function hrefFromHtmlToFile(htmlPath, fileInOut) {
  let rel = relative(dirname(htmlPath), fileInOut);
  rel = rel.split(/[/\\]/g).join("/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

function transformHtml(html, htmlPath, bodyToFilename) {
  let i = 0;
  let out = "";
  while (i < html.length) {
    const start = html.indexOf("<script", i);
    if (start === -1) {
      out += html.slice(i);
      break;
    }
    out += html.slice(i, start);
    const tagEnd = html.indexOf(">", start);
    if (tagEnd === -1) {
      out += html.slice(start);
      break;
    }
    const openTag = html.slice(start, tagEnd + 1);
    if (/\ssrc\s*=/i.test(openTag)) {
      const close = html.indexOf("</script>", tagEnd);
      if (close === -1) {
        out += html.slice(start);
        break;
      }
      out += html.slice(start, close + "</script>".length);
      i = close + "</script>".length;
      continue;
    }
    const close = html.indexOf("</script>", tagEnd);
    if (close === -1) {
      out += html.slice(start);
      break;
    }
    const body = html.slice(tagEnd + 1, close);
    const key = createHash("sha256").update(body, "utf8").digest("hex");
    let filename = bodyToFilename.get(key);
    if (!filename) {
      filename = `nx-${key.slice(0, 16)}.js`;
      bodyToFilename.set(key, filename);
      mkdirSync(inlineDir, { recursive: true });
      writeFileSync(join(inlineDir, filename), body, "utf8");
    }
    const src = hrefFromHtmlToFile(htmlPath, join(inlineDir, filename));
    out += `<script src="${src}"></script>`;
    i = close + "</script>".length;
  }
  return out;
}

function main() {
  if (!existsSync(outRoot)) {
    console.warn("[inline-scripts] out/ missing; skip.");
    process.exit(0);
  }

  const bodyToFilename = new Map();
  const htmlFiles = walkHtmlFiles(outRoot);
  let rewritten = 0;

  for (const htmlPath of htmlFiles) {
    const html = readFileSync(htmlPath, "utf8");
    const next = transformHtml(html, htmlPath, bodyToFilename);
    if (next !== html) {
      writeFileSync(htmlPath, next, "utf8");
      rewritten += 1;
    }
  }

  console.log(
    `[inline-scripts] ${bodyToFilename.size} unique bundle(s) in next/static/inline/; updated ${rewritten} HTML file(s).`
  );
}

main();
