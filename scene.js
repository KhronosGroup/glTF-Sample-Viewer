var assets = {};

function defined(value) {
    return value !== undefined && value !== null;
}

class Mesh {
    constructor(gl, scene, globalState, modelPath, gltf, meshIdx) {
        this.modelPath = modelPath;
        this.scene = scene;

        this.defines = {
            'USE_MATHS': 1,
            'USE_IBL': 1,
        };

        this.glState = {
            uniforms: {},
            uniformLocations: {},
            attributes: {},
            vertSource: globalState.vertSource,
            fragSource: globalState.fragSource,
            sRGBifAvailable : globalState.sRGBifAvailable
        };

        var primitives = gltf.meshes[meshIdx].primitives;
        // todo:  multiple primitives doesn't work.
        for (let i = 0; i < primitives.length; i++) {
            var primitive = primitives[Object.keys(primitives)[i]];

            for (let attribute in primitive.attributes) {
                switch (attribute) {
                    case "NORMAL":
                        this.defines.HAS_NORMALS = 1;
                        break;
                    case "TANGENT":
                        this.defines.HAS_TANGENTS = 1;
                        break;
                    case "TEXCOORD_0":
                        this.defines.HAS_UV = 1;
                        break;
                }
            }

            // Material
            var materialName = primitive.material;
            if (defined(materialName)) {
                this.material = gltf.materials[materialName];
            }
            var imageInfos = this.initTextures(gl, gltf);

            this.initProgram(gl);

            this.accessorsLoading = 0;
            // Attributes
            for (let attribute in primitive.attributes) {
                getAccessorData(this, gl, gltf, modelPath, primitive.attributes[attribute], attribute);
            }

            // Indices
            getAccessorData(this, gl, gltf, modelPath, primitive.indices, 'INDEX');

            loadImages(imageInfos, gl, this);
        }
    }


