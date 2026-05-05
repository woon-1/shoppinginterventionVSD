import type { Viewport } from "next";
import type { CSSProperties } from "react";
import {
  EXTENSION_POPUP_HEIGHT_PX,
  EXTENSION_POPUP_WIDTH_PX,
} from "@/lib/extension-popup-dimensions";

/**
 * `width=device-width` makes the popup think the viewport is the panel’s tiny
 * initial width — layout collapses to a narrow strip. Lock to our panel width.
 */
export const viewport: Viewport = {
  width: EXTENSION_POPUP_WIDTH_PX,
  initialScale: 1,
  maximumScale: 1,
};

const shellStyle: CSSProperties = {
  width: EXTENSION_POPUP_WIDTH_PX,
  minWidth: EXTENSION_POPUP_WIDTH_PX,
  maxWidth: EXTENSION_POPUP_WIDTH_PX,
  height: EXTENSION_POPUP_HEIGHT_PX,
  maxHeight: EXTENSION_POPUP_HEIGHT_PX,
  boxSizing: "border-box",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  flex: "1 1 auto",
  minHeight: 0,
  alignSelf: "stretch",
};

const scrollStyle: CSSProperties = {
  flex: "1 1 auto",
  minHeight: 0,
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  overflowY: "auto",
  overflowX: "hidden",
};

/**
 * BrowserAction popup must declare explicit dimensions; otherwise Chrome sizes the
 * panel to a collapsed min-content width (narrow vertical strip).
 * Inline sizes apply before CSS loads so every state (loading / welcome / active)
 * gets the same chrome window geometry.
 */
export default function PopupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="extension-popup-shell" style={shellStyle}>
      <div className="extension-popup-scroll" style={scrollStyle}>
        {children}
      </div>
    </div>
  );
}
