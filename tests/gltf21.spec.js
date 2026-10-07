import { expect, test } from "@playwright/test";
import {
    canvasPixels,
    collectConsoleErrors,
    expectCanvasToRender,
    expectNoConsoleErrors,
    loadTestAsset,
    waitForLoadingToSettle
} from "./viewer.js";

// Drives the synthetic glTF 2.1 assets through a real browser load. The renderer's unit
// tests cover the parsers in isolation; these cover the path from URL to pixels.
//
// Run `npm run gen:test-assets` first. The assets are generated rather than committed.

// Every GLB container variant wraps the same quad, so they must all render identically.
// Comparing them against one shared baseline is a stronger assertion than giving each
// its own: a chunk binding bug shows up as a difference between variants, which no
// amount of re-recording can hide.
const EQUIVALENT_GLB_CONTAINERS = [
    "glb2_baseline.glb",
    "glb3_single_bin.glb",
    "glb3_implicit.glb",
    "glb3_multi_bin.glb",
    "glb3_chunk_before_json.glb",
    "glb3_unknown_chunk_type.glb",
    "glb3_gap_padding.glb"
];

test.describe("GLB container variants", () => {
    for (const asset of EQUIVALENT_GLB_CONTAINERS) {
        test(`${asset} renders the same quad`, async ({ page }) => {
            const errors = collectConsoleErrors(page);

            await loadTestAsset(page, asset);

            await expectCanvasToRender(page, "gltf21-quad.png");
            expectNoConsoleErrors(errors);
        });
    }
});

test.describe("unreadable GLB chunks", () => {
    test("an undecodable buffer chunk fails without taking down the viewer", async ({ page }) => {
        const errors = collectConsoleErrors(page);

        await loadTestAsset(page, "glb3_unknown_encoding.glb");

        // The buffer cannot be decoded, so the load must report rather than render
        // garbage. The canvas has to survive so the user can pick another model.
        expect(errors.join("\n")).toMatch(/encoding/i);
        await expect(page.locator("#canvas")).toBeVisible();
    });

    test("an encoded JSON chunk is refused", async ({ page }) => {
        const errors = collectConsoleErrors(page);

        await loadTestAsset(page, "glb3_unknown_encoding_json.glb");

        expect(errors.join("\n")).toMatch(/encoding|GLB container/i);
        await expect(page.locator("#canvas")).toBeVisible();
    });
});

test.describe("non-sequential texture coordinate sets", () => {
    // texcoord_5_only carries its UVs at set 5 and texcoord_0_baseline at set 0, with
    // identical values. If the remap is wrong the two renders diverge.
    //
    // Each asset gets its own page: navigating twice aborts the first load's in-flight
    // requests, which surfaces as console errors unrelated to what is being tested.
    test("a set at index 5 renders as if it were set 0", async ({ context }) => {
        const basePage = await context.newPage();
        const baseErrors = collectConsoleErrors(basePage);
        await loadTestAsset(basePage, "texcoord_0_baseline.gltf");
        const baseline = await canvasPixels(basePage);

        const remapPage = await context.newPage();
        const remapErrors = collectConsoleErrors(remapPage);
        await loadTestAsset(remapPage, "texcoord_5_only.gltf");
        const remapped = await canvasPixels(remapPage);

        expect(remapped).toEqual(baseline);
        expectNoConsoleErrors(baseErrors);
        expectNoConsoleErrors(remapErrors);
    });

    test("non-consecutive sets load and render", async ({ page }) => {
        const errors = collectConsoleErrors(page);

        await loadTestAsset(page, "texcoord_1_3.gltf");

        await expectCanvasToRender(page, "gltf21-texcoord-1-3.png");
        expectNoConsoleErrors(errors);
    });

    test("a missing set falls back instead of failing", async ({ page }) => {
        const errors = collectConsoleErrors(page);
        const warnings = [];
        page.on("console", (message) => {
            if (message.type() === "warning") {
                warnings.push(message.text());
            }
        });

        await loadTestAsset(page, "texcoord_missing_set.gltf");

        expect(warnings.join("\n")).toMatch(/TEXCOORD_2/);
        expectNoConsoleErrors(errors);
    });
});

test.describe("thumbnails", () => {
    for (const asset of [
        "thumbnail_bufferview.glb",
        "thumbnail_shared.glb",
        "thumbnail_datauri.gltf"
    ]) {
        test(`${asset} shows its thumbnail in the credits tab`, async ({ page }) => {
            const errors = collectConsoleErrors(page);

            await page.goto(`/?model=test-assets/${asset}`);
            await waitForLoadingToSettle(page);
            await page.getByTestId("tab-credits").click();

            const thumbnail = page.getByTestId("asset-thumbnail").locator("img");
            await expect(thumbnail).toBeVisible();
            // A broken object URL still renders an <img>, so check it decoded.
            await expect
                .poll(() => thumbnail.evaluate((image) => image.naturalWidth))
                .toBeGreaterThan(0);
            expectNoConsoleErrors(errors);
        });
    }

    test("an asset without a thumbnail shows no thumbnail", async ({ page }) => {
        await page.goto("/?model=test-assets/glb3_single_bin.glb");
        await waitForLoadingToSettle(page);
        await page.getByTestId("tab-credits").click();

        await expect(page.getByTestId("asset-thumbnail")).toHaveCount(0);
    });
});

test.describe("shapes and bounding volumes", () => {
    // Nothing renders shapes yet, so this only asserts they parse without complaint.
    // It becomes a visual test once debug drawing lands.
    for (const asset of ["shapes_all.gltf", "bv_transform.gltf"]) {
        test(`${asset} loads cleanly`, async ({ page }) => {
            const errors = collectConsoleErrors(page);

            await loadTestAsset(page, asset);

            expectNoConsoleErrors(errors);
        });
    }
});
