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
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1440, 1600, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    qualities: [60, 65, 75],
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
