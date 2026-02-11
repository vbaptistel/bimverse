import { defineConfig, globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: true,
      },
    },
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/modules/*/domain",
              from: "./src/modules/*/application",
            },
            {
              target: "./src/modules/*/domain",
              from: "./src/modules/*/infrastructure",
            },
            {
              target: "./src/modules/*/domain",
              from: "./src/modules/*/interface",
            },
            {
              target: "./src/modules/*/application",
              from: "./src/modules/*/infrastructure",
            },
            {
              target: "./src/modules/*/application",
              from: "./src/modules/*/interface",
            },
            {
              target: "./src/modules/*/infrastructure",
              from: "./src/modules/*/interface",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/modules/*/domain/*",
                "@/modules/*/application/*",
                "@/modules/*/infrastructure/*",
              ],
              message:
                "UI pode importar apenas a camada interface dos módulos.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/modules/*/interface/actions/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/shared/infrastructure/db/*",
                "@/modules/*/infrastructure/*",
              ],
              message:
                "Server Actions não podem acessar infraestrutura diretamente; use composition + use case.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "drizzle/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
