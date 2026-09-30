import { expect, test } from "@playwright/test";
import {
    collectConsoleErrors,
    expectCanvasToRender,
    expectNoConsoleErrors,
    openTab,
    ui,
    waitForLoadingToSettle
} from "./viewer.js";

// The React UI is opt-in via ?react until it reaches parity. Running the same
// assertions against both, against shared canvas baselines, is what keeps them
// honest: a divergence in layout or in what reaches the renderer fails here.
const UIS = [
    { name: "vue", query: "" },
    { name: "react", query: "?react=1" }
];

for (const target of UIS) {
    test.describe(target.name, () => {
        test("renders the default model", async ({ page }) => {
            const errors = collectConsoleErrors(page);

            await page.goto(`/?noUI=1${target.query.replace("?", "&")}`);
            await waitForLoadingToSettle(page);

            await expectCanvasToRender(page, "default-model.png");
            expectNoConsoleErrors(errors);
        });

        test("loads a model chosen from the dropdown", async ({ page }) => {
            const errors = collectConsoleErrors(page);

            await page.goto(`/${target.query}`);
            await waitForLoadingToSettle(page);
            await openTab(page, "models");

            await page.locator(ui.modelSelect).selectOption("Avocado");
            await waitForLoadingToSettle(page);

            await expect(page.locator(ui.modelSelect)).toHaveValue("Avocado");
            await expectCanvasToRender(page, "avocado.png");
            expectNoConsoleErrors(errors);
        });

        test("turning off image based lighting changes the render", async ({ page }) => {
            const errors = collectConsoleErrors(page);

            await page.goto(`/${target.query}`);
            await waitForLoadingToSettle(page);
            await openTab(page, "display");

            await page.getByTestId("switch-ibl").click();

            await expectCanvasToRender(page, "no-ibl.png");
            expectNoConsoleErrors(errors);
        });
    });
}
