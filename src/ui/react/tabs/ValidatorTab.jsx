import { notify } from "../../../logic/notifications.js";
import { useViewerStore } from "../store.js";

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
        notify("Copied to clipboard", "is-success");
        // eslint-disable-next-line no-unused-vars
    } catch (error) {
        notify("Error copying to clipboard.", "is-danger");
    }
}

export function ValidatorTab({ onCollapse }) {
    const report = useViewerStore((state) => state.validationReport);
    const description = useViewerStore((state) => state.validationReportDescription);

    const failed = report?.error !== undefined;
    const reportName = report?.uri?.substring(report.uri.lastIndexOf("/") + 1);

    return (
        <div
            className="tabContent"
            style={{ display: "flex", flexDirection: "column", height: "inherit" }}
        >
            <img
                src="assets/ui/Navigation_right_20px.svg"
                className="tabNavigationIcon"
                width="30px"
                onClick={onCollapse}
            />
            <h2 className="title is-spaced">glTF Validator</h2>

            {!failed && (
                <div className="modelCredit">
                    <p>Number of errors: {report?.issues?.numErrors ?? 0}</p>
                    <p>Number of warnings: {report?.issues?.numWarnings ?? 0}</p>
                    <p>Number of infos: {report?.issues?.numInfos ?? 0}</p>
                </div>
            )}

            {description?.message && (
                <div>
                    <p style={{ marginTop: "10px", marginBottom: "10px", fontSize: "smaller" }}>
                        {description.message}
                    </p>
                </div>
            )}

            {failed && (
                <div>
                    <p style={{ marginTop: "10px", marginBottom: "10px", color: "red" }}>
                        {report.error}
                    </p>
                </div>
            )}

            {!failed && (
                <>
                    <button
                        className="button is-rounded"
                        style={{ width: "fit-content", flexShrink: 0, marginBottom: "12px" }}
                        onClick={() => copyToClipboard(JSON.stringify(report, undefined, 4))}
                    >
                        Copy
                    </button>
                    <button
                        className="button is-rounded"
                        style={{ width: "fit-content", flexShrink: 0 }}
                        onClick={() => downloadJson(`${reportName}.report.json`, report)}
                    >
                        Download
                    </button>
                </>
            )}

            <span style={{ marginTop: "5px" }}>
                Powered by{" "}
                <a
                    href="https://github.com/KhronosGroup/glTF-Validator"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    glTF-Validator
                </a>
            </span>
        </div>
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
        <div style={{ maxWidth: "fit-content", marginLeft: "auto", marginRight: "auto" }}>
            <div style={{ position: "relative", width: "50px", height: "100%" }}>
                <img
                    src={`assets/ui/Capture ${expanded ? "50X50" : "30X30"}.svg`}
                    width={expanded ? "50px" : "30px"}
                    height={expanded ? "100%" : undefined}
                />
                {info !== "" && (
                    <div
                        style={{
                            display: "flex",
                            color: "black",
                            position: "absolute",
                            right: isMobile ? "-3px" : "-18px",
                            top: "-18px",
                            fontSize: "80%",
                            fontWeight: "bold",
                            backgroundColor: color,
                            borderRadius: "50%",
                            width: "fit-content",
                            minWidth: "2rem",
                            alignItems: "center",
                            aspectRatio: "1/1",
                            justifyContent: "center"
                        }}
                    >
                        {info}
                    </div>
                )}
            </div>
        </div>
    );
}
