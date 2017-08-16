function defined(value) {
    return value !== undefined && value !== null;
}

class Primitive {
    constructor(gl, scene, globalState, modelPath, gltf, primitive) {
        this.modelPath = modelPath;
        this.scene = scene;

        this.defines = {
            'USE_MATHS': 1,
            'USE_IBL'  : 1,
        };

        this.localState = {
            uniforms        : {},
            uniformLocations: {},
            attributes      : {}
        };

        this.vertSource = globalState.vertSource;
        this.fragSource = globalState.fragSource;
        this.sRGBifAvailable = globalState.sRGBifAvailable;

        ++scene.pendingBuffers;

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
        
        scene.loadImages(imageInfos, gl, this);
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
        gl.shaderSource(vertexShader, shaderDefines + this.vertSource);
        gl.compileShader(vertexShader);
        var compiled = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
        if (!compiled) {
            error.innerHTML += 'Failed to compile the vertex shader<br>';
            let compilationLog = gl.getShaderInfoLog(vertexShader);
            error.innerHTML += 'Shader compiler log: ' + compilationLog + '<br>';
        }

        var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, shaderDefines + this.fragSource);
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

    drawPrimitive(gl, transform, view, projection, globalState) {
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
        
        // bind any textures for this mesh
        if (defined(this.material.samplers)) {
          this.material.samplers.forEach(function(sampler) {
            gl.activeTexture(sampler.index);
            gl.bindTexture(gl.TEXTURE_2D, sampler.texture);
          });
        }

        // these should actually be local to the mesh (not in global)
        globalState.uniforms['u_MVPMatrix'].vals = [false, mvpMatrix];

        // Update normal matrix
        globalState.uniforms['u_ModelMatrix'].vals = [false, modelMatrix];

        this.applyState(gl, globalState);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

        // Draw
        if (defined(this.indicesAccessor)) {
            gl.drawElements(gl.TRIANGLES, this.indicesAccessor.count, gl.UNSIGNED_SHORT, this.indicesAccessor.byteOffset);
        }

        this.disableState(gl);
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

        this.localState.attributes[attribute] = {
            'cmds': [
                { 'funcName': 'bindBuffer',              'vals': [gl.ARRAY_BUFFER, buffer] },
                { 'funcName': 'vertexAttribPointer',     'vals': [a_attribute, num, type, false, stride, offset] },
                { 'funcName': 'enableVertexAttribArray', 'vals': [a_attribute] }
            ],
            'a_attribute': a_attribute
        };
        return true;
    }

