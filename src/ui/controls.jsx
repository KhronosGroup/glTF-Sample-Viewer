/**
 * Form primitives, styled with Tailwind utilities.
 *
 * Every panel composes these rather than hand-rolling markup. The Vue original
 * had each panel spell out its own buttons and labels, which is how the same
 * control ended up with three different paddings and two different greens.
 */

import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";

function classNames(...values) {
    return values.filter(Boolean).join(" ");
}

const FOCUS_RING =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent focus-visible:outline";

export function Field({ label, className, grouped = false, children }) {
    return (
        <div className={classNames("mt-6", className)}>
            {label !== undefined && <label className="mb-2 block font-medium">{label}</label>}
            {grouped ? <div className="flex flex-col gap-1">{children}</div> : children}
        </div>
    );
}

export function Switch({ checked, onChange, className, disabled = false, children, ...rest }) {
    return (
        <label
            className={classNames(
                "group mt-2 inline-flex items-center gap-3 whitespace-nowrap",
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                className
            )}
            {...rest}
        >
            <input
                type="checkbox"
                className="peer sr-only"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
            />
            <span className="switch-track h-6 w-11 shrink-0 rounded-full p-0.5" />
            {children !== undefined && <span className="text-base font-light">{children}</span>}
        </label>
    );
}

export function Select({ value, onChange, className, children, ...rest }) {
    return (
        <div className={classNames("relative", className)}>
            <select
                className={classNames(
                    "text-ink border-ink/60 hover:border-ink w-full cursor-pointer appearance-none rounded-md border bg-transparent py-2 pr-10 pl-3 transition-colors focus:outline-none",
                    "focus:border-accent"
                )}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                {...rest}
            >
                {children}
            </select>
            <ChevronDown
                size={16}
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-3 my-auto"
            />
        </div>
    );
}

export function Button({ onClick, className, style, children, ...rest }) {
    return (
        <button
            type="button"
            className={classNames(
                "bg-accent text-ink-dim hover:bg-accent-hover active:bg-accent-active inline-flex items-center justify-center gap-2 rounded-full px-4 py-1.5 transition-colors",
                FOCUS_RING,
                className
            )}
            style={style}
            onClick={onClick}
            {...rest}
        >
            {children}
        </button>
    );
}

export function OutlineButton({ onClick, className, children, ...rest }) {
    return (
        <button
            type="button"
            className={classNames(
                "border-accent text-ink-dim hover:bg-accent-dim inline-flex items-center justify-center gap-2 rounded-full border-[1.5px] bg-transparent px-4 py-1.5 transition-colors",
                FOCUS_RING,
                className
            )}
            onClick={onClick}
            {...rest}
        >
            {children}
        </button>
    );
}

/** A bare icon control: no chrome until hovered or focused. */
export function IconButton({ onClick, label, className, children }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            className={classNames(
                "hover:bg-card inline-flex items-center justify-center rounded-md p-1.5 transition-colors",
                FOCUS_RING,
                className
            )}
        >
            {children}
        </button>
    );
}

export function ToggleButton({ on, onText, offText, onIcon, offIcon, className, onToggle }) {
    return (
        <Button className={className} onClick={() => onToggle(!on)}>
            {on ? onIcon : offIcon}
            {on ? onText : offText}
        </Button>
    );
}

/**
 * Play/pause plus reset. The animation, graph and physics panels each had their
 * own copy of this row, with three different reset buttons.
 */
export function PlaybackControls({ active, onText, offText, onIcon, offIcon, onToggle, onReset }) {
    return (
        <div className="mt-4 mb-6 flex items-center gap-3">
            <ToggleButton
                on={active}
                onText={onText}
                offText={offText}
                onIcon={onIcon}
                offIcon={offIcon}
                className="w-[110px]"
                onToggle={onToggle}
            />
            <OutlineButton onClick={onReset}>
                <RotateCcw size={16} aria-hidden="true" />
                Reset
            </OutlineButton>
        </div>
    );
}

export function Radio({ name, value, checked, onChange, children }) {
    return (
        <label className="inline-flex cursor-pointer items-center gap-2">
            <input
                type="radio"
                className="accent-accent h-4 w-4"
                name={name}
                checked={checked}
                onChange={() => onChange(value)}
            />
            <span className="text-base font-light">{children}</span>
        </label>
    );
}

export function Checkbox({ checked, onChange, disabled = false, children }) {
    return (
        <label
            className={classNames(
                "inline-flex items-center gap-2",
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            )}
        >
            <input
                type="checkbox"
                className="accent-accent h-4 w-4"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
            />
            <span className="text-base font-light">{children}</span>
        </label>
    );
}

export function Input({ className, ...rest }) {
    return (
        <input
            className={classNames(
                "text-ink border-ink/60 hover:border-ink focus:border-accent rounded-md border bg-transparent px-2 py-1 transition-colors focus:outline-none",
                className
            )}
            {...rest}
        />
    );
}

export function Title({ children }) {
    return <h2 className="mt-10 mb-8 text-[22pt] leading-tight font-bold">{children}</h2>;
}

export function Subtitle({ children }) {
    return <h3 className="mt-10 mb-3 text-xl font-semibold">{children}</h3>;
}

export function SectionLabel({ className, children }) {
    return <p className={classNames("mt-8 mb-2 font-medium", className)}>{children}</p>;
}

/** Shared chrome for a tab panel: the collapse control and the heading. */
export function Panel({ title, onCollapse, className, children }) {
    return (
        <div
            data-testid="panel"
            className="animate-panel-in flex min-h-full flex-col px-5 pt-4 pb-12"
        >
            <IconButton label="Collapse panel" onClick={onCollapse} className="-ml-1.5 self-start">
                <ChevronRight size={24} aria-hidden="true" />
            </IconButton>
            <Title>{title}</Title>
            <div className={classNames("min-h-0 flex-1", className)}>{children}</div>
        </div>
    );
}
