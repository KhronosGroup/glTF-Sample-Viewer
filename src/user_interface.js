class gltfUserInterface
{
    constructor(
        modelIndexerPath,
        model,
        renderingParameters,
        stats,
        enableModelSelection = true,
        ignoredVariants = ["glTF-Draco", "glTF-Embedded"])
    {
        this.modelIndexerPath = modelIndexerPath;
        this.model = model;
        this.renderingParameters = renderingParameters;
        this.stats = stats;
        this.enableModelSelection = enableModelSelection;
        this.ignoredVariants = ignoredVariants;

        this.modelIndexer = undefined;
        this.gui = undefined;
        this.gltfFolder = undefined;
        this.modelsDictionary = undefined;
        this.modelsPath = undefined;

        this.onModelSelected = undefined;
        this.onNextSceneSelected = undefined;
        this.onPreviousSceneSelected = undefined;
    }

    initialize()
    {
        const self = this;
        axios.get(this.modelIndexerPath).then(response =>
        {
            self.modelIndexer = response.data;
            self.initializeCallback();
        });
    }

    initializeCallback()
    {
        this.modelsPath = this.modelIndexer !== undefined ? getContainingFolder(this.modelIndexerPath) : "models/";
        this.parseModelIndex(this.modelIndexer);

        this.gui = new dat.GUI({ width: 300 });
        this.gltfFolder = this.gui.addFolder("glTF");

        if (this.enableModelSelection)
        {
            this.initializeModelsDropdown();
        }

        this.initializeSceneSelection();
        this.initializeLightingSettings();
        this.initializeDebugSettings();
        this.initializeMonitoringView();
        this.gltfFolder.open();

        if (this.model.includes("/"))
        {
            this.loadFromPath(this.model);
        }
        else
        {
            this.loadFromKey(this.model);
        }
    }

    parseModelIndex(modelIndexer)
    {
        this.modelsDictionary = {};

        for (const entry of modelIndexer)
        {
            if (entry.variants === undefined)
            {
                continue;
            }

            for (const variant of Object.keys(entry.variants))
            {
                if (this.ignoredVariants.includes(variant))
                {
                    continue;
                }

                const modelPath = entry.name + "/" + variant + "/" + entry.variants[variant];
                let modelKey = getFileNameWithoutExtension(modelPath);
                if (variant !== "glTF")
                {
                    modelKey += " (" + variant.replace("glTF-", "") + ")";
                }
                this.modelsDictionary[modelKey] = modelPath;
            }
        }
    }

    initializeModelsDropdown()
    {
        const modelKeys = Object.keys(this.modelsDictionary);
        if (!modelKeys.includes(this.model))
        {
            this.model = modelKeys[0];
        }

        const self = this;
        this.gltfFolder.add(this, "model", modelKeys).name("Model")
            .onChange(modelKey => self.loadFromKey(modelKey));
    }

    initializeSceneSelection()
    {
        const scenesFolder = this.gltfFolder.addFolder("Scene Index");
        scenesFolder.add(this, "onPreviousSceneSelected").name("←");
        scenesFolder.add(this, "onNextSceneSelected").name("→");
    }

    initializeLightingSettings()
    {
        const self = this;
        const lightingFolder = this.gui.addFolder("Lighting");
        lightingFolder.add(this.renderingParameters, "useIBL").name("Image-Based Lighting");
        lightingFolder.add(this.renderingParameters, "usePunctual").name("Punctual Lighting");
        lightingFolder.add(this.renderingParameters, "environment", Environments).name("Environment")
            .onChange(environment => self.loadEnvironment(environment));
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

    loadFromPath(modelPath)
    {
        this.onModelSelected(modelPath);
    }

    loadFromKey(modelKey)
    {
        this.model = modelKey;
        const relativePath = this.modelsDictionary[this.model];
        this.onModelSelected(relativePath, this.modelsPath);
    }

    loadEnvironment(environment)
    {
        this.renderingParameters.environment = environment;
        this.loadFromKey(this.model);
    }
}
