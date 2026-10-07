/**
 * Flat label/value list for the statistics panel. Unlike JsonTree the entries
 * are always scalar, so there is nothing to collapse.
 */
export function StatList({ data }) {
    if (!data) {
        return null;
    }

    return (
        <dl className="space-y-1">
            {Object.entries(data).map(([label, value]) => (
                <div
                    key={label}
                    className="bg-card flex items-baseline justify-between gap-4 rounded-md px-3 py-2"
                >
                    <dt className="font-light">{label}</dt>
                    <dd className="text-ink/60">{String(value)}</dd>
                </div>
            ))}
        </dl>
    );
}
