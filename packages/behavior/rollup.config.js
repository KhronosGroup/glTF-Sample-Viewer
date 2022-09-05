// rollup.config.js
import typescript from "@rollup/plugin-typescript";
const pkg = require('./package.json');
const version = pkg.version;

export default {
  input: ["src/index.ts"],
  output: {
    file: "dist/bundle.module.js",
    format: "esm",
    sourcemap: true,
    banner: `/*! ${version} */`,
  },
  watch: {
    include: ["src/**"],
    exclude: ["node_modules/**"],
  },
  plugins: [typescript()],
};
