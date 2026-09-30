import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import "./sass.scss";
import { Canvas } from "./Canvas.jsx";
import { App } from "./react/App.jsx";
import { notify } from "../logic/notifications.js";

// main.js looks up the #canvas element as soon as it runs, so the React tree
// that renders it has to be committed synchronously here. This goes away once
// main.js moves into an effect that owns the canvas ref.
const canvasRoot = createRoot(document.getElementById("canvasUI"));
flushSync(() => canvasRoot.render(<Canvas />));

createRoot(document.getElementById("app")).render(<App />);

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
