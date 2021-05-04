import fs from "fs";
import path from "path";

import alias from "@rollup/plugin-alias";
import resolve from "@rollup/plugin-node-resolve";
import eslint from "@rollup/plugin-eslint";
import babel from "rollup-plugin-babel";
import vue from "rollup-plugin-vue";
import typescript from "rollup-plugin-typescript2";
import ttypescript from "ttypescript";
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
      typescript: ttypescript,
      tsconfig: path.resolve(__dirname, "../tsconfig.json"),
      // https://github.com/ezolenko/rollup-plugin-typescript2/issues/201#issuecomment-726802613
      useTsconfigDeclarationDir: true,
      tsconfigOverride: {
        compilerOptions: {
          // declaration: false,
          // plugins: [
          //   { transform: "typescript-transform-paths" },
          //   {
          //     transform: "typescript-transform-paths",
          //     afterDeclarations: true,
          //   },
          // ],
        },
      },
    }),
    commonjs(),
    // css({
    //   output: (styles) => {
    //     fs.writeFileSync(
    //       "dist/vue-virtualised.css",
    //       new CleanCSS().minify(styles).styles
    //     );
    //   },
    // }),
    // buble(),
  ],
  watch: { include: "src/**" },
  // https://rollupjs.org/guide/en/#peer-dependencies
  external: ["vue", "css"],
};
