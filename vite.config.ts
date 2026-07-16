import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173
  },

  plugins: [
    react(),
    tailwindcss(),
    VitePWA({      registerType: "autoUpdate",
      manifest: {
        name: "VRTX CRM — Inteligência Comercial",
        short_name: "VRTX CRM",
        description: "Sistema Inteligente de Gestão Comercial",
        theme_color: "#0F172A",
        background_color: "#0F172A",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/favicon-32x32.png",
            sizes: "32x32",
            type: "image/png",
          }
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // SPA fallback: navegações (inclui /termos e /privacidade) servem index.html
        // no PWA instalado; o pathname é roteado no cliente (main.tsx).
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } }
          },
          {
            // Multi-tenant: dados de leads/settings NUNCA em disco. NetworkOnly =
            // sem write em Cache Storage, sem fallback offline (falha é o correto).
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly'
          }
        ]
      },
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  }

})
