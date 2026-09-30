import { useCallback, useEffect, useRef, useState } from "react";

/**
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
        <div className={["mx-2 mt-4 mb-10", className].filter(Boolean).join(" ")}>
            <div
                ref={trackRef}
                className="bg-track relative h-1.5 cursor-pointer rounded-full"
                onPointerDown={(event) => {
                    onChange(valueFromClientX(event.clientX));
                    setDragging(true);
                }}
            >
                <div
                    className="bg-accent absolute h-full rounded-full"
                    style={{ width: percent(ratio) }}
                />

                {ticks.map((tick) => (
                    <span
                        key={tick.value}
                        className="absolute top-3 -translate-x-1/2 text-xs whitespace-nowrap"
                        style={{ left: percent(ratioOf(tick.value, min, max)) }}
                    >
                        {tick.label}
                    </span>
                ))}

                <div
                    className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
                    style={{ left: percent(ratio) }}
                >
                    {dragging && (
                        <div className="bg-accent text-ink-dim absolute bottom-6 left-1/2 -translate-x-1/2 rounded px-2 py-0.5 text-xs whitespace-nowrap">
                            {formatter(value)}
                        </div>
                    )}
                    <div
                        className="border-surface h-4 w-4 rounded-full border-2 bg-white"
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
    );
}
