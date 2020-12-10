import VueRx from 'vue-rx';
import { Observable } from 'rxjs';

Vue.use(VueRx, { Observable });

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
  props: [],
  template:'#displayTemplate'
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
  data() {
    return {
        skinning: false,
        morphing: false,
    };
  },
  template:'#advancedControlsTemplate'
});

const app = new Vue({
    domStreams: ['modelChanged$', 'flavourChanged$', 'sceneChanged$', 'cameraChanged$'],
    data() {
      return {
        fullheight: true,
        right: true,
        models: [{title: "Avocado"}, {title: "Boombox"}, {title: "Duck"}],
        flavors: [{title: "gltf"}, {title: "binary"}, {title: "draco"}],
        scenes: [{title: "1"}, {title: "2"}],
        cameras: [{title: "front"}, {title: "left"}, {title: "right"}, {title: "top"}],
        materialVariants: [{title: "mat var yellow"}, {title: "mat var red"}, {title: "mat var blue"}],
        environments: [{title: "mat var yellow"}, {title: "mat var red"}, {title: "mat var blue"}],
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
