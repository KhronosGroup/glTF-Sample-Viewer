// general components
Vue.component('drop-down-element', {
  props: ['name', 'dropdowncontent'],
  template:'#dropDownTemplate'
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



// create components for menu tabs
Vue.component('tab-models', {
  props: ["materialvariants", "models", "flavors", "scenes", "cameras"],
  template:'#modelsTemplate'
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
  data() {
    return {
      open: false,
      overlay: false,
      fullheight: true,
      right: true,
      currentTab: 'Models',
      tabs: ['Models', 'Display', 'Animation'],
      models: [{title: "Avocado"}, {title: "Boombox"}, {title: "Duck"}],
      flavors: [{title: "gltf"}, {title: "binary"}, {title: "draco"}],
      scenes: [{title: "1"}, {title: "2"}],
      cameras: [{title: "front"}, {title: "left"}, {title: "right"}, {title: "top"}],
      materialVariants: [{title: "mat var yellow"}, {title: "mat var red"}, {title: "mat var blue"}],
      environments: [{title: "mat var yellow"}, {title: "mat var red"}, {title: "mat var blue"}],
      animations: [{title: "cool animation"}, {title: "even cooler"}, {title: "not cool"}, {title: "Do not click!"}],
      tonemaps: [{title: "ACES"}, {title: "Linear"}],
      debugchannels: [{title: "Wireframe"}, {title: "Color"}, {title: "Specular"}, {title: "Metalic"}, {title: "Sheen"}],
    };
  }
}).$mount('#app')
