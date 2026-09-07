import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@bossjobs/core", "@bossjobs/adapters"],
  serverExternalPackages: [
    "playwright",
    "playwright-core",
    "chromium-bidi",
  ],
  webpack: (config, { isServer }) => {
    // Workspace packages use NodeNext `.js` import specifiers pointing at `.ts` sources.
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    if (isServer) {
      const prev = config.externals;
      config.externals = [
        ...(Array.isArray(prev) ? prev : prev ? [prev] : []),
        "playwright",
        "playwright-core",
        "chromium-bidi",
      ];
    }
    return config;
  },
};

export default nextConfig;
