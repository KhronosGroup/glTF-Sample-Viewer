import { expect, test } from "@playwright/test";
import {
    collectConsoleErrors,
    expectNoConsoleErrors,
    ui,
    waitForLoadingToSettle
} from "./viewer.js";

test("boots the full UI without errors", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await page.goto("/");
    await waitForLoadingToSettle(page);

    await expect(page.locator(ui.canvas)).toBeVisible();
    await expect(page.locator(ui.tabs)).toBeVisible();
    expectNoConsoleErrors(errors);
});

test("serves the Draco decoder itself rather than fetching it from a CDN", async ({ page }) => {
    const decoderUrls = [];
    page.on("response", (response) => {
        if (response.url().includes("draco")) {
            decoderUrls.push(response.url());
        }
    });

    await page.goto("/");
    await waitForLoadingToSettle(page);

    // No asset in the suite is Draco-compressed, so the decoder would otherwise be
    // downloaded and never run. Constructing a Decoder needs a live runtime, which is
    // what distinguishes a working copy from a file that merely parsed.
    const geometryType = await page.evaluate(
        () =>
            new Promise((resolve) => {
                window.DracoDecoderModule({
                    onModuleLoaded: (module) => {
                        const decoder = new module.Decoder();
                        const buffer = new module.DecoderBuffer();
                        buffer.Init(new Int8Array([1, 2, 3, 4]), 4);
                        const type = decoder.GetEncodedGeometryType(buffer);
                        module.destroy(decoder);
                        module.destroy(buffer);
                        resolve(type);
                    }
                });
            })
    );
    // Garbage in, INVALID_GEOMETRY_TYPE out.
    expect(geometryType).toBe(0);

    const appHost = new URL(page.url()).host;
    expect(decoderUrls.length).toBeGreaterThan(0);
    for (const url of decoderUrls) {
        expect(new URL(url).host, `${url} is off-origin`).toBe(appHost);
    }
});
