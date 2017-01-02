class Scene {
  constructor(gl, model, file) {
    // Load gltf file
    var json;
    $.get(file, function(response) {
      json = response;
    });
    var gltf = JSON.parse(json);

    var meshes = gltf.meshes;
    var primitives = meshes[Object.keys(meshes)[0]].primitives;
    for (var i = 0; i < primitives.length; i++) {
      var primitive = primitives[Object.keys(primitives)[i]];
    
      // Attributes
      for (var attribute in primitive.attributes) {
        getAccessorData(gl, gltf, model, primitive.attributes[attribute]);
      }
       
      // Indices
      var indicesAccessor = primitive.indices;
      getAccessorData(gl, gltf, model, indicesAccessor);

      // Material
      var materialName = primitive.material;
      var material = gltf.materials[materialName];
    }
  }
}

function getAccessorData(gl, gltf, model, accessorName) {
  var accessor = gltf.accessors[accessorName];
  var bufferView = gltf.bufferViews[accessor.bufferView];
  var buffer = gltf.buffers[bufferView.buffer];
  var bin = buffer.uri;

  var reader = new FileReader();

  reader.onload = function(e) {
    var arrayBuffer = reader.result;
    var start = bufferView.byteOffset;
    var end = start + bufferView.byteLength;
    console.log(end - start);
    var slicedBuffer = arrayBuffer.slice(start, end);
    var data;
    if (accessor.componentType === 5126) {
      data = new Float32Array(slicedBuffer);
    }
    else if (accessor.componentType === 5123) {
      data = new Uint16Array(slicedBuffer);
    }
  }
 
  var oReq = new XMLHttpRequest();
  oReq.open("GET", model + bin, true);
  oReq.responseType = "blob";
  oReq.onload = function(e) {
    var blob = oReq.response;
    reader.readAsArrayBuffer(blob);
  };
  oReq.send();
}


