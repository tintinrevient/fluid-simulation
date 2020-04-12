class BoxEditor {

    constructor(canvas, wgl, projectionMatrix, camera, gridSize) {
        this.canvas = canvas;

        this.wgl = wgl;

        this.gridWidth = gridSize[0];
        this.gridHeight = gridSize[1];
        this.gridDepth = gridSize[2];

        this.projectionMatrix = projectionMatrix;
        this.camera = camera;

        this.cubeVertexBuffer = wgl.createBuffer();
        wgl.bufferData(this.cubeVertexBuffer, wgl.ARRAY_BUFFER, new Float32Array([
            // Front face
            0.0, 0.0,  1.0,
            1.0, 0.0,  1.0,
            1.0,  1.0,  1.0,
            0.0,  1.0,  1.0,

            // Back face
            0.0, 0.0, 0.0,
            0.0,  1.0, 0.0,
            1.0,  1.0, 0.0,
            1.0, 0.0, 0.0,

            // Top face
            0.0,  1.0, 0.0,
            0.0,  1.0,  1.0,
            1.0,  1.0,  1.0,
            1.0,  1.0, 0.0,

            // Bottom face
            0.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 0.0,  1.0,
            0.0, 0.0,  1.0,

            // Right face
            1.0, 0.0, 0.0,
            1.0,  1.0, 0.0,
            1.0,  1.0,  1.0,
            1.0, 0.0,  1.0,

            // Left face
            0.0, 0.0, 0.0,
            0.0, 0.0,  1.0,
            0.0,  1.0,  1.0,
            0.0,  1.0, 0.0
        ]), wgl.STATIC_DRAW);

        this.cubeIndexBuffer = wgl.createBuffer();
        wgl.bufferData(this.cubeIndexBuffer, wgl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
            0,  1,  2,      0,  2,  3,    // front
            4,  5,  6,      4,  6,  7,    // back
            8,  9,  10,     8,  10, 11,   // top
            12, 13, 14,     12, 14, 15,   // bottom
            16, 17, 18,     16, 18, 19,   // right
            20, 21, 22,     20, 22, 23    // left
        ]), wgl.STATIC_DRAW);

        this.cubeWireframeVertexBuffer = wgl.createBuffer();
        wgl.bufferData(this.cubeWireframeVertexBuffer, wgl.ARRAY_BUFFER, new Float32Array([
            0.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            1.0, 1.0, 0.0,
            0.0, 1.0, 0.0,

            0.0, 0.0, 1.0,
            1.0, 0.0, 1.0,
            1.0, 1.0, 1.0,
            0.0, 1.0, 1.0]), wgl.STATIC_DRAW);

        this.cubeWireframeIndexBuffer = wgl.createBuffer();
        wgl.bufferData(this.cubeWireframeIndexBuffer, wgl.ELEMENT_ARRAY_BUFFER, new Uint16Array([
            0, 1, 1, 2, 2, 3, 3, 0,
            4, 5, 5, 6, 6, 7, 7, 4,
            0, 4, 1, 5, 2, 6, 3, 7
        ]), wgl.STATIC_DRAW);

        //there's one grid vertex buffer for the planes normal to each axis
        this.gridVertexBuffers = [];

        for (var axis = 0; axis < 3; ++axis) {
            this.gridVertexBuffers[axis] = wgl.createBuffer();

            var vertexData = [];

            var points; //the points that make up this grid plane

            if (axis === 0) {
                points = [
                    [0, 0, 0],
                    [0, this.gridHeight, 0],
                    [0, this.gridHeight, this.gridDepth],
                    [0, 0, this.gridDepth]
                ];

            } else if (axis === 1) {
                points = [
                    [0, 0, 0],
                    [this.gridWidth, 0, 0],
                    [this.gridWidth, 0, this.gridDepth],
                    [0, 0, this.gridDepth]
                ];
            } else if (axis === 2) {
                points = [
                    [0, 0, 0],
                    [this.gridWidth, 0, 0],
                    [this.gridWidth, this.gridHeight, 0],
                    [0, this.gridHeight, 0]
                ];
            }

            for (var i = 0; i < 4; ++i) {
                vertexData.push(points[i][0]);
                vertexData.push(points[i][1]);
                vertexData.push(points[i][2]);

                vertexData.push(points[(i + 1) % 4][0]);
                vertexData.push(points[(i + 1) % 4][1]);
                vertexData.push(points[(i + 1) % 4][2]);
            }

            wgl.bufferData(this.gridVertexBuffers[axis], wgl.ARRAY_BUFFER, new Float32Array(vertexData), wgl.STATIC_DRAW);
        }

        this.pointVertexBuffer = wgl.createBuffer();
        wgl.bufferData(this.pointVertexBuffer, wgl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, 1.0, 1.0, 0.0]), wgl.STATIC_DRAW);

        wgl.createProgramsFromFiles({
            boxProgram: {
                vertexShader: 'shaders/box.vert',
                fragmentShader: 'shaders/box.frag'
            },
            boxWireframeProgram: {
                vertexShader: 'shaders/boxwireframe.vert',
                fragmentShader: 'shaders/boxwireframe.frag'
            }
        }, (function (programs) {
            for (var programName in programs) {
                this[programName] = programs[programName];
            }

            this.draw();
        }).bind(this));
    }

    draw() {
        var wgl = this.wgl;

        wgl.clear(
            wgl.createClearState().bindFramebuffer(null).clearColor(0.9, 0.9, 0.9, 1.0),
            wgl.COLOR_BUFFER_BIT | wgl.DEPTH_BUFFER_BIT);

        this.box = new AABB([0, 0, 0], [15, 20, 20]).clone();

        var boxDrawState = wgl.createDrawState()
            .bindFramebuffer(null)
            .viewport(0, 0, this.canvas.width, this.canvas.height)

            .enable(wgl.DEPTH_TEST)
            .enable(wgl.CULL_FACE)

            .useProgram(this.boxProgram)

            .vertexAttribPointer(this.cubeVertexBuffer, this.boxProgram.getAttribLocation('a_cubeVertexPosition'), 3, wgl.FLOAT, wgl.FALSE, 0, 0)

            .bindIndexBuffer(this.cubeIndexBuffer)

            .uniformMatrix4fv('u_projectionMatrix', false, this.projectionMatrix)
            .uniformMatrix4fv('u_viewMatrix', false, this.camera.getViewMatrix())

            .enable(wgl.POLYGON_OFFSET_FILL)
            .polygonOffset(1, 1);

        boxDrawState.uniform3f('u_translation', this.box.min[0], this.box.min[1], this.box.min[2])
            .uniform3f('u_scale', this.box.max[0] - this.box.min[0], this.box.max[1] - this.box.min[1], this.box.max[2] - this.box.min[2]);

        wgl.drawElements(boxDrawState, wgl.TRIANGLES, 36, wgl.UNSIGNED_SHORT);

        var boxWireframeDrawState = wgl.createDrawState()
            .bindFramebuffer(null)
            .viewport(0, 0, this.canvas.width, this.canvas.height)

            .enable(wgl.DEPTH_TEST)

            .useProgram(this.boxWireframeProgram)

            .vertexAttribPointer(this.cubeWireframeVertexBuffer, this.boxWireframeProgram.getAttribLocation('a_cubeVertexPosition'), 3, wgl.FLOAT, wgl.FALSE, 0, 0)

            .bindIndexBuffer(this.cubeWireframeIndexBuffer)

            .uniformMatrix4fv('u_projectionMatrix', false, this.projectionMatrix)
            .uniformMatrix4fv('u_viewMatrix', false, this.camera.getViewMatrix())

        boxWireframeDrawState.uniform3f('u_translation', this.box.min[0], this.box.min[1], this.box.min[2])
            .uniform3f('u_scale', this.box.max[0] - this.box.min[0], this.box.max[1] - this.box.min[1], this.box.max[2] - this.box.min[2]);

        wgl.drawElements(boxWireframeDrawState, wgl.LINES, 24, wgl.UNSIGNED_SHORT);
    }
}
