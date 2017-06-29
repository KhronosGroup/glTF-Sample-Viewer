function loadCubeMap(gl, envMap, type, state) {
    var texture = gl.createTexture();
    var textureNumber = -1;
    var activeTextureEnum = gl.TEXTURE0;
    var mipLevels = 0;
    var uniformName = 'u_EnvSampler';
    if (type === "diffuse") {
        uniformName = 'u_DiffuseEnvSampler';
        activeTextureEnum = gl.TEXTURE1;
        textureNumber = 1;
        mipLevels = 1;
    }
    else if (type === "specular") {
        uniformName = 'u_SpecularEnvSampler';
        activeTextureEnum = gl.TEXTURE2;
        textureNumber = 2;
        mipLevels = 10;
    }
    else if (type === "environment") {
        uniformName = 'u_EnvSampler';
        activeTextureEnum = gl.TEXTURE0;
        textureNumber = 0;
        mipLevels = 1;
    }
    else {
        var error = document.getElementById('error');
        error.innerHTML += 'Invalid type of cubemap loaded<br>';
        return -1;
    }
    gl.activeTexture(activeTextureEnum);
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
        var faces = [[path + "_right_" + j + ".jpg", gl.TEXTURE_CUBE_MAP_POSITIVE_X],
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
                    gl.activeTexture(activeTextureEnum);
                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                    // todo:  should this be srgb?  or rgba?  what's the HDR scale on this?
                    gl.texImage2D(face, j, state.sRGBifAvailable, state.sRGBifAvailable, gl.UNSIGNED_BYTE, image);
                }
            }(texture, face, image, j);
            image.src = faces[i][0];
        }
    }

    state.uniforms[uniformName] = { 'funcName': 'uniform1i', 'vals': [textureNumber] };
    return 1;
}

// Update model from dat.gui change
function updateModel(value, gl, glState, viewMatrix, projectionMatrix, backBuffer, frontBuffer) {
    var error = document.getElementById('error');
    glState.scene = null;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    $.ajax({
        url: 'models/' + value + '/glTF/' + value + '.gltf',
        dataType: 'json',
        async: true,
        error: (jqXhr, textStatus, errorThrown) => {
            error.innerHTML += 'Failed to load model: ' + errorThrown + '<br>';
        },
        success: function(gltf) {
            var scene = new Scene(gl, glState, "./models/" + value + "/glTF/", gltf);
            scene.projectionMatrix = projectionMatrix;
            scene.viewMatrix = viewMatrix;
            scene.backBuffer = backBuffer;
            scene.frontBuffer = frontBuffer;
            glState.scene = scene;
        }
    });
}

function main() {
    var error = document.getElementById('error');
    var vertDeferred = $.ajax({
        url: './shaders/pbr-vert.glsl',
        dataType: 'text',
        async: true,
        error: (jqXhr, textStatus, errorThrown) => {
            error.innerHTML += 'Failed to load the vertex shader: ' + errorThrown + '<br>';
        }
    });
    var fragDeferred = $.ajax({
        url: './shaders/pbr-frag.glsl',
        dataType: 'text',
        async: true,
        error: (jqXhr, textStatus, errorThrown) => {
            error.innerHTML += 'Failed to load the fragment shader: ' + errorThrown + '<br>';
        }
    });
    $.when(vertDeferred, fragDeferred).then((vertSource, fragSource) => {
        init(vertSource[0], fragSource[0]);
    });
}

