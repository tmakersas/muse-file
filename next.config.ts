import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/og": ["./assets/**/*"],
  },
  images: { unoptimized: true },
};

export default nextConfig;
