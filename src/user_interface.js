import { UserCameraIndex, Environments, ToneMaps, DebugOutput } from './rendering_parameters.js';

class gltfUserInterface
{
    constructor(
        modelPathProvider,
        selectedModel,
        renderingParameters,
        stats)
    {
        this.modelPathProvider = modelPathProvider;
        this.selectedModel = selectedModel;
        this.renderingParameters = renderingParameters;
        this.stats = stats;
        this.hexColor = this.toHexColor(this.renderingParameters.clearColor);

        this.gui = undefined;
        this.gltfFolder = undefined;
        this.gltfDependants = [];

        this.onModelChanged = undefined;
        this.onEnvironmentChanged = undefined;

        this.playAnimation = false;
    }

    initialize()
    {
        this.gui = new dat.GUI({ width: 300 });

        this.initializeGltfFolder();
        this.initializeLightingSettings();
        this.initializeDebugSettings();
        this.initializeMonitoringView();
    }

    update(gltf)
    {
        this.clearGltfFolder();

        const isModelInDropdown = this.modelPathProvider.pathExists(gltf.path);
        this.initializeModelsDropdown(isModelInDropdown ? undefined : gltf.path);
        this.initializeGltfVersionView(gltf.asset.version);
        this.initializeAnimationSelection(Object.keys(gltf.animations));
        this.initializeSceneSelection(Object.keys(gltf.scenes));
        this.initializeCameraSelection(Object.keys(gltf.cameras));
    }

    initializeGltfFolder()
    {
        this.gltfFolder = this.gui.addFolder("glTF");

        this.initializeModelsDropdown();
        this.initializeGltfVersionView("");
        this.initializeSceneSelection([]);
        this.initializeCameraSelection([]);
        this.initializeAnimationSettings();

        this.gltfFolder.open();
    }

    initializeModelsDropdown(droppedModel)
    {
        let modelKeys = [];

        if (droppedModel !== undefined)
        {
            modelKeys.push(droppedModel);
            this.selectedModel = droppedModel;
        }

        modelKeys = modelKeys.concat(this.modelPathProvider.getAllKeys());
        if (!modelKeys.includes(this.selectedModel))
        {
            this.selectedModel = modelKeys[0];
        }

        const self = this;
        const modelsDropdown = this.gltfFolder.add(this, "selectedModel", modelKeys).name("Model").onChange(() => self.onModelChanged());
        this.gltfDependants.push(modelsDropdown);
    }

    initializeGltfVersionView(version)
    {
        this.version = version;
        const versionView = this.gltfFolder.add(this, "version", version).name("glTF Version").onChange(() => this.version = version);
        this.gltfDependants.push(versionView);
    }

    initializeSceneSelection(scenes)
    {
        const sceneSelection = this.gltfFolder.add(this.renderingParameters, "sceneIndex", scenes).name("Scene Index");
        this.gltfDependants.push(sceneSelection);
    }

    initializeAnimationSelection(animations)
    {
        this.renderingParameters.animationIndex = -1;

        if(animations === undefined) {
            return;
        }

        this.renderingParameters.animationTimer.reset();

        // Prepend -1, special index for playing all animations, if there is more than one animation.
        const anims = animations.slice();
        if(anims.length > 1) {
            anims.shift(-1);
        }

        if(this.animationSelection !== undefined) {
            this.animationFolder.remove(this.animationSelection);
        }

        this.animationSelection = this.animationFolder.add(this.renderingParameters, "animationIndex", anims).name("Animation");
    }

    initializeCameraSelection(cameras)
    {
        const camerasWithUserCamera = [ UserCameraIndex ].concat(cameras);
        const cameraSelection = this.gltfFolder.add(this.renderingParameters, "cameraIndex", camerasWithUserCamera).name("Camera Index");
        this.gltfDependants.push(cameraSelection);
    }

    initializeLightingSettings()
    {
        const self = this;
        const lightingFolder = this.gui.addFolder("Lighting");
        if (this.renderingParameters.useShaderLoD)
        {
            lightingFolder.add(this.renderingParameters, "useIBL").name("Image-Based Lighting");
        }
        else
        {
            const message = "not available";
            const messageObject = { message: message };
            lightingFolder.add(messageObject, "message").name("Image-Based Lighting").onChange(() => messageObject.message = message);
        }
        lightingFolder.add(this.renderingParameters, "usePunctual").name("Punctual Lighting");
        lightingFolder.add(this.renderingParameters, "environmentName", Object.keys(Environments)).name("Environment")
            .onChange(() => self.onEnvironmentChanged());
        lightingFolder.add(this.renderingParameters, "exposure", 0, 10, 0.1).name("Exposure");
        lightingFolder.add(this.renderingParameters, "gamma", 0, 10, 0.1).name("Gamma");
        lightingFolder.add(this.renderingParameters, "toneMap", Object.values(ToneMaps)).name("Tone Map");
        lightingFolder.addColor(this, "hexColor", this.hexColor).name("Background Color")
            .onChange(() => self.renderingParameters.clearColor = self.fromHexColor(self.hexColor));
    }

    initializeAnimationSettings()
    {
        const self = this;
        this.animationFolder = this.gui.addFolder("Animation");
        this.playAnimationCheckbox = this.animationFolder.add(self, "playAnimation").name("Play").onChange(() => self.renderingParameters.animationTimer.toggle());
        this.animationFolder.add(self.renderingParameters, "skinning").name("Skinning");
        this.animationFolder.add(self.renderingParameters, "morphing").name("Morphing");
    }

    initializeDebugSettings()
    {
        const debugFolder = this.gui.addFolder("Debug");
        debugFolder.add(this.renderingParameters, "debugOutput", Object.values(DebugOutput)).name("Debug Output");
    }

    initializeMonitoringView()
    {
        const monitoringFolder = this.gui.addFolder("Performance");
        this.stats.domElement.height = "48px";
        for (const child of this.stats.domElement.children)
        {
            child.style.display = "";
        }
        this.stats.domElement.style.position = "static";
        const statsList = document.createElement("li");
        statsList.appendChild(this.stats.domElement);
        statsList.classList.add("gui-stats");
        monitoringFolder.__ul.appendChild(statsList);
    }

    clearGltfFolder()
    {
        for (const element of this.gltfDependants)
        {
            if (element !== undefined)
            {
                this.gltfFolder.remove(element);
            }
        }
        this.gltfDependants = [];
    }

    // string format: "#RRGGBB"
    fromHexColor(hexColor)
    {
        const hexR = hexColor.substring(1, 3);
        const hexG = hexColor.substring(3, 5);
        const hexB = hexColor.substring(5, 7);
        return [ this.fromHexValue(hexR) , this.fromHexValue(hexG), this.fromHexValue(hexB) ];
    }

    // array format: [ R, G, B ]
    toHexColor(color)
    {
        const hexR = color[0].toString(16);
        const hexG = color[1].toString(16);
        const hexB = color[2].toString(16);
        return "#" + hexR + hexG + hexB;
    }

    fromHexValue(hexValue)
    {
        return parseInt(hexValue, 16);
    }
}

export { gltfUserInterface };
