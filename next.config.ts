import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  basePath: "/story-foraging-study",
  assetPrefix: "/story-foraging-study",
};

export default nextConfig;
