import nextPlugin from "@next/eslint-plugin-next";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import jsxA11yPlugin from "eslint-plugin-jsx-a11y";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";

const reactRecommended = reactPlugin.configs.flat.recommended;
const reactJsxRuntime = reactPlugin.configs.flat["jsx-runtime"];
const reactHooksRecommended = reactHooksPlugin.configs["recommended-latest"];

const eslintConfig = defineConfig([
  {
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  globalIgnores([
    "node_modules*/**",
    ".next/**",
    ".firebase/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  nextPlugin.flatConfig.recommended,
  nextPlugin.flatConfig.coreWebVitals,
  reactRecommended,
  reactJsxRuntime,
  reactHooksRecommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      import: importPlugin,
      "jsx-a11y": jsxA11yPlugin,
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "@next/next/no-img-element": "off",
      "import/no-anonymous-default-export": "warn",
      "react/no-unknown-property": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "jsx-a11y/alt-text": [
        "warn",
        {
          elements: ["img"],
          img: ["Image"],
        },
      ],
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/no-static-element-interactions": "off",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
      "react/jsx-no-target-blank": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
      },
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);

export default eslintConfig;
