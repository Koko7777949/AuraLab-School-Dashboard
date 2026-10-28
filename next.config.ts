import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Cap Turbopack memory usage so the OS OOM-killer never reaps the
  // dev/standalone server on small (4 GB) machines. When the cap is hit,
  // Turbopack frees cached compilation state instead of growing unbounded.
  turbopack: {
    memoryLimit: 1024,
  },
};

export default nextConfig;
