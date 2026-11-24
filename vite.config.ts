import { copyFileSync } from "node:fs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [react(), {
    name: "copy-css",
    closeBundle() {

      if (command === "build") copyFileSync("src/styles.css", "dist/styles.css");
    },
  }],
  build: {
    lib: { entry: "src/index.ts", formats: ["es"], fileName: () => "index.js" },
    rollupOptions: { external: ["react", "react-dom", "react/jsx-runtime"] },
  },
}));
