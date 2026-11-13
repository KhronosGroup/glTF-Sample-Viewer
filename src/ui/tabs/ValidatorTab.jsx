import { Copy, Download, ShieldCheck } from "lucide-react";
import { notify } from "../../logic/notifications.js";
import { useViewerStore } from "../store.js";
import { Button, Panel } from "../controls.jsx";
import { StatList } from "../StatList.jsx";

function downloadJson(filename, json) {
    const text = JSON.stringify(json, undefined, 4);
    const element = document.createElement("a");
    element.setAttribute("href", "data:application/json;charset=utf-8," + encodeURIComponent(text));
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        notify("Copied to clipboard", "success");
        // eslint-disable-next-line no-unused-vars
    } catch (error) {
        notify("Error copying to clipboard.", "error");
    }
}

function severityMeta(severity) {
    switch (severity) {
        case 0:
            return { label: "Error", tone: "text-red-400", dot: "bg-red-400", badge: "bg-red-400" };
        case 1:
            return { label: "Warning", tone: "text-amber-400", dot: "bg-amber-400", badge: "bg-amber-400" };
        case 2:
            return { label: "Info", tone: "text-sky-300", dot: "bg-sky-300", badge: "bg-sky-300" };
        default:
            return { label: "Hint", tone: "text-ink/60", dot: "bg-ink/40", badge: "bg-ink/40" };
    }
}

// Warnings the renderer resolves on its own (it generates MikkTSpace tangents when the
// asset omits them), so they carry no actionable information for the user.
const IGNORED_VALIDATION_CODES = new Set(["MESH_PRIMITIVE_GENERATED_TANGENT_SPACE"]);

export function ValidatorTab() {
    const report = useViewerStore((state) => state.published.validationReport);

    const failed = report?.error !== undefined;
    const reportName = report?.uri?.substring(report.uri.lastIndexOf("/") + 1);
    const messages = (report?.issues?.messages ?? []).filter(
        (message) => !IGNORED_VALIDATION_CODES.has(message.code)
    );
    // Derive the summary counts from the same filtered list the messages are
    // rendered from, so the counts never claim issues the tab does not show.
    const countOf = (severity) => messages.filter((message) => message.severity === severity).length;

    return (
        <Panel title="Validation">
            {!failed && (
                <div className="my-6">
                    <StatList
                        data={{
                            Errors: countOf(0),
                            Warnings: countOf(1),
                            Infos: countOf(2)
                        }}
                    />
                </div>
            )}

            {failed && <p className="my-2.5 text-red-400">{report.error}</p>}

            {messages.length > 0 && (
                <ul className="my-4 space-y-2">
                    {messages.map((message, index) => {
                        const severity = severityMeta(message.severity);
                        return (
                            <li key={index} className="border-ink/10 min-w-0 rounded-md border px-3 py-2">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                                    <span className={`flex items-center gap-1 font-medium ${severity.tone}`}>
                                        <span className={`size-1.5 rounded-full ${severity.dot}`} />
                                        {severity.label}
                                    </span>
                                    {message.code !== undefined && (
                                        <span className="text-ink/50 font-mono break-all">
                                            {message.code}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-sm break-words">{message.message}</p>
                            </li>
                        );
                    })}
                </ul>
            )}

            {!failed && (
                <div className="flex shrink-0 flex-col items-start gap-3 my-6">
                    <Button onClick={() => copyToClipboard(JSON.stringify(report, undefined, 4))}>
                        <Copy size={16} aria-hidden="true" />
                        Copy
                    </Button>
                    <Button onClick={() => downloadJson(`${reportName}.report.json`, report)}>
                        <Download size={16} aria-hidden="true" />
                        Download
                    </Button>
                </div>
            )}

            <span className="text-ink/70 mt-6 text-sm">
                Powered by{" "}
                <a
                    href="https://github.com/KhronosGroup/glTF-Validator"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                >
                    glTF-Validator
                </a>
            </span>
        </Panel>
    );
}

/**
 * Badge shown on the Validator tab header.
 */
export function ValidationCounter() {
    const report = useViewerStore((state) => state.published.validationReport);
    const issues = report?.issues;

    let info = "";
    let severity;

    if (report?.error) {
        info = "X";
        severity = 0;
    } else if (issues?.numErrors > 0) {
        info = `${issues.numErrors}`;
        severity = 0;
    } else if (issues?.numWarnings > 0) {
        info = `${issues.numWarnings}`;
        severity = 1;
    } else if (issues?.numInfos > 0) {
        info = `${issues.numInfos}`;
        severity = 2;
    }

    if (info.length > 3) {
        info = "999+";
    }

    const tone = severity !== undefined ? severityMeta(severity).badge : "";

    return (
        <span className="relative inline-flex">
            <ShieldCheck size={26} strokeWidth={1.75} aria-hidden="true" />
            {info !== "" && (
                <span
                    className={`absolute -top-2 -right-4 flex aspect-square min-w-6 items-center justify-center rounded-full text-sm font-bold text-black ${tone}`}
                >
                    {info}
                </span>
            )}
        </span>
    );
}
