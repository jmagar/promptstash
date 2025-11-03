// This configuration only applies to the package manager root.
// ESLint flat config format
import { config as baseConfig } from "./packages/eslint-config/base.js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ["apps/**", "packages/**", "node_modules/**", ".next/**", "dist/**", ".turbo/**"],
  },
  ...baseConfig,
];
