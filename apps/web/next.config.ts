import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bossjobs/core", "@bossjobs/adapters"],
  serverExternalPackages: ["playwright"],
  webpack: (config) => {
    // Workspace packages use NodeNext `.js` import specifiers pointing at `.ts` sources.
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return config;
  },
};

export default nextConfig;
