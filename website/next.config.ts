import path from "node:path";
import type { NextConfig } from "next";

// The design tokens live outside this app (design-system/website/theme.css), so
// both the bundler root and the file-tracing root are the repo root.
const repoRoot = path.join(import.meta.dirname, "..");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: repoRoot,
  outputFileTracingIncludes: { "/*": ["./src/content/articles/**/*.json"] },
  turbopack: { root: repoRoot },
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200],
    imageSizes: [24, 32, 48, 64, 96, 128, 256, 384, 448],
    minimumCacheTTL: 31536000,
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "cobe"],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.web3chess.online" }],
        destination: "https://web3chess.online/:path*",
        permanent: true,
      },
      {
        source: "/:locale(en|es|fr|de|ru|pt|zh|hi|ar|ja)/login",
        destination: "https://app.web3chess.online/:locale/login",
        permanent: true,
      },
      {
        source: "/:locale(en|es|fr|de|ru|pt|zh|hi|ar|ja)",
        destination: "https://app.web3chess.online/:locale/home",
        permanent: true,
      },
      {
        source: "/login",
        destination: "https://app.web3chess.online/en/login",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/((?!_next|favicon.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
