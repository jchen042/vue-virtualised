import base from "./rollup.config.base";
import { terser } from "rollup-plugin-terser";

const config = Object.assign({}, base, {
  output: {
    exports: "named",
    name: "VueVirtualised",
    file: "dist/vue-virtualised.min.js",
    format: "iife",
    sourceMap: true,
    inlineDynamicImports: true,
  },
});

config.plugins.push(terser({}));

export default config;
