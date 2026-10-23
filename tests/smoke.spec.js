import { expect, test } from "@playwright/test";
import {
    collectConsoleErrors,
    expectCanvasToRender,
    expectNoConsoleErrors,
    openTab,
    ui,
    waitForLoadingToSettle
} from "./viewer.js";

test("boots the full UI without errors", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);

    await expect(page.locator(ui.canvas)).toBeVisible();
    await expect(page.locator(ui.menu)).toBeVisible();
    expectNoConsoleErrors(errors);
});

test("decodes Draco geometry with a decoder served from the app's own origin", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const decoderUrls = [];
    page.on("response", (response) => {
        if (response.url().includes("draco")) {
            decoderUrls.push(response.url());
        }
    });

    await page.goto("/");
    await waitForLoadingToSettle(page);
    await openTab(page, "models");

    await page.locator(ui.modelSelect).selectOption("Avocado");
    await waitForLoadingToSettle(page);
    await page.locator(ui.flavourSelect).selectOption("glTF-Draco");
    await waitForLoadingToSettle(page);

    // The Draco flavour carries no uncompressed geometry, so matching the baseline
    // the uncompressed one produced is what says the decoder actually ran.
    await expectCanvasToRender(page, "avocado.png");

    const appHost = new URL(page.url()).host;
    expect(decoderUrls.length).toBeGreaterThan(0);
    for (const url of decoderUrls) {
        expect(new URL(url).host, `${url} is off-origin`).toBe(appHost);
    }
    expectNoConsoleErrors(errors);
});
