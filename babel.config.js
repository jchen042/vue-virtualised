module.exports = {
  // https://rollupjs.org/guide/en/#peer-dependencies
  plugins: ["lodash"],
  presets: [
    "@vue/cli-plugin-babel/preset",
    ["@babel/env", { targets: { node: 6 } }],
    "@babel/preset-typescript",
  ],
};
