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
    await expect(page.getByRole("spinbutton")).toHaveCount(6);
}

const weight = (page, name) => page.getByRole("spinbutton", { name, exact: true });
const smile = "Face (Node 0): Smile";

async function editWeight(page, name, value) {
    await weight(page, name).fill(value);
    await weight(page, name).blur();
}

test("flat named controls resolve node, mesh and implicit-zero defaults and render edits", async ({
    page
}) => {
    const errors = collectConsoleErrors(page);
    await loadMorphModel(page);
    await expect(weight(page, smile)).toHaveValue("0.25");
    await expect(weight(page, "Expressions (Node 1): Smile")).toHaveValue("0.1");
    await expect(weight(page, "Node 2: Target 0")).toHaveValue("0");
    await expect(page.getByRole("heading", { name: "Other (Node 3)" })).toHaveCount(0);
    await expect(weight(page, smile)).not.toHaveAttribute("min");
    await expect(weight(page, smile)).not.toHaveAttribute("max");
    await weight(page, smile).fill("");
    await weight(page, smile).blur();
    await expect(weight(page, smile)).toHaveValue("0.25");
    await expect(page.getByRole("button", { name: "Reset Morph Weights" })).toBeDisabled();

    await page.waitForLoadState("networkidle");
    const canvas = page.locator(ui.canvas);
    const before = await canvas.screenshot();
    await editWeight(page, smile, "-2.5");
    await expect(page.getByRole("button", { name: "Reset Morph Weights" })).toHaveCSS(
        "cursor",
        "pointer"
    );
    await expect(weight(page, smile)).toHaveValue("-2.5");
    await expect(weight(page, "Expressions (Node 1): Smile")).toHaveValue("0.1");
    await expect.poll(() => canvas.screenshot()).not.toEqual(before);
    await editWeight(page, "Node 2: Target 0", "3");
    await expect(weight(page, "Node 2: Target 0")).toHaveValue("3");

    const morphingSwitch = page
        .locator("label")
        .filter({ has: page.getByRole("checkbox", { name: "Morphing", exact: true }) });
    await morphingSwitch.click();
    await expect(weight(page, smile)).toBeDisabled();
    await morphingSwitch.click();
    await page.getByRole("button", { name: "Reset Morph Weights" }).click();
    await expect(weight(page, smile)).toHaveValue("0.25");
    await expect(weight(page, "Node 2: Target 0")).toHaveValue("0");
    await expect.poll(() => canvas.screenshot()).toEqual(before);
    expectNoConsoleErrors(errors);
});

test("overrides survive animation, pause and deselection until explicit reset", async ({
    page
}) => {
    const errors = collectConsoleErrors(page);
    await loadMorphModel(page, true);
    const blink = weight(page, "Face (Node 0): Blink");
    const initialBlink = await blink.inputValue();
    await expect.poll(() => blink.inputValue()).not.toBe(initialBlink);
    await editWeight(page, smile, "2.5");
    const nextBlink = await blink.inputValue();
    await expect.poll(() => blink.inputValue()).not.toBe(nextBlink);
    await expect(weight(page, smile)).toHaveValue("2.5");

    await openTab(page, "animations");
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await page
        .locator("label")
        .filter({ has: page.getByRole("checkbox") })
        .click();
    await openTab(page, "advanced");
    await expect(weight(page, smile)).toHaveValue("2.5");
    await expect(blink).toHaveValue("0.5");
    await page.getByRole("button", { name: "Reset Morph Weights" }).click();
    await expect(weight(page, smile)).toHaveValue("0.25");
    expectNoConsoleErrors(errors);
});

test("scene changes retain overrides, global reset clears them, model loads remove controls", async ({
    page
}) => {
    const errors = collectConsoleErrors(page);
    await loadMorphModel(page);
    await editWeight(page, smile, "4");
    await openTab(page, "models");
    await page
        .getByRole("combobox")
        .filter({ has: page.getByRole("option", { name: "Other Scene", exact: true }) })
        .selectOption("1");
    await openTab(page, "advanced");
    await expect(page.getByRole("spinbutton")).toHaveCount(2);
    await expect(weight(page, "Other (Node 3): Smile")).toHaveValue("0.1");
    await page.getByRole("button", { name: "Reset Morph Weights" }).click();
    await openTab(page, "models");
    await page
        .getByRole("combobox")
        .filter({ has: page.getByRole("option", { name: "Main", exact: true }) })
        .selectOption("0");
    await openTab(page, "advanced");
    await expect(weight(page, smile)).toHaveValue("0.25");

    await openTab(page, "models");
    await selectModel(page, "DamagedHelmet");
    await waitForLoadingToSettle(page);
    await openTab(page, "advanced");
    await expect(page.getByRole("spinbutton")).toHaveCount(0);
    expectNoConsoleErrors(errors);
});
