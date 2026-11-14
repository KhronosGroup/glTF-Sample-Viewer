import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { IconButton, Input } from "./controls.jsx";

/**
 * `min` may be greater than `max` (the exposure slider is inverted), so the
 * ratio is derived from the signed span rather than by sorting the bounds.
 *
 * A `null` or `undefined` value is indeterminate: no fill and no visible thumb
 * until the track is clicked or a key is pressed.
 *
 * Optionally renders a numeric input (`showInput`) and/or a reset button
 * (`onReset`) to the right of the track, so callers do not have to repeat the
 * draft-state and reset wiring themselves.
 */

// How much pointer travel maps to a value change while Shift is held.
const PRECISION_FACTOR = 0.1;

function clamp(value, min, max) {
    return Math.min(Math.max(value, Math.min(min, max)), Math.max(min, max));
}

function ratioOf(value, min, max) {
    return clamp((value - min) / (max - min), 0, 1);
}

function percent(ratio) {
    return `${(ratio * 100).toFixed(4)}%`;
}

// Extracts the unit a formatter appends after the number (the "°" in
// `${value}°` or the " s" in `${value.toFixed(2)} s`) so the numeric input can
// show the same unit without the call site having to repeat it. Formatters
// that produce a bare number yield an empty string.
function formatterSuffix(formatter) {
    return formatter(0).replace(/^-?\d*\.?\d+/, "");
}

// Prints a value with at most two decimal places, dropping trailing zeros
// ("1.50" -> "1.5", "45.00" -> "45") so numeric inputs do not echo a long
// float for values like 16/9.
function formatNumber(value) {
    return value.toFixed(2).replace(/\.?0+$/, "");
}

