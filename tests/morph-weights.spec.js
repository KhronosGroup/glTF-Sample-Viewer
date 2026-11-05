import { expect, test } from "@playwright/test";
import {
    collectConsoleErrors,
    expectNoConsoleErrors,
    openTab,
    selectModel,
    ui,
    waitForLoadingToSettle
} from "./viewer.js";

function morphModel(animated = false) {
    const data = new Float32Array([
        -0.5, -0.5, 0, 0.5, -0.5, 0, 0, 0.5, 0, 0.4, 0, 0, 0.4, 0, 0, 0.4, 0, 0, 0, 0.4, 0, 0, 0.4,
        0, 0, 0.4, 0, 0, 1, 0.1, 0.2, 0.9, 0.8
    ]);
    const primitive = {
        attributes: { POSITION: 0 },
        targets: [{ POSITION: 1 }, { POSITION: 2 }],
        material: 0
    };
    return {
        asset: { version: "2.0" },
        scene: 0,
        scenes: [
            { name: "Main", nodes: [4, 1, 2] },
            { name: "Other Scene", nodes: [3] }
        ],
        nodes: [
            { name: "Face", mesh: 0, weights: [0.25, 0.5] },
            { mesh: 0, translation: [-2, 0, 0] },
            { mesh: 1, translation: [2, 0, 0] },
            { name: "Other", mesh: 0 },
            { children: [0] }
        ],
        meshes: [
            {
                name: "Expressions",
                weights: [0.1, 0.2],
                extras: { targetNames: ["Smile", "Blink"] },
                primitives: [primitive]
            },
            { primitives: [primitive] }
        ],
        materials: [{ extensions: { KHR_materials_unlit: {} }, doubleSided: true }],
        extensionsUsed: ["KHR_materials_unlit"],
        buffers: [
            {
                uri: `data:application/octet-stream;base64,${Buffer.from(data.buffer).toString("base64")}`,
                byteLength: data.byteLength
            }
        ],
        bufferViews: [
            { buffer: 0, byteOffset: 0, byteLength: 36 },
            { buffer: 0, byteOffset: 36, byteLength: 36 },
            { buffer: 0, byteOffset: 72, byteLength: 36 },
            { buffer: 0, byteOffset: 108, byteLength: 8 },
            { buffer: 0, byteOffset: 116, byteLength: 16 }
        ],
        accessors: [
            {
                bufferView: 0,
                componentType: 5126,
                count: 3,
                type: "VEC3",
                min: [-0.5, -0.5, 0],
                max: [0.5, 0.5, 0]
            },
            {
                bufferView: 1,
                componentType: 5126,
                count: 3,
                type: "VEC3",
                min: [0.4, 0, 0],
                max: [0.4, 0, 0]
            },
            {
                bufferView: 2,
                componentType: 5126,
                count: 3,
                type: "VEC3",
                min: [0, 0.4, 0],
                max: [0, 0.4, 0]
            },
            { bufferView: 3, componentType: 5126, count: 2, type: "SCALAR", min: [0], max: [1] },
            { bufferView: 4, componentType: 5126, count: 4, type: "SCALAR" }
        ],
        animations: animated
            ? [
                  {
                      samplers: [{ input: 3, output: 4, interpolation: "LINEAR" }],
                      channels: [{ sampler: 0, target: { node: 0, path: "weights" } }]
                  }
              ]
            : []
    };
}

async function loadMorphModel(page, animated = false) {
    await page.route(
        (url) => url.pathname === "/morph-test.gltf",
        (route) => route.fulfill({ json: morphModel(animated) })
    );
    await page.goto("/?model=/morph-test.gltf");
    await waitForLoadingToSettle(page);
    await openTab(page, "advanced");
    await expect(page.getByRole("slider")).toHaveCount(0);
    await overridesSwitch(page).click();
    await expect(page.getByRole("slider")).toHaveCount(6);
}

const overridesSwitch = (page) =>
    page
        .locator("label")
        .filter({ has: page.getByRole("checkbox", { name: "Morph Overrides", exact: true }) });

// Turning the switch off clears every override; turning it back on shows the sliders again.
async function resetOverrides(page) {
    await overridesSwitch(page).click();
    await expect(page.getByRole("slider")).toHaveCount(0);
    await overridesSwitch(page).click();
}

const weight = (page, name) => page.getByRole("slider", { name, exact: true });
const expectWeight = (page, name, value) =>
    expect(weight(page, name)).toHaveAttribute("aria-valuenow", value);
const expectUnset = (page, name) =>
    expect(weight(page, name)).toHaveAttribute("aria-valuetext", "Not set");
const smile = "Face (Node 0): Smile";

// Clicks the slider track at the given 0-1 fraction of its width. The click is
// inset by a pixel because the track's bounding box is half-open on the right,
// so clicking exactly at `x + width` misses the element.
async function setWeight(page, name, fraction) {
    const box = await weight(page, name).locator("xpath=../..").boundingBox();
    const usableWidth = Math.max(box.width - 2, 1);
    await page.mouse.click(box.x + 1 + usableWidth * fraction, box.y + box.height / 2);
}

const numeric = (page, name) => page.getByRole("spinbutton", { name, exact: true });

// Sets an exact weight through the always-visible numeric input.
async function setWeightExact(page, name, value) {
    await numeric(page, name).fill(String(value));
    await numeric(page, name).blur();
}

// The slider left its indeterminate "Not set" state.
const expectSet = (page, name) =>
    expect(weight(page, name)).not.toHaveAttribute("aria-valuetext", "Not set");

