// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==

// This file contains the results of a first pass at manual
// minification.
// minified.js is the result of running this file through
// Google's closure compiler, and thus represents the smallest
// size achieved thus far.

K = "width";
W = a[K]; // canvas width
H = a.height; // canvas height
X = a.addEventListener;
V = a.removeEventListener;
w = 200; // lattice width
h = 80; // lattice height
l = []; // lattice consisting of l nodes.
q = []; // Mouse event qq
o = 1.7; // omega
v = true; // vectors
B = []; // flow particles
J = 0; // draw mode
a.style.background = "#000"; // Black
f = 10; // Steps per frame
A = Math.floor;  // Cache math functions
F = Math.abs;
MS = Math.sqrt;
Mp = Math.pow;
P = Math.PI;
Q = 'mousemove';
O = 'mouseup';
R = 'red'; // Red (name is smaller than hex code)
G = '#0F0'; // Green
Y = '#FF0'; // Yellow
p = A(W / w); // Pixels per node
T = 255; // Constant, used for color stuff
zf = .04; // # used for some color stuff

bp = c.beginPath.bind(c); // Canvas methods
st = c.stroke.bind(c);
cp = c.closePath.bind(c);
cf = c.fill.bind(c);
ca = c.arc.bind(c);

L="length";
z='layerX';
r='layerY';
Z="fillStyle"

function I() {
    //init_flow_particles
    B[L] = 0;
    for (x = 0; x < 20; x++) {
        for (y = 0; y < 8; y++) {
            if (!l[x*f][y*f].b) {
                B.push({'x':x*f, 'y':y*f});
            }
        }
    }
}


