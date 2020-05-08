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
        this.version = "";
        this.sceneEnvironment = "Controlled by the scene";

        this.gui = undefined;
        this.gltfFolder = undefined;
        this.animationFolder = undefined;
        this.lightingFolder = undefined;
        this.updatables = [];

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
        for (const updatable of this.updatables)
        {
            updatable.update(gltf);
        }
    }

    initializeGltfFolder()
    {
        this.gltfFolder = this.gui.addFolder("glTF");

        this.initializeModelsDropdown();
        this.initializeGltfVersionView();
        this.initializeSceneSelection();
        this.initializeCameraSelection();
        this.initializeAnimationSettings();

        this.gltfFolder.open();
    }

    initializeModelsDropdown()
    {
        const self = this;
        function createElement(gltf)
        {
            const modelKeys = self.modelPathProvider.getAllKeys();

            if (gltf !== undefined && !self.modelPathProvider.pathExists(gltf.path))
            {
                modelKeys.unshift(gltf.path);
                self.selectedModel = gltf.path;
            }

            return self.gltfFolder.add(self, "selectedModel", modelKeys).name("Model")
                .onChange(() => self.onModelChanged());
        }
        this.initializeUpdatable(this.gltfFolder, createElement);
    }

    initializeGltfVersionView()
    {
        const self = this;
        function createElement(gltf)
        {
            const version = gltf !== undefined ? gltf.asset.version : "";
            self.version = version;
            return self.gltfFolder.add(self, "version", version).name("glTF Version")
                .onChange(() => self.version = version);
        }
        this.initializeUpdatable(this.gltfFolder, createElement);
    }

    initializeSceneSelection()
    {
        const self = this;
        function createElement(gltf)
        {
            const scenes = gltf !== undefined ? gltf.scenes : [];
            return self.gltfFolder.add(self.renderingParameters, "sceneIndex", Object.keys(scenes)).name("Scene Index")
                .onChange(() => self.update(gltf));
        }
        this.initializeUpdatable(this.gltfFolder, createElement);
    }

    initializeCameraSelection()
    {
        const self = this;
        function createElement(gltf)
        {
            const indices = gltf !== undefined ? Object.keys(gltf.cameras) : [];
            indices.unshift(UserCameraIndex);
            return self.gltfFolder.add(self.renderingParameters, "cameraIndex", indices).name("Camera Index");
        }
        this.initializeUpdatable(this.gltfFolder, createElement);
    }

    initializeLightingSettings()
    {
        const self = this;
        this.lightingFolder = this.gui.addFolder("Lighting");
        this.lightingFolder.add(this.renderingParameters, "useIBL").name("Image-Based Lighting");
        this.lightingFolder.add(this.renderingParameters, "usePunctual").name("Punctual Lighting");
        this.lightingFolder.add(this.renderingParameters, "exposure", 0, 10, 0.1).name("Exposure");
        this.lightingFolder.add(this.renderingParameters, "toneMap", Object.values(ToneMaps)).name("Tone Map");
        this.lightingFolder.addColor(this, "hexColor", this.hexColor).name("Background Color")
            .onChange(() => self.renderingParameters.clearColor = self.fromHexColor(self.hexColor));

        this.initializeEnvironmentSelection();
    }

    initializeEnvironmentSelection()
    {
        const self = this;
        function createElement(gltf)
        {
            if (gltf !== undefined &&
                gltf.scenes[self.renderingParameters.sceneIndex].imageBasedLight !== undefined)
            {
                const sceneEnvironment = self.sceneEnvironment;
                return self.lightingFolder.add(self, "sceneEnvironment", sceneEnvironment).name("Environment")
                    .onChange(() => self.sceneEnvironment = sceneEnvironment);
            }

            return self.lightingFolder.add(self.renderingParameters, "environmentName", Object.keys(Environments)).name("Environment")
                .onChange(() => self.onEnvironmentChanged());
        }
        this.initializeUpdatable(this.lightingFolder, createElement);
    }

    initializeAnimationSettings()
    {
        const self = this;
        this.animationFolder = this.gui.addFolder("Animation");
        this.playAnimationCheckbox = this.animationFolder.add(self, "playAnimation").name("Play").onChange(() => self.renderingParameters.animationTimer.toggle());
        this.animationFolder.add(self.renderingParameters, "skinning").name("Skinning");
        this.animationFolder.add(self.renderingParameters, "morphing").name("Morphing");

        this.initializeAnimationSelection();
    }

    initializeAnimationSelection()
    {
        const self = this;
        function createElement(gltf)
        {
            const indices = gltf !== undefined ? Object.keys(gltf.animations) : [];
            if (indices.length > 0)
            {
                indices.unshift("all");
            }
            return self.animationFolder.add(self.renderingParameters, "animationIndex", indices).name("Animation");
        }
        this.initializeUpdatable(this.animationFolder, createElement);
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

    initializeUpdatable(folder, createElement)
    {
        const updatable = { uiElement: createElement() };
        updatable.update = (gltf) =>
        {
            folder.remove(updatable.uiElement);
            updatable.uiElement = createElement(gltf);
        };
        this.updatables.push(updatable);
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
