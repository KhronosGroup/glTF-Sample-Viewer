class gltfViewer
{
    constructor(canvas, modelIndex, headless = false, onRendererReady = undefined)
    {
        this.canvas = canvas;
        this.headless = headless;
        this.onRendererReady = onRendererReady;

        this.roll  = 0.0;
        this.pitch = 0.0;
        this.zoom  = 0.048;
        this.scale = 180;

        this.defaultModel = "BoomBox/glTF/BoomBox.gltf";

        this.lastMouseX = 0.00;
        this.lastMouseY = 0.00;
        this.wheelSpeed = 1.04;
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

        this.parameters = {
            model: "",

            useIBL: true,

            nextScene: function() { self.sceneIndex++; },
            prevScene: function() { self.sceneIndex--; }
        };

        if (this.headless == false)
        {
            this.initUserInterface(modelIndex);
        }
        else
        {
            this.hideSpinner();
        }

        this.currentlyRendering = false;
        this.renderer = new gltfRenderer(canvas, this);

        this.render(); // Starts a rendering loop.
    }

    load(gltfFile, basePath = "")
    {
        // Started loading the glTF 2.0 models.
        if (!this.headless) this.showSpinner();

        let self = this;

        gltfFile = basePath + gltfFile;
        axios.get(gltfFile).then(function(response) {
            let incompleteGltf = new glTF(gltfFile);
            incompleteGltf.fromJson(response.data);

            self.addEnvironmentMap(incompleteGltf);

            let assetPromises = gltfLoader.load(incompleteGltf);

            Promise.all(assetPromises).then(function() {
                self.currentlyRendering = false;

                if (self.gltf !== undefined)
                {
                    gltfLoader.unload(self.gltf);
                    self.gltf = undefined;
                }

                if (incompleteGltf.scene !== undefined)
                {
                    self.sceneIndex = incompleteGltf.scene;
                }
                else if (incompleteGltf.scenes.length != 0)
                {
                    self.sceneIndex = 0;
                }
                else
                {
                    throw "couldn't find any valid scene!";
                }

                self.gltf = incompleteGltf;

                // Finished load all of the glTF assets
                if (!self.headless) self.hideSpinner();

                self.currentlyRendering = true;
            });
        }).catch(function(error) {
            console.warn("glTF " + error);
            if (!self.headless) self.hideSpinner();
        });
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

    getCameraPosition()
    {
        let cameraPos = [-this.zoom * Math.sin(this.roll) * Math.cos(-this.pitch),
                         -this.zoom * Math.sin(-this.pitch),
                          this.zoom * Math.cos(this.roll) * Math.cos(-this.pitch)];
        return jsToGl(cameraPos);
    }

    getViewTransform()
    {
        let xRotation = mat4.create();
        mat4.rotateY(xRotation, xRotation, this.roll);

        let yRotation = mat4.create();
        mat4.rotateX(yRotation, yRotation, this.pitch);

        let viewMatrix = mat4.create();
        mat4.multiply(viewMatrix, yRotation, xRotation);
        viewMatrix[14] = -this.zoom;

        return viewMatrix;
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
        if (event.deltaY > 0)
        {
            this.zoom *= this.wheelSpeed;
        }
        else
        {
            this.zoom /= this.wheelSpeed;
        }

        canvas.style.cursor = "none";
    }

    onMouseMove(event)
    {
        if (!this.mouseDown)
        {
            canvas.style.cursor = "grab";
            return;
        }

        let newX = event.clientX;
        let newY = event.clientY;

        let deltaX = newX - this.lastMouseX;
        this.roll += (deltaX / this.scale);

        let deltaY = newY - this.lastMouseY;
        this.pitch += (deltaY / this.scale);

        this.clampPitch();

        this.lastMouseX = newX;
        this.lastMouseY = newY;
    }

    clampPitch()
    {
        if (this.pitch >= Math.PI / 2.0)
        {
            this.pitch = +Math.PI / 2.0;
        }
        else if (this.pitch <= -Math.PI / 2.0)
        {
            this.pitch = -Math.PI / 2.0;
        }
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

        let newX = event.touches[0].clientX;
        let newY = event.touches[0].clientY;

        let deltaX = newX - this.lastTouchX;
        this.roll += (deltaX / this.scale);

        let deltaY = newY - this.lastTouchY;
        this.pitch += (deltaY / this.scale);

        this.clampPitch();

        this.lastTouchX = newX;
        this.lastTouchY = newY;
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
                self.parameters.model = self.defaultModel;
            }
            else
            {
                self.parameters.model = self.models[0];
            }

            viewerFolder.add(self.parameters, "model", self.models).onChange(function(model) {
                self.load(model, basePath)
            }).name("Model");

            self.load(self.parameters.model, basePath);

            let sceneFolder = viewerFolder.addFolder("Scene Index");
            sceneFolder.add(self.parameters, "prevScene").name("←");
            sceneFolder.add(self.parameters, "nextScene").name("→");

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
                self.roll = Math.PI;
                self.zoom = 4.0;
            } else {
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
                self.roll = Math.PI;
                self.zoom = 4.0;
            }).catch(function(error) {
                console.warn("Failed to load model-index fallback too!");
            });
        });

        let environmentFolder = this.gui.addFolder("Environment");
        environmentFolder.add(this.parameters, "useIBL").name("Image-Based Lighting");

        // TODO: add stuff like tonemapping algorithm and direction light.

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

        let ignoreVariants = ["glTF-Binary", "glTF-Draco", "glTF-Embedded"];

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

    addEnvironmentMap(gltf)
    {
        gltf.samplers.push(new gltfSampler(gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR,  gl.CLAMP_TO_EDGE,  gl.CLAMP_TO_EDGE, "CubeMapSampler"));
        const cubeSamplerIdx = gltf.samplers.length - 1;

        gltf.samplers.push(new gltfSampler(gl.LINEAR, gl.LINEAR,  gl.CLAMP_TO_EDGE,  gl.CLAMP_TO_EDGE, "LUTSampler"));
        const lutSamplerIdx = gltf.samplers.length - 1;

        let imageIdx = gltf.images.length;

        let indices = [];

        function AddSide(basePath, side)
        {
            for(let i = 0; i < 10; ++i)
            {
                gltf.images.push(new gltfImage(basePath + i + ".jpg", side, i));
                indices.push(++imageIdx);
            }
        };

        // u_DiffuseEnvSampler faces
        gltf.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_back_0.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z));
        gltf.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_bottom_0.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y));
        gltf.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_front_0.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Z));
        gltf.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_left_0.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_X));
        gltf.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_right_0.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_X));
        gltf.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_top_0.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Y));

        // u_DiffuseEnvSampler tex
        gltf.textures.push(new gltfTexture(cubeSamplerIdx, [imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx], gl.TEXTURE_CUBE_MAP));

        // u_SpecularEnvSampler tex
        AddSide("assets/images/papermill/specular/specular_back_",  gl.TEXTURE_CUBE_MAP_NEGATIVE_Z);
        AddSide("assets/images/papermill/specular/specular_bottom_",  gl.TEXTURE_CUBE_MAP_NEGATIVE_Y);
        AddSide("assets/images/papermill/specular/specular_front_",  gl.TEXTURE_CUBE_MAP_POSITIVE_Z);
        AddSide("assets/images/papermill/specular/specular_left_",  gl.TEXTURE_CUBE_MAP_NEGATIVE_X);
        AddSide("assets/images/papermill/specular/specular_right_",  gl.TEXTURE_CUBE_MAP_POSITIVE_X);
        AddSide("assets/images/papermill/specular/specular_top_",  gl.TEXTURE_CUBE_MAP_POSITIVE_Y);

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
