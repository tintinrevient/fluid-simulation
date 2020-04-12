class AABB {

    constructor(min, max) {
        this.min = [min[0], min[1], min[2]];
        this.max = [max[0], max[1], max[2]];
    }

    computeVolume() {
        var volume = 1;
        for (var i = 0; i < 3; ++i) {
            volume *= (this.max[i] - this.min[i]);
        }
        return volume;
    }

    clone() {
        return new AABB(this.min, this.max);
    }

    randomPoint() {
        var point = [];
        for (var i = 0; i < 3; ++i) {
            point[i] = this.min[i] + Math.random() * (this.max[i] - this.min[i]);
        }
        return point;
    }
}