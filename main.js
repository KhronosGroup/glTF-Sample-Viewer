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
    var error = document.getElementById('error');
    error.innerHTML += 'Invalid type of cubemap loaded<br>';
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
function updateModel(value, gl, scene, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix, backBuffer, frontBuffer) {
  scene = new Scene(gl, "./models/" + value + "/glTF/", "./models/" + value + "/glTF/" + value + ".gltf");
  scene.projectionMatrix = projectionMatrix;
  scene.viewMatrix = viewMatrix;
  scene.u_mvpMatrix = u_mvpMatrix;
  scene.u_NormalMatrix = u_NormalMatrix;
  scene.backBuffer = backBuffer;
  scene.frontBuffer = frontBuffer;
  return scene;
}

function main() {
  var canvas = document.getElementById('canvas');
  var canvas2d = document.getElementById('canvas2d');
  var error = document.getElementById('error');
  error.width = window.innerWidth;
  if (!canvas) {
    error.innerHTML += 'Failed to retrieve the canvas element<br>';
    return;
  }
  canvas.width = canvas2d.width = window.innerWidth;
  canvas.height = canvas2d.height = window.innerHeight;
  canvas.hidden = true;

  var gl = canvas.getContext("webgl", {}) || canvas.getContext("experimental-webgl", {});
  if (!gl) {
    error.innerHTML += 'Failed to get the rendering context for WebGL<br>';
    return;
  }

  var ctx2d = canvas2d.getContext("2d");

  // Load extensions
  var lodExt = gl.getExtension('EXT_shader_texture_lod');
  gl.getExtension('OES_standard_derivatives');

  // Initialize shaders
  $.ajaxSetup({
    async: false
  });

  var shaderDefines = "#define USE_SAVED_TANGENTS 1\n#define USE_MATHS 1\n#define USE_IBL 1\n";
  if( lodExt ) {
    shaderDefines += "#define USE_TEX_LOD\n";
  }
 
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  $.get("./shaders/pbr-vert.glsl", function(response) {
    gl.shaderSource(vertexShader, shaderDefines+response);
  });
  gl.compileShader(vertexShader);
  var compiled = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
  if (!compiled) {
    error.innerHTML += 'Failed to compile the vertex shader<br>';
    var compilationLog = gl.getShaderInfoLog(vertexShader);
    error.innerHTML += 'Shader compiler log: ' + compilationLog + '<br>';
  }

  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  $.get("./shaders/pbr-frag.glsl", function(response) {
    gl.shaderSource(fragmentShader, shaderDefines+response);
  });
  gl.compileShader(fragmentShader);
  compiled = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
  if (!compiled) {
    error.innerHTML += 'Failed to compile the fragment shader<br>';
    var compilationLog = gl.getShaderInfoLog(fragmentShader);
    error.innerHTML += 'Shader compiler log: ' + compilationLog + '<br>';
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
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');
  gl.uniform3f(u_LightDirection, 0.0, 0.5, 0.5);
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  gl.uniform3f(u_LightColor, 0.0, 0.5, 0.5);


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

  // get scaling stuff
  var u_scaleDiffSpecAmbient = gl.getUniformLocation(gl.program, 'u_scaleDiffSpecAmbient');
  var u_scaleFGD = gl.getUniformLocation(gl.program, 'u_scaleFGD');

  var scaleVals = {
    diff:0.0,
    spec:0.0,
    IBL:0.5,
    F:0.0,
    G:0.0,
    D:0.0,
    metallic:0.0,
    roughness:0.0,
    pinned:false
  }

  // Set clear color
  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  
  // Enable depth test
  gl.enable(gl.DEPTH_TEST);

  // Clear canvas
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Load scene
  //var scene = new Scene(gl, "./models/DamagedHelmetModified/glTF/", "./models/DamagedHelmetModified/glTF/DamagedHelmetModified.gltf");
  //var scene = new Scene(gl, "./models/MetalRoughSpheres/glTF/", "./models/MetalRoughSpheres/glTF/MetalRoughSpheres.gltf");
  var scene = new Scene(gl, "./models/BoomBox/glTF/", "./models/BoomBox/glTF/BoomBox.gltf")
  scene.projectionMatrix = projectionMatrix;
  scene.viewMatrix = viewMatrix;
  scene.u_mvpMatrix = u_mvpMatrix;
  scene.u_NormalMatrix = u_NormalMatrix;
  scene.backBuffer = canvas;
  scene.frontBuffer = ctx2d;

  var redraw = function() {
    
    window.requestAnimationFrame(function() {
    scene.drawScene(gl);
    })
  }

  // Set control callbacks
  canvas2d.onmousedown = function(ev) {handleMouseDown(ev);};
  document.onmouseup = function(ev) {handleMouseUp(ev);};
  document.onmousemove = function(ev) {handleMouseMove(ev, redraw);};
  document.onwheel = function(ev) {handleWheel(ev, redraw);};

  // Initialize GUI  
  var gui = new dat.GUI();
  var folder = gui.addFolder("Metallic-Roughness Material");

  var text = {Model: "BoomBox"};
  folder.add(text, 'Model', ['MetalRoughSpheres', 'Avocado', 'BarramundiFish', 'BoomBox', 'Corset', 'Telephone', 'Triangle']).onChange(function(value) {
    scene = updateModel(value, gl, scene, viewMatrix, projectionMatrix, u_mvpMatrix, u_NormalMatrix, canvas, ctx2d);
  });
  folder.open();

  var light = gui.addFolder("Directional Light");
  var lightProps = {lightColor:[255,255,255], lightScale:1.0, lightRotation:75, lightPitch:40 };

  var updateLight = function(value) {
    gl.uniform3f(u_LightColor, lightProps.lightScale*lightProps.lightColor[0]/255, lightProps.lightScale*lightProps.lightColor[1]/255, lightProps.lightScale*lightProps.lightColor[2]/255);
    var rot = lightProps.lightRotation * Math.PI / 180;
    var pitch = lightProps.lightPitch * Math.PI / 180;
    gl.uniform3f(u_LightDirection, Math.sin(rot)*Math.cos(pitch),
                                   Math.sin(pitch),
                                   Math.cos(rot)*Math.cos(pitch));
    
    redraw();
  };

  var updateDir = function(value) {
    updateLight(value);
  }

  light.addColor(lightProps, "lightColor").onChange(updateDir);
  light.add(lightProps, "lightScale", 0, 4).onChange(updateDir);
  light.add(lightProps, "lightRotation", 0, 360).onChange(updateDir);
  light.add(lightProps, "lightPitch", -90, 90).onChange(updateDir);
  
  light.open();


  updateLight();

  //mouseover scaling
  var updateMathScales = function(v) {
    var sEl = scaleVals.pinnedElement;
    gl.uniform4f(u_scaleDiffSpecAmbient, sEl=="#mathDiff"?1.0:0.0, sEl=="#mathSpec"?1.0:0.0, scaleVals.IBL, sEl=="#metallic"?1.0:0.0);
    gl.uniform4f(u_scaleFGD, sEl=="#mathF"?1.0:0.0, sEl=="#mathG"?1.0:0.0, sEl=="#mathD"?1.0:0.0, sEl=="#roughness"?1.0:0.0);

    redraw();
  }

  gui.add(scaleVals, "IBL", 0., 1.).onChange(updateMathScales);

  var createMouseOverScale = function() {
    var localArgs = arguments;
    var el = $(localArgs[0]);
    el.hover(
      function(ev) {
        if(!scaleVals.pinned)
        {
          scaleVals.pinnedElement = localArgs[0];
          el.addClass("activeComponent");
          updateMathScales();
        }
      },
      function(ev) {
        if(!scaleVals.pinned)
        {
          scaleVals.pinnedElement = null;
          el.removeClass("activeComponent");
          updateMathScales();
        }
      });
    
    el.click(
      function(ev) {
        if( scaleVals.pinned && scaleVals.pinnedElement) {
          scaleVals.pinnedElement = null;
          $(scaleVals.pinnedElement).removeClass("pinnedComponent");
        }
        else {
          scaleVals.pinnedElement = localArgs[0];
          el.removeClass("activeComponent");
          el.addClass("pinnedComponent");
        }
        scaleVals.pinned = !scaleVals.pinned;

        ev.stopPropagation();
      }
    )
  }

  createMouseOverScale('#mathDiff', 'diff');
  createMouseOverScale('#mathSpec', 'spec');
  createMouseOverScale('#mathF', 'F');
  createMouseOverScale('#mathG', 'G');
  createMouseOverScale('#mathD', 'D');
  createMouseOverScale("#metallic", "metallic");
  createMouseOverScale("#roughness", "roughness");

  $("#pbrMath").click(function(ev) {
        if( scaleVals.pinned && scaleVals.pinnedElement) {
          $(scaleVals.pinnedElement).removeClass("pinnedComponent");
        }
        scaleVals.pinned = false;
  });

  updateMathScales();

  // picker
  $(canvas2d).mousemove(function(e) {
    var pos = $(canvas2d).position();
    var x = e.pageX - pos.left;
    var y = e.pageY - pos.top;
    var coord = "x=" + x + ", y=" + y;
    var p = ctx2d.getImageData(x, y, 1, 1).data; 
    $('#pixelPicker').html("r: "+p[0]+" g: "+p[1]+" b: "+p[2]+"<br>r: "+(p[0]/255.).toFixed(2)+" g: "+(p[1]/255.).toFixed(2)+" b: "+(p[2]/255.).toFixed(2));
  });

  var tick = function() {
    animate(roll);
    redraw();
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

function handleMouseMove(ev, redraw) {
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

  redraw();
}

function handleWheel(ev, redraw) {
  ev.preventDefault();
  if (ev.wheelDelta > 0) {
    translate += 0.04;
  }
  else {
    translate -= 0.04;
  }

  redraw();
}

var prev = Date.now();
function animate(angle) {
  var curr = Date.now();
  var elapsed = curr - prev;
  prev = curr;
  roll = angle + ((Math.PI / 4.0) * elapsed) / 1000.0;
}


