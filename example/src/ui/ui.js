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
Vue.component('radio-button-list-element', {
    props: ['name', 'radiobuttoncontent', 'defaultselection'],
    data() {
        return {
            radio: ""
        };
    },
    mounted: function() {
        this.radio = this.defaultselection;
    },
    updated: function() {
        this.$emit('selectionchanged', this.radio);
    },
    methods:
    {
        setSelection: function(value)
        {
            this.radio = value;
        }
    },
    template:'#radioButtonListTemplate'
});
Vue.component('check-box-element', {
    props: ['name', 'checkboxcontent'],
    data() {
        return {
            checkboxGroup: []
        };
    },
    template:'#checkBoxTemplate'
});
Vue.component('exposure-element', {
    props: ['name'],
    data() {
        return {
            value: 0,
        };
    },
    updated : function()
    {
        this.$emit('valuechanged', this.value);
    },
    methods:
    {
        setValue(value)
        {
            this.value = value;
        }
    },
    template:'#exposureTemplate'
});
Vue.component('color-picker-element', {
    props: ['name'],
    data() {
        return {
            color: '#1CA085'
        };
    },
    methods:
    {
        colorchanged: function(value)
        {
            this.$emit('colorchanged', value);
        },
        setColor(value)
        {
            this.color = value;
        }
    },
    template:'#colorPickerTemplate'
});
Vue.component('dual-label-list-element', {
    props: ['name', 'items'],
    template:'#dualLabelListTemplate'
});
Vue.component('dual-label-element', {
    props: ['name', 'value'],
    template:'#dualLabelTemplate'
});

const app = new Vue({
    domStreams: ['modelChanged$', 'flavourChanged$', 'sceneChanged$', 'cameraChanged$',
        'environmentChanged$', 'debugchannelChanged$', 'tonemapChanged$', 'skinningChanged$',
        'environmentVisibilityChanged$', 'punctualLightsChanged$', 'iblChanged$', 'morphingChanged$',
        'addEnvironment$', 'colorChanged$', 'environmentRotationChanged$', 'animationPlayChanged$',
        'variantChanged$', 'exposureChanged$'],
    data() {
        return {
            fullheight: true,
            right: true,
            models: ["Avocado"],
            flavors: [{title: "gltf"}],
            scenes: [{title: "0"}, {title: "1"}],
            cameras: [{title: "User Camera", index: -1}],
            materialVariants: [{title: "None"}],
            environments: [{title: "Doge"}, {title: "Helipad"}, {title: "Footprint Court"}],
            animations: [{title: "cool animation"}, {title: "even cooler"}, {title: "not cool"}, {title: "Do not click!"}],
            tonemaps: [{title: "None"}],
            debugchannels: [{title: "None"}],
            xmp: [{title: "xmp"}],
            statistics: [],

            selectedModel: "Avocado",
            selectedScene: {},
            selectedCamera: {},

            ibl: true,
            punctualLights: true,
            environmentVisibility: true,
            clearColor: "",
            environmentRotations: [{title: "+Z"}, {title: "-X"}, {title: "-Z"}, {title: "+X"}],
            selectedEnvironmentRotation: "+Z",

            debugChannel: "None",
            toneMap: "None",
            skinning: true,
            morphing: true,
        };
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
