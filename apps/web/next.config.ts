import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@typewell-jr/engine"],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
