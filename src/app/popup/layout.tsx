import type { Viewport } from "next";

/**
 * `width=device-width` makes the popup think the viewport is the panel’s tiny
 * initial width — layout collapses to a narrow strip. Lock to our panel width.
 */
export const viewport: Viewport = {
  width: 360,
  initialScale: 1,
  maximumScale: 1,
};

/**
 * BrowserAction popup must declare explicit dimensions; otherwise Chrome sizes the
 * panel to a collapsed min-content width (narrow vertical strip).
 */
export default function PopupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="extension-popup-shell">
      <div className="extension-popup-scroll">{children}</div>
    </div>
  );
}
