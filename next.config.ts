import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    typescript: {
        // Ignore TypeScript errors during the build process
        // ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

export default nextConfig;
