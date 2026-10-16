import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./ui/styles.css";
import { App } from "./ui/App.jsx";
import { notify } from "./logic/notifications.js";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
    </StrictMode>
);

// pipe error messages to UI
(() => {
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = function (txt) {
        notify(txt, "warning");
        originalWarn.apply(console, arguments);
    };
    console.error = function (txt) {
        notify(txt, "error");
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
            "error"
        );
    };
})();
