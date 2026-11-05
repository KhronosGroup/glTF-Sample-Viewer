/**
 * Flat label/value list for the statistics panel. Unlike JsonTree the entries
 * are always scalar, so there is nothing to collapse.
 */
export function StatList({ data }) {
    if (!data) {
        return null;
    }

    return (
        <dl className="flex flex-col gap-0.5">
            {Object.entries(data).map(([label, value]) => (
                <div
                    key={label}
                    className="bg-card flex items-center justify-between gap-4 px-3 py-2 first:rounded-t-md last:rounded-b-md"
                >
                    <dt className="font-light">{label}</dt>
                    <dd className="text-ink/60">{String(value)}</dd>
                </div>
            ))}
        </dl>
    );
}
