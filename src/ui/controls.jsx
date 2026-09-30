/**
 * Form primitives, styled with Tailwind utilities.
 *
 * These previously reproduced Buefy's DOM so its stylesheet would apply. That
 * constraint is gone, so the markup is now only what each control needs.
 */

function classNames(...values) {
    return values.filter(Boolean).join(" ");
}

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
                "mt-2 inline-flex cursor-pointer items-center gap-3 whitespace-nowrap",
                disabled && "cursor-not-allowed opacity-60",
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

export function Select({ value, onChange, children, ...rest }) {
    return (
        <div className="relative">
            <select
                className="text-ink border-ink focus:border-accent w-full appearance-none rounded border bg-transparent py-2 pr-10 pl-3 focus:outline-none"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                {...rest}
            >
                {children}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                    <path
                        d="M2 5l6 6 6-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>
            </span>
        </div>
    );
}

export function Button({ onClick, className, style, children }) {
    return (
        <button
            type="button"
            className={classNames(
                "bg-accent text-ink-dim hover:bg-accent-hover active:bg-accent-active inline-flex items-center justify-center rounded-full px-4 py-1 transition-colors",
                className
            )}
            style={style}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export function OutlineButton({ onClick, className, children }) {
    return (
        <button
            type="button"
            className={classNames(
                "border-accent text-ink-dim hover:bg-accent-dim inline-flex items-center justify-center rounded-full border-[1.5px] bg-transparent px-4 py-1 transition-colors",
                className
            )}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export function ToggleButton({ on, onText, offText, className, style, onToggle }) {
    return (
        <Button className={className} style={style} onClick={() => onToggle(!on)}>
            {on ? onText : offText}
        </Button>
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
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
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
                "text-ink border-ink focus:border-accent rounded border bg-transparent px-2 py-1 focus:outline-none",
                className
            )}
            {...rest}
        />
    );
}

export function Title({ children }) {
    return <h2 className="mt-16 mb-8 text-[22pt] leading-tight font-bold">{children}</h2>;
}

export function DownloadIcon() {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            className="mr-2"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M7 1h2v6h3l-4 5-4-5h3V1zM2 13h12v2H2z" />
        </svg>
    );
}

export function SectionLabel({ className, children }) {
    return <p className={classNames("mt-8 mb-2 font-medium", className)}>{children}</p>;
}

/** Shared chrome for a tab panel: the collapse arrow and the heading. */
export function Panel({ title, onCollapse, className, children }) {
    return (
        <div data-testid="panel" className={classNames("p-4", className)}>
            <img
                src="assets/ui/Navigation_right_20px.svg"
                className="w-[30px] cursor-pointer transition-transform hover:scale-125"
                onClick={onCollapse}
                alt="Collapse panel"
            />
            <Title>{title}</Title>
            {children}
        </div>
    );
}
