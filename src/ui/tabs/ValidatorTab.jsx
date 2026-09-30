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
                <div className="my-6 break-words">
                    <p>Number of errors: {report?.issues?.numErrors ?? 0}</p>
                    <p>Number of warnings: {report?.issues?.numWarnings ?? 0}</p>
                    <p>Number of infos: {report?.issues?.numInfos ?? 0}</p>
                </div>
            )}

            {description?.message && <p className="my-2.5 text-sm">{description.message}</p>}

            {failed && <p className="my-2.5 text-red-500">{report.error}</p>}

            {!failed && (
                <>
                    <Button
                        className="mb-3 w-fit shrink-0"
                        onClick={() => copyToClipboard(JSON.stringify(report, undefined, 4))}
                    >
                        Copy
                    </Button>
                    <Button
                        className="w-fit shrink-0"
                        onClick={() => downloadJson(`${reportName}.report.json`, report)}
                    >
                        Download
                    </Button>
                </>
            )}

            <span className="mt-1.5">
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
    let color = "white";

    if (report?.error) {
        info = "X";
        color = "red";
    } else if (issues?.numErrors > 0) {
        info = `${issues.numErrors}`;
        color = "red";
    } else if (issues?.numWarnings > 0) {
        if (issues.numWarnings === description?.numIgnoredWarnings) {
            info = "i";
            color = "lightBlue";
        } else {
            info = `${issues.numWarnings}`;
            color = "yellow";
        }
    } else if (issues?.numInfos > 0) {
        info = `${issues.numInfos}`;
    }

    if (info.length > 3) {
        info = "999+";
    }

    return (
        <div className="mx-auto max-w-fit">
            <div className="relative h-full w-[50px]">
                <img
                    src={`assets/ui/Capture ${expanded ? "50X50" : "30X30"}.svg`}
                    width={expanded ? "50px" : "30px"}
                    height={expanded ? "100%" : undefined}
                    alt=""
                />
                {info !== "" && (
                    <div
                        className="absolute -top-[18px] flex aspect-square w-fit min-w-[2rem] items-center justify-center rounded-full text-[80%] font-bold text-black"
                        style={{ right: isMobile ? "-3px" : "-18px", backgroundColor: color }}
                    >
                        {info}
                    </div>
                )}
            </div>
        </div>
    );
}
