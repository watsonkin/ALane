import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Cache Components and partial prefetch keep pages on the Next server.
  // Next 16.4 then loads preview-props.json and the OpenNext worker throws.
  // YAML is prerendered at build time instead.
  // The preview browser opens 127.0.0.1. Without this, Next blocks dev
  // assets and the list filters never hydrate.
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

// Local `next dev` only. No-ops during `next build`. The site does not use bindings.
initOpenNextCloudflareForDev();
