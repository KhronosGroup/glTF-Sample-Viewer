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
    // The two assets are loaded in separate pages, opened one at a time. Navigating
    // twice in one page aborts the first load's in-flight requests, and keeping two
    // viewers alive at once races the Draco script tag that index.html loads; both
    // produce console errors that have nothing to do with the assets.
    test("a set at index 5 renders as if it were set 0", async ({ context }) => {
        const renderOf = async (asset) => {
            const page = await context.newPage();
            const errors = collectConsoleErrors(page);
            await loadTestAsset(page, asset);
            const pixels = await canvasPixels(page);
            expectNoConsoleErrors(errors);
            await page.close();
            return pixels;
        };

        const baseline = await renderOf("texcoord_0_baseline.gltf");
        const remapped = await renderOf("texcoord_5_only.gltf");

        expect(remapped).toEqual(baseline);
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

    test("a fourth set is reachable, which glTF 2.0 could not do", async ({ context }) => {
        const renderOf = async (asset) => {
            const page = await context.newPage();
            const errors = collectConsoleErrors(page);
            const warnings = [];
            page.on("console", (m) => m.type() === "warning" && warnings.push(m.text()));
            await loadTestAsset(page, asset);
            const pixels = await canvasPixels(page);
            expectNoConsoleErrors(errors);
            await page.close();
            return { pixels, warnings };
        };

        // Base colour addresses the fourth of four sets, whose UVs are quarter scale.
        // The baseline carries those same UVs as its only set, so the two must match.
        // Capped at two sets the fourth is dropped and the material samples set 0.
        const baseline = await renderOf("texcoord_fourth_baseline.gltf");
        const fourSets = await renderOf("texcoord_four_sets.gltf");

        expect(fourSets.pixels).toEqual(baseline.pixels);
        expect(fourSets.warnings.join("\n")).not.toMatch(/can be used/);
    });

    test("a set beyond the budget is dropped without shifting the others", async ({ page }) => {
        const errors = collectConsoleErrors(page);
        const warnings = [];
        page.on("console", (m) => m.type() === "warning" && warnings.push(m.text()));

        await loadTestAsset(page, "texcoord_over_limit.gltf");

        expect(warnings.join("\n")).toMatch(/can be used/);
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

test.describe("external assets", () => {
    test("a referenced child renders where the referencing node puts it", async ({ context }) => {
        const renderOf = async (asset) => {
            const page = await context.newPage();
            const errors = collectConsoleErrors(page);
            await loadTestAsset(page, asset);
            const pixels = await canvasPixels(page);
            expectNoConsoleErrors(errors);
            await page.close();
            return pixels;
        };

        // The child is loadable on its own and the node instantiating it has no transform,
        // so the two have to come out pixel for pixel the same. That catches an instance
        // placed at the wrong transform, which a "did it draw anything" check would not.
        expect(await renderOf("external_basic.gltf")).toEqual(
            await renderOf("external_child.gltf")
        );
    });

    test("one child instantiated three times draws three copies", async ({ context }) => {
        const renderOf = async (asset) => {
            const page = await context.newPage();
            const errors = collectConsoleErrors(page);
            await loadTestAsset(page, asset);
            const pixels = await canvasPixels(page);
            expectNoConsoleErrors(errors);
            await page.close();
            return pixels;
        };

        expect(await renderOf("external_reuse.gltf")).not.toEqual(
            await renderOf("external_basic.gltf")
        );
    });

    for (const asset of ["external_diamond.gltf", "external_package.glb"]) {
        test(`${asset} loads and renders`, async ({ page }) => {
            const errors = collectConsoleErrors(page);

            await loadTestAsset(page, asset);

            await expect(page.locator("#canvas")).toBeVisible();
            expectNoConsoleErrors(errors);
        });
    }

    for (const asset of ["external_cycle_direct.gltf", "external_cycle_a.gltf"]) {
        test(`${asset} is refused without taking down the viewer`, async ({ page }) => {
            const errors = collectConsoleErrors(page);

            await loadTestAsset(page, asset);

            expect(errors.join("\n")).toMatch(/cycle|recursion|depth/i);
            await expect(page.locator("#canvas")).toBeVisible();
        });
    }

    test("an instantiated asset animates itself", async ({ page }) => {
        const errors = collectConsoleErrors(page);

        await loadTestAsset(page, "external_animated.gltf");

        // The parent declares no animation, so nothing in the animation UI refers to what
        // is moving. If the viewer only redraws for animations it can list, the canvas
        // goes still and these frames come out identical.
        const frames = [];
        for (let i = 0; i < 3; i++) {
            frames.push((await canvasPixels(page)).toString("base64"));
            await page.waitForTimeout(400);
        }

        expect(new Set(frames).size).toBe(3);
        expectNoConsoleErrors(errors);
    });

    // The debug toggles live in the UI, so these two cannot use loadTestAsset: it hides
    // the panel with noUI.
    async function openWithControls(page, asset) {
        await page.goto(`/?model=test-assets/${asset}`);
        await waitForLoadingToSettle(page);
        await page.getByRole("tab", { name: "Display" }).click();
    }

    test("bounding volumes inside an instantiated asset are drawn", async ({ page }) => {
        const errors = collectConsoleErrors(page);

        await openWithControls(page, "external_shapes.gltf");
        const before = await canvasPixels(page);

        await page.getByTestId("switch-bounding-volumes").click();
        await waitForLoadingToSettle(page);

        // The child declares its own shapes, so its volumes only appear if the debug pass
        // resolves shape indices against the child document rather than the root.
        expect(await canvasPixels(page)).not.toEqual(before);
        expectNoConsoleErrors(errors);
    });

    test("hierarchy colouring tells the documents apart", async ({ page }) => {
        const errors = collectConsoleErrors(page);

        await openWithControls(page, "external_shapes.gltf");
        await page.getByTestId("switch-bounding-volumes").click();
        await waitForLoadingToSettle(page);
        const uniform = await canvasPixels(page);

        await page.getByTestId("select-shape-color").selectOption("Hierarchy Depth");
        await waitForLoadingToSettle(page);

        // Depth is keyed by node, not by index. Keyed by index, a node of the child
        // document would borrow the depth of the root node sharing its index and every
        // instance would come out the same colour as the root.
        expect(await canvasPixels(page)).not.toEqual(uniform);
        expectNoConsoleErrors(errors);
    });

    test("culling by bounding volume does not change what is visible", async ({ page }) => {
        const errors = collectConsoleErrors(page);

        // Correct culling only removes geometry that was off screen, so the image must be
        // identical either way. A volume too small for its node shows up here as a
        // difference, which is the failure this guards against.
        await openWithControls(page, "external_shapes.gltf");
        await expect(page.getByTestId("switch-cull-bounding-volumes")).toBeChecked();
        const culled = await canvasPixels(page);

        await page.getByTestId("switch-cull-bounding-volumes").click();
        await waitForLoadingToSettle(page);

        expect(await canvasPixels(page)).toEqual(culled);
        expectNoConsoleErrors(errors);
    });
});
