import { test } from "@playwright/test";
import { openTab, selectModel, ui, waitForLoadingToSettle } from "./viewer.js";
import { expect } from "@playwright/test";

// The canvas baselines say nothing about the panel, so a styling change can pass
// the rest of the suite untouched. These pin the panel's appearance instead, and
// are deliberately strict: the panel is plain DOM, so any pixel move is either
// intended or a regression. Update them with `-u all`, not `-u`.

const PANELS = ["models", "display", "validator", "animations", "credits", "advanced"];

test.describe("appearance", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/");
        await waitForLoadingToSettle(page);
    });

    for (const panel of PANELS) {
        test(`${panel} panel`, async ({ page }) => {
            // The animations tab only shows when the asset has animations, so
            // load an animated model before opening it.
            if (panel === "animations") {
                await openTab(page, "models");
                await selectModel(page, "BoxAnimated");
                await waitForLoadingToSettle(page);
            }

            await openTab(page, panel);
            // The panel pulls webfonts, so let it settle.
            await page.waitForTimeout(600);

            await expect(page.locator(ui.menu)).toHaveScreenshot(`panel-${panel}.png`, {
                timeout: 60_000
            });
        });
    }

    test("collapsed tab rail", async ({ page }) => {
        // Models opens by default; clicking it again collapses the panel.
        await page.locator(ui.tab("models")).click();
        await page.waitForTimeout(600);

        await expect(page.locator(ui.menu)).toHaveScreenshot("panel-collapsed.png", {
            timeout: 60_000
        });
    });
});
