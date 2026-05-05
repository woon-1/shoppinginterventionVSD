import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // Packaged as chrome-extension://…/*.html — root-absolute "/next/…" can fail to
  // resolve; relative "./next/…" loads reliably next to each HTML entry.
  assetPrefix:
    process.env.NEXT_EXTENSION_ASSETS === "1"
      ? "."
      : undefined,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
