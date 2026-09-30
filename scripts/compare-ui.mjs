import { chromium } from "@playwright/test";

// Throwaway: side-by-side screenshots of a Vue and React panel.
const tab = process.argv[2] ?? "models";

const browser = await chromium.launch({
    args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"]
});

for (const [name, url] of [
    ["vue", "http://localhost:5173/"],
    ["react", "http://localhost:5173/?react=1"]
]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(url);
    const overlay = page.locator(".loading-overlay");
    await overlay.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
    await overlay.waitFor({ state: "detached", timeout: 120_000 });
    await page.locator(`[data-testid='tab-${tab}']`).click();
    await page.waitForTimeout(700);
    await page.screenshot({ path: `dom-dump/${name}-${tab}.png` });
    await page.close();
}

await browser.close();
