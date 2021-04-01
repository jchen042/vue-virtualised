module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    "plugin:vue/vue3-recommended",
    "plugin:vue/vue3-strongly-recommended",
    "plugin:json/recommended",
    "eslint:recommended",
    "@vue/prettier",
  ],
  parserOptions: {
    parser: "@babel/eslint-parser",
    plugins: ["@babel"],
    ecmaFeatures: {
      legacyDecorators: true,
    },
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    "vue/no-unused-components": "warn",
    "no-unused-vars": "warn",
  },
};
