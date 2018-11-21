class gltfViewer
{
    constructor(canvas, modelIndex, headless = false, onRendererReady = undefined)
    {
        this.canvas = canvas;
        this.headless = headless;
        this.onRendererReady = onRendererReady;

        this.defaultModel = "BoomBox/glTF/BoomBox.gltf";

        this.lastMouseX = 0.00;
        this.lastMouseY = 0.00;
        this.mouseDown = false;

        this.lastTouchX = 0.00;
        this.lastTouchY = 0.00;
        this.touchDown = false;

        canvas.style.cursor = "grab";

        this.gltf = undefined;

        this.models = [];

        this.sceneIndex  =  0;
        this.cameraIndex = -1;

        let self = this;

        this.guiParameters = {
            model: "",
            nextScene: function() { self.sceneIndex++; },
            prevScene: function() { self.sceneIndex--; }
        };

        this.renderingParameters = new gltfRenderingParameters();

        if (this.headless == false)
        {
            this.initUserInterface(modelIndex);
        }
        else
        {
            this.hideSpinner();
        }

        this.userCamera = new UserCamera();

        this.currentlyRendering = false;
        this.renderer = new gltfRenderer(canvas, this.userCamera, this.renderingParameters);

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
        if (!this.headless) this.showSpinner();

        gltfFile = basePath + gltfFile;
        const isGlb = getIsGlb(gltfFile);

        const self = this;
        axios.get(gltfFile, { responseType: isGlb  ? "arraybuffer" : "json" }).then(function(response)
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
        console.log("Loading '%s'", path);

        let gltf = new glTF(path);
        gltf.fromJson(json);
        this.addEnvironmentMap(gltf);
        let assetPromises = gltfLoader.load(gltf, buffers);

        let self = this;
        Promise.all(assetPromises).then(function()
        {
            self.onGltfLoaded(gltf);
        });
    }

    onGltfLoaded(gltf)
    {
        // Finished load all of the glTF assets
        if (!this.headless) this.hideSpinner();

        if (gltf.scenes.length === 0)
        {
            throw "No scenes in the gltf";
        }

        this.currentlyRendering = false;

        // unload previous scene
        if (this.gltf !== undefined)
        {
            gltfLoader.unload(this.gltf);
            this.gltf = undefined;
        }

        this.sceneIndex = gltf.scene === undefined ? 0 : gltf.scene;
        const scene = gltf.scenes[this.sceneIndex];
        scene.applyTransformHierarchy(gltf);
        this.userCamera.fitViewToAsset(gltf);

        this.gltf = gltf;
        this.currentlyRendering = true;
    }

    render()
    {
        let self = this;
        function renderFrame(elapsedTime)
        {
            if (!self.headless)
            {
                self.stats.begin();
            }

            if (self.currentlyRendering)
            {
                self.renderer.newFrame();

                self.renderer.resize(canvas.clientWidth, canvas.clientHeight);

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
                    if(self.headless == false)
                    {
                        self.userCamera.updatePosition();
                    }

                    const scene = self.gltf.scenes[self.sceneIndex];
                    scene.applyTransformHierarchy(self.gltf)

                    let alphaScene = scene.getSceneWithAlphaMode(self.gltf, 'BLEND'); // get non opaque
                    if(alphaScene.nodes.length > 0)
                    {
                        // first render opaque objects, oder is not important but could improve performance 'early z rejection'
                        let opaqueScene = scene.getSceneWithAlphaMode(self.gltf, 'BLEND', true);
                        self.renderer.drawScene(self.gltf, opaqueScene, self.cameraIndex, true);

                        // render transparent objects ordered by distance from camera
                        self.renderer.drawScene(self.gltf, alphaScene, self.cameraIndex, true, true);
                    }
                    else
                    {
                        // no alpha materials, render as is
                        self.renderer.drawScene(self.gltf, scene, self.cameraIndex, true);
                    }
                }

                if (self.onRendererReady)
                {
                    self.onRendererReady();
                }
            }

            if (!self.headless)
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
        this.mouseDown = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
        canvas.style.cursor = "none";
    }

    onMouseUp(event)
    {
        this.mouseDown = false;
        canvas.style.cursor = "grab";
    }

    onMouseWheel(event)
    {
        event.preventDefault();
        this.userCamera.zoomIn(event.deltaY);
        canvas.style.cursor = "none";
    }

    onMouseMove(event)
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

    onTouchStart(event)
    {
        this.touchDown = true;
        this.lastTouchX = event.touches[0].clientX;
        this.lastTouchY = event.touches[0].clientY;
    }

    onTouchEnd(event)
    {
        this.touchStart = false;
    }

    onTouchMove(event)
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

    // for some reason, the drop event does not work without this
    dragOverHandler(event)
    {
        event.preventDefault();
    }

    dropEventHandler(event)
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

    initUserInterface(modelIndex)
    {
        this.gui = new dat.GUI({ width: 300 });

        // Find out the root path of the models that are going to be loaded.
        let path = modelIndex.substring(0, modelIndex.lastIndexOf("/") + 1);
        let viewerFolder = this.gui.addFolder("GLTF Viewer");
        let self = this;

        function initModelsDropdown(basePath)
        {
            if (self.models.includes(self.defaultModel))
            {
                self.guiParameters.model = self.defaultModel;
            }
            else
            {
                self.guiParameters.model = self.models[0];
            }

            viewerFolder.add(self.guiParameters, "model", self.models).onChange(function(model) {
                self.loadFromPath(model, basePath)
            }).name("Model");

            self.loadFromPath(self.guiParameters.model, basePath);

            let sceneFolder = viewerFolder.addFolder("Scene Index");
            sceneFolder.add(self.guiParameters, "prevScene").name("←");
            sceneFolder.add(self.guiParameters, "nextScene").name("→");

            viewerFolder.open();
        };

        axios.get(modelIndex).then(function(response)
        {
            let jsonIndex = response.data;

            if (jsonIndex === undefined)
            {
                // TODO: remove this later, fallback if no submodule :-)
                self.models = self.parseModelIndex(jsonIndex, "models/");
                initModelsDropdown("models/");
            }
            else
            {
                self.models = self.parseModelIndex(jsonIndex, path);
                initModelsDropdown(path);
            }

        }).catch(function(error) {
            console.warn("glTF: failed to load model-index from assets!");
            axios.get("models/model-index.json").then(function(response) {
                let jsonIndex = response.data;
                // TODO: remove this later, fallback if no submodule :-)
                self.models = self.parseModelIndex(jsonIndex, "models/");
                initModelsDropdown("models/");
            }).catch(function(error) {
                console.warn("Failed to load model-index fallback too!");
            });
        });

        let environmentFolder = this.gui.addFolder("Lighting");
        environmentFolder.add(this.renderingParameters, "useIBL").name("Image-Based Lighting");
        environmentFolder.add(this.renderingParameters, "usePunctual").name("Punctual Lighting");

        // TODO: add stuff like tonemapping algorithm.

        let performanceFolder = this.gui.addFolder("Performance");

        this.stats = new Stats();

        this.stats.domElement.height = "48px";
        [].forEach.call(this.stats.domElement.children, (child) => (child.style.display = ''));
        this.stats.domElement.style.position = "static";

        let statsList = document.createElement("li");
        statsList.appendChild(this.stats.domElement);
        statsList.classList.add("gui-stats");

        performanceFolder.__ul.appendChild(statsList);
    }

    parseModelIndex(jsonIndex, path = "")
    {
        let models = [];

        let ignoreVariants = ["glTF-Draco", "glTF-Embedded"];

        for(let entry of jsonIndex)
        {
            if(entry.variants !== undefined)
            {
                for(let variant of Object.keys(entry.variants))
                {
                    if (!ignoreVariants.includes(variant))
                    {
                        const gltf = entry.variants[variant];
                        models.push(entry.name + '/' + variant + '/' + gltf);
                    }
                }
            }
        }

        return models;
    }

    addEnvironmentMap(gltf, subFolder = "papermill", type = ImagaType_Jpeg)
    {
        let extension;
        switch(type)
        {
            case(ImagaType_Jpeg):
                extension = ".jpg";
                break;
            case(ImageType_Hdr):
                extension = ".hdr";
                break;
            default:
                console.error("Unknown image type: " + type);
                return;
        }

        const imagesFolder = "assets/images/" + subFolder + "/";
        const diffusePrefix = imagesFolder + "diffuse/diffuse_";
        const diffuseSuffix = "_0" + extension;
        const specularPrefix = imagesFolder + "specular/specular_";
        const specularSuffix = "_";
        const sides =
        [
            [ "back", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z ],
            [ "bottom", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y ],
            [ "front", gl.TEXTURE_CUBE_MAP_POSITIVE_Z ],
            [ "left", gl.TEXTURE_CUBE_MAP_NEGATIVE_X ],
            [ "right", gl.TEXTURE_CUBE_MAP_POSITIVE_X ],
            [ "top", gl.TEXTURE_CUBE_MAP_POSITIVE_Y ]
        ];

        gltf.samplers.push(new gltfSampler(gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR,  gl.CLAMP_TO_EDGE,  gl.CLAMP_TO_EDGE, "CubeMapSampler"));
        const cubeSamplerIdx = gltf.samplers.length - 1;

        gltf.samplers.push(new gltfSampler(gl.LINEAR, gl.LINEAR,  gl.CLAMP_TO_EDGE,  gl.CLAMP_TO_EDGE, "LUTSampler"));
        const lutSamplerIdx = gltf.samplers.length - 1;

        let imageIdx = gltf.images.length;

        let indices = [];

        function addSide(basePath, side)
        {
            for(let i = 0; i < 10; ++i)
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
        gltf.textures.push(new gltfTexture(cubeSamplerIdx, [imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx], gl.TEXTURE_CUBE_MAP));

        // u_SpecularEnvSampler tex
        for (const side of sides)
        {
            addSide(specularPrefix + side[0] + specularSuffix, side[1]);
        }

        gltf.textures.push(new gltfTexture(cubeSamplerIdx, indices, gl.TEXTURE_CUBE_MAP));

        gltf.images.push(new gltfImage("assets/images/brdfLUT.png", gl.TEXTURE_2D));

        // u_brdfLUT tex
        gltf.textures.push(new gltfTexture(lutSamplerIdx, [++imageIdx], gl.TEXTURE_2D));
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
