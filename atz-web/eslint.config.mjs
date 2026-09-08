import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "coverage/**"]),

  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "smart"],
      "prefer-const": "error",
    },
  },

  {
    // The WebGL engine drives an imperative render loop: it mutates three.js
    // objects during animation and writes DOM transforms outside React's
    // model. These rules are correct everywhere else in the codebase, so the
    // exemption is scoped to the two files that genuinely need it rather than
    // switched off repo-wide.
    files: ["src/components/hero-orbit/engine.ts", "src/components/hero-orbit/HeroOrbit.tsx"],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },

  {
    // Server-side modules log deliberately; that is their observability path.
    files: [
      "src/lib/**/*.ts",
      "src/app/api/**/*.ts",
      "src/app/**/error.tsx",
      "src/app/global-error.tsx",
    ],
    rules: { "no-console": "off" },
  },

  {
    files: ["e2e/**/*.ts", "**/*.test.ts", "vitest.config.mts", "playwright.config.ts"],
    rules: { "no-console": "off" },
  },
]);
