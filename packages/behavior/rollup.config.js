// rollup.config.js
import typescript from "@rollup/plugin-typescript";
const pkg = require('./package.json');
const version = pkg.version;

export default {
  input: ["src/main.ts"],
  output: {
    file: "dist/js/bundle.js",
    format: "iife",
    sourcemap: true,
    banner: `/*! ${version} */`,
  },
  watch: {
    include: ["src/**"],
    exclude: ["node_modules/**"],
  },
  plugins: [typescript()],
};
