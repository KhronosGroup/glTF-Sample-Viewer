
import { gltfModelPathProvider } from './model_path_provider.js';
import { gltfRenderer } from './renderer.js';
import { gltfRenderingParameters, Environments, UserCameraIndex } from './rendering_parameters.js';
import { gltfUserInterface } from './user_interface.js';

import { computePrimitiveCentroids } from './gltf_utils.js';
import { loadGltfFromPath, loadGltfFromDrop, loadPrefilteredEnvironmentFromPath } from './ResourceLoader/resource_loader.js';
import { gltfLoader } from "./loader";
import { GltfState } from './GltfState/gltf_state.js';
import { GltfView } from './GltfView/gltf_view.js';
import { WebGl } from './webgl.js';

class gltfViewer
{
    constructor(
        canvas,
        modelIndex,
        input,
        onRendererReady = undefined,
        basePath = "",
        initialModel = "",
        environmentMap = undefined,
        dracoDecoder)
    {
        this.onRendererReady = onRendererReady;
        this.basePath = basePath;
        this.initialModel = initialModel;
        this.dracoDecoder = dracoDecoder;

        this.lastMouseX = 0.00;
        this.lastMouseY = 0.00;
        this.mouseDown = false;

        this.lastTouchX = 0.00;
        this.lastTouchY = 0.00;
        this.touchDown = false;

        this.canvas = canvas;
        this.canvas.style.cursor = "grab";

        this.lastDropped = undefined;

        this.state = new GltfState();
        // for now just provide a dummy view
        this.view = {};
        this.view.context = WebGl.context;

        this.renderingParameters = new gltfRenderingParameters(environmentMap);
        this.currentlyRendering = false;
        this.renderer = new gltfRenderer(canvas, this.renderingParameters, this.basePath);

        this.gltfLoadedCallback = function(){};

        // Holds the last camera index, used for scene scaling when changing to user camera.
        this.prevCameraIndex = null;

        this.setupInputBindings(input);

        if (this.initialModel.includes("/"))
        {
            // no UI if a path is provided (e.g. in the vscode plugin)
            this.showSpinner();
            this.loadFromPath(this.initialModel).then( (gltf) => this.startRendering(gltf) );
        }
        else
        {
            const self = this;
            this.stats = new Stats();
            this.pathProvider = new gltfModelPathProvider(this.basePath + modelIndex);
            this.pathProvider.initialize().then(() =>
            {
                self.initializeGui();
                this.showSpinner();
                self.loadFromPath(self.pathProvider.resolve(self.initialModel)).then( (gltf) => this.startRendering(gltf) );
            });
        }

        this.render(this.state);
    }

    // callback = function(gltf) {}
    setGltfLoadedCallback(callback)
    {
        this.gltfLoadedCallback = callback;
    }

    setupInputBindings(input)
    {
        const self = this;
        input.onRotate = (deltaX, deltaY) =>
        {
            if (this.renderingParameters.userCameraActive())
            {
                this.state.userCamera.rotate(deltaX, deltaY);
            }
        };
        input.onPan = (deltaX, deltaY) =>
        {
            if (this.renderingParameters.userCameraActive())
            {
                this.state.userCamera.pan(deltaX, deltaY);
            }
        };
        input.onZoom = (delta) =>
        {
            if (this.renderingParameters.userCameraActive())
            {
                this.state.userCamera.zoomIn(delta);
            }
        };
        input.onResetCamera = () =>
        {
            if (this.renderingParameters.userCameraActive())
            {
                self.state.userCamera.reset(self.state.gltf , this.renderingParameters.sceneIndex);
            }
        };
        input.onDropFiles = (mainFile, additionalFiles) => {
            this.showSpinner();
            this.loadFromFileObject(mainFile, additionalFiles).then( (gltf) => {
                this.startRendering(gltf);
            });
        };
    }

    async loadFromFileObject(mainFile, additionalFiles)
    {
        this.lastDropped = { mainFile: mainFile, additionalFiles: additionalFiles };

        const gltf = await loadGltfFromDrop(mainFile, additionalFiles, this.view);

        const environmentDesc = Environments[this.renderingParameters.environmentName];
        const environment = loadPrefilteredEnvironmentFromPath("assets/environments/" + environmentDesc.folder, gltf, this.view);

        // inject environment into gltf
        gltf.samplers.push(...(await environment).samplers);
        gltf.images.push(...(await environment).images);
        gltf.textures.push(...(await environment).textures);

        return gltf;
    }

    async loadFromPath(gltfFile, basePath = "")
    {
        this.lastDropped = undefined;

        gltfFile = basePath + gltfFile;

        const gltf = await loadGltfFromPath(gltfFile, this.view);

        const environmentDesc = Environments[this.renderingParameters.environmentName];
        const environment = loadPrefilteredEnvironmentFromPath("assets/environments/" + environmentDesc.folder, gltf, this.view);

        // inject environment into gltf
        gltf.samplers.push(...(await environment).samplers);
        gltf.images.push(...(await environment).images);
        gltf.textures.push(...(await environment).textures);

        return gltf;
    }

