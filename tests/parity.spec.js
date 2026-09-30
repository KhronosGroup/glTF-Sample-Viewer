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

        test("credits and validator reflect the loaded model", async ({ page }) => {
            const errors = collectConsoleErrors(page);

            await page.goto(`/${target.query}`);
            await waitForLoadingToSettle(page);

            await openTab(page, "credits");
            await expect(page.getByTestId("asset-copyright")).not.toBeEmpty();
            await expect(page.getByTestId("asset-generator")).not.toBeEmpty();
            await expect(page.getByTestId("environment-license")).not.toHaveText("N/A");

            await openTab(page, "validator");
            await expect(page.getByText(/Number of errors: \d+/)).toBeVisible();
            await expect(page.getByText(/Number of warnings: \d+/)).toBeVisible();

            expectNoConsoleErrors(errors);
        });

        test("an animated model lists its animations and plays them", async ({ page }) => {
            const errors = collectConsoleErrors(page);

            await page.goto(`/${target.query}`);
            await waitForLoadingToSettle(page);
            await openTab(page, "models");
            await page.locator(ui.modelSelect).selectOption("BoxAnimated");
            await waitForLoadingToSettle(page);

            await openTab(page, "animations");

            // Animations start playing, so the toggle offers to pause.
            await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
            await expect(page.getByRole("checkbox").first()).toBeChecked();

            expectNoConsoleErrors(errors);
        });
    });
}
