var Utilities = {

    magnitudeOfVector: function (v) {
        return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    },

    normalizeVector: function (out, v) {
        var inverseMagnitude = 1.0 / Utilities.magnitudeOfVector(v);
        out[0] = v[0] * inverseMagnitude;
        out[1] = v[1] * inverseMagnitude;
        out[2] = v[2] * inverseMagnitude;
        return out;
    },

    makePerspectiveMatrix: function (out, fovy, aspect, near, far) {
        var f = 1.0 / Math.tan(fovy / 2),
            nf = 1 / (near - far);

        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = (far + near) * nf;
        out[11] = -1;
        out[12] = 0;
        out[13] = 0;
        out[14] = (2 * far * near) * nf;
        out[15] = 0;
        return out;
    },

    makeIdentityMatrix: function (matrix) {
        matrix[0] = 1.0;
        matrix[1] = 0.0;
        matrix[2] = 0.0;
        matrix[3] = 0.0;
        matrix[4] = 0.0;
        matrix[5] = 1.0;
        matrix[6] = 0.0;
        matrix[7] = 0.0;
        matrix[8] = 0.0;
        matrix[9] = 0.0;
        matrix[10] = 1.0;
        matrix[11] = 0.0;
        matrix[12] = 0.0;
        matrix[13] = 0.0;
        matrix[14] = 0.0;
        matrix[15] = 1.0;
        return matrix;
    },

    premultiplyMatrix: function (out, matrixA, matrixB) { //out = matrixB * matrixA
        var b0 = matrixB[0], b4 = matrixB[4], b8 = matrixB[8], b12 = matrixB[12],
            b1 = matrixB[1], b5 = matrixB[5], b9 = matrixB[9], b13 = matrixB[13],
            b2 = matrixB[2], b6 = matrixB[6], b10 = matrixB[10], b14 = matrixB[14],
            b3 = matrixB[3], b7 = matrixB[7], b11 = matrixB[11], b15 = matrixB[15],

            aX = matrixA[0], aY = matrixA[1], aZ = matrixA[2], aW = matrixA[3];
        out[0] = b0 * aX + b4 * aY + b8 * aZ + b12 * aW;
        out[1] = b1 * aX + b5 * aY + b9 * aZ + b13 * aW;
        out[2] = b2 * aX + b6 * aY + b10 * aZ + b14 * aW;
        out[3] = b3 * aX + b7 * aY + b11 * aZ + b15 * aW;

        aX = matrixA[4], aY = matrixA[5], aZ = matrixA[6], aW = matrixA[7];
        out[4] = b0 * aX + b4 * aY + b8 * aZ + b12 * aW;
        out[5] = b1 * aX + b5 * aY + b9 * aZ + b13 * aW;
        out[6] = b2 * aX + b6 * aY + b10 * aZ + b14 * aW;
        out[7] = b3 * aX + b7 * aY + b11 * aZ + b15 * aW;

        aX = matrixA[8], aY = matrixA[9], aZ = matrixA[10], aW = matrixA[11];
        out[8] = b0 * aX + b4 * aY + b8 * aZ + b12 * aW;
        out[9] = b1 * aX + b5 * aY + b9 * aZ + b13 * aW;
        out[10] = b2 * aX + b6 * aY + b10 * aZ + b14 * aW;
        out[11] = b3 * aX + b7 * aY + b11 * aZ + b15 * aW;

        aX = matrixA[12], aY = matrixA[13], aZ = matrixA[14], aW = matrixA[15];
        out[12] = b0 * aX + b4 * aY + b8 * aZ + b12 * aW;
        out[13] = b1 * aX + b5 * aY + b9 * aZ + b13 * aW;
        out[14] = b2 * aX + b6 * aY + b10 * aZ + b14 * aW;
        out[15] = b3 * aX + b7 * aY + b11 * aZ + b15 * aW;

        return out;
    },

    makeXRotationMatrix: function (matrix, angle) {
        matrix[0] = 1.0;
        matrix[1] = 0.0;
        matrix[2] = 0.0;
        matrix[3] = 0.0;
        matrix[4] = 0.0;
        matrix[5] = Math.cos(angle);
        matrix[6] = Math.sin(angle);
        matrix[7] = 0.0;
        matrix[8] = 0.0;
        matrix[9] = -Math.sin(angle);
        matrix[10] = Math.cos(angle);
        matrix[11] = 0.0;
        matrix[12] = 0.0;
        matrix[13] = 0.0;
        matrix[14] = 0.0;
        matrix[15] = 1.0;
        return matrix;
    },

    makeYRotationMatrix: function (matrix, angle) {
        matrix[0] = Math.cos(angle);
        matrix[1] = 0.0
        matrix[2] = -Math.sin(angle);
        matrix[3] = 0.0
        matrix[4] = 0.0
        matrix[5] = 1.0
        matrix[6] = 0.0;
        matrix[7] = 0.0;
        matrix[8] = Math.sin(angle);
        matrix[9] = 0.0
        matrix[10] = Math.cos(angle);
        matrix[11] = 0.0;
        matrix[12] = 0.0;
        matrix[13] = 0.0;
        matrix[14] = 0.0;
        matrix[15] = 1.0;
        return matrix;
    },


    transformDirectionByMatrix: function (out, v, m) {
        var x = v[0], y = v[1], z = v[2];
        out[0] = m[0] * x + m[4] * y + m[8] * z;
        out[1] = m[1] * x + m[5] * y + m[9] * z;
        out[2] = m[2] * x + m[6] * y + m[10] * z;
        out[3] = m[3] * x + m[7] * y + m[11] * z;
        return out;
    },

    makeLookAtMatrix: function (matrix, eye, target, up) { //up is assumed to be normalized
        var forwardX = eye[0] - target[0],
            forwardY = eye[1] - target[1],
            forwardZ = eye[2] - target[2];
        var forwardMagnitude = Math.sqrt(forwardX * forwardX + forwardY * forwardY + forwardZ * forwardZ);
        forwardX /= forwardMagnitude;
        forwardY /= forwardMagnitude;
        forwardZ /= forwardMagnitude;

        var rightX = up[2] * forwardY - up[1] * forwardZ;
        var rightY = up[0] * forwardZ - up[2] * forwardX;
        var rightZ = up[1] * forwardX - up[0] * forwardY;

        var rightMagnitude = Math.sqrt(rightX * rightX + rightY * rightY + rightZ * rightZ);
        rightX /= rightMagnitude;
        rightY /= rightMagnitude;
        rightZ /= rightMagnitude;

        var newUpX = forwardY * rightZ - forwardZ * rightY;
        var newUpY = forwardZ * rightX - forwardX * rightZ;
        var newUpZ = forwardX * rightY - forwardY * rightX;

        var newUpMagnitude = Math.sqrt(newUpX * newUpX + newUpY * newUpY + newUpZ * newUpZ);
        newUpX /= newUpMagnitude;
        newUpY /= newUpMagnitude;
        newUpZ /= newUpMagnitude;

        matrix[0] = rightX;
        matrix[1] = newUpX;
        matrix[2] = forwardX;
        matrix[3] = 0;
        matrix[4] = rightY;
        matrix[5] = newUpY;
        matrix[6] = forwardY;
        matrix[7] = 0;
        matrix[8] = rightZ;
        matrix[9] = newUpZ;
        matrix[10] = forwardZ;
        matrix[11] = 0;
        matrix[12] = -(rightX * eye[0] + rightY * eye[1] + rightZ * eye[2]);
        matrix[13] = -(newUpX * eye[0] + newUpY * eye[1] + newUpZ * eye[2]);
        matrix[14] = -(forwardX * eye[0] + forwardY * eye[1] + forwardZ * eye[2]);
        matrix[15] = 1;
    },

    makeOrthographicMatrix: function (matrix, left, right, bottom, top, near, far) {
        matrix[0] = 2 / (right - left);
        matrix[1] = 0;
        matrix[2] = 0;
        matrix[3] = 0;
        matrix[4] = 0;
        matrix[5] = 2 / (top - bottom);
        matrix[6] = 0;
        matrix[7] = 0;
        matrix[8] = 0;
        matrix[9] = 0;
        matrix[10] = -2 / (far - near);
        matrix[11] = 0;
        matrix[12] = -(right + left) / (right - left);
        matrix[13] = -(top + bottom) / (top - bottom);
        matrix[14] = -(far + near) / (far - near);
        matrix[15] = 1;

        return matrix;
    }
}

