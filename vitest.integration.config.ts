import { defineConfig } from "vitest/config";
import tsConfigPathsPlugin from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsConfigPathsPlugin()],
  test: {
    globals: true,
    setupFiles: ["./vitest.setup.integration.ts"],
    include: ["integration/**/*.spec.ts"],
  },
});
