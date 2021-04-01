import base from "./rollup.config.base";

const config = Object.assign({}, base, {
  output: {
    exports: "named",
    name: "VueVertualised",
    file: "dist/vue-virtualised.umd.js",
    format: "umd",
    sourceMap: true,
    // https://github.com/lukeed/navaid/issues/5
    inlineDynamicImports: true,
    treeshake: true,
  },
});

export default config;
