import { Field, Input, Switch } from "../controls.jsx";

// The Vue template repeated near-identical markup for each of these; they only
// differ by how many inputs to lay out and in which direction.
const VECTOR_SIZES = { float2: 2, float3: 3, float4: 4 };
const MATRIX_SIZES = { float2x2: 2, float3x3: 3, float4x4: 4 };

export function defaultValueForType(type) {
    switch (type) {
        case "bool":
            return false;
        case "int":
            return 0;
        case "float":
            return 0.0;
        case "float2":
            return [0, 0];
        case "float3":
            return [0, 0, 0];
        case "float4":
            return [0, 0, 0, 0];
        case "float2x2":
            return [1, 0, 0, 1];
        case "float3x3":
            return [1, 0, 0, 0, 1, 0, 0, 0, 1];
        case "float4x4":
            return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        default:
            return null;
    }
}

function NumberCell({ className, value, onChange }) {
    return (
        <Input
            className={className}
            type="number"
            value={value}
            required
            onChange={(event) => onChange(Number(event.target.value))}
        />
    );
}

export function CustomEventInput({ name, type, value, onChange }) {
    if (type === "bool") {
        return (
            <div className="flex items-center justify-between">
                <label className="text-sm">{name}</label>
                <Switch checked={Boolean(value)} onChange={onChange} />
            </div>
        );
    }

    const label = <label className="mb-2 block text-sm">{name}</label>;

    if (type === "float" || type === "int") {
        return (
            <div>
                {label}
                <Field>
                    <Input
                        className="w-[110px]"
                        type={type === "float" ? "number" : "text"}
                        step={type === "float" ? "any" : undefined}
                        pattern={type === "int" ? "[\\-]?[0-9]*" : undefined}
                        value={value ?? ""}
                        required
                        onChange={(event) => onChange(Number(event.target.value))}
                    />
                </Field>
            </div>
        );
    }

    const setAt = (index, next) =>
        onChange(value.map((item, position) => (position === index ? next : item)));

    const vectorSize = VECTOR_SIZES[type];
    if (vectorSize !== undefined) {
        return (
            <div>
                {label}
                <div className="flex gap-2">
                    {value.map((item, index) => (
                        <div key={index}>
                            <NumberCell
                                className="w-[60px]"
                                value={item}
                                onChange={(next) => setAt(index, next)}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const matrixSize = MATRIX_SIZES[type];
    if (matrixSize !== undefined) {
        return (
            <div>
                {label}
                <div
                    className="grid w-max gap-1"
                    style={{ gridTemplateColumns: `repeat(${matrixSize}, 1fr)` }}
                >
                    {Array.from({ length: matrixSize }, (_, column) => (
                        <div key={column} className="flex flex-col gap-1">
                            {Array.from({ length: matrixSize }, (_, row) => {
                                const index = column * matrixSize + row;
                                return (
                                    <div key={row}>
                                        <NumberCell
                                            className="w-[60px]"
                                            value={value[index]}
                                            onChange={(next) => setAt(index, next)}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return null;
}
