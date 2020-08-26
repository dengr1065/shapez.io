// Converts from degrees to radians.
Math.radians = function (degrees) {
    return (degrees * Math.PI) / 180.0;
};

// Converts from radians to degrees.
Math.degrees = function (radians) {
    return (radians * 180.0) / Math.PI;
};

if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (src, target) {
        return this.split(src).join(target);
    };
}