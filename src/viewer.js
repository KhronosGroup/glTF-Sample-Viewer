import { mat4, vec3 } from 'gl-matrix';
import axios from '../libs/axios.min.js';
import { glTF } from './gltf.js';
import { gltfLoader } from './loader.js';
import { gltfModelPathProvider } from './model_path_provider.js';
import { gltfRenderer } from './renderer.js';
import { gltfRenderingParameters, Environments, UserCameraIndex } from './rendering_parameters.js';
import { gltfUserInterface } from './user_interface.js';
import { UserCamera } from './user_camera.js';
import { jsToGl, getIsGlb, Timer, getContainingFolder } from './utils.js';
import { GlbParser } from './glb_parser.js';
import { gltfEnvironmentLoader } from './environment.js';
import { getScaleFactor } from './gltf_utils.js';
import { gltfSkin } from './skin.js';

class gltfViewer
{
    constructor(
        canvas,
        modelIndex,
        input,
        headless = false,
        onRendererReady = undefined,
        basePath = "",
        initialModel = "",
        environmentMap = undefined)
    {
        this.headless = headless;
        this.onRendererReady = onRendererReady;
        this.basePath = basePath;
        this.initialModel = initialModel;

        this.lastMouseX = 0.00;
        this.lastMouseY = 0.00;
        this.mouseDown = false;

        this.lastTouchX = 0.00;
        this.lastTouchY = 0.00;
        this.touchDown = false;

        this.canvas = canvas;
        this.canvas.style.cursor = "grab";

        this.loadingTimer = new Timer();
        this.gltf = undefined;

        this.renderingParameters = new gltfRenderingParameters(environmentMap);
        this.userCamera = new UserCamera();
        this.currentlyRendering = false;
        this.renderer = new gltfRenderer(canvas, this.userCamera, this.renderingParameters, this.basePath);

        if (this.headless === true)
        {
            this.hideSpinner();
        }
        else
        {
            this.setupInputBindings(input);

            if (this.initialModel.includes("/"))
            {
                // no UI if a path is provided (e.g. in the vscode plugin)
                this.loadFromPath(this.initialModel);
            }
            else
            {
                const self = this;
                this.stats = new Stats();
                this.pathProvider = new gltfModelPathProvider(this.basePath + modelIndex);
                this.pathProvider.initialize().then(() =>
                {
                    self.initializeGui();
                    self.loadFromPath(self.pathProvider.resolve(self.initialModel));
                });
            }
        }

        this.render(); // Starts a rendering loop.
    }

    setCamera(eye = [0.0, 0.0, 0.05], target = [0.0, 0.0, 0.0], up = [0.0, 1.0, 0.0],
        type = "perspective",
        znear = 0.01, zfar = 10000.0,
        yfov = 45.0 * Math.PI / 180.0, aspectRatio = 16.0 / 9.0,
        xmag = 1.0, ymag = 1.0)
    {
        this.renderingParameters.cameraIndex = UserCameraIndex; // force use default camera

        this.userCamera.target = jsToGl(target);
        this.userCamera.up = jsToGl(up);
        this.userCamera.position = jsToGl(eye);
        this.userCamera.type = type;
        this.userCamera.znear = znear;
        this.userCamera.zfar = zfar;
        this.userCamera.yfov = yfov;
        this.userCamera.aspectRatio = aspectRatio;
        this.userCamera.xmag = xmag;
        this.userCamera.ymag = ymag;
    }

    setupInputBindings(input)
    {
        const self = this;
        input.onRotate = (deltaX, deltaY) =>
        {
            if (this.renderingParameters.userCameraActive())
            {
                this.userCamera.rotate(deltaX, deltaY);
            }
        };
        input.onPan = (deltaX, deltaY) =>
        {
            if (this.renderingParameters.userCameraActive())
            {
                this.userCamera.pan(deltaX, deltaY);
            }
        };
        input.onZoom = (delta) =>
        {
            if (this.renderingParameters.userCameraActive())
            {
                this.userCamera.zoomIn(delta);
            }
        };
        input.onResetCamera = () =>
        {
            if (this.renderingParameters.userCameraActive())
            {
                self.userCamera.reset(self.gltf, self.renderingParameters.sceneIndex);
            }
        };
        input.onDropFiles = this.loadFromFileObject.bind(this);
    }

    loadFromFileObject(mainFile, additionalFiles)
    {
        const gltfFile = mainFile.name;
        this.notifyLoadingStarted(gltfFile);

        const reader = new FileReader();
        const self = this;
        if (getIsGlb(gltfFile))
        {
            reader.onloadend = function(event)
            {
                const data = event.target.result;
                const glbParser = new GlbParser(data);
                const glb = glbParser.extractGlbData();
                self.createGltf(gltfFile, glb.json, glb.buffers);
            };
            reader.readAsArrayBuffer(mainFile);
        }
        else
        {
            reader.onloadend = function(event)
            {
                const data = event.target.result;
                const json = JSON.parse(data);
                self.createGltf(gltfFile, json, additionalFiles);
            };
            reader.readAsText(mainFile);
        }
    }

