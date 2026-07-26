import js from "@eslint/js"
import { defineConfig, globalIgnores } from "eslint/config"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import sonarjs from "eslint-plugin-sonarjs"
import globals from "globals"
import tseslint from "typescript-eslint"

const eslintConfig = defineConfig([
  globalIgnores(["dist", "node_modules"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
      sonarjs.configs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      // React/JSX style patterns that produce high noise vs value
      "sonarjs/no-nested-conditional": "off",
      "sonarjs/void-use": "off",
      "sonarjs/no-nested-functions": "warn",
      "sonarjs/cognitive-complexity": ["warn", 20],
      "sonarjs/slow-regex": "warn",
      "sonarjs/pseudo-random": "off",
      "sonarjs/no-intrusive-permissions": "off",
      "sonarjs/no-nested-template-literals": "warn",
      // Prefer warnings for hook dep hygiene during iteration
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    // shadcn / design-system primitives — compound component APIs + vendor complexity
    files: [
      "src/components/ui/**/*.{ts,tsx}",
      "src/components/shadcn-space/**/*.{ts,tsx}",
    ],
    rules: {
      "react-refresh/only-export-components": "off",
      "sonarjs/cognitive-complexity": "off",
      "sonarjs/no-nested-functions": "off",
      "sonarjs/no-nested-conditional": "off",
      "sonarjs/pseudo-random": "off",
      "sonarjs/no-duplicated-branches": "off",
    },
  },
  {
    // Theme provider co-exports hook + types (standard React context pattern)
    files: ["src/components/theme-provider.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
])

export default eslintConfig
