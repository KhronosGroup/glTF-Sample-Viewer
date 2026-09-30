import { defineConfig, devices } from "@playwright/test";

const PORT = 5173;

export default defineConfig({
    testDir: "./tests",
    // The default model and environment are fetched from GitHub at runtime, so
    // first paint depends on the network rather than on local build output.
    timeout: 180_000,
    expect: { timeout: 60_000 },
    fullyParallel: false,
    workers: 1,
    retries: process.env.CI ? 2 : 0,
    reporter: [["list"]],
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: "retain-on-failure",
        launchOptions: {
            // Headless Chromium has no GPU, so WebGL2 has to come from SwiftShader.
            args: [
                "--enable-unsafe-swiftshader",
                "--use-gl=angle",
                "--use-angle=swiftshader"
            ]
        }
    },
    projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
    webServer: {
        // Bypasses `npm run dev` so the renderer is not rebuilt on every test run.
        command: `npx vite --port ${PORT} --strictPort`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000
    }
});
