import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Keep tooling rooted on this app when parent dirs also have lockfiles
    root: process.cwd(),
  },
};

export default nextConfig;
