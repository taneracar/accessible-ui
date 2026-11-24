import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const browser = () => ({ // a function: Vitest mutates the object it is given
  enabled: true, headless: true, screenshotFailures: false,
  provider: playwright({}),
  instances: [{ browser: "chromium" as const }],
});

// Every story, with axe, once per theme: contrast bugs usually live in one theme only.
const stories = (theme: "light" | "dark") => ({
  plugins: [storybookTest({ configDir: ".storybook" })],
  test: { name: `stories-${theme}`, env: { VITE_THEME: theme }, browser: browser() },
});

export default defineConfig({
  test: {
    projects: [
      { plugins: [react()], test: { name: "unit", include: ["test/unit/**/*.test.{ts,tsx}"], environment: "node" } },
      { plugins: [react()], test: { name: "keyboard", include: ["test/keyboard/**/*.test.tsx"], browser: browser() } },
      stories("light"),
      stories("dark"),
    ],
  },
});
