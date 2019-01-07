import { Environments, ToneMaps, DebugOutput } from './rendering_parameters.js';

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
        this.modelsDropdown = undefined;
        this.versionView = undefined;
        this.sceneSelection = undefined;
        this.cameraSelection = undefined;

        this.onModelSelected = undefined;
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
        this.modelsDropdown = this.gltfFolder.add(this, "selectedModel", modelKeys).name("Model").onChange(modelKey => self.onModelSelected(modelKey));
    }

    initializeGltfVersionView(version)
    {
        this.version = version;
        this.versionView = this.gltfFolder.add(this, "version", version).name("glTF Version").onChange(() => this.version = version);
    }

    initializeSceneSelection(scenes)
    {
        this.sceneSelection = this.gltfFolder.add(this.renderingParameters, "sceneIndex", scenes).name("Scene Index");
    }

    initializeCameraSelection(cameras)
    {
        const camerasWithUserCamera = [ "default" ].concat(cameras);
        this.cameraSelection = this.gltfFolder.add(this.renderingParameters, "cameraIndex", camerasWithUserCamera).name("Camera Index");
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
            .onChange(() => self.onModelSelected(self.selectedModel));
        lightingFolder.add(this.renderingParameters, "exposure", 0, 10, 0.1).name("Exposure");
        lightingFolder.add(this.renderingParameters, "gamma", 0, 10, 0.1).name("Gamma");
        lightingFolder.add(this.renderingParameters, "toneMap", Object.values(ToneMaps)).name("Tone Map");
        lightingFolder.addColor(this, "hexColor", this.hexColor).name("Background Color")
            .onChange(() => self.renderingParameters.clearColor = self.fromHexColor(self.hexColor));
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
        this.gltfFolder.remove(this.modelsDropdown);
        this.gltfFolder.remove(this.versionView);
        this.gltfFolder.remove(this.sceneSelection);
        this.gltfFolder.remove(this.cameraSelection);
    }

    // string format: "#RRGGBB"
    fromHexColor(hexColor)
    {
        const hexR = hexColor.substring(1, 2);
        const hexG = hexColor.substring(3, 4);
        const hexB = hexColor.substring(5, 6);
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
        return parseInt(hexValue, 16) * 16
    }
}

export { gltfUserInterface };
