import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { collectConsoleErrors, expectNoConsoleErrors, waitForLoadingToSettle } from "./viewer.js";

// Checks against a real authored asset rather than a synthesised one. Both files share
// suzanne.bin; only the second declares a thumbnail.
//
// The assets are not committed: thumbnail.png alone is 7 MB. Stage them by copying
// suzanne.gltf, suzanne_thumbnail.gltf, suzanne.bin and thumbnail.png into
// public/local-assets/, which is gitignored and, unlike public/test-assets/, is not
// wiped by `npm run gen:test-assets`.

const ASSET_DIR = "public/local-assets";
const available = existsSync(`${ASSET_DIR}/suzanne.gltf`);

test.skip(!available, `${ASSET_DIR}/suzanne.gltf is not staged`);

const warningsOf = (page) => {
    const warnings = [];
    page.on("console", (message) => {
        if (message.type() === "warning") {
            warnings.push(message.text());
        }
    });
    return warnings;
};

test("an asset without a thumbnail loads without complaining about one", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const warnings = warningsOf(page);

    await page.goto("/?model=local-assets/suzanne.gltf");
    await waitForLoadingToSettle(page);

    // Thumbnails are optional, so their absence must be silent.
    expect(warnings.join("\n")).not.toMatch(/thumbnail/i);
    expectNoConsoleErrors(errors);
});

test("an asset with a thumbnail shows it", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const warnings = warningsOf(page);

    await page.goto("/?model=local-assets/suzanne_thumbnail.gltf");
    await waitForLoadingToSettle(page);
    await page.getByTestId("tab-credits").click();

    const thumbnail = page.getByTestId("asset-thumbnail").locator("img");
    await expect(thumbnail).toBeVisible();
    await expect.poll(() => thumbnail.evaluate((image) => image.naturalWidth)).toBe(3584);

    expect(warnings.join("\n")).not.toMatch(/thumbnail/i);
    expectNoConsoleErrors(errors);
});

test("both spellings of the asset render the same mesh", async ({ context }) => {
    const renderOf = async (name) => {
        const page = await context.newPage();
        const errors = collectConsoleErrors(page);
        await page.goto(`/?noUI=1&model=local-assets/${name}`);
        await waitForLoadingToSettle(page);
        const pixels = await page.locator("#canvas").screenshot();
        expectNoConsoleErrors(errors);
        await page.close();
        return pixels;
    };

    // The thumbnail must not reach the scene: it is not used by any texture, so the two
    // assets have to render identically despite one carrying a 7 MB image.
    expect(await renderOf("suzanne_thumbnail.gltf")).toEqual(await renderOf("suzanne.gltf"));
});

test("the shape showcase loads cleanly", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const warnings = warningsOf(page);

    await page.goto("/?noUI=1&model=local-assets/shapes_all.gltf");
    await waitForLoadingToSettle(page);

    // Nothing draws shapes yet, so this only pins that every type parses and every
    // bounding volume resolves. It becomes a visual test once debug drawing lands.
    expect(warnings.join("\n")).not.toMatch(/shape|bounding/i);
    expectNoConsoleErrors(errors);
});
