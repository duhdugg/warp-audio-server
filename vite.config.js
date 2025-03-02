import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:8712",
      "/socket.io": {
        target: "http://localhost:8712",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  plugins: [vue()],
});
