import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  basePath: "/story_foraging_study",
  assetPrefix: "/story_foraging_study",
};

export default nextConfig;
