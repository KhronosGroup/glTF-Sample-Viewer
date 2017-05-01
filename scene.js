class Scene {
  constructor(gl, model, file) {
    // Load gltf file
    var json;
    $.get(file, function(response) {
      json = response;
    });
    var gltf = (typeof json === 'string') ? JSON.parse(json) : json;

    this.modelPath = model;

    // Transform
    this.transform = mat4.create();
    var scale = gltf.nodes[0].scale;
    var translate = gltf.nodes[0].translation;
    if (scale) {
      this.transform[0] *= scale[0];
      this.transform[5] *= scale[1];
      this.transform[10] *= scale[2];
    }
    if (translate) {
      this.transform[12] += translate[0];
      this.transform[13] += translate[1];
      this.transform[14] += translate[2];
    }

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
      this.material = gltf.materials[materialName];
      this.initTextures(gl, gltf);
    }
  }

  initBuffers(gl, gltf) {
    var error = document.getElementById('error');
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
      error.innerHTML += 'Failed to create the buffer object<br>';
      return -1;
    }

    if (!initArrayBuffer(gl, this.vertices, 3, gl.FLOAT, 'a_Position', this.verticesAccessor.byteStride, this.verticesAccessor.byteOffset)) {
      error.innerHTML += 'Failed to initialize position buffer<br>';
    }

    if (!initArrayBuffer(gl, this.normals, 3, gl.FLOAT, 'a_Normal', this.normalsAccessor.byteStride, this.normalsAccessor.byteOffset)) {
      error.innerHTML += 'Failed to initialize normal buffer<br>';
    }

    if( this.tangentsAccessor )
    {
      if (!initArrayBuffer(gl, this.tangents, 4, gl.FLOAT, 'a_Tangent', this.tangentsAccessor.byteStride, this.tangentsAccessor.byteOffset)) {
        error.innerHTML += 'Failed to initialize tangent buffer<br>';
      }
    }

    if (!initArrayBuffer(gl, this.texcoords, 2, gl.FLOAT, 'a_UV', this.texcoordsAccessor.byteStride, this.texcoordsAccessor.byteOffset)) {
      error.innerHTML += 'Failed to initialize texture buffer<br>';
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    this.loadedBuffers = true;
    if (this.loadedTextures) {
      this.drawScene(gl);
    }
  }

  initTextures(gl, gltf) {

    var images = [];
    var pbrMat = this.material.pbrMetallicRoughness;
    // Base Color
    var baseColorTexInfo = gltf.textures[pbrMat.baseColorTexture.index];
    var baseColorSrc = this.modelPath + gltf.images[baseColorTexInfo.source].uri;
    images.push(baseColorSrc);

    // Metallic-Roughness
    var mrTexInfo = gltf.textures[pbrMat.metallicRoughnessTexture.index];
    var mrSrc = this.modelPath + gltf.images[mrTexInfo.source].uri;
    // gltf.samplers[mrTexInfo.sampler].magFilter etc
    images.push(mrSrc);

    // Normals
    if( this.material.normalTexture )
    {
      var normalsTexInfo = gltf.textures[this.material.normalTexture.index];
      var normalsSrc = this.modelPath + gltf.images[normalsTexInfo.source].uri;
      images.push(normalsSrc);
    }

    // brdfLUT
    var brdfLUT = "textures/brdfLUT.png";
    images.push(brdfLUT);

    // Emissive
    var u_isEmissive = gl.getUniformLocation(gl.program, 'u_isEmissive');
    if (this.material.emissiveTexture) {
      var emissiveTexInfo = gltf.textures[this.material.emissiveTexture.index];
      var emissiveSrc = this.modelPath + gltf.images[emissiveTexInfo.source].uri;
      images.push(emissiveSrc);
      this.containsEmissive = true;
      gl.uniform1i(u_isEmissive, true);
    }
    else {
      gl.uniform1i(u_isEmissive, false);
    }

    // AO
    var u_hasAO = gl.getUniformLocation(gl.program, 'u_hasAO');
    if (this.material.occlusionTexture) {
      var occlusionTexInfo = gltf.textures[this.material.occlusionTexture.index];
      var occlusionSrc = this.modelPath + gltf.images[occlusionTexInfo.source].uri;
      images.push(occlusionSrc);
      this.containsAO = true;
      gl.uniform1i(u_hasAO, true);
    }
    else {
      gl.uniform1i(u_hasAO, false);
    }

    loadImages(images, createTextures, gl, this);
  }

  drawScene(gl) {
    // Update model matrix
    var modelMatrix = mat4.create();
    mat4.multiply(modelMatrix, modelMatrix, this.transform);
    var xRotation = mat4.create();
    mat4.rotateY(xRotation, xRotation, roll);
    var yRotation = mat4.create();
    mat4.rotateX(yRotation, yRotation, -pitch);
    var rotation = mat4.create();
    mat4.multiply(rotation, yRotation, xRotation);
    mat4.multiply(modelMatrix, rotation, modelMatrix);

    // Update view matrix
    this.viewMatrix[14] = -4.0 + translate;

    // Update mvp matrix
    var mvpMatrix = mat4.create();
    mat4.multiply(mvpMatrix, this.viewMatrix, modelMatrix);
    mat4.multiply(mvpMatrix, this.projectionMatrix, mvpMatrix);
    gl.uniformMatrix4fv(this.u_mvpMatrix, false, mvpMatrix);

    // Update normal matrix
    var normalMatrix = mat4.create();
    mat4.invert(normalMatrix, modelMatrix);
    mat4.transpose(normalMatrix, normalMatrix);
    gl.uniformMatrix4fv(this.u_NormalMatrix, false, normalMatrix);

    // Draw
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (this.indicesAccessor != null) {
      gl.drawElements(gl.TRIANGLES, this.indicesAccessor.count, gl.UNSIGNED_SHORT, 0);
    }

    this.frontBuffer.drawImage(this.backBuffer, 0, 0);
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
      case "TANGENT": scene.tangents = data;
        scene.tangentsAccessor = accessor;
        break;
      case "TEXCOORD_0": scene.texcoords = data;
        scene.texcoordsAccessor = accessor;
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
    var error = document.GetElementById('error');
    error.innerHTML += 'Failed to create the buffer object<br>';
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

function loadImages(urls, callback, gl, scene) {
  var images = [];
  var imagesToLoad = urls.length;

  var onImageLoad = function() {
    imagesToLoad--;
    if (imagesToLoad == 0) {
      callback(images, gl, scene);
    }
  };

  for (var i = 0; i < imagesToLoad; i++) {
    var image = loadImage(urls[i], onImageLoad);
    images.push(image);
  }
}

function createTextures(images, gl, scene) {
  var textures = [];
  for (var i = 0; i < images.length; i++) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);

    textures.push(texture);
  }

  var u_BaseColorSampler = gl.getUniformLocation(gl.program, 'u_BaseColorSampler');
  var u_MetallicRoughnessSampler = gl.getUniformLocation(gl.program, 'u_MetallicRoughnessSampler');
  var u_NormalSampler = gl.getUniformLocation(gl.program, 'u_NormalSampler');
  var u_brdfLUT = gl.getUniformLocation(gl.program, 'u_brdfLUT');

  gl.uniform1i(u_BaseColorSampler, 3);
  gl.uniform1i(u_MetallicRoughnessSampler, 4);
  gl.uniform1i(u_NormalSampler, 5);
  gl.uniform1i(u_brdfLUT, 6);

  gl.activeTexture(gl.TEXTURE3);
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);
  gl.activeTexture(gl.TEXTURE4);
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);
  gl.activeTexture(gl.TEXTURE5);
  gl.bindTexture(gl.TEXTURE_2D, textures[2]);
  gl.activeTexture(gl.TEXTURE6);
  gl.bindTexture(gl.TEXTURE_2D, textures[3]);


  var tex = 4;
  if (scene.containsEmissive) {
    var u_EmissiveSampler = gl.getUniformLocation(gl.program, 'u_EmissiveSampler');
    gl.uniform1i(u_EmissiveSampler, 7);
    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, textures[tex]);
    tex++;
  }

  if (scene.containsAO) {
    var u_OcclusionSampler = gl.getUniformLocation(gl.program, 'u_OcclusionSampler');
    gl.uniform1i(u_OcclusionSampler, 8);
    gl.activeTexture(gl.TEXTURE8);
    gl.bindTexture(gl.TEXTURE_2D, textures[tex]);
  }

  scene.loadedTextures = true;
  if (scene.loadedBuffers) {
    scene.drawScene(gl);
  }
}
