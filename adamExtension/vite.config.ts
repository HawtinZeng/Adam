import { crx } from "@crxjs/vite-plugin";
import { defineConfig } from "vite";
import defineManifest from "./manifest.config";
export default defineConfig({
  plugins: [crx({ manifest: defineManifest })],
  build: {
    rollupOptions: {
      watch: {
        include: "./src/*",
      },
    },
  },
});
