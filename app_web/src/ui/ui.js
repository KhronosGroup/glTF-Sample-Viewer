import Vue from 'vue/dist/vue.esm.js'
import VueRx from 'vue-rx';
import { Subject } from 'rxjs';
import './sass.scss';
import Buefy from 'buefy';

Vue.use(VueRx, { Subject });
Vue.use(Buefy);

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
Vue.component('json-to-ui-template', {
    props: ['data', 'isinner'],
    template:'#jsonToUITemplate'
});

const app = new Vue({
    domStreams: ['modelChanged$', 'flavourChanged$', 'sceneChanged$', 'cameraChanged$',
        'environmentChanged$', 'debugchannelChanged$', 'tonemapChanged$', 'skinningChanged$',
        'punctualLightsChanged$', 'iblChanged$', 'blurEnvChanged$', 'morphingChanged$',
        'addEnvironment$', 'colorChanged$', 'environmentRotationChanged$', 'animationPlayChanged$', 'selectedAnimationsChanged$',
        'variantChanged$', 'exposureChanged$', "clearcoatChanged$", "sheenChanged$", "transmissionChanged$",
        'cameraExport$', 'captureCanvas$','iblIntensityChanged$',],
    data() {
        return {
            fullheight: true,
            right: true,
            models: ["DamagedHelmet"],
            flavours: ["glTF", "glTF-Binary", "glTF-Quantized", "glTF-Draco", "glTF-pbrSpecularGlossiness"],
            scenes: [{title: "0"}, {title: "1"}],
            cameras: [{title: "User Camera", index: -1}],
            materialVariants: [{title: "None"}],

            animations: [{title: "cool animation"}, {title: "even cooler"}, {title: "not cool"}, {title: "Do not click!"}],
            tonemaps: [{title: "None"}],
            debugchannels: [{title: "None"}],
            xmp: [{title: "xmp"}],
            statistics: [],

            selectedModel: "DamagedHelmet",
            selectedFlavour: "",
            selectedScene: {},
            selectedCamera: {},
            selectedVariant: "None",
            selectedAnimations: [],
            disabledAnimations: [],

            ibl: true,
            iblIntensity: 0.0,
            punctualLights: true,
            renderEnv: true,
            blurEnv: true,
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
            volumeEnabled: true,
            iorEnabled: true,
            iridescenceEnabled: true,
            specularEnabled: true,
            emissiveStrengthEnabled: true,

            activeTab: 0,
            tabsHidden: false,
            loadingComponent: undefined,
            showDropDownOverlay: false,
            uploadedHDR: undefined,
            uiVisible: true,
            

            // these are handls for certain ui change related things
            environmentVisiblePrefState: true,
            volumeEnabledPrefState: true,
        };
    },
    mounted: function()
    {
        // remove input class from color picker (added by default by buefy)
        const colorPicker = document.getElementById("clearColorPicker");
        colorPicker.classList.remove("input");

        // test if webgl is present
        const context = canvas.getContext("webgl2", { alpha: false, antialias: true });
        if (context === undefined || context === null) {
            this.error("The sample viewer requires WebGL 2.0, which is not supported by this browser or device. " + 
            "Please try again with another browser, or check https://get.webgl.org/webgl2/ " +
            "if you believe you are seeing this message in error.", 15000);
        }

        // add github logo to navbar
        this.$nextTick(function () {
            // Code that will run only after the
            // entire view has been rendered
            var a = document.createElement('a');
            a.href = "https://github.com/KhronosGroup/glTF-Sample-Viewer";
            var img = document.createElement('img');
            img.src ="assets/ui/GitHub-Mark-Light-32px.png";
            img.style.width = "22px";
            img.style.height = "22px";
            document.getElementById("tabsContainer").childNodes[0].childNodes[0].appendChild(a);
            a.appendChild(img);
        })

    },
    methods:
    {
        setAnimationState: function(value)
        {
            this.$refs.animationState.setState(value);
        },
        iblTriggered: function(value)
        {
            if(this.ibl == false)
            {
                this.environmentVisiblePrefState = this.renderEnv;
                this.renderEnv = false;
            }
            else{
                this.renderEnv = this.environmentVisiblePrefState;
            }
        },
        transmissionTriggered: function(value)
        {
            if(this.transmissionEnabled == false)
            {
                this.volumeEnabledPrefState = this.volumeEnabled;
                this.volumeEnabled = false;
            }
            else{
                this.volumeEnabled = this.volumeEnabledPrefState;
            }
        },
        collapseActiveTab : function(event, item) {
            if (item === this.activeTab)
            {
                this.tabsHidden = !this.tabsHidden;
                
                if(this.tabsHidden) {
                    // remove is-active class if tabs are hidden
                    event.stopPropagation();
                    
                    let navElements = document.getElementById("tabsContainer").childNodes[0].childNodes[0].childNodes;
                    for(let elem of navElements) {
                        elem.classList.remove('is-active');
                    }
                } else {
                    // add is-active class to correct element
                    let activeNavElement = document.getElementById("tabsContainer").childNodes[0].childNodes[0].childNodes[item];
                    activeNavElement.classList.add('is-active');
                }
                return;
            }
            else {
                // reset tab visibility
                this.tabsHidden = false;
            }
            
        },
        warn(message) {
            this.$buefy.toast.open({
                message: message,
                type: 'is-warning'
            })
        },
        error(message, duration = 5000) {
            this.$buefy.toast.open({
                message: message,
                type: 'is-danger',
                duration: duration
            })
        },
        goToLoadingState() {
            if(this.loadingComponent !== undefined)
            {
                return;
            }
            this.loadingComponent = this.$buefy.loading.open({
                container: null
            })
        },
        exitLoadingState()
        {
            if(this.loadingComponent === undefined)
            {
                return;
            }
            this.loadingComponent.close();
            this.loadingComponent = undefined;
        },
        onFileChange(e) {
            const file = e.target.files[0];
            this.uploadedHDR = file;
        },
        hide() {
            this.uiVisible = false;
        },
        show() {
            this.uiVisible = true;
        },
    }
}).$mount('#app');

const canvasUI = new Vue({
    data() {
        return {
            fullscreen: false,
            timer: null
        };
    },
    methods:
    {
        toggleFullscreen() {
            if(this.fullscreen) {
                app.show();
            } else {
                app.hide();
            }
            this.fullscreen = !this.fullscreen;
        },
        mouseMove() {
            this.$refs.fullscreenIcon.style.display = "block";
            this.setFullscreenIconTimer();
        },
        setFullscreenIconTimer() {
            clearTimeout(this.timer);
            this.timer = window.setTimeout( () => {
                this.$refs.fullscreenIcon.style.display = "none";
            }, 1000);
        }
    }

}).$mount('#canvasUI');


export { app };

// pipe error messages to UI
(function(){

    var originalWarn = console.warn;
    var originalError = console.error;

    console.warn = function(txt) {
        app.warn(txt);
        originalWarn.apply(console, arguments);
    }
    console.error = function(txt) {
        app.error(txt);
        originalError.apply(console, arguments);
    }

    window.onerror = function(msg, url, lineNo, columnNo, error) {
        var message = [
            'Message: ' + msg,
            'URL: ' + url,
            'Line: ' + lineNo,
            'Column: ' + columnNo,
            'Error object: ' + JSON.stringify(error)
          ].join(' - ');
        app.error(message);
    };
})();

