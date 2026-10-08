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
};

export default nextConfig;
