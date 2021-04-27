import fs from "fs";
import path from "path";

import alias from "@rollup/plugin-alias";
import resolve from "@rollup/plugin-node-resolve";
import eslint from "@rollup/plugin-eslint";
import babel from "rollup-plugin-babel";
import vue from "rollup-plugin-vue";
import typescript from "rollup-plugin-typescript2";
import commonjs from "@rollup/plugin-commonjs";
import autoprefixer from "autoprefixer";
import css from "rollup-plugin-css-only";
import CleanCSS from "clean-css";
import buble from "@rollup/plugin-buble";
import replace from "@rollup/plugin-replace";

import config from "../package.json";

export default {
  input: "src/index.ts",
  plugins: [
    alias({
      entries: [
        { find: "@", replacement: `${path.resolve(__dirname, "../src")}` },
      ],
    }),
    resolve({
      mainFields: ["module", "jsnext:main", "main", "browser"],
      extensions: ["js", "ts", "vue"],
    }),
    eslint({ include: ["src/**/*.{js,ts,vue}", "src/**/**/*.{js,ts,vue}"] }),
    vue({
      postcssPlugins: [autoprefixer],
    }),
    babel({
      exclude: "node_modules/**",
      presets: ["@babel/preset-env", "@babel/preset-typescript"],
      runtimeHelpers: true,
    }),
    typescript({
      tsconfig: path.resolve(__dirname, "../tsconfig.json"),
      tsconfigOverride: {
        compilerOptions: { declaration: false },
      },
    }),
    commonjs(),
    css({
      output: (styles) => {
        fs.writeFileSync(
          "dist/vue-virtualised.css",
          new CleanCSS().minify(styles).styles
        );
      },
    }),
    // buble(),
  ],
  watch: { include: "src/**" },
  // https://rollupjs.org/guide/en/#peer-dependencies
  external: ["vue", "css"],
};
