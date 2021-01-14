import VueRx from 'vue-rx';
import { Observable, Subject } from 'rxjs';
import './sass.scss';

Vue.use(VueRx, { Subject });

// general components
Vue.component('toggle-button', {
    props: ['onText', 'offText'],
    template:'#toggleButtonTemplate',
    data(){
        return {
            name: "Play",
            isOn: false
        };
    },
    mounted(){
        this.name = this.onText;
    },
    methods:
    {
        buttonclicked: function(value)
        {
            this.isOn = !this.isOn;
            this.name = this.isOn ? this.onText : this.offText;
            this.$emit('buttonclicked', this.isOn);
        },
        setState: function(value)
        {
            this.isOn = value;
            this.name = this.isOn ? this.onText : this.offText;
        }
    }
});
Vue.component('drop-down-element', {
    props: ['name', 'dropdowncontent'],
    template:'#dropDownTemplate',
    data() {
        return {
            selectedOption: ""
        };
    },
    // this is used to init the dropdown (so it is not empty on UI bootup)
    mounted(){
        if(this.dropdowncontent === undefined || this.dropdowncontent.length === 0)
        {
            return;
        }
        this.selectedOption = this.dropdowncontent[0].title;
    },
    methods:
    {
        selectionchanged: function(value)
        {
            this.$emit('selectionchanged', value);
        },
        setSelection: function(value)
        {
            this.selectedOption = value;
        }
    }
});
Vue.component('radio-button-list-element', {
    props: ['name', 'radiobuttoncontent'],
    data() {
        return {
            radio: ""
        };
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
Vue.component('slider-element', {
    props: ['name'],
    data() {
        return {
            value: 1
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
    template:'#sliderTemplate'
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



// create components for menu tabs
Vue.component('tab-models', {
    props: ["materialvariants", "models", "flavors", "scenes", "cameras"],
    template:'#modelsTemplate',
    methods:
    {
        modelchanged: function(value) {
            this.$emit('modelchanged', value);
        },
        flavourchanged: function(value) {
            this.$emit('flavourchanged', value);
        },
        scenechanged: function(value) {
            this.$emit('scenechanged', value);
        },
        camerachanged: function(value) {
            this.$emit('camerachanged', value);
        },
        variantchanged: function(value) {
            this.$emit('variantchanged', value);
        },
        setSelectedModel: function(value) {
            this.$refs.models.setSelection(value);
        },
        setSelectedScene: function(value) {
            this.$refs.scenes.setSelection(value);
        }
    }
});
Vue.component('tab-display', {
    props: ["environments", "colorpicker"],
    template:'#displayTemplate',
    data() {
        return {
            environmentvisibility: true,
            punctuallights: true,
            ibl: true,
            environmentRotations: [{title: "+Z"}, {title: "-X"}, {title: "-Z"}, {title: "+X"}]
        };
    },
    methods:
    {
        environmentvisibilitychanged: function(value) {
            this.$emit('environmentvisibilitychanged', value)
        },
        punctuallightschanged: function(value) {
            this.$emit('punctuallightschanged', value)
        },
        iblchanged: function(value) {
            this.$emit('iblchanged', value)
        },
        environmentchanged: function(value) {
            this.$emit('environmentchanged', value)
        },
        environmentrotationchanged: function(value) {
            this.$emit('environmentrotationchanged', value);
        },
        addenvironment: function(value) {
            this.$emit('addenvironment', value)
        },
        colorchanged: function(value) {
            this.$emit('colorchanged', value)
        },
        setSelectedClearColor: function (value) {
            this.$refs.colorpicker.setColor(value);
        }
    }
});
Vue.component('tab-animation', {
    props: ["animations"],
    template:'#animationTemplate',
    methods:
    {
        animationplayclicked: function(value) {
            this.$emit('animationplayclicked', value)
        },
        setAnimationState: function(value) {
            this.$refs.animations.setState(value);
        }
    }
});
Vue.component('tab-xmp', {
  props: ["xmp"],
  template:'#xmpTemplate',
  data() {
    return {
    };
  },
});
Vue.component('tab-advanced-controls', {
    props: ["debugchannels", "tonemaps", "statistics", "exposure"],
    template:'#advancedControlsTemplate',
    data() {
        return {
            skinning: true,
            morphing: true,
        };
    },
    methods:
    {
        exposurechanged: function(value) {
            this.$emit('exposurechanged', value)
        },
        skinningchanged: function(value) {
            this.$emit('skinningchanged', value)
        },
        morphingchanged: function(value) {
            this.$emit('morphingchanged', value)
        },
        debugchannelchanged: function(value) {
            this.$emit('debugchannelchanged', value)
        },
        tonemapchanged: function(value) {
            this.$emit('tonemapchanged', value);
        }
    }
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
            models: [{title: "Avocado"}],
            flavors: [],
            scenes: [{title: "0"}, {title: "1"}],
            cameras: [{title: "User Camera"}],
            materialVariants: [{title: "mat var yellow"}, {title: "mat var red"}, {title: "mat var blue"}],
            environments: [{title: "Doge"}, {title: "Helipad"}, {title: "Footprint Court"}],
            animations: [{title: "cool animation"}, {title: "even cooler"}, {title: "not cool"}, {title: "Do not click!"}],
            tonemaps: [{title: "None"}],
            debugchannels: [{title: "None"}],
            xmp: [{title: "xmp"}],
            statistics: []
        };
    },
    methods:
    {
        setSelectedModel: function(value)
        {
            this.$refs.models.setSelectedModel(value);
        },
        setSelectedScene: function(value)
        {
            this.$refs.scenes.setSelectedScene(value);
        },
        setSelectedClearColor: function(value)
        {
            this.$refs.colorpicker.setSelectedClearColor(value);
        },
        setAnimationState: function(value)
        {
            this.$refs.animations.setAnimationState(value);
        }
    }
}).$mount('#app');

export { app };
