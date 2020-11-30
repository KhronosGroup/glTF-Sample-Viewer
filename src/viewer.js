
import { gltfModelPathProvider } from './model_path_provider.js';
import { gltfRenderer } from './renderer.js';
import { gltfRenderingParameters, Environments, UserCameraIndex } from './rendering_parameters.js';
import { gltfUserInterface } from './user_interface.js';
import { UserCamera } from './user_camera.js';
import { jsToGl, getIsGlb, Timer, getContainingFolder } from './utils.js';
import { GlbParser } from './glb_parser.js';
import { computePrimitiveCentroids } from './gltf_utils.js';
import { loadGltfFromPath, loadGltfFromDrop, loadPrefilteredEnvironmentFromPath } from './ResourceLoader/resource_loader.js';
import { gltfLoader } from "./loader";
import { GltfState } from './GltfState/gltf_state.js';

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

        this.loadingTimer = new Timer();
        this.lastDropped = undefined;

        this.state = new GltfState();
        this.state.renderingParameters = new gltfRenderingParameters(environmentMap);
        this.state.userCamera = new UserCamera();
        this.currentlyRendering = false;
        this.renderer = new gltfRenderer(canvas, this.state.userCamera, this.state.renderingParameters, this.basePath);



        this.gltfLoadedCallback = function(){};

        // Holds the last camera index, used for scene scaling when changing to user camera.
        this.prevCameraIndex = null;

        this.setupInputBindings(input);

        if (this.initialModel.includes("/"))
        {
            // no UI if a path is provided (e.g. in the vscode plugin)
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
                self.loadFromPath(self.pathProvider.resolve(self.initialModel)).then( (gltf) => this.startRendering(gltf) );
            });
        }

        this.render();
    }

    setCamera(eye = [0.0, 0.0, 0.05], target = [0.0, 0.0, 0.0], up = [0.0, 1.0, 0.0],
        type = "perspective",
        znear = 0.01, zfar = 10000.0,
        yfov = 45.0 * Math.PI / 180.0, aspectRatio = 16.0 / 9.0,
        xmag = 1.0, ymag = 1.0)
    {
        this.state.renderingParameters.cameraIndex = UserCameraIndex; // force use default camera

        this.state.userCamera.target = jsToGl(target);
        this.state.userCamera.up = jsToGl(up);
        this.state.userCamera.position = jsToGl(eye);
        this.state.userCamera.type = type;
        this.state.userCamera.znear = znear;
        this.state.userCamera.zfar = zfar;
        this.state.userCamera.yfov = yfov;
        this.state.userCamera.aspectRatio = aspectRatio;
        this.state.userCamera.xmag = xmag;
        this.state.userCamera.ymag = ymag;
    }

    setAnimation(animationIndex = 'all', play = false, timeInSec = undefined)
    {
        this.state.renderingParameters.animationIndex = animationIndex;
        if(timeInSec !== undefined)
        {
            this.state.renderingParameters.animationTimer.setFixedTime(timeInSec);
        }
        else if(play)
        {
            this.state.renderingParameters.animationTimer.start();
        }
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
            if (this.state.renderingParameters.userCameraActive())
            {
                this.state.userCamera.rotate(deltaX, deltaY);
            }
        };
        input.onPan = (deltaX, deltaY) =>
        {
            if (this.state.renderingParameters.userCameraActive())
            {
                this.state.userCamera.pan(deltaX, deltaY);
            }
        };
        input.onZoom = (delta) =>
        {
            if (this.state.renderingParameters.userCameraActive())
            {
                this.state.userCamera.zoomIn(delta);
            }
        };
        input.onResetCamera = () =>
        {
            if (this.state.renderingParameters.userCameraActive())
            {
                self.state.userCamera.reset(self.state.gltf , this.state.renderingParameters.sceneIndex);
            }
        };
        input.onDropFiles = (mainFile, additionalFiles) => {
            this.loadFromFileObject(mainFile, additionalFiles).then( (gltf) => {
                this.startRendering(gltf);
            });
        };
    }

    async loadFromFileObject(mainFile, additionalFiles)
    {
        this.lastDropped = { mainFile: mainFile, additionalFiles: additionalFiles };

        const gltfFile = mainFile.name;
        this.notifyLoadingStarted(gltfFile);

        const gltf = await loadGltfFromDrop(mainFile, additionalFiles);

        const environmentDesc = Environments[this.state.renderingParameters.environmentName];
        const environment = loadPrefilteredEnvironmentFromPath("assets/environments/" + environmentDesc.folder, gltf);

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
        this.notifyLoadingStarted(gltfFile);

        const gltf = await loadGltfFromPath(gltfFile).catch(function(error)
        {
            console.error(error.stack);
            self.hideSpinner();
        });

        const environmentDesc = Environments[this.state.renderingParameters.environmentName];
        const environment = loadPrefilteredEnvironmentFromPath("assets/environments/" + environmentDesc.folder, gltf);

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
        this.notifyLoadingEnded(gltf.path);
        if(this.gltfLoadedCallback !== undefined)
        {
            this.gltfLoadedCallback(gltf);
        }

        if (gltf.scenes.length === 0)
        {
            throw "No scenes in the gltf";
        }

        this.state.renderingParameters.cameraIndex = UserCameraIndex;
        this.state.renderingParameters.sceneIndex = gltf.scene ? gltf.scene : 0;
        this.state.renderingParameters.animationTimer.reset();
        this.state.renderingParameters.animationIndex = "all";

        if (this.gui !== undefined)
        {
            this.gui.update(gltf);
        }

        this.state.gltf = gltf;
        this.currentlyRendering = true;

        this.prepareSceneForRendering(gltf);
        this.state.userCamera.fitViewToScene(gltf, this.state.renderingParameters.sceneIndex);

        computePrimitiveCentroids(gltf);
    }

    render()
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
                self.prepareSceneForRendering(self.state.gltf);
                self.state.userCamera.fitCameraPlanesToScene(self.state.gltf, self.state.renderingParameters.sceneIndex);

                self.renderer.resize(self.canvas.clientWidth, self.canvas.clientHeight);
                self.renderer.newFrame();

                if (self.state.gltf .scenes.length !== 0)
                {
                    self.state.userCamera.updatePosition();

                    const scene = self.state.gltf .scenes[self.state.renderingParameters.sceneIndex];

                    // Check if scene contains transparent primitives.

                    const nodes = scene.gatherNodes(self.state.gltf);

                    const alphaModes = nodes
                        .filter(n => n.mesh !== undefined)
                        .reduce((acc, n) => acc.concat(self.state.gltf .meshes[n.mesh].primitives), [])
                        .map(p => self.state.gltf .materials[p.material].alphaMode);

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
                        self.renderer.drawScene(self.state.gltf , scene, false, primitive => self.state.gltf .materials[primitive.material].alphaMode !== "BLEND");

                        // Draw all transparent primitives. Depth sort is required.
                        self.renderer.drawScene(self.state.gltf , scene, true, primitive => self.state.gltf .materials[primitive.material].alphaMode === "BLEND");
                    }
                    else
                    {
                        // Simply draw all primitives.
                        self.renderer.drawScene(self.state.gltf , scene, false);
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
        const scene = gltf.scenes[this.state.renderingParameters.sceneIndex];

        this.animateNode(gltf);

        scene.applyTransformHierarchy(gltf);
    }

    animateNode(gltf)
    {
        if(gltf.animations !== undefined && !this.state.renderingParameters.animationTimer.paused)
        {
            const t = this.state.renderingParameters.animationTimer.elapsedSec();

            if(this.state.renderingParameters.animationIndex === "all")
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
                const anim = gltf.animations[this.state.renderingParameters.animationIndex];
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
            this.state.renderingParameters,
            this.stats);

        const self = this;
        gui.onModelChanged = () => self.loadFromPath(this.pathProvider.resolve(gui.selectedModel)).then( (gltf) => this.startRendering(gltf) );
        gui.onEnvironmentChanged = () =>
        {
            if (this.lastDropped === undefined)
            {
                self.loadFromPath(this.pathProvider.resolve(gui.selectedModel)).then( (gltf) => this.startRendering(gltf) );
            }
            else
            {
                self.loadFromFileObject(this.lastDropped.mainFile, this.lastDropped.additionalFiles);
            }
        };
        gui.initialize();
        this.gui = gui;
    }

    notifyLoadingStarted(path)
    {
        this.loadingTimer.start();
        console.log("Loading '" + path + "' with environment '" + this.state.renderingParameters.environmentName + "'");
        this.showSpinner();
    }

    notifyLoadingEnded(path)
    {
        this.loadingTimer.stop();
        console.log("Loading '" + path + "' took " + this.loadingTimer.seconds + " seconds");
        this.hideSpinner();
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
