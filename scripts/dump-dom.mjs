import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Throwaway: dumps the Buefy-rendered markup of each panel so the React
// rewrite can reproduce the exact class names the existing SCSS targets.
// Output goes outside the project so Vite does not watch it and reload the
// page mid-capture.
export const DUMP_DIR = join(tmpdir(), "gltf-viewer-ui-dump");

const TABS = ["models", "display", "validator", "animations", "credits", "advanced"];

const browser = await chromium.launch({
    args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"]
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultNavigationTimeout(0);
await page.goto("http://localhost:5173/");
const overlay = page.locator(".loading-overlay");
await overlay.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
await overlay.waitFor({ state: "detached", timeout: 120_000 });

await mkdir(DUMP_DIR, { recursive: true });

await writeFile(
    join(DUMP_DIR, "_shell.html"),
    await page.locator("#app").evaluate((el) => el.outerHTML)
);

for (const tab of TABS) {
    await page.locator(`[data-testid='tab-${tab}']`).click();
    await page.waitForTimeout(300);
    const html = await page
        .locator(".tabContent:visible")
        .first()
        .evaluate((el) => el.outerHTML);
    await writeFile(join(DUMP_DIR, `${tab}.html`), html);
    console.log(`${tab}: ${html.length} bytes -> ${DUMP_DIR}`);
}

await browser.close();
