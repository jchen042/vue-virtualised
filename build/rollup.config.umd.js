import base from "./rollup.config.base";

const config = Object.assign({}, base, {
  output: {
    exports: "named",
    name: "VueVertualised",
    file: "dist/vue-virtualised.umd.js",
    format: "umd",
    sourcemap: false,
    // https://github.com/lukeed/navaid/issues/5
    inlineDynamicImports: true,
  },
});

export default config;
