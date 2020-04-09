var SimulatorRenderer = (function () {
    function SimulatorRenderer (canvas, wgl, projectionMatrix, camera, gridDimensions, onLoaded) {
        this.canvas = canvas;
        this.wgl = wgl;
        this.projectionMatrix = projectionMatrix;
        this.camera = camera;

        wgl.getExtension('OES_texture_float');
        wgl.getExtension('OES_texture_float_linear');

        var rendererLoaded = false,
            simulatorLoaded = false;

        this.renderer = new Renderer(this.canvas, this.wgl, gridDimensions, (function () {
            rendererLoaded = true;  
            if (rendererLoaded && simulatorLoaded) {
                start.call(this);
            }
        }).bind(this));

        this.simulator = new Simulator(this.wgl, (function () {
            simulatorLoaded = true;
            if (rendererLoaded && simulatorLoaded) {
                start.call(this);
            }
        }).bind(this));

        function start () {

            setTimeout(onLoaded, 1);
        }
    }

    SimulatorRenderer.prototype.reset = function (particlesWidth, particlesHeight, particlePositions, gridSize, gridResolution, particleDensity, sphereRadius) {
        this.simulator.reset(particlesWidth, particlesHeight, particlePositions, gridSize, gridResolution, particleDensity);
        this.renderer.reset(particlesWidth, particlesHeight, sphereRadius);
    }

    SimulatorRenderer.prototype.update = function (timeStep) {
        var fov = 2.0 * Math.atan(1.0 / this.projectionMatrix[5]);

        this.simulator.simulate(timeStep);
        this.renderer.draw(this.simulator, this.projectionMatrix, this.camera.getViewMatrix());
    }

    SimulatorRenderer.prototype.onResize = function (event) {
        this.renderer.onResize(event);
    }

    return SimulatorRenderer;
}());
