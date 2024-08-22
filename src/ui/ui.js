import { createApp } from 'vue/dist/vue.cjs.js';
import { Subject } from 'rxjs';
import './sass.scss';
import Buefy from '@ntohq/buefy-next';

const appCreated = createApp({
    data() {
        return {
            modelChanged: new Subject(),
            flavourChanged: new Subject(),
            sceneChanged: new Subject(),
            cameraChanged: new Subject(),
            
            debugchannelChanged: new Subject(),
            tonemapChanged: new Subject(),
            skinningChanged: new Subject(),
            punctualLightsChanged: new Subject(),

            iblChanged: new Subject(),
            blurEnvChanged: new Subject(),
            morphingChanged: new Subject(),
            colorChanged: new Subject(),

            environmentRotationChanged: new Subject(),
            animationPlayChanged: new Subject(),
            variantChanged: new Subject(),
            exposureChanged: new Subject(),

            clearcoatChanged: new Subject(),
            sheenChanged: new Subject(),
            transmissionChanged: new Subject(),
            diffuseTransmissionChanged: new Subject(),
            cameraExport: new Subject(),

            captureCanvas: new Subject(),
            iblIntensityChanged: new Subject(),

            volumeChanged: new Subject(),
            iorChanged: new Subject(),
            iridescenceChanged: new Subject(),
            anisotropyChanged: new Subject(),
            dispersionChanged: new Subject(),
            specularChanged: new Subject(),
            emissiveStrengthChanged: new Subject(),
            renderEnvChanged: new Subject(),
            addEnvironmentChanged: new Subject(),
            selectedAnimationsChanged: new Subject(),
            selectedEnvironmentChanged: new Subject(),

            validatorChanged: new Subject(),

            fullheight: true,
            right: true,
            models: ["DamagedHelmet"],
            flavours: ["glTF", "glTF-Binary", "glTF-Quantized", "glTF-Draco", "glTF-pbrSpecularGlossiness"],
            scenes: [{title: "0"}, {title: "1"}],
            cameras: [{title: "User Camera", index: -1}],
            materialVariants: ["None"],

            animations: [{title: "None"}],
            tonemaps: [{title: "None"}],
            debugchannels: [{title: "None"}],
            xmp: [{title: "xmp"}],
            assetCopyright: "",
            assetGenerator: "",
            statistics: [],

            selectedModel: "DamagedHelmet",
            selectedFlavour: "",
            selectedScene: {},
            selectedCamera: {},
            selectedVariant: "None",
            selectedAnimations: [],
            disabledAnimations: [],

            validationReport: {},

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
            toneMap: "Khronos PBR Neutral",
            skinning: true,
            morphing: true,
            clearcoatEnabled: true,
            sheenEnabled: true,
            transmissionEnabled: true,
            volumeEnabled: true,
            iorEnabled: true,
            iridescenceEnabled: true,
            diffuseTransmissionEnabled: true,
            anisotropyEnabled: true,
            dispersionEnabled: true,
            specularEnabled: true,
            emissiveStrengthEnabled: true,

            activeTab: 0,
            tabContentHidden: true,
            loadingComponent: undefined,
            showDropDownOverlay: false,
            uploadedHDR: undefined,
            uiVisible: false,
            isMobile: false,
            

            // these are handles for certain ui change related things
            environmentVisiblePrefState: true,
            volumeEnabledPrefState: true,
        };
    },
    watch: {
        selectedAnimations: function (newValue) {
            this.selectedAnimationsChanged.next(newValue);
        }
    },
    beforeMount: function(){
        // Definition of mobile: https://bulma.io/documentation/start/responsiveness/
        if(window.innerWidth > 768) { 
            this.uiVisible = true;
            this.isMobile = false;
        } else {
            this.uiVisible=false;
            this.isMobile = true;
        }
    },
    mounted: function()
    {
        // remove input class from color picker (added by default by buefy)
        const colorPicker = document.getElementById("clearColorPicker");
        colorPicker.classList.remove("input");

        // test if webgl is present
        const canvas = document.getElementById("canvas");
        const context = canvas.getContext("webgl2", { alpha: false, antialias: true });
        if (context === undefined || context === null) {
            this.error("The sample viewer requires WebGL 2.0, which is not supported by this browser or device. " + 
            "Please try again with another browser, or check https://get.webgl.org/webgl2/ " +
            "if you believe you are seeing this message in error.", 15000);
        }

        // change styling of tab-bar
        this.$nextTick(function () {
            // Code that will run only after the
            // entire view has been rendered

            let navElement = document.getElementById("tabsContainer").childNodes[0];

            if(!this.isMobile){
                navElement.style.width = "100px";
            }

            let ulElement = navElement.childNodes[0];
            while (ulElement) {
                if (ulElement.nodeName === "UL") {
                    break;
                }
                ulElement = ulElement.nextElementSibling;
            }

            // Avoid margin on top for mobile devices
            if(this.isMobile) { 
                let liElement =ulElement.childNodes[0];
                while (liElement) {
                    if (liElement.nodeName === "LI") {
                        break;
                    }
                    liElement = liElement.nextElementSibling;
                }
                liElement.style.marginTop = "0px";
            }

            // add github logo to tab-bar
            var a = document.createElement('a');
            a.href = "https://github.com/KhronosGroup/glTF-Sample-Viewer";
            var img = document.createElement('img');
            img.src ="assets/ui/GitHub-Mark-Light-32px.png";
            img.style.width = "22px";
            img.style.height = "22px";
            ulElement.appendChild(a);
            a.appendChild(img);
        });

    },
    methods:
    {
        async copyToClipboard(text) {
            try {
                await navigator.clipboard.writeText(text);
                this.$buefy.toast.open({
                    message: "Copied to clipboard",
                    type: 'is-success'
                });
            } catch (err) {
                this.error("Error copying to clipboard.");
            }
        },
        downloadJSON(filename, json) {
            const text = JSON.stringify(json, undefined, 4);
            const dataURL = "data:application/json;charset=utf-8," + encodeURIComponent(text);
            const element = document.createElement("a");
            element.setAttribute("href", dataURL);
            element.setAttribute("download", filename);
            element.style.display = "none";
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        },
        getValidationCounter: function(){
            let number = 0;
            let color = "white";
            if (this.validationReport?.issues?.numErrors > 0) {
                number = this.validationReport?.issues?.numErrors;
                color = "red";
            } else if (this.validationReport?.issues?.numWarnings > 0) {
                number = this.validationReport?.issues?.numWarnings;
                color = "yellow";
            } else if (this.validationReport?.issues?.numInfos > 0) {
                number = this.validationReport?.issues?.numInfos;
            }
            if (number !== 0) {
                return `<div style="display:flex;color:black; font-weight:bold; background-color:${color}; border-radius:50%; width:fit-content; min-width:2rem; align-items:center;aspect-ratio:1/1;justify-content:center;">${number}</div>`;
            }
            if (this.tabsHidden === false && this.activeTab === 2) {
                return `<img src="assets/ui/Capture 50X50.svg" width="50px" height="100%">`;
            }
            return '<img src="assets/ui/Capture 30X30.svg" width="30px">';
        },
        setAnimationState: function(value)
        {
            this.$refs.animationState.setState(value);
        },
        iblTriggered: function(value)
        {
            if(value == false) {
                this.environmentVisiblePrefState = this.renderEnv;
                this.renderEnv = false;
                this.renderEnvChanged.next(false);
            } else {
                this.renderEnv = this.environmentVisiblePrefState;
                this.renderEnvChanged.next(this.renderEnv);
            }
        },
        transmissionTriggered: function(value)
        {
            if (value == false && this.diffuseTransmissionEnabled == false) {
                this.volumeEnabledPrefState = this.volumeEnabled;
                this.volumeEnabled = false;
            } else if (value == true && this.diffuseTransmissionEnabled == false) {
                this.volumeEnabled = this.volumeEnabledPrefState;
            }
        },
        diffuseTransmissionTriggered: function(value)
        {
            if (value == false && this.transmissionEnabled == false) {
                this.volumeEnabledPrefState = this.volumeEnabled;
                this.volumeEnabled = false;
            } else if (value == true && this.transmissionEnabled == false) {
                this.volumeEnabled = this.volumeEnabledPrefState;
            }
        },
        collapseActiveTab : function(event, item) {
            if (item === this.activeTab) {
                this.tabContentHidden = !this.tabContentHidden;
                
                if(this.tabContentHidden) {
                    // remove is-active class if tabs are hidden
                    event.stopPropagation();
                    
                    let navElements = document.getElementById("tabsContainer").children[0].children[0].children;
                    for(let elem of navElements) {
                        elem.classList.remove('is-active');
                    }
                } else {
                    // add is-active class to correct element
                    let activeNavElement = document.getElementById("tabsContainer").children[0].children[0].children[item];
                    activeNavElement.classList.add('is-active');
                }
                return;
            } else {
                // reset tab visibility
                this.tabContentHidden = false;
            }
            
        },
        warn(message) {
            this.$buefy.toast.open({
                message: message,
                type: 'is-warning'
            });
        },
        error(message, duration = 5000) {
            this.$buefy.toast.open({
                message: message,
                type: 'is-danger',
                duration: duration
            });
        },
        goToLoadingState() {
            if(this.loadingComponent !== undefined)
            {
                return;
            }
            this.loadingComponent = this.$buefy.loading.open({
                container: null
            });
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
            this.addEnvironmentChanged.next(file);
        },

        toggleUI() {
            this.uiVisible = !this.uiVisible;
        },
    }
});

appCreated.use(Buefy);

// general components
appCreated.component('toggle-button', {
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
        buttonclicked: function()
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
appCreated.component('json-to-ui-template', {
    props: ['data', 'isinner'],
    template:'#jsonToUITemplate'
});

export const app = appCreated.mount('#app');

const canvasUI = createApp({
    data() {
        return {
            timer: null
        };
    },
    methods:
    {
    }

});

canvasUI.use(Buefy);

canvasUI.mount('#canvasUI');

// pipe error messages to UI
(() => {
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = function(txt) {
        app.warn(txt);
        originalWarn.apply(console, arguments);
    };
    console.error = function(txt) {
        app.error(txt);
        originalError.apply(console, arguments);
    };

    window.onerror = function(msg, url, lineNo, columnNo, error) {
        app.error([
            'Message: ' + msg,
            'URL: ' + url,
            'Line: ' + lineNo,
            'Column: ' + columnNo,
            'Error object: ' + JSON.stringify(error)
        ].join(' - '));
    };
})();

