// Taking a different

(function(){
//START SIAF
var lattice_width = 200; // lattice width
var lattice_height = 80; //lattice height
var lattice=[]; // lattice
var x; // loop variable
var y;// loop variable
var eq = [];
var four9ths = 4/9;
var one9th = 1/9;
var one36th = 1/36;
var WIDTH = 'width';
// MATHS
var SQRT =Math.sqrt;
var POW = Math.pow;
var ABS = Math.abs;
var FLOOR = Math.floor;
// EVENTS
var ADDEVENT = a.addEventListener;
var REMOVEEVENT = a.removeEventListener;
var MOUSEMOVE = 'mousemove';
var MOUSEUP = 'mouseup';
var LAYERX='layerX';
var LAYERY='layerY';
var px_per_node = FLOOR(a.width / lattice_width); // Pixels per node
var node_directions = [
    [0,0],
    [1,0],
    [0,-1],
    [-1,0],
    [0,1],
    [1,-1],
    [-1,-1],
    [-1,1],
    [1,1]
];
var node_weight = [
    four9ths,
    one9th,
    one9th,
    one9th,
    one9th,
    one36th,
    one36th,
    one36th,
    one36th
];
// END VARIABLES
a.style.background="#000";
//Lattice Node
/**
 * @constructor
 */
function LatticeNode() {
    // LatticeNode
    this.d = [0,0,0,0,0,0,0,0,0]; // Individual density distributions for 
    // each of the nine possible discrete velocities of a node.
    this.s = [0,0,0,0,0,0,0,0,0]; // Used to temporarily hold streamed values
    this.n = 1; // Macroscopic density of a node.
    this.x = 0; // X component of macroscopic velocity of a node.
    this.y = 0; // Y component of macroscopic velocity of a node.
}
function equilibrium(ux, uy, rho) {
    // equilibrium
    eq = [];
    var u2 = (ux * ux) + (uy * uy); // Magnitude of macroscopic velocity
    for (var d = 0; d < 9; d++) {
        // Calculate equilibrium value
        var velocity = node_directions[d]; // Node direction vector
        var eu = (velocity[0] * ux) + (velocity[1] * uy); // Macro velocity multiplied by distribution velocity
        eq.push(node_weight[d] * rho * (1 + 3*eu + 4.5*(eu*eu) - 1.5*u2)); // Equilibrium equation
    }
}
function stream(){
    for (x = 0; x < lattice_width; x++) {
        for(y = 0; y < lattice_height; y++) {
            var node = lattice[x][y];
            for (var d = 0; d < 9; d++) {
                var move = node_directions[d];
                var newx = move[0] + x;
                var newy = move[1] + y;
                // Check if new node is in the l
                if (newx >= 0 && newx < lattice_width &&
                    newy >= 0 && newy < lattice_height) {
                    lattice[newx][newy].s[d] = node.d[d];
                }
            }
        }
    }
}
function collide(){
    for (x = 0; x < lattice_width; x++) {
        for(y = 0; y < lattice_height; y++) {
            var node = lattice[x][y];
            var d = node.d;
            for (var p = 0; p < 9; p++) {
                // Copy over values from streaming phase.
                d[p] = node.s[p];
            }
            // Calculate macroscopic density (rho) and velocity (ux, uy)
            var d1 = d[1] + d[5] + d[8];
            var d2 = d[4] + d[7] + d[8];
            var rho = d[0] +  d[2] + d[3] + d[6] + d1 + d2 - d[8];
            var ux = (d1 - d[3] - d[6] - d[7]) / rho;
            var uy = (d2 - d[2] - d[5] - d[6]) / rho;
            // Update values stored in node.
            node.n = rho;
            node.x = ux;
            node.y = uy;
            // Set node equilibrium for each velocity
            equilibrium(ux, uy, rho);
            for (var i = 0; i < 9; i++) {
                var old_value = d[i];
                node.d[i] = old_value + (1.7 * (eq[i] - old_value));
            }
        }
    }
}

function mousedown(e) {
            var oldX = e[LAYERX];
            var oldY = e[LAYERY];
            var moveListener = function(e) {
                var radius = 5;
                var newX = e[LAYERX];
                var newY = e[LAYERY];
                var dx = (newX - oldX) / px_per_node / 10;
                var dy = (newY - oldY) / px_per_node / 10;
                // Ensure that push isn't too big
                if (ABS(dx) > 0.1) {
                    dx = 0.1 * ABS(dx) / dx;
                }
                if (ABS(dy) > 0.1) {
                    dy = 0.1 * ABS(dy) / dy;
                }
                // Scale from canvas coordinates to lattice coordinates
                var lattice_x = FLOOR(newX / px_per_node);
                var lattice_y = FLOOR(newY / px_per_node);
                for (var x = -radius; x <= radius; x++) {
                    for (var y = -radius; y <= radius; y++) {
                        // Push in circle around cursor. Make sure coordinates are in bounds.
                        if (lattice_x + x >= 0 && lattice_x + x < lattice_width &&
                            lattice_y + y >= 0 && lattice_y + y < lattice_height &&
                            SQRT((x * x) + (y * y)) < radius) {
                            var node = lattice[lattice_x + x][lattice_y + y];
                            equilibrium(dx, dy, node.n);
                            node.d = eq;
                        }
                    }
                }
            oldX = newX;
            oldY = newY;
            };

            var mouseupListener = function(e) {
                REMOVEEVENT(MOUSEMOVE, moveListener);
                REMOVEEVENT(MOUSEUP, mouseupListener);

            };

            ADDEVENT(MOUSEMOVE, moveListener);
            ADDEVENT(MOUSEUP, mouseupListener);
        }
function draw(){
    var image = c.createImageData(a.width, a.height);
    var id = image.data;
    for (x = 0; x < lattice_width; x++) {
        for(y = 0; y < lattice_height; y++) {
            var speed = SQRT(POW(lattice[x][y].x, 2) + POW(lattice[x][y].y, 2));
            for (var ypx = y * px_per_node; ypx < (y+1) * px_per_node; ypx++) {
                for (var xpx = x * px_per_node; xpx < (x + 1) * px_per_node; xpx++) {
                    var index = (xpx + ypx * image[WIDTH]) * 4;
                    id[index+0] = 0; // Red
                    id[index+1] = 255; // Green
                    id[index+2] = 0; // Blue
                    id[index+3] = FLOOR(speed*4E3); // Alpha
                }
            }
        }
    }
    c.putImageData(image, 0, 0);
}
// Initialize lattice
for (x = 0; x < lattice_width; x++) {
    lattice[x]=[];
    for(y = 0; y < lattice_height; y++) {
        lattice[x][y] = new LatticeNode();
        equilibrium(0,0,1);
        lattice[x][y].s = eq.slice(0);
        lattice[x][y].d = eq.slice(0);
    }
}
// Register mouse events
ADDEVENT('mousedown', mousedown);
(function update(){
    for (var i = 0; i < 10; i++) {
        stream();
        collide();
    }
    draw();
    requestAnimationFrame(update);
})();
//END SELF INVOKED ANONYMOUS FUNCTION
})();