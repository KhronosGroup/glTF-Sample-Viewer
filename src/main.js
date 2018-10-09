function main() {
    $.ajax({
        url: '../models/BoomBox/glTF/BoomBox.gltf',
        dataType: 'json',
        async: true,
        error: (jqXhr, textStatus, errorThrown) => {
            error.innerHTML += 'Failed to load model: ' + errorThrown + '<br>';
        },
        success: function(json) {
            let gltf = new glTF();
            gltf.fromJson(json);
            console.log(gltf);
        }
    });
}
