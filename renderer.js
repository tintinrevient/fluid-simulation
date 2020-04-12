'use strict'

class Renderer {

    constructor(canvas, wgl, gridDimensions) {

        this.canvas = canvas;
        this.wgl = wgl;

        this.particlesWidth = 0;
        this.particlesHeight = 0;

        this.sphereRadius = 0.0;

        this.wgl.getExtension('ANGLE_instanced_arrays');

        this.quadVertexBuffer = wgl.createBuffer();
        wgl.bufferData(this.quadVertexBuffer, wgl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), wgl.STATIC_DRAW);

        this.sphereGeometry = this.generateSphereGeometry(3);

        this.sphereVertexBuffer = wgl.createBuffer();
        wgl.bufferData(this.sphereVertexBuffer, wgl.ARRAY_BUFFER, new Float32Array(this.sphereGeometry.vertices), wgl.STATIC_DRAW);

        this.sphereNormalBuffer = wgl.createBuffer();
        wgl.bufferData(this.sphereNormalBuffer, wgl.ARRAY_BUFFER, new Float32Array(this.sphereGeometry.normals), wgl.STATIC_DRAW);

        this.sphereIndexBuffer = wgl.createBuffer();
        wgl.bufferData(this.sphereIndexBuffer, wgl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.sphereGeometry.indices), wgl.STATIC_DRAW);

        this.lightViewMatrix = new Float32Array(16);
        var midpoint = [gridDimensions[0] / 2, gridDimensions[1] / 2, gridDimensions[2] / 2];
        Utilities.makeLookAtMatrix(this.lightViewMatrix, midpoint, [midpoint[0], midpoint[1] - 1.0, midpoint[2]], [0.0, 0.0, 1.0]);
        this.lightProjectionMatrix = Utilities.makeOrthographicMatrix(new Float32Array(16), -gridDimensions[0] / 2, gridDimensions[0] / 2, -gridDimensions[2] / 2, gridDimensions[2] / 2, -gridDimensions[1] / 2, gridDimensions[1] / 2);
        this.lightProjectionViewMatrix = new Float32Array(16);
        Utilities.premultiplyMatrix(this.lightProjectionViewMatrix, this.lightViewMatrix, this.lightProjectionMatrix);

        this.particleVertexBuffer = wgl.createBuffer();

        this.renderingFramebuffer = wgl.createFramebuffer();
        this.renderingRenderbuffer = wgl.createRenderbuffer();
        this.renderingTexture = wgl.createTexture();
        this.compositingTexture = wgl.createTexture();

        this.onResize();

        wgl.createProgramsFromFiles({
            sphereProgram: {
                vertexShader: 'shaders/sphere.vert',
                fragmentShader: 'shaders/sphere.frag'
            },
            compositeProgram: {
                vertexShader: 'shaders/fullscreen.vert',
                fragmentShader: 'shaders/composite.frag',
                attributeLocations: { 'a_position': 0}
            }
        }, (function (programs) {
                for (var programName in programs) {
                    this[programName] = programs[programName];
                }
            }).bind(this));
    }

    /*
    we render in a deferred way to a special RGBA texture format
    the format is (normal.x, normal.y, speed, depth)
    the normal is normalized (thus z can be reconstructed with sqrt(1.0 - x * x - y * y)
    the depth simply the z in view space
    */

    //returns {vertices, normals, indices}
    generateSphereGeometry(iterations) {

        var vertices = [],
            normals = [];

        var compareVectors = function (a, b) {
            var EPSILON = 0.001;
            return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON && Math.abs(a[2] - b[2]) < EPSILON;
        };

        var addVertex = function (v) {
            Utilities.normalizeVector(v, v);
            vertices.push(v);
            normals.push(v);
        };

        var getMiddlePoint = function (vertexA, vertexB) {
            var middle = [
                (vertexA[0] + vertexB[0]) / 2.0,
                (vertexA[1] + vertexB[1]) / 2.0,
                (vertexA[2] + vertexB[2]) / 2.0];

            Utilities.normalizeVector(middle, middle);

            for (var i = 0; i < vertices.length; ++i) {
                if (compareVectors(vertices[i], middle)) {
                    return i;
                }
            }

            addVertex(middle);
            return (vertices.length - 1);
        };

        var t = (1.0 + Math.sqrt(5.0)) / 2.0;

        addVertex([-1, t, 0]);
        addVertex([1, t, 0]);
        addVertex([-1, -t, 0]);
        addVertex([1, -t, 0]);

        addVertex([0, -1, t]);
        addVertex([0, 1, t]);
        addVertex([0, -1, -t]);
        addVertex([0, 1, -t]);

        addVertex([t, 0, -1]);
        addVertex([t, 0, 1]);
        addVertex([-t, 0, -1]);
        addVertex([-t, 0, 1]);

        var faces = [];
        faces.push([0, 11, 5]);
        faces.push([0, 5, 1]);
        faces.push([0, 1, 7]);
        faces.push([0, 7, 10]);
        faces.push([0, 10, 11]);

        faces.push([1, 5, 9]);
        faces.push([5, 11, 4]);
        faces.push([11, 10, 2]);
        faces.push([10, 7, 6]);
        faces.push([7, 1, 8]);

        faces.push([3, 9, 4]);
        faces.push([3, 4, 2]);
        faces.push([3, 2, 6]);
        faces.push([3, 6, 8]);
        faces.push([3, 8, 9]);

        faces.push([4, 9, 5]);
        faces.push([2, 4, 11]);
        faces.push([6, 2, 10]);
        faces.push([8, 6, 7]);
        faces.push([9, 8, 1]);

        for (var i = 0; i < iterations; ++i) {
            var faces2 = [];

            for (var i = 0; i < faces.length; ++i) {
                var face = faces[i];
                //replace triangle with 4 triangles
                var a = getMiddlePoint(vertices[face[0]], vertices[face[1]]);
                var b = getMiddlePoint(vertices[face[1]], vertices[face[2]]);
                var c = getMiddlePoint(vertices[face[2]], vertices[face[0]]);

                faces2.push([face[0], a, c]);
                faces2.push([face[1], b, a]);
                faces2.push([face[2], c, b]);
                faces2.push([a, b, c]);
            }
            faces = faces2;
        }

        var packedVertices = [],
            packedNormals = [],
            indices = [];

        for (var i = 0; i < vertices.length; ++i) {
            packedVertices.push(vertices[i][0]);
            packedVertices.push(vertices[i][1]);
            packedVertices.push(vertices[i][2]);

            packedNormals.push(normals[i][0]);
            packedNormals.push(normals[i][1]);
            packedNormals.push(normals[i][2]);
        }

        for (var i = 0; i < faces.length; ++i) {
            var face = faces[i];
            indices.push(face[0]);
            indices.push(face[1]);
            indices.push(face[2]);
        }

        return {
            vertices: packedVertices,
            normals: packedNormals,
            indices: indices
        }
    }

    onResize(event) {
        wgl.renderbufferStorage(this.renderingRenderbuffer, wgl.RENDERBUFFER, wgl.DEPTH_COMPONENT16, this.canvas.width, this.canvas.height);
        wgl.rebuildTexture(this.renderingTexture, wgl.RGBA, wgl.FLOAT, this.canvas.width, this.canvas.height, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR); //contains (normal.x, normal.y, speed, depth)
        wgl.rebuildTexture(this.compositingTexture, wgl.RGBA, wgl.UNSIGNED_BYTE, this.canvas.width, this.canvas.height, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR);
    }

    reset(particlesWidth, particlesHeight, sphereRadius) {
        this.particlesWidth = particlesWidth;
        this.particlesHeight = particlesHeight;
        this.sphereRadius = sphereRadius;

        var particleTextureCoordinates = new Float32Array(this.particlesWidth * this.particlesHeight * 2);
        for (var y = 0; y < this.particlesHeight; ++y) {
            for (var x = 0; x < this.particlesWidth; ++x) {
                particleTextureCoordinates[(y * this.particlesWidth + x) * 2] = (x + 0.5) / this.particlesWidth;
                particleTextureCoordinates[(y * this.particlesWidth + x) * 2 + 1] = (y + 0.5) / this.particlesHeight;
            }
        }

        wgl.bufferData(this.particleVertexBuffer, wgl.ARRAY_BUFFER, particleTextureCoordinates, wgl.STATIC_DRAW);
    }

    draw(simulator, projectionMatrix, viewMatrix) {
        var wgl = this.wgl;

        wgl.framebufferTexture2D(this.renderingFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.renderingTexture, 0);
        wgl.framebufferRenderbuffer(this.renderingFramebuffer, wgl.FRAMEBUFFER, wgl.DEPTH_ATTACHMENT, wgl.RENDERBUFFER, this.renderingRenderbuffer);

        wgl.clear(
            wgl.createClearState().bindFramebuffer(this.renderingFramebuffer).clearColor(-99999.0, -99999.0, -99999.0, -99999.0),
            wgl.COLOR_BUFFER_BIT | wgl.DEPTH_BUFFER_BIT);

        var sphereDrawState = wgl.createDrawState()
            .bindFramebuffer(this.renderingFramebuffer)
            .viewport(0, 0, this.canvas.width, this.canvas.height)

            .enable(wgl.DEPTH_TEST)
            .enable(wgl.CULL_FACE)

            .useProgram(this.sphereProgram)

            .vertexAttribPointer(this.sphereVertexBuffer, this.sphereProgram.getAttribLocation('a_vertexPosition'), 3, wgl.FLOAT, wgl.FALSE, 0, 0)
            .vertexAttribPointer(this.sphereNormalBuffer, this.sphereProgram.getAttribLocation('a_vertexNormal'), 3, wgl.FLOAT, wgl.FALSE, 0, 0)

            .vertexAttribPointer(this.particleVertexBuffer, this.sphereProgram.getAttribLocation('a_textureCoordinates'), 2, wgl.FLOAT, wgl.FALSE, 0, 0)
            .vertexAttribDivisorANGLE(this.sphereProgram.getAttribLocation('a_textureCoordinates'), 1)

            .bindIndexBuffer(this.sphereIndexBuffer) 

            .uniformMatrix4fv('u_projectionMatrix', false, projectionMatrix)
            .uniformMatrix4fv('u_viewMatrix', false, viewMatrix)

            .uniformTexture('u_positionsTexture', 0, wgl.TEXTURE_2D, simulator.particlePositionTexture)
            .uniformTexture('u_velocitiesTexture', 1, wgl.TEXTURE_2D, simulator.particleVelocityTexture)

            .uniform1f('u_sphereRadius', this.sphereRadius)

        wgl.drawElementsInstancedANGLE(sphereDrawState, wgl.TRIANGLES, this.sphereGeometry.indices.length, wgl.UNSIGNED_SHORT, 0, this.particlesWidth * this.particlesHeight);

        // lighting
        wgl.framebufferTexture2D(this.renderingFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.compositingTexture, 0);

        wgl.clear(
            wgl.createClearState().bindFramebuffer(this.renderingFramebuffer).clearColor(0, 0, 0, 0),
            wgl.COLOR_BUFFER_BIT | wgl.DEPTH_BUFFER_BIT);

        var compositeDrawState = wgl.createDrawState()
            .bindFramebuffer(null)
            .viewport(0, 0, this.canvas.width, this.canvas.height)

            .useProgram(this.compositeProgram)

            .vertexAttribPointer(this.quadVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0)
            .uniformTexture('u_renderingTexture', 0, wgl.TEXTURE_2D, this.renderingTexture)

        wgl.drawArrays(compositeDrawState, wgl.TRIANGLE_STRIP, 0, 4);
    }
}
