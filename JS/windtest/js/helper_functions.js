function dist(x1, y1, x2, y2) {
    return Math.sqrt( Math.pow((x2 - x1),2) + Math.pow((y2 - y1),2) );
}

function speed(d, t) {
    return d / t;
}

function radian_to_direction(angle){
    // Return the discrete direction for a given angle.
    if (angle >= (Math.PI * (15/8)) || angle <  (Math.PI * (1/8))) {
        return 2;
    } else if (angle >= (Math.PI * (1/8)) && angle < (Math.PI * (3/8))) {
        return 5;
    } else if (angle >= (Math.PI * (3/8)) && angle < (Math.PI * (5/8))) {
        return 1;
    } else if (angle >= (Math.PI * (5/8)) && angle < (Math.PI * (7/8))) {
        return 8;
    } else if (angle >= (Math.PI * (7/8)) && angle < (Math.PI * (9/8))) {
        return 4;
    } else if (angle >= (Math.PI * (9/8)) && angle < (Math.PI * (11/8))) {
        return 7;
    } else if (angle >= (Math.PI * (11/8)) && angle < (Math.PI * (13/8))) {
        return 3;
    } else if (angle >= (Math.PI * (13/8)) && angle < (Math.PI * (15/8))) {
        return 6;
    } else {
        return 0;
    }
}

function angle(x1, y1, x2, y2) {
    // Return angle in radians, with 'North' being 0,
    // increasing clockwise to 3pi/2 at 'East', pi at 'South', etc.
    var dx = x1 - x2;
    var dy = y1 - y2;
    var theta = Math.atan2(-dx,dy);
    // atan2 returns results in the range -pi...pi. Convert results 
    // to the range 0...2pi
    if (theta < 0) {
        theta += (2 * Math.PI);
    }
    return theta;
}

function dot_product(ux, uy, vx, vy) {
    // Return dot product of two vectors
    return (ux * vx) + (uy * vy);
}