    initProgram(gl) {
        var definesToString = function(defines) {
            var outStr = '';
            for (var def in defines) {
                outStr += '#define ' + def + ' ' + defines[def] + '\n';
            }
            return outStr;
        };

        var shaderDefines = definesToString(this.defines);//"#define USE_SAVED_TANGENTS 1\n#define USE_MATHS 1\n#define USE_IBL 1\n";
        if (gl.hasLodExt) {
            shaderDefines += '#define USE_TEX_LOD 1\n';
        }

        var vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, shaderDefines + this.glState.vertSource);
        gl.compileShader(vertexShader);
        var compiled = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
        if (!compiled) {
            error.innerHTML += 'Failed to compile the vertex shader<br>';
            let compilationLog = gl.getShaderInfoLog(vertexShader);
            error.innerHTML += 'Shader compiler log: ' + compilationLog + '<br>';
        }

        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, shaderDefines + this.glState.fragSource);
        gl.compileShader(fragmentShader);
        compiled = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
        if (!compiled) {
            error.innerHTML += 'Failed to compile the fragment shader<br>';
            let compilationLog = gl.getShaderInfoLog(fragmentShader);
            error.innerHTML += 'Shader compiler log: ' + compilationLog + '<br>';
        }

        var program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        this.program = program;
    }

    drawMesh(gl, transform, view, projection, globalState) {
        // Update model matrix
        var modelMatrix = mat4.create();
        mat4.multiply(modelMatrix, modelMatrix, transform);

        // Update view matrix
        // roll, pitch and translate are all globals. :)
        var xRotation = mat4.create();
        mat4.rotateY(xRotation, xRotation, roll);
        var yRotation = mat4.create();
        mat4.rotateX(yRotation, yRotation, pitch);
        view = mat4.create();
        mat4.multiply(view, yRotation, xRotation);
        view[14] = -translate;

        if (this.material.doubleSided) {
            gl.disable(gl.CULL_FACE);
        } else {
            gl.enable(gl.CULL_FACE);
        }

        // set this outside of this function
        var cameraPos = [view[14] * Math.sin(roll) * Math.cos(-pitch),
            view[14] * Math.sin(-pitch),
            -view[14] * Math.cos(roll) * Math.cos(-pitch)];
        globalState.uniforms['u_Camera'].vals = cameraPos;

        // Update mvp matrix
        var mvMatrix = mat4.create();
        var mvpMatrix = mat4.create();
        mat4.multiply(mvMatrix, view, modelMatrix);
        mat4.multiply(mvpMatrix, projection, mvMatrix);
        // these should actually be local to the mesh (not in global)
        globalState.uniforms['u_mvpMatrix'].vals = [false, mvpMatrix];

        // Update normal matrix
        globalState.uniforms['u_NormalMatrix'].vals = [false, modelMatrix];

        applyState(gl, this.program, globalState, this.glState);

        // Draw
        if (defined(this.indicesAccessor)) {
            gl.drawElements(gl.TRIANGLES, this.indicesAccessor.count, gl.UNSIGNED_SHORT, this.indicesAccessor.byteOffset);
        }

        disableState(gl, globalState, this.glState);
    }

    initArrayBuffer(gl, data, num, type, attribute, stride, offset) {
        var buffer = gl.createBuffer();
        if (!buffer) {
            var error = document.GetElementById('error');
            error.innerHTML += 'Failed to create the buffer object<br>';
            return -1;
        }

        gl.useProgram(this.program);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

        var a_attribute = gl.getAttribLocation(this.program, attribute);

        this.glState.attributes[attribute] = {
            'cmds': [
                { 'funcName': 'bindBuffer', 'vals': [gl.ARRAY_BUFFER, buffer] },
                { 'funcName': 'vertexAttribPointer', 'vals': [a_attribute, num, type, false, stride, offset] },
                { 'funcName': 'enableVertexAttribArray', 'vals': [a_attribute] }
            ],
            'a_attribute': a_attribute
        };
        return true;
    }

    initBuffers(gl, gltf) {
        var error = document.getElementById('error');
        var indexBuffer = gl.createBuffer();
        if (!indexBuffer) {
            error.innerHTML += 'Failed to create the buffer object<br>';
            return -1;
        }

        if (!this.initArrayBuffer(gl, this.vertices, 3, gl.FLOAT, 'a_Position', this.verticesAccessor.byteStride, this.verticesAccessor.byteOffset)) {
            error.innerHTML += 'Failed to initialize position buffer<br>';
        }

        if (this.normalsAccessor) {
            if (!this.initArrayBuffer(gl, this.normals, 3, gl.FLOAT, 'a_Normal', this.normalsAccessor.byteStride, this.normalsAccessor.byteOffset)) {
                error.innerHTML += 'Failed to initialize normal buffer<br>';
            }
        }

        if (this.tangentsAccessor) {
            if (!this.initArrayBuffer(gl, this.tangents, 4, gl.FLOAT, 'a_Tangent', this.tangentsAccessor.byteStride, this.tangentsAccessor.byteOffset)) {
                error.innerHTML += 'Failed to initialize tangent buffer<br>';
            }
        }

        if (this.texcoordsAccessor) {
            if (!this.initArrayBuffer(gl, this.texcoords, 2, gl.FLOAT, 'a_UV', this.texcoordsAccessor.byteStride, this.texcoordsAccessor.byteOffset)) {
                error.innerHTML += 'Failed to initialize texture buffer<br>';
            }
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        this.loadedBuffers = true;
        if (this.pendingTextures === 0) {
            this.scene.drawScene(gl);
        }
    }

    initTextures(gl, gltf) {
        var imageInfos = {};
        var pbrMat = this.material ? this.material.pbrMetallicRoughness : null;
        var samplerIndex = 3; // skip the first three because of the cubemaps

        // Base Color
        if (pbrMat && pbrMat.baseColorTexture && gltf.textures.length > pbrMat.baseColorTexture.index) {
            var baseColorTexInfo = gltf.textures[pbrMat.baseColorTexture.index];
            var baseColorSrc = this.modelPath + gltf.images[baseColorTexInfo.source].uri;
            imageInfos['baseColor'] = { 'uri': baseColorSrc, 'samplerIndex': samplerIndex, 'colorSpace': this.glState.sRGBifAvailable }; // colorSpace, samplerindex, uri
            this.glState.uniforms['u_BaseColorSampler'] = { 'funcName': 'uniform1i', 'vals': [samplerIndex] };
            samplerIndex++;
            this.defines.HAS_BASECOLORMAP = 1;
        }
        else if (this.glState.uniforms['u_BaseColorSampler']) {
            delete this.glState.uniforms['u_BaseColorSampler'];
        }

        // Metallic-Roughness
        if (pbrMat && pbrMat.metallicRoughnessTexture && gltf.textures.length > pbrMat.metallicRoughnessTexture.index) {
            var mrTexInfo = gltf.textures[pbrMat.metallicRoughnessTexture.index];
            var mrSrc = this.modelPath + gltf.images[mrTexInfo.source].uri;
            // gltf.samplers[mrTexInfo.sampler].magFilter etc
            imageInfos['metalRoughness'] = { 'uri': mrSrc, 'samplerIndex': samplerIndex, 'colorSpace': gl.RGBA };
            this.glState.uniforms['u_MetallicRoughnessSampler'] = { 'funcName': 'uniform1i', 'vals': [samplerIndex] };
            samplerIndex++;
            this.defines.HAS_METALROUGHNESSMAP = 1;
            if (this.glState.uniforms['u_MetallicRoughnessValues']) {
                delete this.glState.uniforms['u_MetallicRoughnessValues'];
            }
        }
        else {
            if (this.glState.uniforms['u_MetallicRoughnessSampler']) {
                delete this.glState.uniforms['u_MetallicRoughnessSampler'];
            }
            var metallic = (pbrMat && defined(pbrMat.metallicFactor)) ? pbrMat.metallicFactor : 1.0;
            var roughness = (pbrMat && defined(pbrMat.roughnessFactor)) ? pbrMat.roughnessFactor : 1.0;
            this.glState.uniforms['u_MetallicRoughnessValues'] = {
                funcName: 'uniform2f',
                vals: [metallic, roughness]
            };
        }

        // Normals
        if (this.material && this.material.normalTexture && gltf.textures.length > this.material.normalTexture.index) {
            var normalsTexInfo = gltf.textures[this.material.normalTexture.index];
            var normalsSrc = this.modelPath + gltf.images[normalsTexInfo.source].uri;
            imageInfos['normal'] = { 'uri': normalsSrc, 'samplerIndex': samplerIndex, 'colorSpace': gl.RGBA };
            this.glState.uniforms['u_NormalSampler'] = {
                funcName: 'uniform1i',
                vals: [samplerIndex]
            };
            samplerIndex++;
            this.defines.HAS_NORMALMAP = 1;
        }
        else if (this.glState.uniforms['u_NormalSampler']) {
            delete this.glState.uniforms['u_NormalSampler'];
        }

        // brdfLUT
        var brdfLUT = 'textures/brdfLUT.png';
        imageInfos['brdfLUT'] = { 'uri': brdfLUT, 'samplerIndex': samplerIndex, 'colorSpace': gl.RGBA };
        this.glState.uniforms['u_brdfLUT'] = { 'funcName': 'uniform1i', 'vals': [samplerIndex] };
        samplerIndex++;

        // Emissive
        if (this.material && this.material.emissiveTexture) {
            var emissiveTexInfo = gltf.textures[this.material.emissiveTexture.index];
            var emissiveSrc = this.modelPath + gltf.images[emissiveTexInfo.source].uri;
            imageInfos['emissive'] = { 'uri': emissiveSrc, 'samplerIndex': samplerIndex, 'colorSpace': this.glState.sRGBifAvailable }; // colorSpace, samplerindex, uri
            this.glState.uniforms['u_EmissiveSampler'] = { 'funcName': 'uniform1i', 'vals': [samplerIndex] };
            samplerIndex++;
            this.defines.HAS_EMISSIVEMAP = 1;
        }
        else if (this.glState.uniforms['u_EmissiveSampler']) {
            delete this.glState.uniforms['u_EmissiveSampler'];
        }

        // AO
        if (this.material && this.material.occlusionTexture) {
            var occlusionTexInfo = gltf.textures[this.material.occlusionTexture.index];
            var occlusionSrc = this.modelPath + gltf.images[occlusionTexInfo.source].uri;
            imageInfos['occlusion'] = { 'uri': occlusionSrc, 'samplerIndex': samplerIndex, 'colorSpace': gl.RGBA };
            this.glState.uniforms['u_OcclusionSampler'] = { 'funcName': 'uniform1i', 'vals': [samplerIndex] };
            samplerIndex++;
            this.defines.HAS_OCCLUSIONMAP = 1;
        }
        else if (this.glState.uniforms['u_OcclusionSampler']) {
            delete this.glState.uniforms['u_OcclusionSampler'];
        }

        return imageInfos;
    }
}

