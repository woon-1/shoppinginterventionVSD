/** Resolve packaged extension URLs from UI (popup, settings, etc.). */
export function getExtensionPageUrl(page: string): string {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    const q = page.indexOf("?");
    if (q === -1) return chrome.runtime.getURL(page);
    const path = page.slice(0, q);
    const query = page.slice(q + 1);
    return `${chrome.runtime.getURL(path)}?${query}`;
  }
  return page.startsWith("/") ? page : `/${page}`;
}
