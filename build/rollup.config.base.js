import resolve from "@rollup/plugin-node-resolve";
import { eslint } from "rollup-plugin-eslint";
import vue from "rollup-plugin-vue";
import autoprefixer from "autoprefixer";
import babel from "rollup-plugin-babel";
import css from "rollup-plugin-css-only";
import fs from "fs";
import CleanCSS from "clean-css";
import cjs from "@rollup/plugin-commonjs";
import buble from "@rollup/plugin-buble";
import replace from "@rollup/plugin-replace";

const config = require("../package.json");

export default {
  input: "src/index.js",
  plugins: [
    resolve({
      mainFields: ["module", "jsnext", "main", "browser"],
      extensions: ["js, vue"],
    }),
    eslint({ include: ["src/**/*.{js,vue}", "src/**/**/*.{js,vue}"] }),
    vue({
      postcssPlugins: [autoprefixer],
    }),
    babel({ exclude: "node_modules/**", runtimeHelpers: true }),
    css({
      output: (styles) => {
        fs.writeFileSync(
          "dist/vue-virtualised.css",
          new CleanCSS().minify(styles).styles
        );
      },
    }),
    cjs(),
    buble(),
  ],
  watch: { include: "src/**" },
  external: ["vue", "css"],
};