    startRendering(gltf)
    {
        this.currentlyRendering = false;


        // unload previous scene
        if (this.state.gltf !== undefined)
        {
            gltfLoader.unload(this.state.gltf );
            this.state.gltf = undefined;
        }

        this.state.gltf = gltf;
        if(this.gltfLoadedCallback !== undefined)
        {
            this.gltfLoadedCallback(gltf);
        }

        if (gltf.scenes.length === 0)
        {
            throw "No scenes in the gltf";
        }

        this.renderingParameters.cameraIndex = UserCameraIndex;
        this.renderingParameters.sceneIndex = gltf.scene ? gltf.scene : 0;
        this.renderingParameters.animationTimer.reset();
        this.renderingParameters.animationIndex = "all";

        if (this.gui !== undefined)
        {
            this.gui.update(gltf);
        }

        this.state.gltf = gltf;

        this.hideSpinner();

        this.currentlyRendering = true;

        this.prepareSceneForRendering(gltf);
        this.state.userCamera.fitViewToScene(gltf, this.renderingParameters.sceneIndex);

        computePrimitiveCentroids(gltf);
    }

    render(state)
    {
        const self = this;
        function renderFrame()
        {
            if (self.stats !== undefined)
            {
                self.stats.begin();
            }

            if (self.currentlyRendering)
            {
                self.prepareSceneForRendering(state.gltf);
                state.userCamera.fitCameraPlanesToScene(state.gltf, self.renderingParameters.sceneIndex);

                self.renderer.resize(self.canvas.clientWidth, self.canvas.clientHeight);
                self.renderer.newFrame();

                if (state.gltf .scenes.length !== 0)
                {
                    state.userCamera.updatePosition();

                    const scene = state.gltf .scenes[self.renderingParameters.sceneIndex];

                    // Check if scene contains transparent primitives.

                    const nodes = scene.gatherNodes(state.gltf);

                    const alphaModes = nodes
                        .filter(n => n.mesh !== undefined)
                        .reduce((acc, n) => acc.concat(state.gltf .meshes[n.mesh].primitives), [])
                        .map(p => state.gltf .materials[p.material].alphaMode);

                    let hasBlendPrimitives = false;
                    for(const alphaMode of alphaModes)
                    {
                        if(alphaMode === "BLEND")
                        {
                            hasBlendPrimitives = true;
                            break;
                        }
                    }

                    if(hasBlendPrimitives)
                    {
                        // Draw all opaque and masked primitives. Depth sort is not yet required.
                        self.renderer.drawScene(state, scene, false, primitive => state.gltf .materials[primitive.material].alphaMode !== "BLEND");

                        // Draw all transparent primitives. Depth sort is required.
                        self.renderer.drawScene(state, scene, true, primitive => state.gltf .materials[primitive.material].alphaMode === "BLEND");
                    }
                    else
                    {
                        // Simply draw all primitives.
                        self.renderer.drawScene(state, scene, false);
                    }
                }

                if (self.onRendererReady)
                {
                    self.onRendererReady();
                }
            }

            if (self.stats !== undefined)
            {
                self.stats.end();
            }

            window.requestAnimationFrame(renderFrame);
        }

        // After this start executing render loop.
        window.requestAnimationFrame(renderFrame);
    }

    prepareSceneForRendering(gltf)
    {
        const scene = gltf.scenes[this.renderingParameters.sceneIndex];

        this.animateNode(gltf);

        scene.applyTransformHierarchy(gltf);
    }

    animateNode(gltf)
    {
        if(gltf.animations !== undefined && !this.renderingParameters.animationTimer.paused)
        {
            const t = this.renderingParameters.animationTimer.elapsedSec();

            if(this.renderingParameters.animationIndex === "all")
            {
                // Special index, step all animations.
                for(const anim of gltf.animations)
                {
                    if(anim)
                    {
                        anim.advance(gltf, t);
                    }
                }
            }
            else
            {
                // Step selected animation.
                const anim = gltf.animations[this.renderingParameters.animationIndex];
                if(anim)
                {
                    anim.advance(gltf, t);
                }
            }
        }
    }

    initializeGui()
    {
        const gui = new gltfUserInterface(
            this.pathProvider,
            this.initialModel,
            this.renderingParameters,
            this.stats);

        const self = this;
        gui.onModelChanged = () => {
            this.showSpinner();
            self.loadFromPath(this.pathProvider.resolve(gui.selectedModel)).then( (gltf) => this.startRendering(gltf) );
        };
        gui.onEnvironmentChanged = () =>
        {
            if (self.lastDropped === undefined)
            {
                self.showSpinner();
                self.loadFromPath(this.pathProvider.resolve(gui.selectedModel)).then( (gltf) => this.startRendering(gltf) );
            }
            else
            {
                self.showSpinner();
                self.loadFromFileObject(this.lastDropped.mainFile, this.lastDropped.additionalFiles);
            }
        };
        gui.initialize();
        this.gui = gui;
    }

    showSpinner()
    {
        let spinner = document.getElementById("gltf-sample-viewer-model-spinner");
        if (spinner !== undefined)
        {
            spinner.style.display = "block";
        }
    }

    hideSpinner()
    {
        let spinner = document.getElementById("gltf-sample-viewer-model-spinner");
        if (spinner !== undefined)
        {
            spinner.style.display = "none";
        }
    }
}

export { gltfViewer };
