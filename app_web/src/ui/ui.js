import VueRx from 'vue-rx';
import { Subject } from 'rxjs';
import './sass.scss';

Vue.use(VueRx, { Subject });

// general components
Vue.component('toggle-button', {
    props: ['ontext', 'offtext'],
    template:'#toggleButtonTemplate',
    data(){
        return {
            name: "Play",
            isOn: false
        };
    },
    mounted(){
        this.name = this.ontext;
    },
    methods:
    {
        buttonclicked: function(value)
        {
            this.isOn = !this.isOn;
            this.name = this.isOn ? this.ontext : this.offtext;
            this.$emit('buttonclicked', this.isOn);
        },
        setState: function(value)
        {
            this.isOn = value;
            this.name = this.isOn ? this.ontext : this.offtext;
        }
    }
});
Vue.component('dual-label-list-element', {
    props: ['name', 'items'],
    template:'#dualLabelListTemplate'
});
Vue.component('dual-label-element', {
    props: ['name', 'value'],
    template:'#dualLabelTemplate'
});
Vue.component('json-to-ui-template', {
    props: ['data', 'isinner'],
    template:'#jsonToUITemplate'
});

const app = new Vue({
    domStreams: ['modelChanged$', 'flavourChanged$', 'sceneChanged$', 'cameraChanged$',
        'environmentChanged$', 'debugchannelChanged$', 'tonemapChanged$', 'skinningChanged$',
        'environmentVisibilityChanged$', 'punctualLightsChanged$', 'iblChanged$', 'morphingChanged$',
        'addEnvironment$', 'colorChanged$', 'environmentRotationChanged$', 'animationPlayChanged$', 'selectedAnimationsChanged$',
        'variantChanged$', 'exposureChanged$', "clearcoatChanged$", "sheenChanged$", "transmissionChanged$",
        'cameraExport$'],
    data() {
        return {
            fullheight: true,
            right: true,
            models: ["Avocado"],
            flavors: [{title: "gltf"}],
            scenes: [{title: "0"}, {title: "1"}],
            cameras: [{title: "User Camera", index: -1}],
            materialVariants: [{title: "None"}],

            animations: [{title: "cool animation"}, {title: "even cooler"}, {title: "not cool"}, {title: "Do not click!"}],
            tonemaps: [{title: "None"}],
            debugchannels: [{title: "None"}],
            xmp: [{title: "xmp"}],
            statistics: [],

            selectedModel: "Avocado",
            selectedScene: {},
            selectedCamera: {},
            selectedVariant: "None",
            selectedAnimations: [],

            ibl: true,
            punctualLights: true,
            environmentVisibility: true,
            clearColor: "",
            environmentRotations: [{title: "+Z"}, {title: "-X"}, {title: "-Z"}, {title: "+X"}],
            selectedEnvironmentRotation: "+Z",
            environments: [{index: 0, name: ""}],
            selectedEnvironment: 0,

            debugChannel: "None",
            exposureSetting: 0,
            toneMap: "None",
            skinning: true,
            morphing: true,
            clearcoatEnabled: true,
            sheenEnabled: true,
            transmissionEnabled: true,
        };
    },
    mounted: function()
    {
        // remove input class from color picker (added by default by buefy)
        const colorPicker = document.getElementById("clearColorPicker");
        colorPicker.classList.remove("input");
    },
    methods:
    {
        setAnimationState: function(value)
        {
            this.$refs.animationState.setState(value);
        }
    }
}).$mount('#app');

export { app };
