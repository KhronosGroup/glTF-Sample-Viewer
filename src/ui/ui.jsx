import { createApp } from "vue";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import "./sass.scss";
import Buefy from "@ntohq/buefy-next";
import ToggleButton from "./components/ToggleButton.vue";
import JsonToUiTemplate from "./components/JsonToUiTemplate.vue";
import VueApp from "./App.vue";
import { Canvas } from "./Canvas.jsx";
import { App as ReactApp } from "./react/App.jsx";
import { notify } from "../logic/notifications.js";

// The React UI is still being filled in panel by panel, so it is opt-in until
// it reaches parity. Once it does, this branch and the Vue half both go.
const useReactUi = new URLSearchParams(window.location.search).get("react") !== null;

// main.js looks up the #canvas element as soon as it runs, so the React tree
// that renders it has to be committed synchronously here.
const canvasRoot = createRoot(document.getElementById("canvasUI"));
flushSync(() => canvasRoot.render(<Canvas />));

if (useReactUi) {
    createRoot(document.getElementById("app")).render(<ReactApp />);
} else {
    const appCreated = createApp(VueApp);
    appCreated.use(Buefy);
    appCreated.component("toggle-button", ToggleButton);
    appCreated.component("json-to-ui-template", JsonToUiTemplate);
    appCreated.mount("#app");
}

// pipe error messages to UI
(() => {
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = function (txt) {
        notify(txt, "is-warning");
        originalWarn.apply(console, arguments);
    };
    console.error = function (txt) {
        notify(txt, "is-danger");
        originalError.apply(console, arguments);
    };

    window.onerror = function (msg, url, lineNo, columnNo, error) {
        // If error is not from the sample viewer, ignore it
        if (url === undefined || url === null || url === "") {
            return;
        }
        notify(
            [
                "Message: " + msg,
                "URL: " + url,
                "Line: " + lineNo,
                "Column: " + columnNo,
                "Error object: " + JSON.stringify(error)
            ].join(" - "),
            "is-danger"
        );
    };
})();
