var canvas = document.getElementById("astar");
var graph = []; // 2D array representing graph of Cartesian points on a plane.
var particles = [];
var node_size = 3;
var graph_width = Math.floor(canvas.width / node_size);
var graph_height = Math.floor(canvas.height / node_size);
var queue = [];
var particle_size = 4;
var mouse = {'x':0, 'y':0};

function angle(x1, y1, x2, y2) {
    // Return angle in radians, with 'North' being 0,
    // increasing clockwise to 3pi/2 at 'East', pi at 'South', etc.
    var dx = x1 - x2;
    var dy = y1 - y2;
    var theta = Math.atan2(dx,dy);
    // atan2 returns results in the range -pi...pi. Convert results 
    // to the range 0...2pi
    if (theta < 0) {
        theta += (2 * Math.PI);
    }
    return theta;
}