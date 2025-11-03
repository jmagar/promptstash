// This configuration only applies to the package manager root.
// ESLint flat config format
import { config as baseConfig } from "@workspace/eslint-config/base";

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ["apps/**", "packages/**", "node_modules/**", ".next/**", "dist/**", ".turbo/**"],
  },
  ...baseConfig,
];
