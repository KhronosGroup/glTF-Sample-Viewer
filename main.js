function loadCubeMap(gl, envMap, type) { 
  var texture = gl.createTexture();
  var textureNumber = -1;
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
  loadCubeMap(gl, envMap, "diffuse");
  loadCubeMap(gl, envMap, "specular");

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
  mat4.perspective(projectionMatrix, 70.0, canvas.width/canvas.height, 0.01, 100.0);

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
  document.onwheel = function(ev) {handleWheel(ev, gl, scene);};

  // Initialize GUI  
  var gui = new dat.GUI();
  var folder = gui.addFolder("Metallic-Roughness Material");

  var text = {Model: "Avocado"};
  folder.add(text, 'Model', ['Avocado', 'BarramundiFish', 'BoomBox', 'Corset', 'Telephone']).onChange(function(value) {
    scene = updateModel(value, gl, scene, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix);
  });
  folder.open();

  var tick = function() {
    animate(roll);
    scene.drawScene(gl);
    requestAnimationFrame(tick);
  };
  // Uncomment for turntable
  //tick();
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

function handleMouseMove(ev, gl, scene) {
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

function handleWheel(ev, gl, scene) {
  ev.preventDefault();
  if (ev.wheelDelta > 0) {
    translate += 0.04;
  }
  else {
    translate -= 0.04;
  }
  scene.drawScene(gl);
}

var prev = Date.now();
function animate(angle) {
  var curr = Date.now();
  var elapsed = curr - prev;
  prev = curr;
  roll = angle + ((Math.PI / 4.0) * elapsed) / 1000.0;
}


