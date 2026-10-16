import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Throwaway: side-by-side screenshots of a Vue and React panel. Output goes
// outside the project so Vite does not watch it and reload the page.
const OUT_DIR = join(tmpdir(), "gltf-viewer-ui-dump");
const tab = process.argv[2] ?? "models";

await mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch({
    args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"]
});

for (const [name, url] of [
    ["vue", "http://localhost:5173/"],
    ["react", "http://localhost:5173/?react=1"]
]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    // index.html loads Draco and icon fonts from CDNs with a blocking script tag,
    // so navigation can take far longer than the default timeout.
    page.setDefaultNavigationTimeout(0);
    await page.goto(url);
    const overlay = page.locator(".loading-overlay");
    await overlay.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    await overlay.waitFor({ state: "detached", timeout: 120_000 });
    await page.locator(`[data-testid='tab-${tab}']`).click();
    await page.waitForTimeout(700);
    const path = join(OUT_DIR, `${name}-${tab}.png`);
    await page.screenshot({ path });
    console.log(path);
    await page.close();
}

await browser.close();
