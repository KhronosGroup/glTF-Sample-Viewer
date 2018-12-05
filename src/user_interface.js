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

        this.modelIndexer = undefined;
        this.gui = undefined;
        this.gltfFolder = undefined;
        this.modelsPath = undefined;

        this.onLoadModel = undefined;
        this.onLoadNextScene = undefined;
        this.onLoadPreviousScene = undefined;
    }

    initialize()
    {
        this.gui = new dat.GUI({ width: 300 });
        this.gltfFolder = this.gui.addFolder("glTF");

        this.initializeModelsDropdown();
        this.initializeSceneSelection();
        this.initializeLightingSettings();
        this.initializeDebugSettings();
        this.initializeMonitoringView();
        this.gltfFolder.open();
    }

    initializeModelsDropdown()
    {
        const modelKeys = this.modelPathProvider.getAllKeys();
        if (!modelKeys.includes(this.selectedModel))
        {
            this.selectedModel = modelKeys[0];
        }

        const self = this;
        this.gltfFolder.add(this, "selectedModel", modelKeys).name("Model").onChange(modelKey => self.onLoadModel(modelKey));
    }

    initializeSceneSelection()
    {
        const scenesFolder = this.gltfFolder.addFolder("Scene Index");
        scenesFolder.add(this, "onLoadPreviousScene").name("←");
        scenesFolder.add(this, "onLoadNextScene").name("→");
    }

    initializeLightingSettings()
    {
        const lightingFolder = this.gui.addFolder("Lighting");
        lightingFolder.add(this.renderingParameters, "useIBL").name("Image-Based Lighting");
        lightingFolder.add(this.renderingParameters, "usePunctual").name("Punctual Lighting");
        lightingFolder.add(this.renderingParameters, "exposure", 0, 2, 0.1).name("Exposure");
        lightingFolder.add(this.renderingParameters, "gamma", 0, 10, 0.1).name("Gamma");
        lightingFolder.add(this.renderingParameters, "toneMap", Object.values(ToneMaps)).name("Tone Map");
        lightingFolder.addColor(this.renderingParameters, "clearColor", [50, 50, 50]).name("Background Color");
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
}
