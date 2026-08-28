import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Relax some rules for production readiness
  {
    rules: {
      // Allow setState in effects for Three.js and modal logic
      "react-hooks/set-state-in-effect": "off",
      // Allow impure functions in render for Three.js math
      "react-hooks/purity": "off",
      // Allow unused vars in specific cases
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_|^otherLang|^lang$"
      }],
      // Allow expressions not used for their result
      "no-unused-expressions": "off",
    },
  },
]);

export default eslintConfig;
