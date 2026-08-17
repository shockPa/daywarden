import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      /*
       * Don't forcibly reload Daywarden when
       * an update is detected.
       *
       * We'll build our own update UI later.
       */
      registerType: "prompt",

      injectRegister: "auto",

      includeAssets: [
        "favicon.ico",
        "daywarden-icon.svg",
        "apple-touch-icon-180x180.png",
      ],

      manifest: {
        id: "/",

        name: "Daywarden",
        short_name: "Daywarden",

        description: "A private, local-first daily log.",

        start_url: "/",
        scope: "/",

        display: "standalone",

        background_color: "#f4f4f1",

        theme_color: "#f4f4f1",

        prefer_related_applications: false,

        icons: [
          {
            src: "/pwa-192x192.png",

            sizes: "192x192",

            type: "image/png",
          },

          {
            src: "/pwa-512x512.png",

            sizes: "512x512",

            type: "image/png",

            purpose: "any",
          },

          {
            src: "/maskable-icon-512x512.png",

            sizes: "512x512",

            type: "image/png",

            purpose: "maskable",
          },
        ],
      },

      workbox: {
        /*
         * Cache the complete Daywarden
         * application shell.
         *
         * We include fonts now because
         * Daywarden will eventually bundle
         * its own logo font.
         */
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
      },
    }),
  ],
});
