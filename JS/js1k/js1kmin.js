// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==

// This file contains the results of a first pass at manual
// minification.
// minified.js is the result of running this file through
// Google's closure compiler, and thus represents the smallest
// size achieved thus far.

W = a.width; // canvas width
H = a.height; // canvas height
X = a.addEventListener;
V = a.removeEventListener;
w = 200; // lattice width
h = 80; // lattice height
l = []; // l consisting of l nodes.
q = []; // Mouse event qq
o = 1 / (3 * 0.02 + 0.5); // omega
v = true; // vectors
nb = true; // new barrier
fp = []; // flow particles
dm = 0; // draw mode
a.style.background = "#0"; // Black
f = 10; // Steps per frame
MF = Math.floor;  // Cache math functions
MA = Math.abs;
MS = Math.sqrt;
Mp = Math.pow;
P = Math.PI;
Mm = 'mousemove';
Mu = 'mouseup';
R = 'red'; // Red (name is smaller than hex code)
G = '#0F0'; // Green
Y = '#FF0'; // Yellow
p = MF(W / w); // Pixels per node
T = 255;

bp = c.beginPath.bind(c);
st = c.stroke.bind(c);
cp = c.closePath.bind(c);
cf = c.fill.bind(c);
ca = c.arc.bind(c);

function L(elmt){
    return elmt.length;
}

function I() {
    //init_flow_particles
    fp.length = 0;
    for (x = 0; x < 20; x++) {
        for (y = 0; y < 8; y++) {
            if (!l[x*f][y*f].b) {
                fp.push({'x':x*f, 'y':y*f});
            }
        }
    }
}


function DS(x, y, color, image) {
    //draw_square
    id = image.data;
    for (var ypx = y * p; ypx < (y+1) * p; ypx++) {
        for (var xpx = x * p; xpx < (x + 1) * p; xpx++) {
            var index = (xpx + ypx * image.width) * 4;
            id[index+0] = color.r;
            id[index+1] = color.g;
            id[index+2] = color.b;
            id[index+3] = color.a;
        }
    }
}

function DF(x, y, ux, uy) {
    //draw_flow_vector
    c.strokeStyle = R;
    c.fillStyle = R;
    var scale = w;
    var xpx = x * p;
    var ypx = y * p;

    bp();
    c.moveTo(xpx, ypx);
    c.lineTo(Math.round(xpx + (ux * p * scale)), ypx + (uy * p * scale));
    st();
    bp();
    ca(xpx, ypx, 1, 0, 2 * P, false);
    st();
    cp();
}

function DP(x,y) {
    //draw_flow_particle
    c.fillStyle = G;
    bp();
    ca(x * p, y * p, 1, 0, 2 * P, false);
    cf();
    cp();
}

function DB() {
    //draw_barriers
    c.fillStyle = Y;
    for (x = 0; x < w; x++) {
        for (y = 0; y < h; y++) {
            if (l[x][y].b) {
                bp();
                c.rect(x * p, y * p, p, p);
                cf();
                cp();
            }
        }
    }
}

function GC(val, min, max) {
    // get_color
    // Returns a color for a given value in a range between min and max.
    // Min and max were experimentally derived for speed, density, etc.
    var mid = (min + max) / 2;
    var range = MA(max-mid);
    var color = {'r': 0, 'g': 0, 'b': 0, 'a': 0};
    if (val > max) {
        val = max;
    }
    if (val < min) {
        val = min;
    }
    if (val >= mid) {
        color.r = T;
        color.a = MF(MA(val) * (1/range) * T);
    } else {
        color.g = T;
        color.a = MF(MA(val) * (1/range) * T);
    }
    return color;
}

