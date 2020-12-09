import VueRx from 'vue-rx';
import Rx from 'rxjs/Rx';

Vue.use(VueRx, Rx);

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
    setSelectedModel:function(value)
    {
        this.$refs.models.setSelection(value);
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

let app = new Vue({
    domStreams: ['gunther$'],

      subscriptions()
      {
      },
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
        // these methods cann be called from outside simply by calling app.methodName()
        setSelectedModel: function(value)
        {
            this.$refs.models.setSelectedModel(value);
        }
    }
}).$mount('#app')

export {app};
