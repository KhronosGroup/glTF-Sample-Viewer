import { expect, test } from "@playwright/test";
import {
    canvasPixels,
    collectConsoleErrors,
    expectNoConsoleErrors,
    loadTestAsset,
    waitForLoadingToSettle
} from "./viewer.js";

// Physics runs as soon as an asset using KHR_physics_rigid_bodies loads, so these drive
// the simulation by waiting rather than by stepping it.

// Long enough for a box dropped from 2.3 units up to land and stop bouncing.
const SETTLE_MS = 3000;

async function settled(page, asset) {
    await loadTestAsset(page, asset);
    await page.waitForTimeout(SETTLE_MS);
    return canvasPixels(page);
}

test("a dropped box falls to the floor", async ({ context }) => {
    // Comparing against the same scene without physics rather than against an earlier
    // frame: the box lands in well under a second, which is faster than the viewer
    // finishes loading, so there is no "before" frame to catch it in mid air.
    const render = async (asset) => {
        const page = await context.newPage();
        const errors = collectConsoleErrors(page);
        const pixels = await settled(page, asset);
        expectNoConsoleErrors(errors);
        await page.close();
        return pixels;
    };

    expect(await render("physics_same_document.gltf")).not.toEqual(
        await render("physics_static_reference.gltf")
    );
});

test("a dropped box comes to rest rather than falling forever", async ({ page }) => {
    const errors = collectConsoleErrors(page);

    await loadTestAsset(page, "physics_same_document.gltf");
    await page.waitForTimeout(SETTLE_MS);
    const resting = await canvasPixels(page);
    await page.waitForTimeout(1000);

    // Still moving a second later means it missed the floor.
    expect(await canvasPixels(page)).toEqual(resting);
    expectNoConsoleErrors(errors);
});

test.fixme("a collider in an external asset takes part in the simulation", async ({ context }) => {
    // Parked pending a ruling from the glTF working group on what physics means across
    // documents: whether one simulation spans the tree, and what a joint or a compound
    // trigger naming a node index means when the index belongs to another document.
    //
    // The scene is the same twice: once in a single document, once with the floor moved
    // into an external asset. Today the floor's collider never reaches the engine, so the
    // box falls through it and the two settle in different places. See open question 12.
    const render = async (asset) => {
        const page = await context.newPage();
        const errors = collectConsoleErrors(page);
        const pixels = await settled(page, asset);
        expectNoConsoleErrors(errors);
        await page.close();
        return pixels;
    };

    expect(await render("physics_cross_document.gltf")).toEqual(
        await render("physics_same_document.gltf")
    );
});
