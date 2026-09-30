import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Reproduces Buefy's b-slider markup and drag behaviour.
 *
 * `min` may be greater than `max` (the exposure slider is inverted), so the
 * ratio is derived from the signed span rather than by sorting the bounds.
 */

function clamp(value, min, max) {
    return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max));
}

function ratioOf(value, min, max) {
    return clamp((value - min) / (max - min), 0, 1);
}

function percent(ratio) {
    return `${(ratio * 100).toFixed(4)}%`;
}

export function Slider({
    value,
    min,
    max,
    step = 1,
    onChange,
    className,
    formatter = String,
    ticks = []
}) {
    const trackRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const valueFromClientX = useCallback(
        (clientX) => {
            const rect = trackRef.current.getBoundingClientRect();
            const position = clamp((clientX - rect.left) / rect.width, 0, 1);
            const raw = min + position * (max - min);
            const stepped = Math.round(raw / step) * step;
            // Re-round to the step's precision, otherwise 0.1 steps drift.
            const decimals = (String(step).split(".")[1] ?? "").length;
            return clamp(Number(stepped.toFixed(decimals)), min, max);
        },
        [min, max, step]
    );

    useEffect(() => {
        if (!dragging) {
            return;
        }
        const move = (event) => onChange(valueFromClientX(event.clientX));
        const stop = () => setDragging(false);
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", stop);
        window.addEventListener("pointercancel", stop);
        return () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", stop);
            window.removeEventListener("pointercancel", stop);
        };
    }, [dragging, onChange, valueFromClientX]);

    const onKeyDown = (event) => {
        const direction =
            { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key] ?? 0;
        if (direction === 0) {
            return;
        }
        event.preventDefault();
        onChange(clamp(value + direction * step * Math.sign(max - min), min, max));
    };

    const ratio = ratioOf(value, min, max);

    return (
        <div className={["b-slider is-primary is-rounded", className].filter(Boolean).join(" ")}>
            <div
                className="b-slider-track"
                ref={trackRef}
                onPointerDown={(event) => {
                    onChange(valueFromClientX(event.clientX));
                    setDragging(true);
                }}
            >
                <div className="b-slider-fill" style={{ width: percent(ratio), left: "0%" }} />
                {ticks.map((tick) => (
                    <div
                        key={tick.value}
                        className={[
                            "b-slider-tick",
                            tick.value === min || tick.value === max ? "is-tick-hidden" : "",
                            tick.className
                        ]
                            .filter(Boolean)
                            .join(" ")}
                        style={{ left: percent(ratioOf(tick.value, min, max)) }}
                    >
                        <span className="b-slider-tick-label">{tick.label}</span>
                    </div>
                ))}
                <div className="b-slider-thumb-wrapper" style={{ left: percent(ratio) }}>
                    <div className="b-tooltip is-primary is-top is-medium">
                        <div
                            className="tooltip-content"
                            style={dragging ? undefined : { display: "none" }}
                        >
                            {formatter(value)}
                        </div>
                        <div className="tooltip-trigger">
                            <div
                                className="b-slider-thumb"
                                tabIndex={0}
                                role="slider"
                                aria-valuemin={min}
                                aria-valuemax={max}
                                aria-valuenow={value}
                                aria-orientation="horizontal"
                                onKeyDown={onKeyDown}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
