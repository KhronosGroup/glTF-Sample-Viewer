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

            renderer = new gltfRenderer(canvas);
            renderer.init();
            renderer.resize(window.innerWidth,
                            window.innerHeight);

            function render(elapsedTime)
            {
                renderer.newFrame();
                renderer.drawScene(gltf, 0, -1, true);
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
