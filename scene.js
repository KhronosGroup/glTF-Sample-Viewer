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
        getAccessorData(this, gl, gltf, model, primitive.attributes[attribute], attribute);
      }
       
      // Indices
      var indicesAccessor = primitive.indices;
      getAccessorData(this, gl, gltf, model, indicesAccessor, "INDEX");

      // Material
      var materialName = primitive.material;
      var material = gltf.materials[materialName];
    }
  }

  initBuffers(gl, gltf) {
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }
  
    if (!initArrayBuffer(gl, this.vertices, 3, gl.FLOAT, 'a_Position', 12, 0)) {
      return -1;
    }  

    if (!initArrayBuffer(gl, this.normals, 3, gl.FLOAT, 'a_Normal', 12, 163200)) {
      return -1;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    
  }

  drawScene(gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix) {
  // Update model matrix
  modelMatrix = mat4.create();
  mat4.rotateY(modelMatrix, modelMatrix, roll);
  mat4.rotateX(modelMatrix, modelMatrix, pitch);
  //var translateVec = vec3.fromValues(0.0, translate, 0.0);
  //mat4.translate(modelMatrix, modelMatrix, translateVec);

  // Update mvp matrix
  var mvpMatrix = mat4.create();
  mat4.multiply(mvpMatrix, viewMatrix, modelMatrix);
  mat4.multiply(mvpMatrix, projectionMatrix, mvpMatrix);
  gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix);

  // Update normal matrix
  var normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelMatrix);
  mat4.transpose(normalMatrix, normalMatrix);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix); 



    // Draw
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 46356, gl.UNSIGNED_SHORT, 0);
  }
}

var semaphore = 0;
function getAccessorData(scene, gl, gltf, model, accessorName, attribute) {
  semaphore++;
  var accessor = gltf.accessors[accessorName];
  var bufferView = gltf.bufferViews[accessor.bufferView];
  var buffer = gltf.buffers[bufferView.buffer];
  var bin = buffer.uri;

  var reader = new FileReader();

  reader.onload = function(e) {
    var arrayBuffer = reader.result;
    var start = bufferView.byteOffset;
    var end = start + bufferView.byteLength;
    var slicedBuffer = arrayBuffer.slice(start, end);
    var data;
    if (accessor.componentType === 5126) {
      data = new Float32Array(slicedBuffer);
    }
    else if (accessor.componentType === 5123) {
      data = new Uint16Array(slicedBuffer);
    }
    switch (attribute) {
      case "POSITION": scene.vertices = data;
        break;
      case "NORMAL": scene.normals = data;
        break;
      case "TEXCOORD_0": scene.texcoords = data;
        break;
      case "TANGENT": scene.tangents = data;
        break;
      case "INDEX": scene.indices = data;
        break;
    }

    semaphore--;
    if (semaphore === 0) {
      scene.initBuffers(gl, gltf);
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

function initArrayBuffer(gl, data, num, type, attribute, stride, offset) {
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  
  gl.vertexAttribPointer(a_attribute, num, type, false, stride, offset);
  
  gl.enableVertexAttribArray(a_attribute);
  return true;
}
