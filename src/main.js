function main() {

    let gltfURL = '../models/BoomBox/glTF/BoomBox.gltf';

    $.ajax({
        url: gltfURL,
        dataType: 'json',
        async: true,
        error: (jqXhr, textStatus, errorThrown) => {
            error.innerHTML += 'Failed to load model: ' + errorThrown + '<br>';
        },
        success: function(json) {
            let gltf = new glTF(gltfURL);
            gltf.fromJson(json);
            console.log(gltf);
        }
    });
}
