import { chromium } from "@playwright/test";

// Throwaway: side-by-side screenshots of the Vue and React panels.
const browser = await chromium.launch({
    args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"]
});

for (const [name, url] of [
    ["vue", "http://localhost:5173/"],
    ["react", "http://localhost:5173/?react=1"]
]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(url);
    await page.locator(".loading-overlay").waitFor({ state: "detached", timeout: 120_000 });
    await page.locator("[data-testid='tab-models']").click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `dom-dump/${name}-models.png` });
    await page.close();
}

await browser.close();
