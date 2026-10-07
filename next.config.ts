import type { NextConfig } from "next";

// The app lives at https://www.tmaker.io/muse-file (rewrite in tmaker-portfolio),
// so every route and asset is served under this base path.
const BASE = "/muse-file";

const nextConfig: NextConfig = {
  basePath: BASE,
  outputFileTracingIncludes: {
    "/api/og": ["./assets/**/*"],
  },
  images: { unoptimized: true },
  redirects: async () => [
    // Old links on the bare vercel.app domain go to the tmaker.io home of the app.
    {
      source: "/:path((?!muse-file(?:/|$)).*)",
      destination: "https://www.tmaker.io/muse-file/:path",
      permanent: false,
      basePath: false,
    },
  ],
};

export default nextConfig;
