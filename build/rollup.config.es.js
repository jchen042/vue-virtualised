import base from "./rollup.config.base";

const config = Object.assign({}, base, {
  output: {
    exports: "named",
    name: "VueVirtualised",
    // dir: "dist",
    file: "dist/vue-virtualised.esm.js",
    format: "es",
    sourcemap: true,
    inlineDynamicImports: true,
  },
  external: [...base.external, "core-js", "fbjs", "lodash"],
});

export default config;
