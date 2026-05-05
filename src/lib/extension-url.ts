import type { AnchorHTMLAttributes } from "react";

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

/**
 * Use on links inside the browserAction popup. Without target="_blank", Chrome
 * navigates the popup surface itself — full pages appear clipped in the tiny window.
 */
export function extensionFullPageLinkProps(
  page: string
): Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel"> {
  return {
    href: getExtensionPageUrl(page),
    target: "_blank",
    rel: "noopener noreferrer",
  };
}
