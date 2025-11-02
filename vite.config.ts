import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: '/Camara/',
  server: {
    port: 5191,
    strictPort: true,
    host: true
  }
});