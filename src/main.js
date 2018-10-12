function main() {

    let gltfURL = '../models/BoomBox/glTF/BoomBox.gltf';

    let loadGLTF = axios.get(gltfURL);
    loadGLTF.then(function(json)
    {
        let gltf = new glTF(gltfURL, { responseType: 'json' });
        gltf.fromJson(json.data);
        console.log(gltf);
    }).catch(function(err)
    {
        console.log(err);
        //error.innerHTML += 'Failed to load model: ' + errorThrown + '<br>';
    });
}
