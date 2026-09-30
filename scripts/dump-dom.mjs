import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

// Throwaway: dumps the Buefy-rendered markup of each panel so the React
// rewrite can reproduce the exact class names the existing SCSS targets.
const TABS = ["models", "display", "validator", "animations", "credits", "advanced"];

const browser = await chromium.launch({
    args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"]
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto("http://localhost:5173/");
await page.locator(".loading-overlay").waitFor({ state: "detached", timeout: 120_000 });

await mkdir("dom-dump", { recursive: true });

await writeFile("dom-dump/_shell.html", await page.locator("#app").evaluate((el) => el.outerHTML));

for (const tab of TABS) {
    await page.locator(`[data-testid='tab-${tab}']`).click();
    await page.waitForTimeout(300);
    const html = await page
        .locator(".tabContent:visible")
        .first()
        .evaluate((el) => el.outerHTML);
    await writeFile(`dom-dump/${tab}.html`, html);
    console.log(`${tab}: ${html.length} bytes`);
}

await browser.close();
