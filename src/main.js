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

    viewer = new gltfViewer(canvas);

    canvas.onmousedown = viewer.onMouseDown.bind(viewer);
    document.onmouseup = viewer.onMouseUp.bind(viewer);
    document.onmousemove = viewer.onMouseMove.bind(viewer);
    canvas.onwheel = viewer.onMouseWheel.bind(viewer);

    let gltfFile = "models/Telephone/glTF/Telephone.gltf";

    viewer.load(gltfFile);
    viewer.render();

    return true;
}
