<template>
    <div>
        <b-button v-on:click="buttonclicked" rounded :class="btnClass">{{ name }}</b-button>
    </div>
</template>

<script>
export default {
    name: "ToggleButton",
    props: ["ontext", "offtext", "btnClass", "modelValue"],
    emits: ["buttonclicked", "update:modelValue"],
    data() {
        return {
            name: "Play",
            isOn: false
        };
    },
    mounted() {
        this.name = this.offtext;
        // Initialize state from modelValue prop if provided
        if (this.modelValue !== undefined) {
            this.isOn = this.modelValue;
            this.name = this.isOn ? this.ontext : this.offtext;
        }
    },
    watch: {
        // Watch for external changes to modelValue
        modelValue(newValue) {
            if (newValue !== this.isOn) {
                this.isOn = newValue;
                this.name = this.isOn ? this.ontext : this.offtext;
            }
        }
    },
    methods: {
        buttonclicked: function () {
            this.isOn = !this.isOn;
            this.name = this.isOn ? this.ontext : this.offtext;
            this.$emit("buttonclicked", this.isOn);
            this.$emit("update:modelValue", this.isOn);
        },
        setState: function (value) {
            this.isOn = value;
            this.name = this.isOn ? this.ontext : this.offtext;
            this.$emit("update:modelValue", this.isOn);
        }
    }
};
</script>