class Scene {
    constructor(gl, glState, model, gltf) {
        this.globalState = glState;

        this.nodes = gltf.nodes;
        this.meshes = [];
        for (var meshIdx in gltf.meshes) {
            this.meshes.push(new Mesh(gl, this, this.globalState, model, gltf, meshIdx));
        }
    }

    drawScene(gl) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        var drawNodeRecursive = function(scene, node, parentTransform) {
            // Transform
            var localTransform;
            if (node.matrix) {
                localTransform = mat4.clone(node.matrix);
            } else {
                localTransform = mat4.create();
                var scale = node.scale ? node.scale : [1.0, 1.0, 1.0];
                var rotation = node.rotation ? node.rotation : [0.0, 0.0, 0.0, 1.0];
                var translate = node.translation ? node.translation : [0.0, 0.0, 0.0];

                mat4.fromRotationTranslationScale(localTransform, rotation, translate, scale);
            }

            mat4.multiply(localTransform, localTransform, parentTransform);

            if (defined(node.mesh) && node.mesh < scene.meshes.length) {
                scene.meshes[node.mesh].drawMesh(gl, localTransform, scene.viewMatrix, scene.projectionMatrix, scene.globalState);
            }

            if (defined(node.children) && node.children.length > 0) {
                for (var i = 0; i < node.children.length; i++) {
                    drawNodeRecursive(scene, scene.nodes[node.children[i]], localTransform);
                }
            }
        };

