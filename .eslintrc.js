module.exports = {
  env: {
    es6: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    "plugin:prettier/recommended",
  ],
  overrides: [
    {
      files: ["test/**/*"],
      env: {
        mocha: true,
      },
    },
  ],
  parserOptions: {
    ecmaVersion: "2020",
    project: ["tsconfig.json"],
    sourceType: "module",
    warnOnUnsupportedTypeScriptVersion: false,
  },
};