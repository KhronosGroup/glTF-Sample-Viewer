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

function loadCubeMap(gl, envMap, type) { 
  var texture = gl.createTexture();
  var textureNumber = 0;
  var u_EnvSampler;
  if (type === "diffuse") {
    u_EnvSampler = gl.getUniformLocation(gl.program, 'u_DiffuseEnvSampler');
    gl.activeTexture(gl.TEXTURE6);
    textureNumber = 6;
  }
  else if (type === "specular") {
    u_EnvSampler = gl.getUniformLocation(gl.program, 'u_SpecularEnvSampler');
    gl.activeTexture(gl.TEXTURE7);
    textureNumber = 7;
  }
  else {
    console.log('Invalid type of cubemap loaded\n');
    return -1;
  }
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  var path = "textures/" + envMap + "/" + type;

  var faces = [[path +  "_right.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
               [path + "_left.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_X],
               [path + "_top.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Y],
               [path + "_bottom.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Y],
               [path + "_front.jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_Z],
               [path + "_back.jpg", gl.TEXTURE_CUBE_MAP_NEGATIVE_Z]];
  for (var i = 0; i < faces.length; i++) {
    var face = faces[i][1];
    var image = new Image();
    image.onload = function(texture, face, image) {
      return function() {
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(face, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      }
    } (texture, face, image);
    image.src = faces[i][0];
  }

  gl.uniform1i(u_EnvSampler, textureNumber);
  return 1;
}

function updateDiffuse(value, gl, scene, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix) {
  var u_BaseColor = gl.getUniformLocation(gl.program, 'u_BaseColor');
  gl.uniform3f(u_BaseColor, value[0]/255, value[1]/255, value[2]/255);
  scene.drawScene(gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
}

function updateMetallic(value, gl, scene, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix) {
  var u_Metallic = gl.getUniformLocation(gl.program, 'u_Metallic');
  gl.uniform1f(u_Metallic, value);
  scene.drawScene(gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
}

function updateRoughness(value, gl, scene, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix) {
  var u_Roughness = gl.getUniformLocation(gl.program, 'u_Roughness');
  gl.uniform1f(u_Roughness, value);
  scene.drawScene(gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
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

  // Set positions of vertices
  //initCubeBuffers(1.0, 1.0, 1.0, gl);
  // Create cube maps
  var envMap = "papermill";
  loadCubeMap(gl, envMap, "diffuse");
  loadCubeMap(gl, envMap, "specular");

  // Light
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  gl.uniform3f(u_LightPosition, 0.0, 0.0, 1.5);

  // Camera
  var u_Camera = gl.getUniformLocation(gl.program, 'u_Camera');
  gl.uniform3f(u_Camera, 0.0, 0.0, 2.0);

  // Model matrix
  var modelMatrix = mat4.create();
  
  // View matrix
  var viewMatrix = mat4.create();
  var eye = vec3.fromValues(0.0, 0.0, 2.0);
  var at = vec3.fromValues(0.0, 0.0, 0.0);
  var up = vec3.fromValues(0.0, -1.0, 0.0);
  mat4.lookAt(viewMatrix, eye, at, up);

  // Projection matrix
  var projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, 30.0, canvas.width/canvas.height, 0.1, 100.0);

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
  var scene = new Scene(gl, "./models/damagedHelmet/", "./models/damagedHelmet/Helmet.gltf");

  document.onkeydown = function(ev) {keydown(ev, gl, scene, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);};

  // Initialize GUI  
  var gui = new dat.GUI();
  var folder = gui.addFolder("Metallic-Roughness Material");
  var material = {
    'Base Color': [180, 180, 180],
    'Metallic': 0.5,
    'Roughness': 0.5
  };
  folder.addColor(material, 'Base Color').onChange(function(value) {
    updateDiffuse(value, gl, scene, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
  });
  folder.add(material, 'Metallic', 0.0, 1.0).onChange(function(value) {
    updateMetallic(value, gl, scene, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
  });
  folder.add(material, 'Roughness', 0.0, 1.0).onChange(function(value) {
    updateRoughness(value, gl, scene, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
  });
  folder.open();
  updateDiffuse(material["Base Color"], gl, scene, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
  updateMetallic(material["Metallic"], gl, scene, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
  updateRoughness(material["Roughness"], gl, scene, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);

  // Draw 
  var tick = function() {
    animate(roll);
    scene.drawScene(gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
    requestAnimationFrame(tick);
  };
  tick();
}

/***** ANIMATE ******/
var roll = 0.0;
var pitch = 0.0;
var prev = Date.now();
function animate(angle) {
  var curr = Date.now();
  var elapsed = curr - prev;
  prev = curr;
  roll = angle + ((Math.PI / 16.0) * elapsed) / 1000.0;
}

/****** KEYDOWN EVENT ******/
function keydown(ev, gl, scene, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix) {
  switch (ev.keyCode) {
    case 39: roll+=0.02; break;
    case 37: roll-=0.02; break;
    case 38: pitch+=0.02; break;
    case 40: pitch-=0.02; break;
    default: return;
  }

  scene.drawScene(gl, modelMatrix, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
}
