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
