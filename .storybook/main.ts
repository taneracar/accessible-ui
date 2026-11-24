import type { StorybookConfig } from "@storybook/react-vite";

export default {
  stories: ["../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  framework: "@storybook/react-vite",
  core: { disableTelemetry: true },
  viteFinal: (config) => {
    // vite.config.ts builds the library; Storybook needs an app build.
    delete config.build?.lib;
    delete config.build?.rollupOptions;
    config.plugins = (config.plugins ?? []).filter((p) => !(p && "name" in p && p.name === "copy-css"));
    return config;
  },
} satisfies StorybookConfig;
