import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
  strategies: "generateSW",

  manifest: {
    name: "Aimo Pulse",
    short_name: "Aimo Pulse",
    description: "A couples mood board app to share your daily pulse",
    theme_color: "#A83FFF",
    background_color: "#000000",
    display: "standalone",
    orientation: "portrait",
    scope: "/",
    start_url: "/",
    icons: [
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable",
      },
    ],
    categories: ["lifestyle", "social"],
    shortcuts: [
      {
        name: "Today's Pulse",
        short_name: "Today",
        description: "View today's shared pulse",
        url: "/",
        icons: [{ src: "/logo.svg", sizes: "192x192" }],
      },
    ],
  },

  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "supabase-api-cache",
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },

  devOptions: { enabled: true, type: "module" },
})





  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
})