import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./ui/styles.css";
import { App } from "./ui/App.jsx";
import { ErrorBoundary } from "./ui/ErrorBoundary.jsx";
import { installConsoleBridge } from "./logic/console_bridge.js";

installConsoleBridge();

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </StrictMode>
);
