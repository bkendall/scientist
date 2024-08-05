import eslint from "@eslint/js";
import eslintConfigGoogle from "eslint-config-google";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

export default [
  // I don't know why this doesn't just work...
  eslint.configs.recommended, // eslint-disable-line @typescript-eslint/no-unsafe-member-access
  ...tseslint.configs.recommendedTypeChecked,
  eslintConfigGoogle,
  eslintConfigPrettier,
  eslintPluginPrettierRecommended,
  {
    ignores: ["dist/**/*"],
  },
  {
    "rules": {
      "prettier/prettier": "error",
      "prefer-arrow-callback": "error",
      "no-unused-vars": "off", // Turned off in favor of @typescript-eslint/no-unused-vars.
      "require-atomic-updates": "off", // This rule is so noisy and isn't useful: https://github.com/eslint/eslint/issues/11899
      "require-jsdoc": "off", // This rule is deprecated and superseded by jsdoc/require-jsdoc.
      "valid-jsdoc": "off", // This is deprecated but included in recommended configs.
    },
    languageOptions: {
      ecmaVersion: 2023,
      parserOptions: {
        ecmaVersion: "es2023",
        projectService: {
          allowDefaultProject: ["eslint.config.js"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
