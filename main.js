function initCubeBuffers(length, width, height, gl) {
  var x = length/2.0;
  var y = height/2.0;
  var z = width/2.0;

  // Vertices
  var vertices = new Float32Array([
    x, -y, -z, // Back triangle 1
    -x, y, -z,
    -x, -y, -z,

    -x, y, -z,  // Back triangle 2
    x, -y, -z,
    x, y, -z,

    x, y, z,    // Right triangle 1
    x, y, -z,
    x, -y, -z,

    x, y, z,    // Right triangle 2
    x, -y, -z,
    x, -y, z,

    x, y, z,    // Front triangle 1
    x, -y, z,
    -x, y, z,

    x, -y, z,   // Front triangle 2
    -x, -y, z,
    -x, y, z,

    -x, y, z,   // Left triangle 1
    -x, -y, z,
    -x, -y, -z,

    -x, y, z,   // Left triangle 2
    -x, -y, -z,
    -x, y, -z,

    -x, y, -z,  // Top triangle 1
    x, y, z,
    -x, y, z,

    -x, y, -z,  // Top triangle 2
    x, y, -z,
    x, y, z,

    -x, -y, z,  // Bottom triangle 1
    x, -y, z,
    -x, -y, -z,
    
    x, -y, z,   // Bottom triangle 2
    x, -y, -z,
    -x, -y, -z
  ]);

  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(a_Position);

  // Colors
  var colors = new Float32Array([
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // back
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,
   
    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // right
    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,
 
    1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // front
    1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,
  
    1.0, 0.0, 1.0,  1.0, 0.0, 1.0,  1.0, 0.0, 1.0, // left
    1.0, 0.0, 1.0,  1.0, 0.0, 1.0,  1.0, 0.0, 1.0,

    0.0, 1.0, 1.0,  0.0, 1.0, 1.0,  0.0, 1.0, 1.0, // top
    0.0, 1.0, 1.0,  0.0, 1.0, 1.0,  0.0, 1.0, 1.0,

    1.0, 1.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, 0.0, // bottom
    1.0, 1.0, 0.0,  1.0, 1.0, 0.0,  1.0, 1.0, 0.0,
  ]);

  var colorBuffer = gl.createBuffer();
  if (!colorBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');

  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(a_Color);

  // Normals
  var normals = new Float32Array([
    0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0, // Back face
    0.0, 0.0, -1.0,  0.0, 0.0, -1.0,  0.0, 0.0, -1.0,

    1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // Right face
    1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,
 
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // Front face
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,

    -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0, // Left face
    -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,

    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // Top face
    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,

    0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  0.0, -1.0, 0.0, // Bottom face
    0.0, -1.0, 0.0,  0.0, -1.0, 0.0,  0.0, -1.0, 0.0
  ]);

  var normalBuffer = gl.createBuffer();
  if (!normalBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

  var a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
  
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(a_Normal); 

  return 1;
}

function loadCubeMap(gl, envMap, type, mipLevel) { 
  var texture = gl.createTexture();
  var textureNumber = 0;
  var mipLevels = 0;
  var u_EnvSampler;
  if (type === "diffuse") {
    u_EnvSampler = gl.getUniformLocation(gl.program, 'u_DiffuseEnvSampler');
    gl.activeTexture(gl.TEXTURE1);
    textureNumber = 1;
    mipLevels = 1;
  }
  else if (type === "specular") {
    u_EnvSampler = gl.getUniformLocation(gl.program, 'u_SpecularEnvSampler');
    gl.activeTexture(gl.TEXTURE2);
    textureNumber = 2;
    mipLevels = 10;
  }
  else if (type === "environment") {
    u_EnvSampler = gl.getUniformLocation(gl.program, 'u_EnvSampler');
    gl.activeTexture(gl.TEXTURE0);
    textureNumber = 0;
    mipLevels = 1;
  }
  else {
    console.log('Invalid type of cubemap loaded\n');
    return -1;
  }
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (mipLevels < 2) {
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }
  else {
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  var path = "textures/" + envMap + "/" + type + "/" + type;

  for (var j = 0; j < mipLevels; j++) {
    var faces = [[path +  "_right_" + j + ".jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
                [path + "_left_" + j + ".jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
                [path + "_top_" + j + ".jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
                [path + "_bottom_" + j + ".jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
                [path + "_front_" + j + ".jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
                [path + "_back_" + j + ".jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]];
    for (var i = 0; i < faces.length; i++) {
      var face = faces[i][1];
      var image = new Image();
      image.onload = function(texture, face, image, j) {
        return function() {
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          gl.texImage2D(face, j, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        }
      } (texture, face, image, j);
      image.src = faces[i][0];
    }
  }

  gl.uniform1i(u_EnvSampler, textureNumber);
  return 1;
}

// Update model from dat.gui change
function updateModel(value, gl, scene, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix) {
  scene = new Scene(gl, "./models/" + value + "/glTF/", "./models/" + value + "/glTF/" + value + ".gltf");
  scene.projectionMatrix = projectionMatrix;
  scene.viewMatrix = viewMatrix;
  scene.u_mvpMatrix = u_mvpMatrix;
  scene.u_NormalMatrix = u_NormalMatrix;
  return scene;
}

function main() {
  var canvas = document.getElementById('canvas');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return;
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  var gl = canvas.getContext("webgl");
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Load extensions
  gl.getExtension('EXT_shader_texture_lod');
  gl.getExtension('OES_standard_derivatives');

  // Initialize shaders
  $.ajaxSetup({
    async: false
  });
 
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  $.get("./shaders/pbr-vert.glsl", function(response) {
    gl.shaderSource(vertexShader, response);
  });
  gl.compileShader(vertexShader);
  var compiled = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
  if (!compiled) {
    console.log('Failed to compile vertex shader');
    var compilationLog = gl.getShaderInfoLog(vertexShader);
    console.log('Shader compiler log: ' + compilationLog);
  }

  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  $.get("./shaders/pbr-frag.glsl", function(response) {
    gl.shaderSource(fragmentShader, response);
  });
  gl.compileShader(fragmentShader);
  compiled = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
  if (!compiled) {
    console.log('Failed to compile fragment shader');
    var compilationLog = gl.getShaderInfoLog(fragmentShader);
    console.log('Shader compiler log: ' + compilationLog);
  }

  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);
  gl.program = program;

  // Create cube maps
  var envMap = "papermill";
  //loadCubeMap(gl, envMap, "environment");
  loadCubeMap(gl, envMap, "diffuse", 0);
  loadCubeMap(gl, envMap, "specular", 0);

  // Light
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  gl.uniform3f(u_LightPosition, 0.0, 0.0, 1.5);

  // Camera
  var u_Camera = gl.getUniformLocation(gl.program, 'u_Camera');
  gl.uniform3f(u_Camera, 0.0, 0.0, -4.0);

  // Model matrix
  var modelMatrix = mat4.create();
  
  // View matrix
  var viewMatrix = mat4.create();
  var eye = vec3.fromValues(0.0, 0.0, -4.0);
  var at = vec3.fromValues(0.0, 0.0, 0.0);
  var up = vec3.fromValues(0.0, 1.0, 0.0);
  mat4.lookAt(viewMatrix, eye, at, up);

  // Projection matrix
  var projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, 70.0, canvas.width/canvas.height, 0.1, 100.0);

  // Get location of mvp matrix uniform
  var u_mvpMatrix = gl.getUniformLocation(gl.program, 'u_mvpMatrix');

  // Get location of normal matrix uniform
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

  // Set clear color
  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  
  // Enable depth test
  gl.enable(gl.DEPTH_TEST);

  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Load scene
  //var scene = new Scene(gl, "./models/DamagedHelmetModified/glTF/", "./models/DamagedHelmetModified/glTF/DamagedHelmetModified.gltf");
  var scene = new Scene(gl, "./models/Avocado/glTF/", "./models/Avocado/glTF/Avocado.gltf");
  scene.projectionMatrix = projectionMatrix;
  scene.viewMatrix = viewMatrix;
  scene.u_mvpMatrix = u_mvpMatrix;
  scene.u_NormalMatrix = u_NormalMatrix;

  // Set control callbacks
  canvas.onmousedown = function(ev) {handleMouseDown(ev);};
  document.onmouseup = function(ev) {handleMouseUp(ev);};
  document.onmousemove = function(ev) {handleMouseMove(ev, gl, scene);};
  window.onscroll = function() {handleScroll(gl, scene);};

  // Initialize GUI  
  var gui = new dat.GUI();
  var folder = gui.addFolder("Metallic-Roughness Material");

  var text = {Model: "Avocado"};
  folder.add(text, 'Model', ['Avocado', 'BarramundiFish', 'BoomBox', 'Corset', 'Telephone']).onChange(function(value) {
    scene = updateModel(value, gl, scene, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
  });
  folder.open();
}

// ***** Mouse Controls ***** //
var mouseDown = false;
var roll = 0.0;
var pitch = 0.0;
var translate = 0.0;
var lastMouseX = null;
var lastMouseY = null;
function handleMouseDown(ev) {
  mouseDown = true;
  lastMouseX = ev.clientX;
  lastMouseY = ev.clientY;
}

function handleMouseUp(ev) {
  mouseDown = false;
}

function handleMouseMove(gl, scene) {
  if (!mouseDown) {
    return;
  }
  var newX = ev.clientX;
  var newY = ev.clientY;

  var deltaX = newX - lastMouseX;
  roll += (deltaX / 100.0); 
 
  var deltaY = newY - lastMouseY;
  pitch += (deltaY / 100.0);

  lastMouseX = newX;
  lastMouseY = newY;

  scene.drawScene(gl);
}

function handleScroll(ev, gl, scene) {
  console.log("hey");
}
