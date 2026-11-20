import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist", "node_modules", ".vite"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      ...js.configs.recommended.rules,
      "no-unused-vars": "off",
    },
  },
];
