import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", "cache/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      semi: ["error", "always"],
      indent: ["error", 2, { SwitchCase: 1 }],
      "no-trailing-spaces": "error",
      "eol-last": ["error", "always"],
      "no-console": "off",
      "preserve-caught-error": "off",
      "@typescript-eslint/no-require-imports": "error",
      "@typescript-eslint/no-empty-function": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "prettier/prettier": [
        "error",
        {
          tabWidth: 2,
          useTabs: false,
          semi: true,
          singleQuote: false,
          trailingComma: "all",
          printWidth: 100,
          endOfLine: "auto",
        },
      ],
    },
  },
  prettierConfig,
);
