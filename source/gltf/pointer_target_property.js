class PointerTargetProperty {
    constructor(value) {
        this.fallbackValue = value;
        this.overrideValue = null;
    }

    setFallbackValue(value) {
        this.fallbackValue = value;
    }

    setValue(value) {
        this.overrideValue = value;
    }

    reset() {
        this.overrideValue = null;
    }

    value() {
        return this.overrideValue ?? this.fallbackValue;
    }

    isDefined() {
        return this.fallbackValue !== undefined;
    }
}

const makePointerTarget = (object, json, properties) => {
    for (const property in properties) {
        object[property] = new PointerTargetProperty(json[property] ?? properties[property]);
    }
}

export { PointerTargetProperty, makePointerTarget as makePointerTarget };
