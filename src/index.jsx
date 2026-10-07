import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./ui/sass.scss";
import { Viewer } from "./ui/Viewer.jsx";
import { App } from "./ui/App.jsx";
import { notify } from "./logic/notifications.js";

// Two roots rather than one, because index.html's column layout owns the split
// between the canvas and the panel. The viewer starts from its own effect, so
// there is no ordering dependency between them.
createRoot(document.getElementById("canvasUI")).render(
    <StrictMode>
        <Viewer />
    </StrictMode>
);

createRoot(document.getElementById("app")).render(
    <StrictMode>
        <App />
    </StrictMode>
);

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
