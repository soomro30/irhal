import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
const r2PublicHostname = (() => {
  if (!r2PublicUrl) return undefined;
  try {
    return new URL(r2PublicUrl).hostname;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      ...(r2PublicHostname
        ? [
            {
              protocol: "https" as const,
              hostname: r2PublicHostname,
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "imagedelivery.net",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default withPayload(nextConfig);
