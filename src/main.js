function main() {

    let gltfURL = 'BoomBox/glTF/BoomBox.gltf';

    let loadGLTF = axios.get(gltfURL);
    loadGLTF.then(function(response)
    {
        if(response.data === undefined)
        {
            console.log("Failed to load " + gltfURL);
            return;
        }

        let backBuffer = document.getElementById('canvas');
        let error = document.getElementById('error');

        if (!backBuffer) {
            error.innerHTML += 'Failed to retrieve the canvas element<br>';
            return;
        }

        backBuffer.hidden = true;

        gl = backBuffer.getContext("webgl", {}) || backBuffer.getContext("experimental-webgl", {});
        if (!gl) {
            error.innerHTML += 'Failed to get the rendering context for WebGL<br>';
            return;
        }

        let canvas2d = document.getElementById('canvas2d');
        let frontBuffer = canvas2d.getContext("2d");

        let gltf = new glTF(gltfURL, { responseType: 'json' });
        gltf.fromJson(response.data);
        console.log(gltf);

        gltfLoader.load(gltf); // loade resources.

        let renderer = new gltfRenderer(frontBuffer, backBuffer);

        renderer.init();
        renderer.resize(backBuffer.width, backBuffer.height);

        var render = function(elapsed) {
            renderer.newFrame();
            renderer.drawScene(gltf, 0, -1, true);
            renderer.drawImage();
            window.requestAnimationFrame(render);
        };

        window.requestAnimationFrame(render);
    }).catch(function(err)
    {
        console.log(err);
        //error.innerHTML += 'Failed to load model: ' + errorThrown + '<br>';
    });
}
