function gltf_rv(canvasId, loggerId,
                 models = [])
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


    extensions = [
        "EXT_shader_texture_lod",
        "OES_standard_derivatives",
        "OES_element_index_uint",
        "EXT_SRGB"
    ];

    for (let extension of extensions)
    {
        if(gl.getExtension(extension) === null)
        {
            console.warn("Extension " + extension + " not supported");
        }
    }

    let hasEXT_SRGB = gl.getExtension("EXT_SRGB");

    if (hasEXT_SRGB)
    {
        gl.SRGB = hasEXT_SRGB.SRGB_EXT;
        gl.hasSRGBExtension = true;
    }
    else
    {
        gl.SRGB = gl.RGBA;
        gl.hasSRGBExtension = false;
    }

    let gltfFile = models[0]; // just pick the first one for now :)
    let gltfGetRequest = axios.get(gltfFile);
    gltfGetRequest.then(function(response) {
        gltf = new glTF(gltfFile, {
            responseType: 'json'
        });

        gltf.fromJson(response.data);

        // Only render when all assets have been/are loaded.

        let assetPromises = gltfLoader.load(gltf);
        Promise.all(assetPromises).then(function(response) {

            let renderer = new gltfRenderer(canvas);
            renderer.init();
            renderer.resize(window.innerWidth,
                            window.innerHeight);

            let viewer = new gltfViewer();

            function render(elapsedTime)
            {
                renderer.newFrame();
                renderer.resize(window.innerWidth,
                                window.innerHeight);
                renderer.drawScene(gltf, 0, -1, true, viewer);
                window.requestAnimationFrame(render);
            }

            window.requestAnimationFrame(render);

        });
    }).catch(function(message) {
        log("glTF error: " + message);
        return false;
    });

    return true;
}
