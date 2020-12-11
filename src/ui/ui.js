import VueRx from 'vue-rx';
import { Subject } from 'rxjs';

Vue.use(VueRx, { Subject });

// general components
Vue.component('drop-down-element', {
    props: ['name', 'dropdowncontent'],
    template:'#dropDownTemplate',
    data() {
        return {
            selectedOption: ""
        }
    },
    // this is used to init the dropdown (so it is not empty on UI bootup)
    mounted(){
        if(this.dropdowncontent === undefined)
        {
            return;
        }
        this.selectedOption = this.dropdowncontent[0].title
    },
    methods:
    {
        selectionchanged: function(value)
        {
            this.$emit('selectionchanged', value)
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
        value: 0
    };
  },
  template:'#sliderTemplate'
});
Vue.component('color-picker-element', {
  props: ['name'],
  data() {
    return {
      color: '#1CA085'
    }
  },
  template:'#colorPickerTemplate'
});



// create components for menu tabs
Vue.component('tab-models', {
  props: ["materialvariants", "models", "flavors", "scenes", "cameras"],
  template:'#modelsTemplate',
  methods:
  {
    modelchanged: function(value) {
        this.$emit('modelchanged', value)
    },
    flavourchanged: function(value) {
        this.$emit('flavourchanged', value)
    },
    scenechanged: function(value) {
        this.$emit('scenechanged', value)
    },
    camerachanged: function(value) {
        this.$emit('camerachanged', value)
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
  props: ["environments"],
  template:'#displayTemplate',
  data() {
    return {
        environmentvisibility: true,
        punctuallights: true,
        ibl: true
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
    }
  }
});
Vue.component('tab-animation', {
  props: ["animations"],
  template:'#animationTemplate'
});
Vue.component('tab-xmp', {
  props: [""],
  template:'#xmpTemplate'
});
Vue.component('tab-advanced-controls', {
  props: ["debugchannels", "tonemaps"],
  template:'#advancedControlsTemplate',
  data() {
    return {
        skinning: false,
        morphing: false,
    };
  },
  methods:
  {
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
      this.$emit('tonemapchanged', value)
    }
  }
});

const app = new Vue({
    domStreams: ['modelChanged$', 'flavourChanged$', 'sceneChanged$', 'cameraChanged$',
                'environmentChanged$', 'debugchannelChanged$', 'tonemapChanged$', 'skinningChanged$',
                'environmentVisibilityChanged$', 'punctualLightsChanged$', 'iblChanged$', 'morphingChanged$'],
    data() {
      return {
        fullheight: true,
        right: true,
        models: [{title: "Avocado"}, {title: "Boombox"}, {title: "Duck"}],
        flavors: [{title: "gltf"}, {title: "binary"}, {title: "draco"}],
        scenes: [{title: "1"}, {title: "2"}],
        cameras: [{title: "front"}, {title: "left"}, {title: "right"}, {title: "top"}],
        materialVariants: [{title: "mat var yellow"}, {title: "mat var red"}, {title: "mat var blue"}],
        environments: [{title: "Doge"}, {title: "Helipad"}, {title: "Footprint Court"}],
        animations: [{title: "cool animation"}, {title: "even cooler"}, {title: "not cool"}, {title: "Do not click!"}],
        tonemaps: [{title: "ACES"}, {title: "Linear"}],
        debugchannels: [{title: "Wireframe"}, {title: "Color"}, {title: "Specular"}, {title: "Metallic"}, {title: "Sheen"}],
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
        }
    }
}).$mount('#app')

export { app };
