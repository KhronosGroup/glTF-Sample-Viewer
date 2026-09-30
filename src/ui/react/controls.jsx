/**
 * Form primitives that reproduce the markup Buefy used to render.
 *
 * The stylesheet in src/ui/sass.scss is written against Buefy's class names and
 * is kept as-is, so these components exist to emit the same DOM without the Vue
 * runtime. They are deliberately dumb and fully controlled.
 */

function classNames(...values) {
    return values.filter(Boolean).join(" ");
}

export function Field({ label, className, grouped = false, children }) {
    return (
        <div className={classNames("field", className)}>
            {label !== undefined && <label className="label">{label}</label>}
            {grouped ? (
                <div className="field-body">
                    <div className="field has-addons">{children}</div>
                </div>
            ) : (
                children
            )}
        </div>
    );
}

export function Switch({ checked, onChange, className, disabled = false, children, ...rest }) {
    return (
        <label
            className={classNames("switch", "is-rounded", className)}
            disabled={disabled}
            {...rest}
        >
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
            />
            <span className="check" />
            {children !== undefined && <span className="control-label">{children}</span>}
        </label>
    );
}

export function Select({ value, onChange, children, ...rest }) {
    return (
        <div className="control">
            <span className="select">
                <select value={value} onChange={(event) => onChange(event.target.value)} {...rest}>
                    {children}
                </select>
            </span>
        </div>
    );
}

export function Button({ onClick, className, style, children }) {
    return (
        <button
            type="button"
            className={classNames("button", "is-rounded", className)}
            style={style}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

export function Radio({ name, value, checked, onChange, children }) {
    return (
        <label className="b-radio radio">
            <input type="radio" name={name} checked={checked} onChange={() => onChange(value)} />
            <span className="check" />
            <span className="control-label">{children}</span>
        </label>
    );
}

export function Checkbox({ checked, onChange, disabled = false, children }) {
    return (
        <label className="b-checkbox checkbox" disabled={disabled}>
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
            />
            <span className="check" />
            <span className="control-label">{children}</span>
        </label>
    );
}
