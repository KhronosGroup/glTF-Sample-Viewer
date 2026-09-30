import { Copy, Download, ShieldCheck } from "lucide-react";
import { notify } from "../../logic/notifications.js";
import { useViewerStore } from "../store.js";
import { Button, Panel } from "../controls.jsx";

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

export function ValidatorTab({ onCollapse }) {
    const report = useViewerStore((state) => state.validationReport);
    const description = useViewerStore((state) => state.validationReportDescription);

    const failed = report?.error !== undefined;
    const reportName = report?.uri?.substring(report.uri.lastIndexOf("/") + 1);

    return (
        <Panel title="glTF Validator" onCollapse={onCollapse} className="flex h-full flex-col">
            {!failed && (
                <div className="my-6 space-y-1 break-words">
                    <p>Number of errors: {report?.issues?.numErrors ?? 0}</p>
                    <p>Number of warnings: {report?.issues?.numWarnings ?? 0}</p>
                    <p>Number of infos: {report?.issues?.numInfos ?? 0}</p>
                </div>
            )}

            {description?.message && <p className="my-2.5 text-sm">{description.message}</p>}

            {failed && <p className="my-2.5 text-red-400">{report.error}</p>}

            {!failed && (
                <div className="flex shrink-0 flex-col items-start gap-3">
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
                >
                    glTF-Validator
                </a>
            </span>
        </Panel>
    );
}

/**
 * Badge shown on the Validator tab header. The Vue version built this as an
 * HTML string and injected it with v-html.
 */
export function ValidationCounter({ expanded, isMobile }) {
    const report = useViewerStore((state) => state.validationReport);
    const description = useViewerStore((state) => state.validationReportDescription);
    const issues = report?.issues;

    let info = "";
    let tone = "bg-white";

    if (report?.error) {
        info = "X";
        tone = "bg-red-500";
    } else if (issues?.numErrors > 0) {
        info = `${issues.numErrors}`;
        tone = "bg-red-500";
    } else if (issues?.numWarnings > 0) {
        if (issues.numWarnings === description?.numIgnoredWarnings) {
            info = "i";
            tone = "bg-sky-300";
        } else {
            info = `${issues.numWarnings}`;
            tone = "bg-amber-400";
        }
    } else if (issues?.numInfos > 0) {
        info = `${issues.numInfos}`;
    }

    if (info.length > 3) {
        info = "999+";
    }

    return (
        <span className="relative inline-flex">
            <ShieldCheck size={expanded ? 34 : 26} strokeWidth={1.75} aria-hidden="true" />
            {info !== "" && (
                <span
                    className={`absolute -top-2 flex aspect-square min-w-[1.5rem] items-center justify-center rounded-full text-sm font-bold text-black ${tone}`}
                    style={{ right: isMobile ? "-6px" : "-16px" }}
                >
                    {info}
                </span>
            )}
        </span>
    );
}
