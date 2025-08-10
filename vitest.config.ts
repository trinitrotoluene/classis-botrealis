import { defineConfig } from "vitest/config";
import tsConfigPathsPlugin from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsConfigPathsPlugin()],
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
    exclude: ["integration/**/*"],
  },
});
