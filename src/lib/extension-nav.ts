/**
 * Static export is loaded as chrome-extension://…/*.html. Client-side
 * `router.replace("/shop")` updates the location to a path with no matching
 * HTML entry, so navigations should use full document loads to *.html.
 */

export function isChromeExtensionPage(): boolean {
  return (
    typeof window !== "undefined" &&
    window.location.protocol === "chrome-extension:"
  );
}

/** Map Next route href (e.g. /shop, /setup?x=1) to packaged extension URL. */
export function extensionDocumentUrl(href: string): string | null {
  if (typeof chrome === "undefined" || !chrome.runtime?.getURL) return null;
  const [pathPart, queryPart] = href.split("?");
  const raw = (pathPart || "/").replace(/\/$/, "") || "/";
  const file =
    raw === "/" ? "index.html" : `${raw.replace(/^\//, "")}.html`;
  const base = chrome.runtime.getURL(file);
  return queryPart ? `${base}?${queryPart}` : base;
}

export function navigateInExtension(href: string): void {
  const url = extensionDocumentUrl(href);
  if (!url || typeof window === "undefined") return;
  window.location.assign(url);
}

export function extensionAwareReplace(
  router: { replace: (href: string) => void },
  href: string
): void {
  if (isChromeExtensionPage()) {
    navigateInExtension(href);
    return;
  }
  router.replace(href);
}