function init(vertSource, fragSource) {
    var canvas = document.getElementById('canvas');
    var canvas2d = document.getElementById('canvas2d');
    var error = document.getElementById('error');
    if (!canvas) {
        error.innerHTML += 'Failed to retrieve the canvas element<br>';
        return;
    }
    var canvasWidth = -1;
    var canvasHeight = -1;
    canvas.hidden = true;

    var gl = canvas.getContext("webgl", {}) || canvas.getContext("experimental-webgl", {});
    if (!gl) {
        error.innerHTML += 'Failed to get the rendering context for WebGL<br>';
        return;
    }

    var ctx2d = canvas2d.getContext("2d");

    var hasSRGBExt = gl.getExtension('EXT_SRGB');

    glState = {
        uniforms: {},
        attributes: {},
        vertSource: vertSource,
        fragSource: fragSource,
        scene: null,
        hasLODExtension:gl.getExtension('EXT_shader_texture_lod'),
        hasDerivativesExtension:gl.getExtension('OES_standard_derivatives'),
        sRGBifAvailable: (hasSRGBExt ? hasSRGBExt.SRGB_EXT : gl.RGBA)
    };

    var projectionMatrix = mat4.create();
    function resizeCanvasIfNeeded() {
        var width = Math.max(1, window.innerWidth);
        var height = Math.max(1, window.innerHeight);
        if (width !== canvasWidth || height !== canvasHeight) {
            canvas.width = canvas2d.width = canvasWidth = width;
            canvas.height = canvas2d.height = canvasHeight = height;
            gl.viewport(0, 0, width, height);
            mat4.perspective(projectionMatrix, 45.0 * Math.PI / 180.0, width / height, 0.01, 100.0);
        }
    }

    // Create cube maps
    var envMap = "papermill";
    //loadCubeMap(gl, envMap, "environment");
    loadCubeMap(gl, envMap, "diffuse", glState);
    loadCubeMap(gl, envMap, "specular", glState);
    // Get location of mvp matrix uniform
    glState.uniforms['u_mvpMatrix'] = { 'funcName': 'uniformMatrix4fv' };
    // Get location of normal matrix uniform
    glState.uniforms['u_modelMatrix'] = { 'funcName': 'uniformMatrix4fv' };

    // Light
    glState.uniforms['u_LightDirection'] = { 'funcName': 'uniform3f', 'vals': [0.0, 0.5, 0.5] };
    glState.uniforms['u_LightColor'] = { 'funcName': 'uniform3f', 'vals': [1.0, 1.0, 1.0] };

    // Camera
    glState.uniforms['u_Camera'] = { 'funcName': 'uniform3f', vals: [0.0, 0.0, -4.0] };

    // Model matrix
    var modelMatrix = mat4.create();

    // View matrix
    var viewMatrix = mat4.create();
    var eye = vec3.fromValues(0.0, 0.0, 4.0);
    var at = vec3.fromValues(0.0, 0.0, 0.0);
    var up = vec3.fromValues(0.0, 1.0, 0.0);
    mat4.lookAt(viewMatrix, eye, at, up);

    // get scaling stuff
    glState.uniforms['u_scaleDiffBaseMR'] = { 'funcName': 'uniform4f', vals: [0.0, 0.0, 0.0, 0.0] };
    glState.uniforms['u_scaleFGDSpec'] = { 'funcName': 'uniform4f', vals: [0.0, 0.0, 0.0, 0.0] };
    glState.uniforms['u_scaleIBLAmbient'] = { 'funcName': 'uniform4f', vals: [1.0, 1.0, 1.0, 1.0] };

    // Load scene
    var defaultModelName = 'DamagedHelmet';
    updateModel(defaultModelName, gl, glState, viewMatrix, projectionMatrix, canvas, ctx2d);

    // Set clear color
    gl.clearColor(0.2, 0.2, 0.2, 1.0);

    // Enable depth test
    gl.enable(gl.DEPTH_TEST);

    var redrawQueued = false;
    var redraw = function() {
        if (!redrawQueued) {
            redrawQueued = true;
            window.requestAnimationFrame(function() {
                redrawQueued = false;
                resizeCanvasIfNeeded();
                var scene = glState.scene;
                if (scene) {
                    scene.drawScene(gl);
                }
            });
        }
    };

    // Set control callbacks
    canvas2d.onmousedown = function(ev) { handleMouseDown(ev); };
    document.onmouseup = function(ev) { handleMouseUp(ev); };
    document.onmousemove = function(ev) { handleMouseMove(ev, redraw); };
    document.onwheel = function(ev) { handleWheel(ev, redraw); };

    // Initialize GUI
    var gui = new dat.GUI();
    var folder = gui.addFolder("Metallic-Roughness Material");


    var text = { Model: defaultModelName };
    folder.add(text, 'Model', ['MetalRoughSpheres', 'AppleTree', 'Avocado', 'BarramundiFish', 'BoomBox', 'Corset', 'DamagedHelmet', 'FarmLandDiorama', 'NormalTangentTest', 'Telephone', 'TextureSettingsTest', 'Triangle', 'WaterBottle']).onChange(function(value) {
        updateModel(value, gl, glState, viewMatrix, projectionMatrix, canvas, ctx2d);
    });
    folder.open();

    var light = gui.addFolder("Directional Light");
    var lightProps = { lightColor: [255, 255, 255], lightScale: 1.0, lightRotation: 75, lightPitch: 40 };

    var updateLight = function(value) {
        glState.uniforms['u_LightColor'].vals = [lightProps.lightScale * lightProps.lightColor[0] / 255,
        lightProps.lightScale * lightProps.lightColor[1] / 255,
        lightProps.lightScale * lightProps.lightColor[2] / 255];

        var rot = lightProps.lightRotation * Math.PI / 180;
        var pitch = lightProps.lightPitch * Math.PI / 180;
        glState.uniforms['u_LightDirection'].vals = [Math.sin(rot) * Math.cos(pitch),
        Math.sin(pitch),
        Math.cos(rot) * Math.cos(pitch)];

        redraw();
    };

    light.addColor(lightProps, "lightColor").onChange(updateLight);
    light.add(lightProps, "lightScale", 0, 10).onChange(updateLight);
    light.add(lightProps, "lightRotation", 0, 360).onChange(updateLight);
    light.add(lightProps, "lightPitch", -90, 90).onChange(updateLight);

    light.open();


    updateLight();

    //mouseover scaling

    var scaleVals = {
        IBL: 1.0,
    };
    var updateMathScales = function(v) {
        var el = scaleVals.pinnedElement ? scaleVals.pinnedElement : scaleVals.activeElement;
        var elId = el ? el.attr('id') : null;

        glState.uniforms['u_scaleDiffBaseMR'].vals = [elId == "mathDiff" ? 1.0 : 0.0, elId == "baseColor" ? 1.0 : 0.0, elId == "metallic" ? 1.0 : 0.0, elId == "roughness" ? 1.0 : 0.0];
        glState.uniforms['u_scaleFGDSpec'].vals = [elId == "mathF" ? 1.0 : 0.0, elId == "mathG" ? 1.0 : 0.0, elId == "mathD" ? 1.0 : 0.0, elId == "mathSpec" ? 1.0 : 0.0];
        glState.uniforms['u_scaleIBLAmbient'].vals = [scaleVals.IBL, scaleVals.IBL, 0.0, 0.0];

        redraw();
    };

    gui.add(scaleVals, "IBL", 0, 4).onChange(updateMathScales);

    var setActiveComponent = function(el) {
        if (scaleVals.activeElement) {
            scaleVals.activeElement.removeClass("activeComponent");
        }
        if (el && !scaleVals.pinnedElement) {
            el.addClass("activeComponent");
        }
        scaleVals.activeElement = el;

        if (!scaleVals.pinnedElement) {
            updateMathScales();
        }
    };

    var setPinnedComponent = function(el) {
        if (scaleVals.activeElement) {
            if (el) {
                scaleVals.activeElement.removeClass("activeComponent");
            }
            else {
                scaleVals.activeElement.addClass("activeComponent");
            }
        }

        if (scaleVals.pinnedElement) {
            scaleVals.pinnedElement.removeClass("pinnedComponent");
        }
        if (el) {
            el.addClass("pinnedComponent");
        }

        scaleVals.pinnedElement = el;

        updateMathScales();
    };

    var createMouseOverScale = function() {
        var localArgs = arguments;
        var el = $(localArgs[0]);
        el.hover(
            function(ev) {
                setActiveComponent(el);
            },
            function(ev) {
                setActiveComponent(null);
            });

        el.click(
            function(ev) {
                if (scaleVals.pinnedElement) {
                    setPinnedComponent(null);
                }
                else {
                    setPinnedComponent(el);
                }
                ev.stopPropagation();
            }
        );
    };

    createMouseOverScale('#mathDiff', 'diff');
    createMouseOverScale('#mathSpec', 'spec');
    createMouseOverScale('#mathF', 'F');
    createMouseOverScale('#mathG', 'G');
    createMouseOverScale('#mathD', 'D');
    createMouseOverScale("#baseColor", "baseColor");
    createMouseOverScale("#metallic", "metallic");
    createMouseOverScale("#roughness", "roughness");

    $("#pbrMath").click(function(ev) {
        if (scaleVals.pinned && scaleVals.pinnedElement) {
            $(scaleVals.pinnedElement).removeClass("pinnedComponent");
        }
        scaleVals.pinned = false;
    });

    updateMathScales();

    function format255(p) {
        var str = p.toString();
        return ' '.repeat(3).substring(str.length) + str;
    }

    // picker
    var pixelPickerText = document.getElementById('pixelPickerText');
    var pixelPickerColor = document.getElementById('pixelPickerColor');
    var pixelPickerPos = { x: 0, y: 0 };
    var pixelPickerScheduled = false;
    function sample2D() {
        pixelPickerScheduled = false;
        var x = pixelPickerPos.x;
        var y = pixelPickerPos.y;
        var p = ctx2d.getImageData(x, y, 1, 1).data;
        pixelPickerText.innerHTML =
            "r:  " + format255(p[0]) + " g:  " + format255(p[1]) + " b:  " + format255(p[2]) +
            "<br>r: " + (p[0] / 255).toFixed(2) + " g: " + (p[1] / 255).toFixed(2) + " b: " + (p[2] / 255).toFixed(2);
        pixelPickerColor.style.backgroundColor = 'rgb(' + p[0] + ',' + p[1] + ',' + p[2] + ')';
    }
    $(canvas2d).mousemove(function(e) {
        var pos = $(canvas2d).position();
        pixelPickerPos.x = e.pageX - pos.left;
        pixelPickerPos.y = e.pageY - pos.top;
        if (!pixelPickerScheduled) {
            pixelPickerScheduled = true;
            window.requestAnimationFrame(sample2D);
        }
    });

    // Redraw the scene after window size changes.
    $(window).resize(redraw);

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
var roll = Math.PI;
var pitch = 0.0;
var translate = 4.0;
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

var wheelSpeed = 1.04;
function handleWheel(ev, redraw) {
    ev.preventDefault();
    if (ev.deltaY > 0) {
        translate *= wheelSpeed;
    }
    else {
        translate /= wheelSpeed;
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
