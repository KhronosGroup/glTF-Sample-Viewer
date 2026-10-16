import { createApp } from "vue";
import "./sass.scss";
import Buefy from "@ntohq/buefy-next";
import ToggleButton from "./components/ToggleButton.vue";
import JsonToUiTemplate from "./components/JsonToUiTemplate.vue";
import App from "./App.vue";
import CanvasUI from "./CanvasUI.vue";

const appCreated = createApp(App);

appCreated.use(Buefy);

// general components
appCreated.component("toggle-button", ToggleButton);
appCreated.component("json-to-ui-template", JsonToUiTemplate);

// Must mount before App: App's mounted() hook looks up the #canvas element,
// which CanvasUI's template renders (it used to be static HTML in index.html).
const canvasUI = createApp(CanvasUI);

canvasUI.use(Buefy);

canvasUI.mount("#canvasUI");

export const app = appCreated.mount("#app");

// pipe error messages to UI
(() => {
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = function (txt) {
        app.warn(txt);
        originalWarn.apply(console, arguments);
    };
    console.error = function (txt) {
        app.error(txt);
        originalError.apply(console, arguments);
    };

    window.onerror = function (msg, url, lineNo, columnNo, error) {
        // If error is not from the sample viewer, ignore it
        if (url === undefined || url === null || url === "") {
            return;
        }
        app.error(
            [
                "Message: " + msg,
                "URL: " + url,
                "Line: " + lineNo,
                "Column: " + columnNo,
                "Error object: " + JSON.stringify(error)
            ].join(" - ")
        );
    };
})();
