module.exports = {
  root: true,
  env: {
    node: true,
  },
  // https://github.com/vuejs/eslint-config-typescript
  extends: [
    "plugin:vue/vue3-recommended",
    "plugin:vue/vue3-strongly-recommended",
    "plugin:json/recommended",
    "eslint:recommended",
    "@vue/prettier",
    "@vue/typescript/recommended",
  ],
  parserOptions: {
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint/eslint-plugin"],
    ecmaFeatures: {
      legacyDecorators: true,
    },
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "vue/no-unused-components": "warn",
    "no-unused-vars": "warn",
    // https://stackoverflow.com/questions/64529114/eslint-vue-plugin-showing-false-positives-for-vue-comment-directive
    "vue/comment-directive": 0,
  },
};
