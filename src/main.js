function gltf_rv(frontBufferId, backBufferId,
                 models = [], loggerId = undefined,
                 configuration = undefined)
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

    let backBuffer  = document.getElementById(backBufferId);
    if (!backBuffer)
    {
        log("Failed to retrieve the WebGL back buffer!");
        return false;
    }

    backBuffer.hidden = true;

    gl = backBuffer.getContext("webgl") || backBuffer.getContext("experimental-webgl");
    if (!gl)
    {
        log("Failed to get an WebGL rendering context!");
        return false;
    }

    let frontBufferCanvas = document.getElementById(frontBufferId);
    if (!frontBufferCanvas)
    {
        log("Couldn't find the WebGL 2.0 front buffer!");
        return false;
    }

    let frontBuffer = frontBufferCanvas.getContext("2d");
    if (!frontBuffer)
    {
        log("Failed to get some 2-D rendering context!");
        return false;
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

            renderer = new gltfRenderer(frontBuffer, backBuffer);
            renderer.init(); // Finally, setup the GL state machine.
            renderer.resize(backBuffer.width, backBuffer.height);

            // The main rendering loop!
            function render(elapsedTime)
            {
                renderer.newFrame();
                renderer.drawScene(gltf, 0, -1, true);
                renderer.drawImage();
                window.requestAnimationFrame(render);
            }

            window.requestAnimationFrame(render);

        });
    }).catch(function(message) {
        log("glTF load error :" + message);
        return false;
    });

    return true;
}
