import { test } from "@playwright/test";
import { openTab, waitForLoadingToSettle } from "./viewer.js";
import { expect } from "@playwright/test";

// The canvas baselines say nothing about the panel, so a styling change can pass
// the rest of the suite untouched. These pin the panel's appearance instead, and
// are deliberately strict: any pixel move is either intended or a regression.

const PANELS = ["models", "display", "validator", "animations", "credits", "advanced"];

test.describe("appearance", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await waitForLoadingToSettle(page);
    });

    for (const panel of PANELS) {
        test(`${panel} panel`, async ({ page }) => {
            await openTab(page, panel);
            // The panel animates open and pulls webfonts, so let it settle.
            await page.waitForTimeout(600);

            await expect(page.locator("#app")).toHaveScreenshot(`panel-${panel}.png`, {
                timeout: 60_000,
                maxDiffPixelRatio: 0.01
            });
        });
    }

    test("collapsed tab rail", async ({ page }) => {
        await expect(page.locator("#app")).toHaveScreenshot("panel-collapsed.png", {
            timeout: 60_000,
            maxDiffPixelRatio: 0.01
        });
    });
});