function DS(x, y, color, image) {
    //draw_square
    var id = image.data;
    for (var ypx = y * p; ypx < (y+1) * p; ypx++) {
        for (var xpx = x * p; xpx < (x + 1) * p; xpx++) {
            var index = (xpx + ypx * image[K]) * 4;
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
    c[Z] = R;
    var xpx = x * p;
    var ypx = y * p;

    bp();
    c.moveTo(xpx, ypx);
    c.lineTo(Math.round(xpx + (ux * p * w)), ypx + (uy * p * w));
    st();
    bp();
    ca(xpx, ypx, 1, 0, 2 * P, false);
    st();
    cp();
}

function DP(x,y) {
    //draw_flow_particle
    c[Z] = G;
    bp();
    ca(x * p, y * p, 1, 0, 2 * P, false);
    cf();
    cp();
}

// function DB() {
//     //draw_barriers
//     c[Z] = Y;
//     for (x = 0; x < w; x++) {
//         for (y = 0; y < h; y++) {
//             if (l[x][y].b) {
//                 bp();
//                 c.rect(x * p, y * p, p, p);
//                 cf();
//                 cp();
//             }
//         }
//     }
// }

function GC(val, min, max) {
    // get_color
    // Returns a color for a given value in a range between min and max.
    // Min and max were experimentally derived for speed, density, etc.
    var mid = (min + max) / 2;
    var range = F(max-mid);
    var color = {'r': 0, 'g': 0, 'b': 0, 'a': 0};
    if (val > max) {
        val = max;
    }
    if (val < min) {
        val = min;
    }
    if (val >= mid) {
        color.r = T;
        color.a = A(F(val) * (1/range) * T);
    } else {
        color.g = T;
        color.a = A(F(val) * (1/range) * T);
    }
    return color;
}

function D() {
    // draw
    a[K] = W; // Clear
    var image = c.createImageData(W, H);
    for (x = 0; x < w; x++) {
        for (y = 0; y < h; y++) {
            if (!l[x][y].b) {
                var color = {'r': 0, 'g': 0, 'b': 0, 'a': 0};
                var ux = l[x][y].x;
                var uy = l[x][y].y;
                if (J == 0) {
                    // Speed
                    var speed = MS(Mp(ux, 2) + Mp(uy, 2));
                    color = {'r': 0, 'a': A(speed*4E3), 'b': 0, 'g': T};
                    if (color.g > T) {color.g = T;}
                    if (color.g < 0) {color.g = 0;}
                }//  else if (J == 1) {
                //     // X velocity
                //     var xvel = ux;
                //     color = GC(xvel, -zf, zf);
                // } else if (J == 2) {
                //     // Y Velocity
                //     var yvel = uy;
                //     color = GC(yvel, -zf, zf);
                // } else if (J == 3) {
                //     // Density
                //     var dens = l[x][y].n;
                //     color = {'r': 0, 'a': A((T - (T / F(dens)))*20), 'b': 0, 'g': T};
                //     if (color.g > T) {color.g = T;}
                //     if (color.g < 0) {color.g = 0;}
                // } else if (J == 4) {
                //     // Curl
                //     var curl = l[x][y].c;
                //     color = GC(curl, -0.1, 0.1);
                // } else if (J == 5) {
                //     // Draw nothing. This mode is useful when flow vectors or particles are turned on.
                //     continue;
                // }
                DS(x, y, color, image);
            }
        }
    }
    c.putImageData(image, 0, 0);
    for (x = 0, ln=B[L]; x < ln; x++) {
        // Draw particles
        DP(B[x].x, B[x].y);
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
    // DB();
}

function M(e) {
    //mousedownListener
    var button = e.which;
    if (button !== 1) {return;} // Only capture left click
    var oldX = e[z];
    var oldY = e[r];

    var B = function(e) {
        //moveListener
        var radius = 5;
        var newX = e[z];
        var newY = e[r];
        var dx = (newX - oldX) / p / f;
        var dy = (newY - oldY) / p / f;
        // Ensure that push isn't too big
        if (F(dx) > 0.1) {
            dx = 0.1 * F(dx) / dx;
        }
        if (F(dy) > 0.1) {
            dy = 0.1 * F(dy) / dy;
        }
        // Scale from canvas coordinates to l coordinates
        var l_x = A(newX / p);
        var l_y = A(newY / p);
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
        V(Q, B, false);
        V(O, N, false);

    };

    X(Q, B, false);
    X(O, N, false);

}


// function PB(e) {
//     //place_barrier
//     e.preventDefault();
//     var mouse_x = e[z];
//     var mouse_y = e[r];
//     var l_x = A(mouse_x / p);
//     var l_y = A(mouse_y / p);
//     var draw = true; // Drawing, or erasing?
//     if (l[l_x][l_y].b) {
//         draw = false;
//     }
//     l[l_x][l_y].b = draw;

//     var B = function(e) {
//         //moveListener
//         mouse_x = e[z];
//         mouse_y = e[r];
//         // Scale from canvas coordinates to l coordinates
//         l_x = A(mouse_x / p);
//         l_y = A(mouse_y / p);
//         // Draw/erase barrier
//         l[l_x][l_y].b = draw;
//     };

//     var Nz = function(e) {
//         ////mouseupListener
//         V(Q, B, false);
//         V(O, Nz, false);

//     };

//     X(Q, B, false);
//     X(O, Nz, false);

// }
// function Kz(e){
//     //change_draw_mode
//     var key = e.keyCode;
//     if(key == 72) {
//         // h key: change draw mode
//         J = (J + 1) % 6;
//     }
//     if (key == 74) {
//         // j key: toggle flow vectors
//         v = !v;
//     }
//     if (key == 75) {
//         // k key: toggle flow particles
//         if (B[L] > 0) {
//             B[L] = 0;
//         } else {
//             I();
//         }
//     }
//     if (key == 76) {
//         // l key: reset
//         // TODO: This slows things down like crazy
//         t();
//     }
// }


// Register left click
X('mousedown', M, false);
// Register right click 
// X('contextmenu', PB, false);
// Register keydown
// b.addEventListener('keydown', Kz, false);


// MAIN



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
    var t =this;
    // N.B. Google closure compiler refuses to shorten
    // `this` in this way. Do this manually. As far as I can tell, this
    // doesn't cause any problems.
    t.d = [0,0,0,0,0,0,0,0,0]; // Individual density distributions for 
    // each of the nine possible discrete velocities of a node.
    t.s = [0,0,0,0,0,0,0,0,0]; // Used to temporarily hold streamed values
    t.n = 0; // Macroscopic density of a node.
    t.x = 0; // X component of macroscopic velocity of a node.
    t.y = 0; // Y component of macroscopic velocity of a node.
    t.b = false; // Boolean indicating if node is a barrier.
    t.c = 0; // Curl of node.
}
function ml(w, h) {
    // make_lattice
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
    for (x = 0, ln=B[L]; x < ln; x++) {
        var p = B[x];
        var lx = A(p.x);
        var ly = A(p.y);
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
}
function E(ux, uy, rho) {
    // equilibrium
    // Calculate equilibrium densities of a node
    // This is no longer performed in a loop, as that required
    // too many redundant calculations and was a performance drag.
    // Thanks to Daniel V. Schroeder http://physics.weber.edu/schroeder/fluids/
    // for this optimization
    var eq = []; // Equilibrium values for all velocities in a node.
    var uy3 = 3 * uy;
    var ux2 = ux * ux;
    var ff = 4.5;
    var uy2 = uy * uy;
    var uxuy2 = 2 * ux * uy;
    var u2 = ux2 + uy2;
    var u215 = 1.5 * u2;
    var on = 1/9 * rho;
    var ot = 1/36 * rho;
    var foo = ff*ux2 - u215;
    var bar = ff*uy2 - u215;
    var ux3p = 1 + 3 * ux;
    var ux3n = 1 - 3 * ux;
    var u45p = ff*(u2+uxuy2) - u215;
    var u45n = ff*(u2-uxuy2) - u215;
    eq[0] = 4/9 * rho * (1 - u215);
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

function Sz() {
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

function Zz() {
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
        Sz();
        Zz();
        if (B[L] > 0) {
            MP();
        }
        while (q[L] > 0) {
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
    q[L] = 0;
    I(); // Initialize flow
    D(); // Call draw once to draw/erase barriers
    U(); // Start updater
}
t();