class Scene {
  constructor(gl, model, file) {
    // Load gltf file
    var json;
    $.get(file, function(response) {
      json = response;
    });
    var gltf = JSON.parse(json);

    this.modelPath = model;

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
      this.material = gltf.materials[materialName].extensions.FRAUNHOFER_materials_pbr.values;
      this.initTextures(gl, gltf);
    }
  }

  initBuffers(gl, gltf) {
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
      console.log('Failed to create the buffer object');
      return -1;
    }
  
    if (!initArrayBuffer(gl, this.vertices, 3, gl.FLOAT, 'a_Position', this.verticesAccessor.byteStride, this.verticesAccessor.byteOffset)) {
      return -1;
    }  

    if (!initArrayBuffer(gl, this.normals, 3, gl.FLOAT, 'a_Normal', this.normalsAccessor.byteStride, this.normalsAccessor.byteOffset)) {
      return -1;
    }

    if (!initArrayBuffer(gl, this.texcoords, 2, gl.FLOAT, 'a_UV', this.texcoordsAccessor.byteStride, this.texcoordsAccessor.byteOffset)) {
      return -1;
    }

    if (!initArrayBuffer(gl, this.tangents, 3, gl.FLOAT, 'a_Tangent', this.tangentsAccessor.byteStride, this.tangentsAccessor.byteOffset)) {
      return -1;
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    
  }

  initTextures(gl, gltf) {

    // Base Color
    var baseColorTexInfo = gltf.textures[this.material.baseColorTexture];
    var baseColorSrc = this.modelPath + gltf.images[baseColorTexInfo.source].uri;
    
    // Metallic
    var metallicTexInfo = gltf.textures[this.material.metallicTexture];
    var metallicSrc = this.modelPath + gltf.images[metallicTexInfo.source].uri;
    
    // Roughness
    var roughnessTexInfo = gltf.textures[this.material.roughnessTexture];
    var roughnessSrc = this.modelPath + gltf.images[roughnessTexInfo.source].uri;

    // Normals
    var normalsTexInfo = gltf.textures[this.material.normalTexture];
    var normalsSrc = this.modelPath + gltf.images[normalsTexInfo.source].uri;

    // brdfLUT
    var brdfLUT = "textures/brdfLUT.jpg";

    loadImages([baseColorSrc, metallicSrc, roughnessSrc, normalsSrc, brdfLUT], createTextures, gl);
  }

  drawScene(gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix) {
    // Update model matrix
    modelMatrix = mat4.create();
    mat4.rotateY(modelMatrix, modelMatrix, roll);
    mat4.rotateX(modelMatrix, modelMatrix, pitch);

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
    if (this.indicesAccessor != null) {
      gl.drawElements(gl.TRIANGLES, this.indicesAccessor.count, gl.UNSIGNED_SHORT, 0);
    }
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
        scene.verticesAccessor = accessor;
        break;
      case "NORMAL": scene.normals = data;
        scene.normalsAccessor = accessor;
        break;
      case "TEXCOORD_0": scene.texcoords = data;
        scene.texcoordsAccessor = accessor;
        break;
      case "TANGENT": scene.tangents = data;
        scene.tangentsAccessor = accessor;
        break;
      case "INDEX": scene.indices = data;
        scene.indicesAccessor = accessor;
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

function loadImage(url, callback) {
  var image = new Image();
  image.src = url;
  image.onload = callback;
  return image;
}

function loadImages(urls, callback, gl) {
  var images = [];
  var imagesToLoad = urls.length;

  var onImageLoad = function() {
    imagesToLoad--;
    if (imagesToLoad == 0) {
      callback(images, gl);
    }
  };

  for (var i = 0; i < imagesToLoad; i++) {
    var image = loadImage(urls[i], onImageLoad);
    images.push(image);
  }
}

function createTextures(images, gl) {
  var textures = [];
  for (var i = 0; i < images.length; i++) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    if (i < images.length - 1){
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    }
    else {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);

    textures.push(texture);
  }

  var u_BaseColorSampler = gl.getUniformLocation(gl.program, 'u_BaseColorSampler');
  var u_MetallicSampler = gl.getUniformLocation(gl.program, 'u_MetallicSampler');
  var u_RoughnessSampler = gl.getUniformLocation(gl.program, 'u_RoughnessSampler');
  var u_NormalSampler = gl.getUniformLocation(gl.program, 'u_NormalSampler');
  var u_brdfLUT = gl.getUniformLocation(gl.program, 'u_brdfLUT');

  gl.uniform1i(u_BaseColorSampler, 3);
  gl.uniform1i(u_MetallicSampler, 4);
  gl.uniform1i(u_RoughnessSampler, 5);
  gl.uniform1i(u_NormalSampler, 6);
  gl.uniform1i(u_brdfLUT, 7);

  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE4);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
  gl.activeTexture(gl.TEXTURE5);
  gl.bindTexture(gl.TEXTURE_2D, textures[2]);
  gl.activeTexture(gl.TEXTURE6);
  gl.bindTexture(gl.TEXTURE_2D, textures[3]);
  gl.activeTexture(gl.TEXTURE7);
  gl.bindTexture(gl.TEXTURE_2D, textures[4]);
}
