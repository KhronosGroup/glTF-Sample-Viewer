// general components
Vue.component('drop-down-element', {
  props: ['name', 'dropdowncontent'],
  template:'#dropDownTemplate'
});

Vue.component('radio-button-element', {
  props: ['name', 'radiobuttoncontent'],
  data() {
    return {
      radio: ""
    };
  },
  template:'#radioButtonTemplate'
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
  props: [],
  template:'#animationTemplate'
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
      environments: [{title: "mat var yellow"}, {title: "mat var red"}, {title: "mat var blue"}]
    };
  }
}).$mount('#app')
