function gltf_rv(canvasId, index, headless = false)
{
    let canvas = document.getElementById(canvasId);
    if (!canvas)
    {
        console.warn("Failed to retrieve the WebGL canvas!");
        return null;
    }

    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl)
    {
        console.warn("Failed to get an WebGL rendering context!");
        return null;
    }

    let viewer = new gltfViewer(canvas, index, headless);

    canvas.onmousedown = viewer.onMouseDown.bind(viewer);
    document.onmouseup = viewer.onMouseUp.bind(viewer);
    document.onmousemove = viewer.onMouseMove.bind(viewer);
    canvas.onwheel = viewer.onMouseWheel.bind(viewer);
    canvas.ontouchstart = viewer.onTouchStart.bind(viewer);
    document.ontouchend = viewer.onTouchEnd.bind(viewer);
    document.ontouchmove = viewer.onTouchMove.bind(viewer);

    return viewer; // Succeeded in creating a glTF viewer!
}