        var firstNode = this.nodes[0];

        drawNodeRecursive(this, firstNode, mat4.create());

        // draw to the front buffer
        this.frontBuffer.drawImage(this.backBuffer, 0, 0);
    }
}

function getAccessorData(mesh, gl, gltf, model, accessorName, attribute) {
    mesh.accessorsLoading++;
    var accessor = gltf.accessors[accessorName];
    var bufferView = gltf.bufferViews[accessor.bufferView];
    var buffer = gltf.buffers[bufferView.buffer];
    var bin = buffer.uri;

    var reader = new FileReader();

    reader.onload = function(e) {
        var arrayBuffer = reader.result;
        var start = defined(bufferView.byteOffset) ? bufferView.byteOffset : 0;
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
            case "POSITION": mesh.vertices = data;
                mesh.verticesAccessor = accessor;
                break;
            case "NORMAL": mesh.normals = data;
                mesh.normalsAccessor = accessor;
                break;
            case "TANGENT": mesh.tangents = data;
                mesh.tangentsAccessor = accessor;
                break;
            case "TEXCOORD_0": mesh.texcoords = data;
                mesh.texcoordsAccessor = accessor;
                break;
            case "INDEX": mesh.indices = data;
                mesh.indicesAccessor = accessor;
                break;
        }

        mesh.accessorsLoading--;
        if (mesh.accessorsLoading === 0) {
            mesh.initBuffers(gl, gltf);
        }
    };

    var assetUrl = model + bin;
    var promise;
    if (assets.hasOwnProperty(assetUrl)) {
        // We already requested this, and a promise already exists.
        promise = assets[assetUrl];
    } else {
        // We didn't request this yet, create a promise for it.
        var deferred = $.Deferred();
        assets[assetUrl] = deferred;
        promise = deferred.promise();
        var oReq = new XMLHttpRequest();
        oReq.open("GET", model + bin, true);
        oReq.responseType = "blob";
        oReq.onload = function(e) {
            deferred.resolve(oReq.response);
        };
        oReq.send();
    }

    // This will fire when the promise is resolved, or immediately if the promise has previously resolved.
    promise.then(function(blob) {
        reader.readAsArrayBuffer(blob);
    });
}

function loadImage(imageInfo, gl, mesh) {
    var intToGLSamplerIndex = [gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2, gl.TEXTURE3, gl.TEXTURE4,
    gl.TEXTURE5, gl.TEXTURE6, gl.TEXTURE7, gl.TEXTURE8, gl.TEXTURE9];
    var image = new Image();
    mesh.pendingTextures++;
    image.src = imageInfo.uri;
    image.onload = function() {
        var texture = gl.createTexture();
        var glIndex = intToGLSamplerIndex[imageInfo.samplerIndex];
        gl.activeTexture(glIndex);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,/*imageInfo.colorSpace, imageInfo.colorSpace,*/ gl.UNSIGNED_BYTE, image);

        mesh.pendingTextures--;

        if (mesh.loadedBuffers === true && mesh.pendingTextures === 0) {
            mesh.scene.drawScene(gl);
        }
    };

    return image;
}

function loadImages(imageInfos, gl, mesh) {
    mesh.pendingTextures = 0;
    for (var i in imageInfos) {
        loadImage(imageInfos[i], gl, mesh);
    }
}

function applyState(gl, program, globalState, localState) {
    gl.useProgram(program);

    var applyUniform = function(u, uniformName) {
        if (!defined(localState.uniformLocations[uniformName])) {
            localState.uniformLocations[uniformName] = gl.getUniformLocation(program, uniformName);
        }

        if (u.funcName && defined(localState.uniformLocations[uniformName]) && u.vals) {
            gl[u.funcName](localState.uniformLocations[uniformName], ...u.vals);
        }
    };

    for (let uniform in globalState.uniforms) {
        applyUniform(globalState.uniforms[uniform], uniform);
    }

    for (let uniform in localState.uniforms) {
        applyUniform(localState.uniforms[uniform], uniform);
    }

    for (var attrib in localState.attributes) {
        var a = localState.attributes[attrib];
        for (var cmd in a.cmds) {
            var c = a.cmds[cmd];
            gl[c.funcName](...c.vals);
        }
    }
}

function disableState(gl, globalState, localState) {
    for (var attrib in localState.attributes) {
        // do something.
        gl.disableVertexAttribArray(localState.attributes[attrib].a_attribute);
    }
}
