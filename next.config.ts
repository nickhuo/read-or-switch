import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    reactCompiler: true,
  },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
