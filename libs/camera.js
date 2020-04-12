class Camera {
    constructor (element, orbitPoint) {
        this.distance = 40.0;
        this.orbitPoint = orbitPoint;

        this.azimuth = 0.0,
        this.elevation = 0.25

        this.minElevation = -Math.PI / 4;
        this.maxElevation = Math.PI / 4;

        this.viewMatrix = new Float32Array(16);

        this.recomputeViewMatrix();
    };

    recomputeViewMatrix() {
        var xRotationMatrix = new Float32Array(16),
            yRotationMatrix = new Float32Array(16),
            distanceTranslationMatrix = Utilities.makeIdentityMatrix(new Float32Array(16)),
            orbitTranslationMatrix = Utilities.makeIdentityMatrix(new Float32Array(16));

        Utilities.makeIdentityMatrix(this.viewMatrix);

        Utilities.makeXRotationMatrix(xRotationMatrix, this.elevation);
        Utilities.makeYRotationMatrix(yRotationMatrix, this.azimuth);
        distanceTranslationMatrix[14] = -this.distance;
        orbitTranslationMatrix[12] = -this.orbitPoint[0];
        orbitTranslationMatrix[13] = -this.orbitPoint[1];
        orbitTranslationMatrix[14] = -this.orbitPoint[2];

        Utilities.premultiplyMatrix(this.viewMatrix, this.viewMatrix, orbitTranslationMatrix);
        Utilities.premultiplyMatrix(this.viewMatrix, this.viewMatrix, yRotationMatrix);
        Utilities.premultiplyMatrix(this.viewMatrix, this.viewMatrix, xRotationMatrix);
        Utilities.premultiplyMatrix(this.viewMatrix, this.viewMatrix, distanceTranslationMatrix);
    };

    getViewMatrix() {
        return this.viewMatrix;
    };

    setBounds(minElevation, maxElevation) {
        this.minElevation = minElevation;
        this.maxElevation = maxElevation;

        if (this.elevation > this.maxElevation) this.elevation = this.maxElevation;
        if (this.elevation < this.minElevation) this.elevation = this.minElevation;

        this.recomputeViewMatrix();
    };
}
