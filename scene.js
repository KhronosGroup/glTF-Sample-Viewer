class Scene {
    constructor(gl, glState, model, gltf) {
        this.globalState = glState;

        this.nodes = gltf.nodes;
        this.meshes = [];
        this.assets = {};
        this.pendingTextures = 0;
        this.pendingBuffers = 0;
        this.samplerIndex = 3; // skip the first three because of the cubemaps
        for (var meshIdx in gltf.meshes) {
            this.meshes.push(new Mesh(gl, this, this.globalState, model, gltf, meshIdx));
        }
    }

    getNextSamplerIndex() {
        var result = this.samplerIndex++;
        if (result > 31) {
            throw new Error('Too many texture samplers in use.');
        }
        return result;
    }

    drawScene(gl) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        if (this.pendingTextures > 0 || this.pendingBuffers > 0) {
            return;
        }
        document.getElementById('loadSpinner').style.display = 'none';

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

        // set up the camera position and view matrix
        var cameraPos = [-translate * Math.sin(roll) * Math.cos(-pitch),
            -translate * Math.sin(-pitch),
            translate * Math.cos(roll) * Math.cos(-pitch)];
        this.globalState.uniforms['u_Camera'].vals = cameraPos;

        // Update view matrix
        // roll, pitch and translate are all globals.
        var xRotation = mat4.create();
        mat4.rotateY(xRotation, xRotation, roll);
        var yRotation = mat4.create();
        mat4.rotateX(yRotation, yRotation, pitch);
        this.viewMatrix = mat4.create();
        mat4.multiply(this.viewMatrix, yRotation, xRotation);
        this.viewMatrix[14] = -translate;

        var firstNode = this.nodes[0];

        drawNodeRecursive(this, firstNode, mat4.create());

        // draw to the front buffer
        this.frontBuffer.drawImage(this.backBuffer, 0, 0);
    }

    loadImage(imageInfo, gl) {
        var scene = this;
        var image = new Image();
        this.pendingTextures++;
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
            gl.texImage2D(gl.TEXTURE_2D, 0, imageInfo.colorSpace, imageInfo.colorSpace, gl.UNSIGNED_BYTE, image);

            scene.pendingTextures--;
            scene.drawScene(gl);
        };

        return image;
    }

    loadImages(imageInfos, gl) {
        this.pendingTextures = 0;
        for (var i in imageInfos) {
            this.loadImage(imageInfos[i], gl);
        }
    }
}

