import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  build: { outDir: "../dist/public", emptyOutDir: true, assetsInlineLimit: 0 },
  server: {
    port: 5173,
    proxy: { "/api": { target: "http://127.0.0.1:8787", changeOrigin: false } },
  },
});
