class gltfViewer
{
    constructor(canvas, headless = false)
    {
        this.roll  = Math.PI;
        this.pitch = 0.0;
        this.zoom  = 4.0;

        this.canvas = canvas;

        canvas.style.cursor = "grab";

        this.lastMouseX = 0.0;
        this.lastMouseY = 0.0;

        this.scale = 180;

        this.wheelSpeed = 1.04;
        this.mouseDown = false;

        if (headless == false)
        {
            this.initGUI();
        }

        this.gltf = undefined;
        this.newGltf = undefined;

        this.currentScene  = 0;
        this.currentCamera = -1;

        this.rendering = false;
        this.renderer = new gltfRenderer(canvas);
        this.renderer.init();
        this.renderer.resize(canvas.clientWidth, canvas.clientHeight);
    }

    initGUI()
    {
        this.gui = new dat.GUI();

        this.environmentLightingFolder = this.gui.addFolder("Environment Lighting");
        this.performanceFolder = this.gui.addFolder("Performance");

        let self = this;

        let text = {
            model: 'models/Telephone/glTF/Telephone.gltf',
            nextScene: function() {
                self.currentScene++;
            },
            previousScene: function() {
                self.currentScene--;
            },
        };

        this.gui.add(text, "model", ['models/Telephone/glTF/Telephone.gltf', 'models/BoomBox/glTF/BoomBox.gltf']).onChange(function(gltfFile) {
            self.load(gltfFile);
        });

        this.gui.add(text, "nextScene");
        this.gui.add(text, "previousScene");

        this.stats = new Stats();
        this.stats.dom.height = "48px";
        [].forEach.call(this.stats.dom.children,(child) =>
                        (child.style.display = ''));

        let perfList = document.createElement("li");
        this.stats.dom.style.position = 'static';
        perfList.appendChild(this.stats.dom);
        perfList.classList.add("gui-stats");
        this.performanceFolder.__ul.appendChild(perfList);
    }

    load(gltfFile)
    {
        let self = this;
        axios.get(gltfFile).then(function(response) {
            let newGltf = new glTF(gltfFile); // unload glTF resouce

            newGltf.fromJson(response.data);

            // TODO: insert textures & images for environmap
            self.addEnvironmentMap(newGltf);

            // Only render when all assets have been/are loaded:

            let assetPromises = gltfLoader.load(newGltf);

            Promise.all(assetPromises).then(function() {
                self.rendering = false;

                if (self.gltf !== undefined)
                {
                    gltfLoader.unload(self.gltf);
                    self.gltf = undefined;
                }

                self.gltf = newGltf;

                self.rendering = true;
            });
        }).catch(function(error) {
            log("glTF " + error);
        });
    }

    render()
    {
        let viewer = this;
        function renderCallback(elapsedTime)
        {
            if (viewer.rendering)
            {
                viewer.renderer.newFrame();

                // Will only resize canvas if needed.
                viewer.renderer.resize(canvas.clientWidth, canvas.clientHeight);

                if (viewer.currentScene >= 0 && viewer.currentScene < viewer.gltf.scenes.length)
                {
                    viewer.renderer.drawScene(viewer.gltf, viewer.currentScene, viewer.currentCamera, true, viewer);
                }
                else
                {
                    viewer.currentScene = 0;
                }
            }

            if (viewer.headless == false)
            {
                viewer.stats.update();
            }

            window.requestAnimationFrame(renderCallback);
        }

        window.requestAnimationFrame(renderCallback);
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

        if (this.pitch >= Math.PI / 2.0)
        {
            this.pitch = +Math.PI / 2.0;
        }
        else if (this.pitch <= -Math.PI / 2.0)
        {
            this.pitch = -Math.PI / 2.0;
        }

        this.lastMouseX = newX;
        this.lastMouseY = newY;
    }

    // assume the glTF is already parsed, but not loaded
    addEnvironmentMap(gltf)
    {
        let imageIdx = gltf.images.length;

        // u_DiffuseEnvSampler faces
        gltf.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_back_0.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z));
        gltf.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_bottom_0.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y));
        gltf.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_front_0.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Z));
        gltf.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_left_0.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_X));
        gltf.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_right_0.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_X));
        gltf.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_top_0.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Y));

        //let diffuseSources = [imageIdx, imageIdx++, imageIdx++, imageIdx++, imageIdx++,imageIdx++];

        // u_SpecularEnvSampler faces
        gltf.images.push(new gltfImage("assets/images/papermill/specular/specular_back_0.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z));
        gltf.images.push(new gltfImage("assets/images/papermill/specular/specular_bottom_0.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y));
        gltf.images.push(new gltfImage("assets/images/papermill/specular/specular_front_0.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Z));
        gltf.images.push(new gltfImage("assets/images/papermill/specular/specular_left_0.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_X));
        gltf.images.push(new gltfImage("assets/images/papermill/specular/specular_right_0.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_X));
        gltf.images.push(new gltfImage("assets/images/papermill/specular/specular_top_0.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Y));

        gltf.images.push(new gltfImage("assets/images/brdfLUT.png", gl.TEXTURE_2D));

        let samplerIdx = gltf.samplers.length;
        gltf.samplers.push(new gltfSampler(gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR,  gl.CLAMP_TO_EDGE,  gl.CLAMP_TO_EDGE, "CubeMapSampler"));

        // u_DiffuseEnvSampler tex
        gltf.textures.push(new gltfTexture(samplerIdx, [imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx], gl.TEXTURE_CUBE_MAP));

        // u_SpecularEnvSampler tex
        gltf.textures.push(new gltfTexture(samplerIdx, [++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx], gl.TEXTURE_CUBE_MAP));

        // u_brdfLUT tex
        gltf.textures.push(new gltfTexture(samplerIdx, [++imageIdx], gl.TEXTURE_2D));
    }

}