function D() {
    // draw
    a.width = W; // Clear

    var image = c.createImageData(W, H);
    for (x = 0; x < w; x++) {
        for (y = 0; y < h; y++) {
            if (!l[x][y].b) {
                var color = {'r': 0, 'g': 0, 'b': 0, 'a': 0};
                var ux = l[x][y].x;
                var uy = l[x][y].y;
                if (dm === 0) {
                    // Speed
                    var speed = MS(Mp(ux, 2) + Mp(uy, 2));
                    color = {'r': 0, 'a': MF(speed*4E3), 'b': 0, 'g': T};
                    if (color.g > T) {color.g = T;}
                    if (color.g < 0) {color.g = 0;}
                } else if (dm == 1) {
                    // X velocity
                    var xvel = ux;
                    color = GC(xvel, -0.04, 0.04);
                } else if (dm == 2) {
                    // Y Velocity
                    var yvel = uy;
                    color = GC(yvel, -0.04, 0.04);
                } else if (dm == 3) {
                    // Density
                    var dens = l[x][y].n;
                    color = {'r': 0, 'a': MF((T - (T / MA(dens)))*20), 'b': 0, 'g': T};
                    if (color.g > T) {color.g = T;}
                    if (color.g < 0) {color.g = 0;}
                } else if (dm == 4) {
                    // Curl
                    var curl = l[x][y].c;
                    color = GC(curl, -0.1, 0.1);
                } else if (dm == 5) {
                    // Draw nothing. This mode is useful when flow vectors or particles are turned on.
                    continue;
                }
                DS(x, y, color, image);
            }
        }
    }
    c.putImageData(image, 0, 0);
    for (x = 0, ln=L(fp); x < ln; x++) {
        // Draw particles
        DP(fp[x].x, fp[x].y);
    }
    if (v) {
        // Draw flow vectors every tenth node
        for (x = 0; x < w; x+=f) {
            for (y = 0; y < h; y+=f) {
                var ux = l[x][y].x;
                var uy = l[x][y].y;
                DF(x, y, ux, uy);
            }
        }
    }
    if (nb) {
        // Draw barrriers
        DB();
        nb = false;
    }
}

function C() {
    //clear
    a.width = W;
    // Clear barrier canvas, but redraw in case barriers are still present
    DB();
    nb = false;
}

function M(e) {
    //mousedownListener
    var button = e.which;
    if (button !== 1) {return;} // Only capture left click
    var oldX = e.layerX;
    var oldY = e.layerY;

    var B = function(e) {
        //moveListener
        var radius = 5;
        var newX = e.layerX;
        var newY = e.layerY;
        var dx = (newX - oldX) / p / f;
        var dy = (newY - oldY) / p / f;
        // Ensure that push isn't too big
        if (MA(dx) > 0.1) {
            dx = 0.1 * MA(dx) / dx;
        }
        if (MA(dy) > 0.1) {
            dy = 0.1 * MA(dy) / dy;
        }
        // Scale from canvas coordinates to l coordinates
        var l_x = MF(newX / p);
        var l_y = MF(newY / p);
        for (x = -radius; x <= radius; x++) {
            for (y = -radius; y <= radius; y++) {
                // Push in circle around cursor. Make sure coordinates are in bounds.
                if (l_x + x >= 0 && l_x + x < w &&
                    l_y + y >= 0 && l_y + y < h &&
                    !l[l_x + x][l_y + y].b &&
                    MS((x * x) + (y * y)) < radius) {
                    q.push([l_x + x, l_y + y, dx, dy]);
                }
            }
        }
    oldX = newX;
    oldY = newY;
    };

    var N = function(e) {
        //mouseupListener
        V(Mm, B, false);
        V(Mu, N, false);

    };

    X(Mm, B, false);
    X(Mu, N, false);

}


function PB(e) {
    //place_barrier
    e.preventDefault();
    var mouse_x = e.layerX;
    var mouse_y = e.layerY;
    var l_x = MF(mouse_x / p);
    var l_y = MF(mouse_y / p);
    var draw = true; // Drawing, or erasing?
    if (l[l_x][l_y].b) {
        draw = false;
    }
    l[l_x][l_y].b = draw;

    var B = function(e) {
        //moveListener
        mouse_x = e.layerX;
        mouse_y = e.layerY;
        // Scale from canvas coordinates to l coordinates
        l_x = MF(mouse_x / p);
        l_y = MF(mouse_y / p);
        // Draw/erase barrier
        l[l_x][l_y].b = draw;
        nb = true;
    };

    var N = function(e) {
        ////mouseupListener
        V(Mm, B, false);
        V(Mu, N, false);

    };

    X(Mm, B, false);
    X(Mu, N, false);

}
function K(e){
    //change_draw_mode
    var key = e.keyCode;
    if(key == 72) {
        dm = (dm + 1) % 6;
    }
    if (key == 74) {
        v = !v;
    }
    if (key == 75) {
        if (L(fp) > 0) {
            fp.length = 0;
        } else {
            I();
        }
    }
    if (key == 76) {
        t();
    }
}


