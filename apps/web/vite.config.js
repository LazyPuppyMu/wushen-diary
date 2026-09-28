import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "吾身",
        short_name: "吾身",
        description: "本地优先的 AI 日记整理工具",
        theme_color: "#f7f7f2",
        background_color: "#f7f7f2",
        display: "standalone",
        start_url: "/"
      }
    })
  ],
  test: { environment: "node" }
});