    initBuffers(gl, gltf) {
        var error = document.getElementById('error');
        this.indexBuffer = gl.createBuffer();
        if (!this.indexBuffer) {
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

        --this.scene.pendingBuffers;
        this.scene.drawScene(gl);
    }

    getImageInfo(gl, gltf, textureIndex, funcName, uniformName, colorSpace, samplerIndex) {
        var textureInfo = gltf.textures[textureIndex];
        var uri         = this.modelPath + gltf.images[textureInfo.source].uri;
//sg        var samplerIndex = this.scene.getNextSamplerIndex();
        this.localState.uniforms[uniformName] = { 'funcName': funcName, 'vals': [samplerIndex] };

        return {
            'uri'         : uri,
            'samplerIndex': samplerIndex,
            'colorSpace'  : colorSpace
        };
    }

    initTextures(gl, gltf) {
        var imageInfos   = {};
        var pbrMat       = this.material ? this.material.pbrMetallicRoughness : null;
        var samplerIndex = 3;;

        // Base Color
        var baseColorFactor = pbrMat && defined(pbrMat.baseColorFactor) ? pbrMat.baseColorFactor : [1.0, 1.0, 1.0, 1.0];
        this.localState.uniforms['u_BaseColorFactor'] = {
            funcName: 'uniform4f',
            vals: baseColorFactor
        };
        if (pbrMat && pbrMat.baseColorTexture && gltf.textures.length > pbrMat.baseColorTexture.index) {
            imageInfos['baseColor'] = this.getImageInfo(gl, gltf, pbrMat.baseColorTexture.index, 'uniform1i', 'u_BaseColorSampler', this.sRGBifAvailable, samplerIndex++);
            this.defines.HAS_BASECOLORMAP = 1;
        }
        else if (this.localState.uniforms['u_BaseColorSampler']) {
            delete this.localState.uniforms['u_BaseColorSampler'];
        }

        // Metallic-Roughness
        var metallic  = (pbrMat && defined(pbrMat.metallicFactor)) ? pbrMat.metallicFactor : 1.0;
        var roughness = (pbrMat && defined(pbrMat.roughnessFactor)) ? pbrMat.roughnessFactor : 1.0;
        this.localState.uniforms['u_MetallicRoughnessValues'] = {
            funcName: 'uniform2f',
            vals: [metallic, roughness]
        };
        if (pbrMat && pbrMat.metallicRoughnessTexture && gltf.textures.length > pbrMat.metallicRoughnessTexture.index) {
            imageInfos['metalRoughness'] = this.getImageInfo(gl, gltf, pbrMat.metallicRoughnessTexture.index, 'uniform1i', 'u_MetallicRoughnessSampler', gl.RGBA, samplerIndex++);
            this.defines.HAS_METALROUGHNESSMAP = 1;
        }
        else if (this.localState.uniforms['u_MetallicRoughnessSampler']) {
            delete this.localState.uniforms['u_MetallicRoughnessSampler'];
        }

        // Normals
        if (this.material && this.material.normalTexture && gltf.textures.length > this.material.normalTexture.index) {
            imageInfos['normal'] = this.getImageInfo(gl, gltf, this.material.normalTexture.index, 'uniform1i', 'u_NormalSampler', gl.RGBA, samplerIndex++);
            var normalScale = defined(this.material.normalTexture.scale) ? this.material.normalTexture.scale : 1.0;
            this.localState.uniforms['u_NormalScale'] = { 'funcName': 'uniform1f', 'vals': [normalScale] };
            this.defines.HAS_NORMALMAP = 1;
        }
        else if (this.localState.uniforms['u_NormalSampler']) {
            delete this.localState.uniforms['u_NormalSampler'];
        }

        // Alpha
        if (this.material && this.material.alphaMode && this.material.alphaMode === 'MASK') {
            var cutoff = defined(this.material.alphaCutoff) ? this.material.alphaCutoff : 0.5;
            this.localState.uniforms['u_alphaCutoff'] = {
                funcName: 'uniform1f',
                vals    : cutoff
            };
            this.defines.HAS_ALPHAMASK = 1;
        }
        else if (this.localState.uniforms['u_alphaCutoff']) {
            delete this.glState.uniforms['u_alphaCutoff'];
        }
        
        // brdfLUT
        var brdfLUT = 'textures/brdfLUT.png';
        //sg samplerIndex = this.scene.getNextSamplerIndex();
        imageInfos['brdfLUT'] = { 'uri': brdfLUT, 'samplerIndex': samplerIndex, 'colorSpace': gl.RGBA, 'clamp': true };
        this.localState.uniforms['u_brdfLUT'] = { 'funcName': 'uniform1i', 'vals': [samplerIndex] };
        samplerIndex+=1;
        
        // Emissive
        if (this.material && this.material.emissiveTexture) {
            imageInfos['emissive'] = this.getImageInfo(gl, gltf, this.material.emissiveTexture.index, 'uniform1i', 'u_EmissiveSampler', this.sRGBifAvailable, samplerIndex++);
            this.defines.HAS_EMISSIVEMAP = 1;
            var emissiveFactor = defined(this.material.emissiveFactor) ? this.material.emissiveFactor : [0.0, 0.0, 0.0];
            this.localState.uniforms['u_EmissiveFactor'] = {
                funcName: 'uniform3f',
                vals: emissiveFactor
            };
        }
        else if (this.localState.uniforms['u_EmissiveSampler']) {
            delete this.localState.uniforms['u_EmissiveSampler'];
        }

        // AO
        if (this.material && this.material.occlusionTexture) {
            imageInfos['occlusion'] = this.getImageInfo(gl, gltf, this.material.occlusionTexture.index, 'uniform1i', 'u_OcclusionSampler', gl.RGBA, samplerIndex++);
            var occlusionStrength = defined(this.material.occlusionTexture.strength) ? this.material.occlusionTexture.strength : 1.0;
            this.localState.uniforms['u_OcclusionStrength'] = { 'funcName': 'uniform1f', 'vals': [occlusionStrength] };
            this.defines.HAS_OCCLUSIONMAP = 1;
        }
        else if (this.localState.uniforms['u_OcclusionSampler']) {
            delete this.localState.uniforms['u_OcclusionSampler'];
        }

        return imageInfos;
    }

    getAccessorData(gl, gltf, modelPath, accessorName, attribute) {
        var mesh = this;
        this.accessorsLoading++;
        var accessor   = gltf.accessors[accessorName];
        var bufferView = gltf.bufferViews[accessor.bufferView];
        accessor.byteStride = bufferView.byteStride;
        var buffer     = gltf.buffers[bufferView.buffer];
        var bin        = buffer.uri;

        let reader = new FileReader();
        reader.mesh       = mesh;
        reader.bufferView = bufferView;
        reader.accessor   = accessor;
        reader.attribute  = attribute;

        reader.onload = function(e) {
            var arrayBuffer  = this.result;
            var start        = defined(this.bufferView.byteOffset) ? this.bufferView.byteOffset : 0;
            var end          = start + this.bufferView.byteLength;
            var slicedBuffer = arrayBuffer.slice(start, end);
            var data;
            if (accessor.componentType === 5126) {
                data = new Float32Array(slicedBuffer);
            }
            else if (accessor.componentType === 5123) {
                data = new Uint16Array(slicedBuffer);
            }
            switch (attribute) {
                case "POSITION": 
                    this.mesh.vertices = data;
                    this.mesh.verticesAccessor = this.accessor;
                    break;
                case "NORMAL": 
                    this.mesh.normals = data;
                    this.mesh.normalsAccessor = this.accessor;
                    break;
                case "TANGENT": 
                    this.mesh.tangents = data;
                    this.mesh.tangentsAccessor = this.accessor;
                    break;
                case "TEXCOORD_0": 
                    this.mesh.texcoords = data;
                    this.mesh.texcoordsAccessor = this.accessor;
                    break;
                case "INDEX":
                    this.mesh.indices = data;
                    this.mesh.indicesAccessor = this.accessor;
                    break;
                default:
                    console.warn('Unknown attribute semantic: ' + attribute);
            }

            this.mesh.accessorsLoading--;
            if (this.mesh.accessorsLoading === 0) {
                this.mesh.initBuffers(gl, gltf);
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
            var deferred     = $.Deferred();
            assets[assetUrl] = deferred;
            promise          = deferred.promise();
            var oReq         = new XMLHttpRequest();
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

    applyState(gl, globalState) {
        var program = this.program;
        var localState = this.localState;
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

    disableState(gl) {
        var localState = this.localState;
        for (var attrib in localState.attributes) {
            // do something.
            gl.disableVertexAttribArray(localState.attributes[attrib].a_attribute);
        }
    }
}

class Mesh {
    constructor(gl, scene, globalState, modelPath, gltf, meshIdx) {

        var primitives  = gltf.meshes[meshIdx].primitives;
        this.primitives = new Array();
        
        // todo:  multiple primitives doesn't work.
        for (let i = 0; i < primitives.length; i++) {
            var primitive = primitives[Object.keys(primitives)[i]];
            
            this.primitives.push(new Primitive(gl, scene, globalState, modelPath, gltf, primitive));
        }
    }

    drawMesh(gl, transform, view, projection, globalState) {
        for (let pi = 0; pi < this.primitives.length; pi++) {
            this.primitives[pi].drawPrimitive(gl, transform, view, projection, globalState);
        }
    }
}
