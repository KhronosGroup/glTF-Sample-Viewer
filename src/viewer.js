class gltfViewer
{
    constructor(
        canvas,
        modelIndex,
        headless = false,
        onRendererReady = undefined,
        basePath = "",
        initialModel = "",
        environmentMap = "papermill")
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

        canvas.style.cursor = "grab";

        this.loadingTimer = new Timer();
        this.gltf = undefined;

        this.sceneIndex = 0;
        this.cameraIndex = -1;

        this.renderingParameters = new gltfRenderingParameters(environmentMap);

        if (this.headless === true)
        {
            this.hideSpinner();
        }
        else if (this.initialModel.includes("/"))
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

        this.userCamera = new UserCamera();

        this.currentlyRendering = false;
        this.renderer = new gltfRenderer(canvas, this.userCamera, this.renderingParameters, this.basePath);

        this.render(); // Starts a rendering loop.
    }

    setCamera(eye = [0.0, 0.0, 0.05], target = [0.0, 0.0, 0.0], up = [0.0, 1.0, 0.0],
        type = "perspective",
        znear = 0.01, zfar = 10000.0,
        yfov = 45.0 * Math.PI / 180.0, aspectRatio = 16.0 / 9.0,
        xmag = 1.0, ymag = 1.0)
    {
        this.cameraIndex = -1; // force use default camera

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
        axios.get(gltfFile, { responseType: isGlb ? "arraybuffer" : "json" }).then(function(response)
        {
            let json = response.data;
            let buffers = undefined
            if (isGlb)
            {
                const glbParser = new GlbParser(response.data);
                const glb = glbParser.extractGlbData();
                json = glb.json;
                buffers = glb.buffers;
            }
            self.createGltf(gltfFile, json, buffers);
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

        this.renderingParameters.updateEnvironment(this.renderingParameters.environment);

        let gltf = new glTF(path);
        gltf.fromJson(json);
        const environmentType = this.renderingParameters.useHdr ? ImageType_Hdr : ImageType_Jpeg;
        this.addEnvironmentMap(gltf, this.renderingParameters.environment, this.renderingParameters.environmentMipLevel, environmentType);
        let assetPromises = gltfLoader.load(gltf, buffers);

        let self = this;
        Promise.all(assetPromises)
            .then(() => self.onResize(gltf))
            .then(() => self.onGltfLoaded(gltf));
    }

    isPowerOf2(n)
    {
        return n && (n & (n - 1)) === 0;
    }

    onResize(gltf)
    {
        const imagePromises = [];
        if (gltf.images !== undefined)
        {
            let i;
            for (i = 0; i < gltf.images.length; i++)
            {
                if (gltf.images[i].image.dataRGBE !== undefined ||
                    this.isPowerOf2(gltf.images[i].image.width) && (gltf.images[i].image.width === gltf.images[i].image.height))
                {
                    // Square image and power of two, so no resize needed.
                    continue;
                }
                
                let doPower = false;

                if (gltf.images[i].image.width == gltf.images[i].image.height)
                {
                    // Square image but not power of two. Resize it to power of two.
                    doPower = true;
                }
                else 
                {
                    // Rectangle image, so not mip-mapped and ...
                    
                    if ((gltf.images[i].image.width % 2 == 0) && (gltf.images[i].image.height % 2 == 0))
                    {
                        // ... with even size, so no resize needed.
                        continue;
                    }
                    
                    // ... with odd size, so resize needed to make even size.
                }
                
                const currentImagePromise = new Promise(function(resolve)
                {
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');

                    function nearestPowerOf2(n)
                    {
                        return Math.pow(2.0, Math.round(Math.log(n) / Math.log(2.0)));
                    }

                    function makeEven(n)
                    {
                        if (n % 2 === 1)
                        {
                            return n + 1;
                        }
                        return n;
                    }
                    
                    if (doPower)
                    {
                        canvas.width = nearestPowerOf2(gltf.images[i].image.width);
                        canvas.height = nearestPowerOf2(gltf.images[i].image.height);
                    }
                    else
                    {
                        canvas.width = makeEven(gltf.images[i].image.width);
                        canvas.height = makeEven(gltf.images[i].image.height);
                    }

                    context.drawImage(gltf.images[i].image, 0, 0, canvas.width, canvas.height);

                    gltf.images[i].image.src = canvas.toDataURL("image/png");

                    resolve();
                });

                imagePromises.push(currentImagePromise);
            }
        }

        return Promise.all(imagePromises);
    }

    onGltfLoaded(gltf)
    {
        this.notifyLoadingEnded(gltf.path);

        if (gltf.scenes.length === 0)
        {
            throw "No scenes in the gltf";
        }

        this.sceneIndex = gltf.scene === undefined ? 0 : gltf.scene;
        const scene = gltf.scenes[this.sceneIndex];
        scene.applyTransformHierarchy(gltf);
        this.scaleFactor = this.userCamera.fitViewToAsset(gltf);

        this.gltf = gltf;
        this.currentlyRendering = true;
    }

    render()
    {
        let self = this;
        function renderFrame(elapsedTime)
        {
            if (self.stats !== undefined)
            {
                self.stats.begin();
            }

            if (self.currentlyRendering)
            {
                self.renderer.resize(canvas.clientWidth, canvas.clientHeight);
                self.renderer.newFrame();

                if (self.sceneIndex < 0)
                {
                    self.sceneIndex = 0;
                }
                else if (self.sceneIndex >= self.gltf.scenes.length)
                {
                    self.sceneIndex = self.gltf.scenes.length - 1;
                }

                if (self.gltf.scenes.length !== 0)
                {
                    if (self.headless == false)
                    {
                        self.userCamera.updatePosition();
                    }

                    const scene = self.gltf.scenes[self.sceneIndex];

                    // if transformations happen at runtime, we need to apply the transform hierarchy here
                    // scene.applyTransformHierarchy(gltf);

                    let alphaScene = scene.getSceneWithAlphaMode(self.gltf, 'BLEND'); // get non opaque
                    if (alphaScene.nodes.length > 0)
                    {
                        // first render opaque objects, oder is not important but could improve performance 'early z rejection'
                        let opaqueScene = scene.getSceneWithAlphaMode(self.gltf, 'BLEND', true);
                        self.renderer.drawScene(self.gltf, opaqueScene, self.cameraIndex, false, self.scaleFactor);

                        // render transparent objects ordered by distance from camera
                        self.renderer.drawScene(self.gltf, alphaScene, self.cameraIndex, true, self.scaleFactor);
                    }
                    else
                    {
                        // no alpha materials, render as is
                        self.renderer.drawScene(self.gltf, scene, self.cameraIndex, false, self.scaleFactor);
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

    onMouseDown(event)
    {
        if (this.currentlyRendering)
        {
            this.mouseDown = true;
            this.lastMouseX = event.clientX;
            this.lastMouseY = event.clientY;
            canvas.style.cursor = "none";
        }
    }

    onMouseUp(event)
    {
        if (this.currentlyRendering)
        {
            this.mouseDown = false;
            canvas.style.cursor = "grab";
        }
    }

    onMouseWheel(event)
    {
        if (this.currentlyRendering)
        {
            event.preventDefault();
            this.userCamera.zoomIn(event.deltaY);
            canvas.style.cursor = "none";
        }
    }

    onMouseMove(event)
    {
        if (this.currentlyRendering)
        {
            if (!this.mouseDown)
            {
                canvas.style.cursor = "grab";
                return;
            }

            const newX = event.clientX;
            const newY = event.clientY;

            const deltaX = newX - this.lastMouseX;
            const deltaY = newY - this.lastMouseY;

            this.lastMouseX = newX;
            this.lastMouseY = newY;

            this.userCamera.rotate(deltaX, deltaY);
        }
    }

    onTouchStart(event)
    {
        if (this.currentlyRendering)
        {
            this.touchDown = true;
            this.lastTouchX = event.touches[0].clientX;
            this.lastTouchY = event.touches[0].clientY;
        }
    }

    onTouchEnd(event)
    {
        if (this.currentlyRendering)
        {
            this.touchStart = false;
        }
    }

    onTouchMove(event)
    {
        if (this.currentlyRendering)
        {
            if (!touchDown)
            {
                return;
            }

            const newX = event.touches[0].clientX;
            const newY = event.touches[0].clientY;

            const deltaX = newX - this.lastTouchX;
            const deltaY = newY - this.lastTouchY;

            this.lastTouchX = newX;
            this.lastTouchY = newY;

            this.userCamera.rotate(deltaX, deltaY);
        }
    }

    // for some reason, the drop event does not work without this
    dragOverHandler(event)
    {
        if (this.currentlyRendering)
        {
            event.preventDefault();
        }
    }

    dropEventHandler(event)
    {
        if (this.currentlyRendering)
        {
            event.preventDefault();

            let additionalFiles = [];
            let mainFile;
            for (const file of event.dataTransfer.files)
            {
                if (getIsGltf(file.name) || getIsGlb(file.name))
                {
                    mainFile = file;
                }
                else
                {
                    additionalFiles.push(file);
                }
            }

            if (mainFile === undefined)
            {
                console.warn("No gltf/glb file found. Provided files: " + additionalFiles.map(f => f.name).join(", "));
                return;
            }

            this.loadFromFileObject(mainFile, additionalFiles);
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
        gui.onNextSceneSelected = () => self.sceneIndex++;
        gui.onPreviousSceneSelected = () => self.sceneIndex--;

        gui.initialize();
    }

    parseModelIndex(jsonIndex)
    {
        const modelDictionary = {};

        let ignoreVariants = ["glTF-Draco", "glTF-Embedded"];

        for (let entry of jsonIndex)
        {
            if (entry.variants !== undefined)
            {
                for (let variant of Object.keys(entry.variants))
                {
                    if (!ignoreVariants.includes(variant))
                    {
                        const path = entry.name + '/' + variant + '/' + entry.variants[variant];
                        const fileName = getFileNameWithoutExtension(path);
                        let identifier = fileName;
                        if (variant !== "glTF")
                        {
                            identifier += " (" + variant.replace('glTF-', '') + ")";
                        }
                        modelDictionary[identifier] = path;
                    }
                }
            }
        }

        return modelDictionary;
    }

    addEnvironmentMap(gltf, subFolder = "papermill", mipLevel = 9, type = ImageType_Jpeg)
    {
        let extension;
        switch (type)
        {
            case (ImageType_Jpeg):
                extension = ".jpg";
                break;
            case (ImageType_Hdr):
                extension = ".hdr";
                break;
            default:
                console.error("Unknown image type: " + type);
                return;
        }

        const imagesFolder = this.basePath + "assets/images/" + subFolder + "/";
        const diffusePrefix = imagesFolder + "diffuse/diffuse_";
        const diffuseSuffix = "_0" + extension;
        const specularPrefix = imagesFolder + "specular/specular_";
        const specularSuffix = "_";
        const sides =
            [
                ["right", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
                ["left", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
                ["top", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
                ["bottom", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
                ["front", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
                ["back", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]
            ];

        gltf.samplers.push(new gltfSampler(gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, "DiffuseCubeMapSampler"));
        const diffuseCubeSamplerIdx = gltf.samplers.length - 1;

        gltf.samplers.push(new gltfSampler(gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, "SpecularCubeMapSampler"));
        const specularCubeSamplerIdx = gltf.samplers.length - 1;

        gltf.samplers.push(new gltfSampler(gl.LINEAR, gl.LINEAR, gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE, "LUTSampler"));
        const lutSamplerIdx = gltf.samplers.length - 1;

        let imageIdx = gltf.images.length;

        let indices = [];

        function addSide(basePath, side, mipLevel)
        {
            let stop = false;
            let i = 0;
            for (i = 0; i <= mipLevel; i++)
            {
                const imagePath = basePath + i + extension;
                const image = new gltfImage(imagePath, side, i);
                image.mimeType = type;
                gltf.images.push(image);
                indices.push(++imageIdx);
            }
        };

        // u_DiffuseEnvSampler faces
        for (const side of sides)
        {
            const imagePath = diffusePrefix + side[0] + diffuseSuffix;
            const image = new gltfImage(imagePath, side[1]);
            image.mimeType = type;
            gltf.images.push(image);
        }

        // u_DiffuseEnvSampler tex
        gltf.textures.push(new gltfTexture(diffuseCubeSamplerIdx, [imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx], gl.TEXTURE_CUBE_MAP));

        // u_SpecularEnvSampler tex
        for (const side of sides)
        {
            addSide(specularPrefix + side[0] + specularSuffix, side[1], mipLevel);
        }

        gltf.textures.push(new gltfTexture(specularCubeSamplerIdx, indices, gl.TEXTURE_CUBE_MAP));

        gltf.images.push(new gltfImage(this.basePath + "assets/images/brdfLUT.png", gl.TEXTURE_2D));

        // u_brdfLUT tex
        gltf.textures.push(new gltfTexture(lutSamplerIdx, [++imageIdx], gl.TEXTURE_2D));
    }

    notifyLoadingStarted(path)
    {
        this.loadingTimer.start();
        console.log("Loading '%s' with environment '%s'", path, this.renderingParameters.environment);

        if (!this.headless)
        {
            this.showSpinner();
        }
    }

    notifyLoadingEnded(path)
    {
        this.loadingTimer.stop();
        console.log("Loading '%s' took %f seconds", path, this.loadingTimer.seconds);

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
