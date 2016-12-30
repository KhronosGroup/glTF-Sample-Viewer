class Scene {
  constructor(file) {
    // Load gltf file
    var json;
    $.get(file, function(response) {
      json = response;
    });
    var gltf = JSON.parse(json);

    // Vertices

    // Normals

    // Material
  }
}
