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

            this.initProgram(gl, globalState);

            this.accessorsLoading = 0;
            // Attributes
            for (let attribute in primitive.attributes) {
                this.getAccessorData(gl, gltf, modelPath, primitive.attributes[attribute], attribute);
            }

            // Indices
            this.getAccessorData(gl, gltf, modelPath, primitive.indices, 'INDEX');

            loadImages(imageInfos, gl, this);
        }
    }


    initProgram(gl, globalState) {
        var definesToString = function(defines) {
            var outStr = '';
            for (var def in defines) {
                outStr += '#define ' + def + ' ' + defines[def] + '\n';
            }
            return outStr;
        };

        var shaderDefines = definesToString(this.defines);//"#define USE_SAVED_TANGENTS 1\n#define USE_MATHS 1\n#define USE_IBL 1\n";
        if (globalState.hasLODExtension) {
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

        if (this.material && this.material.doubleSided) {
            gl.disable(gl.CULL_FACE);
        } else {
            gl.enable(gl.CULL_FACE);
        }

        // Update mvp matrix
        var mvMatrix = mat4.create();
        var mvpMatrix = mat4.create();
        mat4.multiply(mvMatrix, view, modelMatrix);
        mat4.multiply(mvpMatrix, projection, mvMatrix);
        // these should actually be local to the mesh (not in global)
        globalState.uniforms['u_MVPMatrix'].vals = [false, mvpMatrix];

        // Update normal matrix
        globalState.uniforms['u_ModelMatrix'].vals = [false, modelMatrix];

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
        var samplerIndex;

        // Base Color
        var baseColorFactor = pbrMat && defined(pbrMat.baseColorFactor) ? pbrMat.baseColorFactor : [1.0, 1.0, 1.0, 1.0];
        this.glState.uniforms['u_BaseColorFactor'] = {
            funcName: 'uniform4f',
            vals: baseColorFactor
        };
        if (pbrMat && pbrMat.baseColorTexture && gltf.textures.length > pbrMat.baseColorTexture.index) {
            var baseColorTexInfo = gltf.textures[pbrMat.baseColorTexture.index];
            var baseColorSrc = this.modelPath + gltf.images[baseColorTexInfo.source].uri;
            samplerIndex = this.scene.getNextSamplerIndex();
            imageInfos['baseColor'] = { 'uri': baseColorSrc, 'samplerIndex': samplerIndex, 'colorSpace': this.glState.sRGBifAvailable }; // colorSpace, samplerindex, uri
            this.glState.uniforms['u_BaseColorSampler'] = { 'funcName': 'uniform1i', 'vals': [samplerIndex] };
            this.defines.HAS_BASECOLORMAP = 1;
        }
        else if (this.glState.uniforms['u_BaseColorSampler']) {
            delete this.glState.uniforms['u_BaseColorSampler'];
        }

        // Metallic-Roughness
        var metallic = (pbrMat && defined(pbrMat.metallicFactor)) ? pbrMat.metallicFactor : 1.0;
        var roughness = (pbrMat && defined(pbrMat.roughnessFactor)) ? pbrMat.roughnessFactor : 1.0;
        this.glState.uniforms['u_MetallicRoughnessValues'] = {
            funcName: 'uniform2f',
            vals: [metallic, roughness]
        };
        if (pbrMat && pbrMat.metallicRoughnessTexture && gltf.textures.length > pbrMat.metallicRoughnessTexture.index) {
            var mrTexInfo = gltf.textures[pbrMat.metallicRoughnessTexture.index];
            var mrSrc = this.modelPath + gltf.images[mrTexInfo.source].uri;
            // gltf.samplers[mrTexInfo.sampler].magFilter etc
            samplerIndex = this.scene.getNextSamplerIndex();
            imageInfos['metalRoughness'] = { 'uri': mrSrc, 'samplerIndex': samplerIndex, 'colorSpace': gl.RGBA };
            this.glState.uniforms['u_MetallicRoughnessSampler'] = { 'funcName': 'uniform1i', 'vals': [samplerIndex] };
            this.defines.HAS_METALROUGHNESSMAP = 1;
        }
        else {
            if (this.glState.uniforms['u_MetallicRoughnessSampler']) {
                delete this.glState.uniforms['u_MetallicRoughnessSampler'];
            }
        }

        // Normals
        if (this.material && this.material.normalTexture && gltf.textures.length > this.material.normalTexture.index) {
            var normalScale = defined(this.material.normalTexture.scale) ? this.material.normalTexture.scale : 1.0;
            var normalsTexInfo = gltf.textures[this.material.normalTexture.index];
            var normalsSrc = this.modelPath + gltf.images[normalsTexInfo.source].uri;
            samplerIndex = this.scene.getNextSamplerIndex();
            imageInfos['normal'] = { 'uri': normalsSrc, 'samplerIndex': samplerIndex, 'colorSpace': gl.RGBA };
            this.glState.uniforms['u_NormalSampler'] = {
                funcName: 'uniform1i',
                vals: [samplerIndex]
            };
            this.glState.uniforms['u_NormalScale'] = { 'funcName': 'uniform1f', 'vals': [normalScale] };
            this.defines.HAS_NORMALMAP = 1;
        }
        else if (this.glState.uniforms['u_NormalSampler']) {
            delete this.glState.uniforms['u_NormalSampler'];
        }

        // brdfLUT
        var brdfLUT = 'textures/brdfLUT.png';
        samplerIndex = this.scene.getNextSamplerIndex();
        imageInfos['brdfLUT'] = { 'uri': brdfLUT, 'samplerIndex': samplerIndex, 'colorSpace': gl.RGBA, 'clamp': true };
        this.glState.uniforms['u_brdfLUT'] = { 'funcName': 'uniform1i', 'vals': [samplerIndex] };

        // Emissive
        if (this.material && this.material.emissiveTexture) {
            var emissiveTexInfo = gltf.textures[this.material.emissiveTexture.index];
            var emissiveSrc = this.modelPath + gltf.images[emissiveTexInfo.source].uri;
            samplerIndex = this.scene.getNextSamplerIndex();
            imageInfos['emissive'] = { 'uri': emissiveSrc, 'samplerIndex': samplerIndex, 'colorSpace': this.glState.sRGBifAvailable }; // colorSpace, samplerindex, uri
            this.glState.uniforms['u_EmissiveSampler'] = { 'funcName': 'uniform1i', 'vals': [samplerIndex] };
            this.defines.HAS_EMISSIVEMAP = 1;
            var emissiveFactor = defined(this.material.emissiveFactor) ? this.material.emissiveFactor : [0.0, 0.0, 0.0];
            this.glState.uniforms['u_EmissiveFactor'] = {
                funcName: 'uniform3f',
                vals: emissiveFactor
            };
        }
        else if (this.glState.uniforms['u_EmissiveSampler']) {
            delete this.glState.uniforms['u_EmissiveSampler'];
        }

        // AO
        if (this.material && this.material.occlusionTexture) {
            var occlusionStrength = defined(this.material.occlusionTexture.strength) ? this.material.occlusionTexture.strength : 1.0;
            var occlusionTexInfo = gltf.textures[this.material.occlusionTexture.index];
            var occlusionSrc = this.modelPath + gltf.images[occlusionTexInfo.source].uri;
            samplerIndex = this.scene.getNextSamplerIndex();
            imageInfos['occlusion'] = { 'uri': occlusionSrc, 'samplerIndex': samplerIndex, 'colorSpace': gl.RGBA };
            this.glState.uniforms['u_OcclusionSampler'] = { 'funcName': 'uniform1i', 'vals': [samplerIndex] };
            this.glState.uniforms['u_OcclusionStrength'] = { 'funcName': 'uniform1f', 'vals': [occlusionStrength] };
            this.defines.HAS_OCCLUSIONMAP = 1;
        }
        else if (this.glState.uniforms['u_OcclusionSampler']) {
            delete this.glState.uniforms['u_OcclusionSampler'];
        }

        return imageInfos;
    }

    getAccessorData(gl, gltf, modelPath, accessorName, attribute) {
        var mesh = this;
        this.accessorsLoading++;
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
                default:
                    console.warn('Unknown attribute semantic: ' + attribute);
            }

            mesh.accessorsLoading--;
            if (mesh.accessorsLoading === 0) {
                mesh.initBuffers(gl, gltf);
            }
        };

        var assets = mesh.scene.assets;
        var assetUrl = modelPath + bin;
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
            oReq.open("GET", assetUrl, true);
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
}

//
// **** NOTE: The following functions are global ****
//

function loadImage(imageInfo, gl, mesh) {
    var image = new Image();
    mesh.pendingTextures++;
    image.src = imageInfo.uri;
    image.onload = function() {
        var texture = gl.createTexture();
        var glIndex = gl.TEXTURE0 + imageInfo.samplerIndex;  // gl.TEXTUREn enums are in numeric order.
        gl.activeTexture(glIndex);
        gl.bindTexture(gl.TEXTURE_2D, texture);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, imageInfo.clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, imageInfo.clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT);
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
