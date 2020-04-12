class FluidParticles {

    constructor(stats) {

        this.FOV = Math.PI / 3;

        this.State = {
            EDITING: 0,
            SIMULATING: 1
        };

        this.GRID_WIDTH = 40;
        this.GRID_HEIGHT = 20;
        this.GRID_DEPTH = 20;

        this.PARTICLES_PER_CELL = 10;

        this.canvas = document.getElementById('canvas');
        this.wgl = new WrappedGL(canvas);

        window.wgl = this.wgl;

        this.stats = stats;

        this.projectionMatrix = Utilities.makePerspectiveMatrix(new Float32Array(16), this.FOV, this.canvas.width / this.canvas.height, 0.1, 100.0);
        this.camera = new Camera(this.canvas, [this.GRID_WIDTH / 2, this.GRID_HEIGHT / 3, this.GRID_DEPTH / 2]);

        this.boxEditor = new BoxEditor(this.canvas, this.wgl, this.projectionMatrix, this.camera,
            [this.GRID_WIDTH, this.GRID_HEIGHT, this.GRID_DEPTH]);

        wgl.getExtension('OES_texture_float');
        wgl.getExtension('OES_texture_float_linear');

        this.simulator = new Simulator(this.wgl);
        this.renderer = new Renderer(this.canvas, this.wgl, [this.GRID_WIDTH, this.GRID_HEIGHT, this.GRID_DEPTH]);
    }

    onResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        Utilities.makePerspectiveMatrix(this.projectionMatrix, this.FOV, this.canvas.width / this.canvas.height, 0.1, 100.0);

        this.renderer.onResize();
    }

    getParticleCount() {

        var gridCells = this.GRID_WIDTH * this.GRID_HEIGHT * this.GRID_DEPTH * this.gridCellDensity;

        var gridResolutionY = Math.ceil(Math.pow(gridCells / 2, 1.0 / 3.0));
        var gridResolutionZ = gridResolutionY * 1;
        var gridResolutionX = gridResolutionY * 2;

        var totalGridCells = gridResolutionX * gridResolutionY * gridResolutionZ;
        var totalVolume = this.boxEditor.box.computeVolume();
        var fractionFilled = totalVolume / (this.GRID_WIDTH * this.GRID_HEIGHT * this.GRID_DEPTH);

        var desiredParticleCount = fractionFilled * totalGridCells * this.PARTICLES_PER_CELL;

        return desiredParticleCount;
    }

    startSimulation(density, flipness) {
        this.state = this.State.SIMULATING;
        this.gridCellDensity = density;

        var desiredParticleCount = this.getParticleCount();
        var particlesWidth = 512;
        var particlesHeight = Math.ceil(desiredParticleCount / particlesWidth);

        var particleCount = particlesWidth * particlesHeight;
        var particlePositions = [];

        for (var j = 0; j < particleCount; ++j) {
            var position = this.boxEditor.box.randomPoint();
            particlePositions.push(position);
        }

        var gridCells = this.GRID_WIDTH * this.GRID_HEIGHT * this.GRID_DEPTH * this.gridCellDensity;

        var gridResolutionY = Math.ceil(Math.pow(gridCells / 2, 1.0 / 3.0));
        var gridResolutionZ = gridResolutionY * 1;
        var gridResolutionX = gridResolutionY * 2;

        var gridSize = [this.GRID_WIDTH, this.GRID_HEIGHT, this.GRID_DEPTH];
        var gridResolution = [gridResolutionX, gridResolutionY, gridResolutionZ];

        var sphereRadius = 7.0 / gridResolutionX;
        this.simulator.reset(particlesWidth, particlesHeight, particlePositions, gridSize, gridResolution, this.PARTICLES_PER_CELL, flipness);
        this.renderer.reset(particlesWidth, particlesHeight, sphereRadius);

        this.camera.setBounds(0, Math.PI / 2);

        var loop = (function () {
            this.update();
            this.stats.update();

            requestAnimationFrame(loop);
        }).bind(this);
        loop();
    }

    stopSimulation() {
        this.state = this.State.EDITING;
        this.camera.setBounds(-Math.PI / 4, Math.PI / 4);
    }

    update() {
        if (this.state === this.State.EDITING) {
            this.boxEditor.draw();
        } else if (this.state === this.State.SIMULATING) {
            this.simulator.simulate();
            this.renderer.draw(this.simulator, this.projectionMatrix, this.camera.getViewMatrix());
        }
    }
}