    loadFromPath(gltfFile, basePath = "")
    {
        gltfFile = basePath + gltfFile;
        this.notifyLoadingStarted(gltfFile);

        const isGlb = getIsGlb(gltfFile);

        const self = this;
        return axios.get(gltfFile, { responseType: isGlb ? "arraybuffer" : "json" }).then(function(response)
        {
            let json = response.data;
            let buffers = undefined;
            if (isGlb)
            {
                const glbParser = new GlbParser(response.data);
                const glb = glbParser.extractGlbData();
                json = glb.json;
                buffers = glb.buffers;
            }
            return self.createGltf(gltfFile, json, buffers);
        }).catch(function(error)
        {
            console.error("glTF " + error);
            if (!self.headless) self.hideSpinner();
        });
    }

    createGltf(path, json, buffers)
    {
        this.currentlyRendering = false;

        // unload previous scene
        if (this.gltf !== undefined)
        {
            gltfLoader.unload(this.gltf);
            this.gltf = undefined;
        }

        const gltf = new glTF(path);
        gltf.fromJson(json);

        this.injectEnvironment(gltf);

        const self = this;
        return gltfLoader.load(gltf, buffers)
            .then(() => self.startRendering(gltf));
    }

    injectEnvironment(gltf)
    {
        // this is hacky, because we inject stuff into the gltf

        // because the environment loader adds images with paths that are not relative
        // to the gltf, we have to resolve all image paths before that
        for (const image of gltf.images)
        {
            image.resolveRelativePath(getContainingFolder(gltf.path));
        }

        const environment = Environments[this.renderingParameters.environmentName];
        new gltfEnvironmentLoader(this.basePath).addEnvironmentMap(gltf, environment);
    }

    startRendering(gltf)
    {
        this.notifyLoadingEnded(gltf.path);

        if (gltf.scenes.length === 0)
        {
            throw "No scenes in the gltf";
        }

        this.renderingParameters.cameraIndex = UserCameraIndex;
        this.renderingParameters.sceneIndex = gltf.scene ? gltf.scene : 0;

        if (this.gui !== undefined)
        {
            this.gui.update(gltf);
        }

        this.gltf = gltf;
        this.currentlyRendering = true;

        this.prepareSceneForRendering(gltf);
        this.userCamera.fitViewToScene(gltf, this.renderingParameters.sceneIndex);
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
                self.prepareSceneForRendering(self.gltf);

                self.renderer.resize(self.canvas.clientWidth, self.canvas.clientHeight);
                self.renderer.newFrame();

                if (self.gltf.scenes.length !== 0)
                {
                    if (self.headless === false)
                    {
                        self.userCamera.updatePosition();
                    }

                    const scene = self.gltf.scenes[self.renderingParameters.sceneIndex];

                    // if transformations happen at runtime, we need to apply the transform hierarchy here
                    // scene.applyTransformHierarchy(gltf);

                    let alphaScene = scene.getSceneWithAlphaMode(self.gltf, 'BLEND'); // get non opaque
                    if (alphaScene.nodes.length > 0)
                    {
                        // first render opaque objects, oder is not important but could improve performance 'early z rejection'
                        let opaqueScene = scene.getSceneWithAlphaMode(self.gltf, 'BLEND', true);
                        self.renderer.drawScene(self.gltf, opaqueScene, false);

                        // render transparent objects ordered by distance from camera
                        self.renderer.drawScene(self.gltf, alphaScene, true);
                    }
                    else
                    {
                        // no alpha materials, render as is
                        self.renderer.drawScene(self.gltf, scene, false);
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

        // const transform = mat4.create();
        // if (this.renderingParameters.userCameraActive())
        // {
        //     const scaleFactor = getScaleFactor(gltf, this.renderingParameters.sceneIndex);
        //     mat4.scale(transform, transform, vec3.fromValues(scaleFactor, scaleFactor, scaleFactor));
        // }

        // scene.applyTransformHierarchy(gltf, transform);

        this.animateSkin(gltf);
    }

    animateNode(gltf)
    {
        if(gltf.animations !== undefined && !this.renderingParameters.animationTimer.paused)
        {
            const t = this.renderingParameters.animationTimer.elapsed();
            for(const anim of gltf.animations)
            {
                anim.advance(gltf, t);
            }
        }
    }

    animateSkin(gltf)
    {
        if(gltf.skins !== undefined && !this.renderingParameters.animationTimer.paused)
        {
            for(const skin of gltf.skins)
            {
                skin.computeJoints(gltf);
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
        gui.onModelSelected = (model) => self.loadFromPath(this.pathProvider.resolve(model));
        gui.initialize();
        this.gui = gui;
    }

    notifyLoadingStarted(path)
    {
        this.loadingTimer.start();
        console.log("Loading '" + path + "' with environment '" + this.renderingParameters.environmentName + "'");

        if (!this.headless)
        {
            this.showSpinner();
        }
    }

    notifyLoadingEnded(path)
    {
        this.loadingTimer.stop();
        console.log("Loading '" + path + "' took " + this.loadingTimer.seconds + " seconds");

        if (!this.headless)
        {
            this.hideSpinner();
        }
    }

    showSpinner()
    {
        let spinner = document.getElementById("gltf-rv-model-spinner");
        if (spinner !== undefined)
        {
            spinner.style.display = "block";
        }
    }

    hideSpinner()
    {
        let spinner = document.getElementById("gltf-rv-model-spinner");
        if (spinner !== undefined)
        {
            spinner.style.display = "none";
        }
    }
}

export { gltfViewer };