// Register left click
X('mousedown', M, false);
// Register right click 
X('contextmenu', PB, false);
// Register keydown
b.addEventListener('keydown', K, false); //ALREADY HAVE


// MAIN
f9 = 4/9;
o9 = 1/9;
o3 = 1/36;
ND = {
    //node distribution velocities
    0: {'x':0, 'y':0},
    1: {'x':1, 'y':0},
    2: {'x':0, 'y':-1},
    3: {'x':-1, 'y':0},
    4: {'x':0, 'y':1},
    5: {'x':1, 'y':-1},
    6: {'x':-1, 'y':-1},
    7: {'x':-1, 'y':1},
    8: {'x':1, 'y':1}
};
Rf = {
    // reflections
    0: 0,
    1: 3,
    2: 4,
    3: 1,
    4: 2,
    5: 7,
    6: 8,
    7: 5,
    8: 6
};
/**
 * @constructor
 */
function LN() {
    // LatticeNode
    this.d = [0,0,0,0,0,0,0,0,0]; // Individual density distributions for 
    // each of the nine possible discrete velocities of a node.
    this.s = [0,0,0,0,0,0,0,0,0]; // Used to temporarily hold streamed values
    this.n = 0; // Macroscopic density of a node.
    this.x = 0; // X component of macroscopic velocity of a node.
    this.y = 0; // Y component of macroscopic velocity of a node.
    this.b = false; // Boolean indicating if node is a barrier.
    this.c = 0; // Curl of node.
}
function ml(w, h) {
    // make_lattice
    // Make a new empty l 
    for (var i = 0; i < w; i++) {
        l[i] = [];
        for (var j = 0; j < h; j++) {
            l[i][j] = new LN();
        }
    }
}
function IF(ux, uy, rho) {
    //init_flow
    // Initialize all nodes in l to flow with velocity (ux, uy) and density rho
    for (x = 0; x < w; x++) {
        for (y = 0; y < h; y++) {
            var node = l[x][y];
            if (!node.b) {
                node.n = rho;
                node.x = ux;
                node.y = uy;
                var eq = E(ux, uy, rho);
                node.d = eq.slice(0);
                node.s = eq.slice(0);
            }
        }
    }
}
function MP() {
    //move_particles
    for (x = 0, ln=L(fp); x < ln; x++) {
        var p = fp[x];
        var lx = MF(p.x);
        var ly = MF(p.y);
        if (lx >=0 && lx < w &&
            ly >=0 && ly < h) {
            var node = l[lx][ly];
            var ux = node.x;
            var uy = node.y;
            p.x += ux;
            p.y += uy;
        }
    }
}
function IB(barrier) {
    //init_barrier
    // Initialize barrier nodes.
    // Clear all
    for (x = 0; x < w; x++) {
        for (y = 0; y < h; y++) {
            l[x][y].b = false;
        }
    }
    nb = true;
}
function E(ux, uy, rho) {
    // equilibrium
    // Calculate equilibrium densities of a node
    // This is no longer performed in a loop, as that required
    // too many redundant calculations and was a performance drag.
    // Thanks to Daniel V. Schroeder http://physics.weber.edu/schroeder/fluids/
    // for this optimization
    var eq = []; // Equilibrium values for all velocities in a node.
    var ux3 = 3 * ux;
    var uy3 = 3 * uy;
    var ux2 = ux * ux;
    var uy2 = uy * uy;
    var uxuy2 = 2 * ux * uy;
    var u2 = ux2 + uy2;
    var u215 = 1.5 * u2;
    var on = o9 * rho;
    var ot = o3 * rho;
    var foo = 4.5*ux2 - u215;
    var bar = 4.5*uy2 - u215;
    var ux3p = 1 + ux3;
    var ux3n = 1 - ux3;
    var u45p = 4.5*(u2+uxuy2) - u215;
    var u45n = 4.5*(u2-uxuy2) - u215;
    eq[0] = f9 * rho * (1 - u215);
    eq[1] = on * (ux3p + foo);
    eq[2] = on * (1 - uy3 + bar);
    eq[3] = on * (ux3n + foo);
    eq[4] = on * (1 + uy3 + bar);
    eq[5] = ot * (ux3p - uy3 + u45n);
    eq[6] = ot * (ux3n - uy3 + u45p);
    eq[7] = ot * (ux3n + uy3 + u45n);
    eq[8] = ot * (ux3p + uy3 + u45p);
    return eq;
}