export function Slider({
    value,
    min,
    max,
    step = 1,
    onChange,
    className,
    label,
    formatter = String,
    ticks = [],
    onReset,
    resetLabel,
    showInput = false,
    inputLabel,
    inputPlaceholder,
    inputFormat,
    inputSuffix,
    inputClassName = "w-16 shrink-0 py-0.5 text-sm"
}) {
    const trackRef = useRef(null);
    const dragOrigin = useRef(null);
    const lastValue = useRef(null);
    const lastShift = useRef(false);
    const [dragging, setDragging] = useState(false);

    // The numeric input keeps its own draft while focused, so editing it is not
    // rewritten as the underlying value changes.
    const [inputDraft, setInputDraft] = useState(null);

    const clampValue = useCallback(
        (raw) => {
            const stepped = Math.round(raw / step) * step;
            // Re-round to the step's precision, otherwise 0.1 steps drift.
            const decimals = (String(step).split(".")[1] ?? "").length;
            return clamp(Number(stepped.toFixed(decimals)), min, max);
        },
        [min, max, step]
    );

    const valueFromClientX = useCallback(
        (clientX) => {
            const rect = trackRef.current.getBoundingClientRect();
            const position = clamp((clientX - rect.left) / rect.width, 0, 1);
            return clampValue(min + position * (max - min));
        },
        [min, max, clampValue]
    );

    // Dragging moves relative to where the pointer went down; holding Shift
    // scales that travel down for precision editing.
    const valueFromDrag = useCallback(
        (clientX, shiftKey) => {
            const rect = trackRef.current.getBoundingClientRect();
            const scale = shiftKey ? PRECISION_FACTOR : 1;
            const delta = (clientX - dragOrigin.current.clientX) / rect.width;
            return clampValue(dragOrigin.current.value + delta * (max - min) * scale);
        },
        [max, min, clampValue]
    );

    useEffect(() => {
        if (!dragging) {
            return;
        }
        const move = (event) => {
            // Re-anchor when the modifier toggles, so the value does not jump.
            if (event.shiftKey !== lastShift.current) {
                dragOrigin.current = {
                    clientX: event.clientX,
                    value: lastValue.current
                };
                lastShift.current = event.shiftKey;
            }
            const next = valueFromDrag(event.clientX, event.shiftKey);
            lastValue.current = next;
            onChange(next);
        };
        const stop = () => {
            setDragging(false);
            dragOrigin.current = null;
            lastValue.current = null;
            lastShift.current = false;
        };
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", stop);
        window.addEventListener("pointercancel", stop);
        return () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", stop);
            window.removeEventListener("pointercancel", stop);
        };
    }, [dragging, onChange, valueFromDrag]);

    const indeterminate = value === null || value === undefined;

    const onKeyDown = (event) => {
        const direction =
            { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[event.key] ?? 0;
        if (direction === 0) {
            return;
        }
        event.preventDefault();
        if (indeterminate) {
            onChange(min);
            return;
        }
        onChange(clamp(value + direction * step * Math.sign(max - min), min, max));
    };

    const ratio = indeterminate ? 0 : ratioOf(value, min, max);

    const formatInput = inputFormat ?? formatNumber;
    const inputValue = inputDraft ?? (indeterminate ? "" : formatInput(value));
    const suffix = inputSuffix ?? formatterSuffix(formatter);

    return (
        <div
            className={[
                "mt-4 touch-none select-none",
                ticks.length > 0 ? "mb-10" : "mb-4",
                className
            ]
                .filter(Boolean)
                .join(" ")}
            // A lingering text selection would otherwise turn the drag into a native drag-and-drop.
            onDragStart={(event) => event.preventDefault()}
        >
            <div className="flex items-center gap-3">
                <div
                    ref={trackRef}
                    className={`bg-track relative mx-2 h-1.5 min-w-0 flex-1 rounded-full ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
                    onPointerDown={(event) => {
                        event.preventDefault();
                        dragOrigin.current = {
                            clientX: event.clientX,
                            value: valueFromClientX(event.clientX)
                        };
                        lastValue.current = dragOrigin.current.value;
                        lastShift.current = event.shiftKey;
                        onChange(dragOrigin.current.value);
                        setDragging(true);
                    }}
                >
                    {!indeterminate && (
                        <div
                            className="bg-accent absolute h-full rounded-full"
                            style={{ width: percent(ratio) }}
                        />
                    )}

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
                        {dragging && !indeterminate && (
                            <div className="bg-accent text-ink-dim absolute bottom-6 left-1/2 -translate-x-1/2 rounded px-2 py-0.5 text-xs whitespace-nowrap select-none">
                                {formatter(value)}
                            </div>
                        )}
                        <div
                            className={[
                                "border-surface h-4 w-4 rounded-full border-2 bg-white",
                                indeterminate && "opacity-0"
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            tabIndex={0}
                            role="slider"
                            aria-valuemin={min}
                            aria-valuemax={max}
                            aria-valuenow={indeterminate ? undefined : value}
                            aria-orientation="horizontal"
                            aria-label={label}
                            aria-valuetext={indeterminate ? "Not set" : formatter(value)}
                            onKeyDown={onKeyDown}
                        />
                    </div>
                </div>

                {showInput && (
                    <div className="relative shrink-0">
                        <Input
                            aria-label={inputLabel ?? label}
                            className={suffix ? `${inputClassName} pr-6` : inputClassName}
                            type="number"
                            step="any"
                            placeholder={inputPlaceholder}
                            value={inputValue}
                            onFocus={() => setInputDraft(indeterminate ? "" : formatInput(value))}
                            onBlur={() => setInputDraft(null)}
                            onChange={(event) => {
                                setInputDraft(event.target.value);
                                if (event.target.value === "") {
                                    onChange(null);
                                } else if (event.target.validity.valid) {
                                    onChange(event.target.valueAsNumber);
                                }
                            }}
                        />
                        {suffix && (
                            <span className="text-ink/60 pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-sm">
                                {suffix}
                            </span>
                        )}
                    </div>
                )}

                {onReset && (
                    <IconButton label={resetLabel ?? `Reset ${label}`} onClick={onReset}>
                        <RotateCcw size={16} aria-hidden="true" />
                    </IconButton>
                )}
            </div>
        </div>
    );
}
