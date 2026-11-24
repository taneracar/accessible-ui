import type { Preview } from "@storybook/react-vite";
import "../src/styles.css";
import "./preview.css";

export default {
  globalTypes: {
    theme: { toolbar: { title: "Theme", items: ["light", "dark"], dynamicTitle: true } },
  },
  initialGlobals: { theme: import.meta.env.VITE_THEME ?? "light" },
  decorators: [
    (Story, { globals }) => {
      document.documentElement.dataset.theme = String(globals.theme);
      return <Story />;
    },
  ],
  parameters: {
    layout: "fullscreen",
    // A violation fails the test run, not just the panel.
    a11y: { test: "error", options: { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"], rules: { region: { enabled: false } } } },
  },
} satisfies Preview;