function S() {
    //stream
    // Stream distributions from old l to new l. Boundary conditions are
    // considered at this stage, and distributions are bounced back to originating node
    // if a boundary is encountered.
    for (x = 0; x < w; x++) {
        for (y = 0; y < h; y++) {
            var node = l[x][y];
            if (!node.b) {
                // Compute curl. Non-edge nodes only.
                if (x > 0 && x < w - 1 &&
                    y > 0 && y < h - 1) {
                    node.c = l[x+1][y].y - l[x-1][y].y - l[x][y+1].x + l[x][y-1].x;
                }
                for (var d = 0; d < 9; d++) {
                    var move = ND[d];
                    var newx = move.x + x;
                    var newy = move.y + y;
                    // Check if new node is in the l
                    if (newx >= 0 && newx < w && newy >= 0 && newy < h) {
                        // If destination node is barrier, bounce distribution back to 
                        // originating node in opposite direction.
                        // TODO: Look more closely into boundary conditions. 
                        // Simple Rf might be a bit simplistic.
                        if (l[newx][newy].b) {
                            l[x][y].s[Rf[d]] = node.d[d];
                        } else {
                            l[newx][newy].s[d] = node.d[d];
                        }
                    }
                }
            }
        }
    }
}

function Z() {
    //collide
    for (x = 0; x < w; x++) {
        for (y = 0; y < h; y++) {
            var node = l[x][y];
            if (!node.b) {
                var d = node.d;
                for (var p = 0; p < 9; p++) {
                    // Copy over values from streaming phase.
                    // While cloning with slice() would be simpler here, it
                    // seems to impose a bit of a performance penalty.
                    // This step would also be more naturally performed within 
                    // S(), but that would require an extraneous full loop
                    // through the l array.
                    d[p] = node.s[p];
                }
                // Calculate macroscopic density (rho) and velocity (ux, uy)
                // Thanks to Daniel V. Schroeder for this optimization
                // http://physics.weber.edu/schroeder/fluids/
                var d1 = d[1] + d[5] + d[8];
                var d2 = d[4] + d[7] + d[8];
                var rho = d[0] +  d[2] + d[3] + d[6] + d1 +d2  - d[8];
                var ux = (d1 - d[3] - d[6] - d[7]) / rho;
                var uy = (d2 - d[2] - d[5] - d[6]) / rho;
                // Update values stored in node.
                node.n = rho;
                node.x = ux;
                node.y = uy;
                // Set node equilibrium for each velocity
                var eq = E(ux, uy, rho);
                for (var i = 0; i < 9; i++) {
                    var old_value = d[i];
                    node.d[i] = old_value + (o * (eq[i] - old_value));
                }
            }
        }
    }
}
function U(){
    //updater
    for (var i = 0; i < f; i++) {
        S();
        Z();
        if (L(fp) > 0) {
            MP();
        }
        while (L(q) > 0) {
            u = q.shift();
            var node = l[u[0]][u[1]];
            var ux = u[2];
            var uy = u[3];
            node.d = E(ux, uy, node.n);
        }
    }
    D();
    requestAnimationFrame(U);
}
function t(){
    //Initialize
    ml(w, h);
    IB(); // Initialize barriers
    IF(0, 0, 1); // Initialize all l nodes with zero velocity, and density of 1
    q.length = 0;
    I(); // Initialize flow
    D(); // Call draw once to draw/erase barriers
    U(); // Start updater
}
t();