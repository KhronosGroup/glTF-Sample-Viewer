function main() {

    let gltfURL = '../models/BoomBox/glTF/BoomBox.gltf';

    let loadGLTF = axios.get(gltfURL);
    loadGLTF.then(function(json)
    {
        let backBuffer = document.getElementById('canvas');
        let error = document.getElementById('error');

        if (!backBuffer) {
            error.innerHTML += 'Failed to retrieve the canvas element<br>';
            return;
        }

        backBuffer.hidden = true;

        gl = canvas.getContext("webgl", {}) || canvas.getContext("experimental-webgl", {});
        if (!gl) {
            error.innerHTML += 'Failed to get the rendering context for WebGL<br>';
            return;
        }

        let canvas2d = document.getElementById('canvas2d');
        let frontBuffer = canvas2d.getContext("2d");

        let gltf = new glTF(gltfURL, { responseType: 'json' });
        gltf.fromJson(json.data);
        console.log(gltf);

        gltfLoader.load(gltf); // loade resources.

        let renderer = new gltfRenderer(frontBuffer, backBuffer);

        renderer.init();
        renderer.resize(canvas.width, canvas.height);
        renderer.drawScene(gltf, 0, -1, true);

        renderer.drawImage();

    }).catch(function(err)
    {
        console.log(err);
        //error.innerHTML += 'Failed to load model: ' + errorThrown + '<br>';
    });
}
