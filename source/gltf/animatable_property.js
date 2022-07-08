class AnimatableProperty {
    constructor(value) {
        this.restValue = value;
        this.animatedValue = null;
    }

    restAt(value) {
        this.restValue = value;
    }

    animate(value) {
        this.animatedValue = value;
    }

    rest() {
        this.animatedValue = null;
    }

    value() {
        return this.animatedValue ?? this.restValue;
    }

    isDefined() {
        return this.restValue !== undefined;
    }
}

const makeAnimatable = (object, json, properties) => {
    for (const property in properties) {
        object[property] = new AnimatableProperty(json[property] ?? properties[property]);
    }
}

export { AnimatableProperty, makeAnimatable };