test("flat named sliders start unset and override rendering when set", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await loadMorphModel(page);
    await expectUnset(page, smile);
    await expectUnset(page, "Expressions (Node 1): Smile");
    await expectUnset(page, "Node 2: Target 0");
    await expect(page.getByRole("heading", { name: "Other (Node 3)" })).toHaveCount(0);
    await expect(weight(page, smile)).toHaveAttribute("aria-valuemin", "0");
    await expect(weight(page, smile)).toHaveAttribute("aria-valuemax", "1");

    await page.waitForLoadState("networkidle");
    const canvas = page.locator(ui.canvas);
    const before = await canvas.screenshot();
    await setWeight(page, smile, 1);
    await expectSet(page, smile);
    await expectUnset(page, "Expressions (Node 1): Smile");
    await expect.poll(() => canvas.screenshot()).not.toEqual(before);
    await setWeight(page, "Node 2: Target 0", 1);
    await expectSet(page, "Node 2: Target 0");

    const morphingSwitch = page
        .locator("label")
        .filter({ has: page.getByRole("checkbox", { name: "Morphing", exact: true }) });
    await morphingSwitch.click();
    await expect(
        weight(page, smile).locator("xpath=ancestor::div[@aria-disabled][1]")
    ).toHaveAttribute("aria-disabled", "true");
    await morphingSwitch.click();
    await resetOverrides(page);
    await expectUnset(page, smile);
    await expectUnset(page, "Node 2: Target 0");
    await expect.poll(() => canvas.screenshot()).toEqual(before);
    expectNoConsoleErrors(errors);
});

test("overrides survive animation, pause and deselection until explicit reset", async ({
    page
}) => {
    const errors = collectConsoleErrors(page);
    await loadMorphModel(page, true);
    await setWeightExact(page, smile, 1);
    await expectWeight(page, smile, "1");
    await expectUnset(page, "Face (Node 0): Blink");

    await openTab(page, "animations");
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await page
        .locator("label")
        .filter({ has: page.getByRole("checkbox") })
        .click();
    await openTab(page, "advanced");
    await expectWeight(page, smile, "1");
    await resetOverrides(page);
    await expectUnset(page, smile);
    expectNoConsoleErrors(errors);
});

test("scene changes retain overrides, global reset clears them, model loads remove controls", async ({
    page
}) => {
    const errors = collectConsoleErrors(page);
    await loadMorphModel(page);
    await setWeight(page, smile, 1);
    await openTab(page, "models");
    await page
        .getByRole("combobox")
        .filter({ has: page.getByRole("option", { name: "Other Scene", exact: true }) })
        .selectOption("1");
    await openTab(page, "advanced");
    await expect(page.getByRole("slider")).toHaveCount(2);
    await expectUnset(page, "Other (Node 3): Smile");
    await resetOverrides(page);
    await openTab(page, "models");
    await page
        .getByRole("combobox")
        .filter({ has: page.getByRole("option", { name: "Main", exact: true }) })
        .selectOption("0");
    await openTab(page, "advanced");
    await expectUnset(page, smile);

    await openTab(page, "models");
    await selectModel(page, "DamagedHelmet");
    await waitForLoadingToSettle(page);
    await openTab(page, "advanced");
    await expect(page.getByRole("slider")).toHaveCount(0);
    expectNoConsoleErrors(errors);
});

test("numeric input shares overrides with sliders and clears them when emptied", async ({
    page
}) => {
    const errors = collectConsoleErrors(page);
    await loadMorphModel(page);

    // The numeric input sits beside the slider and starts empty (unset).
    await expect(numeric(page, smile)).toHaveValue("");
    await expect(numeric(page, "Face (Node 0): Blink")).toHaveValue("");
    await expect(numeric(page, "Face (Node 0): Blink")).toHaveAttribute("placeholder", "-");

    // Setting a numeric value updates the matching slider.
    await setWeightExact(page, smile, 1);
    await expect(numeric(page, smile)).toHaveValue("1");
    await expectWeight(page, smile, "1");

    // The numeric input accepts values outside the slider's 0..1 range.
    await setWeightExact(page, "Face (Node 0): Blink", -1.5);
    await expectWeight(page, "Face (Node 0): Blink", "-1.5");

    // Emptying the input clears the override, returning the slider to unset.
    await numeric(page, smile).fill("");
    await numeric(page, smile).blur();
    await expect(numeric(page, smile)).toHaveValue("");
    await expectUnset(page, smile);

    expectNoConsoleErrors(errors);
});

test("slider range toggles between [0, 1] and [-1, 1]", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await loadMorphModel(page);

    const range01 = page.getByRole("button", { name: "[0, 1]", exact: true });
    const range11 = page.getByRole("button", { name: "[-1, 1]", exact: true });

    await expect(range01).toHaveAttribute("aria-pressed", "true");
    await expect(range11).toHaveAttribute("aria-pressed", "false");
    await expect(weight(page, smile)).toHaveAttribute("aria-valuemin", "0");
    await expect(weight(page, smile)).toHaveAttribute("aria-valuemax", "1");

    await range11.click();
    await expect(range11).toHaveAttribute("aria-pressed", "true");
    await expect(range01).toHaveAttribute("aria-pressed", "false");
    await expect(weight(page, smile)).toHaveAttribute("aria-valuemin", "-1");
    await expect(weight(page, smile)).toHaveAttribute("aria-valuemax", "1");

    await range01.click();
    await expect(weight(page, smile)).toHaveAttribute("aria-valuemin", "0");

    expectNoConsoleErrors(errors);
});
