import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// Scaffolding only for now — asset copying, license banner, and dev/build script
// wiring land in later steps of vite_refactor.md.
export default defineConfig({
    plugins: [vue()]
});
