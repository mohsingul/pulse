import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { webcrypto as nodeCrypto } from 'node:crypto';

const safeGlobal = globalThis as any;
if (typeof safeGlobal.crypto === 'undefined') {
  safeGlobal.crypto = nodeCrypto;
}
if (typeof safeGlobal.window === 'undefined') {
  safeGlobal.window = safeGlobal;
}
if (typeof safeGlobal.self === 'undefined') {
  safeGlobal.self = safeGlobal;
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      includeAssets: [
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
        "calendar-notification-icon.png",
        "logo.svg",
      ],
      manifest: {
        id: "/",
        name: "Aimo Pulse",
        short_name: "Aimo Pulse",
        description: "A little window into your day.",
        theme_color: "#A83FFF",
        background_color: "#000000",
        display: "standalone",
        scope: "/",
        start_url: "/?source=pwa",
        categories: ["health", "social", "productivity"],
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/logo.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
        shortcuts: [
          {
            name: "Open Today",
            short_name: "Today",
            description: "Open your pulse board",
            url: "/",
            icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "View Notifications",
            short_name: "Notifications",
            description: "Check your latest updates",
            url: "/notification-center",
            icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,json,webmanifest}"],
        runtimeCaching: [
          {
            urlPattern: /\/functions\/v1\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/, 
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /https:\/\/(fonts|fonts\.googleapis|fonts\.gstatic)\./,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico,json,webmanifest}"],
      },
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      "@": path.resolve(__dirname, "./src"),
    },
  },
});