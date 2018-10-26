function gltf_rv(canvasId, gltfFiles = [],
                 loggerId = undefined)
{
    let logger = document.getElementById(loggerId);
    log = function(message)
    {
        if (logger)
        {
            logger.style.display = "block";
            logger.innerHTML += message + "<br>"
        } else {
            console.warn(message);
        }
    }

    let canvas = document.getElementById(canvasId);
    if (!canvas)
    {
        log("Failed to retrieve the WebGL canvas!");
        return false;
    }

    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl)
    {
        log("Failed to get an WebGL rendering context!");
        return false;
    }

    let requiredWebglExtensions = [
        "EXT_shader_texture_lod",
        "OES_standard_derivatives",
        "OES_element_index_uint",
        "EXT_SRGB"
    ];

    LoadWebGLExtensions(requiredWebglExtensions);

    let gltfFile = gltfFiles[0]; // FIXME: select

    axios.get(gltfFile).then(function(response) {

        gltf = new glTF(gltfFile);

        gltf.fromJson(response.data);

        // TODO: insert textures & images for environmap
        addEnvironmentMap(gltf);

        // Only render when all assets have been/are loaded:

        let assetPromises = gltfLoader.load(gltf);

        Promise.all(assetPromises).then(function(response) {

            let renderer = new gltfRenderer(canvas);

            renderer.init();
            renderer.resize(canvas.clientWidth,
                            canvas.clientHeight);

            let viewer = new gltfViewer(canvas);

            canvas.onmousedown   = viewer.onMouseDown.bind(viewer);
            document.onmouseup   = viewer.onMouseUp.bind(viewer);
            document.onmousemove = viewer.onMouseMove.bind(viewer);
            canvas.onwheel       = viewer.onMouseWheel.bind(viewer);

            function render(elapsedTime)
            {
                renderer.newFrame();

                // Will only resize canvas if needed.
                renderer.resize(canvas.clientWidth,
                                canvas.clientHeight);

                // TODO: select the correct cameraIndex later.
                renderer.drawScene(gltf, 0, -1, true, viewer);

                window.requestAnimationFrame(render);
            }

            window.requestAnimationFrame(render);

        });

    }).catch(function(error) {
        log("glTF " + error);
        return false;
    });

    return true;
}

// assume the glTF is already parsed, but not loaded
function addEnvironmentMap(glTF)
{
    let imageIdx = glTF.images.length;

    // u_DiffuseEnvSampler faces
    glTF.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_back_0.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z));
    glTF.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_bottom_0.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y));
    glTF.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_front_0.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Z));
    glTF.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_left_0.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_X));
    glTF.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_right_0.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_X));
    glTF.images.push(new gltfImage("assets/images/papermill/diffuse/diffuse_top_0.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Y));

    //let diffuseSources = [imageIdx, imageIdx++, imageIdx++, imageIdx++, imageIdx++,imageIdx++];

    // u_SpecularEnvSampler faces
    glTF.images.push(new gltfImage("assets/images/papermill/specular/specular_back_0.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z));
    glTF.images.push(new gltfImage("assets/images/papermill/specular/specular_bottom_0.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y));
    glTF.images.push(new gltfImage("assets/images/papermill/specular/specular_front_0.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Z));
    glTF.images.push(new gltfImage("assets/images/papermill/specular/specular_left_0.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_X));
    glTF.images.push(new gltfImage("assets/images/papermill/specular/specular_right_0.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_X));
    glTF.images.push(new gltfImage("assets/images/papermill/specular/specular_top_0.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Y));

    glTF.images.push(new gltfImage("assets/images/brdfLUT.png", gl.TEXTURE_2D));

    let samplerIdx = glTF.samplers.length;
    glTF.samplers.push(new gltfSampler(gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR,  gl.CLAMP_TO_EDGE,  gl.CLAMP_TO_EDGE, "CubeMapSampler"));

    // u_DiffuseEnvSampler tex
    gltf.textures.push(new gltfTexture(samplerIdx, [imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx], gl.TEXTURE_CUBE_MAP));

    // u_SpecularEnvSampler tex
    gltf.textures.push(new gltfTexture(samplerIdx, [++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx, ++imageIdx], gl.TEXTURE_CUBE_MAP));

    // u_brdfLUT tex
    gltf.textures.push(new gltfTexture(samplerIdx, [++imageIdx], gl.TEXTURE_2D));
}
