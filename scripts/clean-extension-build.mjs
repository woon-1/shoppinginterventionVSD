import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const rootPath = fileURLToPath(new URL("../out/", import.meta.url));

function stripLeadingUnderscores(name) {
  return name.replace(/^_+/, "");
}

function safeRename(sourcePath, targetPath) {
  if (sourcePath === targetPath) return;
  if (existsSync(targetPath)) {
    rmSync(targetPath, { recursive: true, force: true });
  }
  renameSync(sourcePath, targetPath);
}

function rewriteTextFile(filePath) {
  let content;
  try {
    content = readFileSync(filePath, "utf8");
  } catch {
    return;
  }

  const updated = content
    .replaceAll("/_next/", "/next/")
    .replaceAll("/_not-found", "/not-found")
    .replaceAll("__next", "next");

  if (updated !== content) {
    writeFileSync(filePath, updated);
  }
}

function walkAndRewrite(dirPath) {
  const entries = readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = join(dirPath, entry.name);
    const nextName = stripLeadingUnderscores(entry.name);
    const targetPath = join(dirPath, nextName);

    if (entry.isDirectory()) {
      walkAndRewrite(sourcePath);
      safeRename(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile() && entry.name.startsWith("_")) {
      safeRename(sourcePath, targetPath);
      continue;
    }
  }

  for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
    const currentPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkAndRewrite(currentPath);
    } else if (entry.isFile()) {
      rewriteTextFile(currentPath);
    }
  }
}

walkAndRewrite(rootPath);
