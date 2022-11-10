import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

import path from "node:path";
import { version } from "./package.json";

/**
 * @param {import('vite').ConfigEnv} env
 */
function genius_config(env) {
  const generateScopedName =
    env.mode === "production" ? "[hash:base64:3]" : "[local]_[hash:base64:3]";
  /** @type {import('vite-plugin-pwa').VitePWAOptions} */
  const pwa_options = {
    mode: env.mode,
    includeAssets: ["favicon.svg"],
    manifest: {
      name: "1024 Game",
      short_name: "1024",
      theme_color: "#e76f51",
      background_color: "#83c5be",
      start_url: "/pwa-1024/",
      display: "standalone",
      icons: [
        {
          src: "pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
    devOptions: {
      enabled: env.mode !== "production",
    },
  };
  return defineConfig({
    base: "/pwa-1024/",
    define: {
      __PWA__: { version: `v${version}` },
    },
    plugins: [VitePWA(pwa_options)],
    resolve: {
      alias: {
        "@styles": path.resolve(__dirname, "styles"),
      },
    },
    css: {
      modules: {
        localsConvention: "dashesOnly",
        generateScopedName,
      },
    },
  });
}

export default genius_config;
