// `storybook build` relies on the event loop draining. On Linux CI it printed
// "build completed" and never exited (esbuild child still alive), so exit explicitly.
import { build } from "storybook/internal/core-server";

try {
  await build({ mode: "static", configDir: ".storybook", outputDir: "storybook-static", quiet: true });
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
