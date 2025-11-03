/* eslint-env node */
import { config as baseConfig } from "@workspace/eslint-config/base";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ["dist/**", "node_modules/**", ".turbo/**"],
  },
  ...baseConfig,
];
