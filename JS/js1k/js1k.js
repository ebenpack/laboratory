
function addsib(node, sib){
    sib.width = canvas.width;
    sib.height = canvas.height;
    sib.style.cssText = "pointer-events: none; position: absolute; left:0;";
    return node.parentNode.insertBefore(sib, node.nextSibling);
}

a = document.getElementById("js1k");
lattice_width = 200;
lattice_height = 80;
viscosity = 0.02;
lattice = []; // Lattice consisting of lattice nodes.
queue = []; // Mouse event queue
omega = 1 / (3 * viscosity + 0.5);
flow_vectors = true;
new_barrier = true;
flow_particles = [];
draw_mode = 0;
vectorcanvas = document.createElement("canvas");
particlecanvas = document.createElement("canvas");
barriercanvas = document.createElement("canvas");
canvas.style.cssText = "background-color: black; position: relative";
vectorcanvas.id = "vectorcanvas";
particlecanvas.id = "particlecanvas";
barriercanvas.id = "barriercanvas";
vectorcanvas = addsib(canvas, vectorcanvas);
particlecanvas = addsib(canvas, particlecanvas);
barriercanvas = addsib(canvas, barriercanvas);
steps_per_frame = 10;
px_per_node = Math.floor(canvas.width / lattice_width);

(function() {
    // Initialize canvases
        boltzctx = canvas.getContext('2d'); // ALREADY HAVE THIS ONE
        vectorctx = vectorcanvas.getContext('2d');
        particlectx = particlecanvas.getContext('2d');
        barrierctx = barriercanvas.getContext('2d');
})();

function init_flow_particles() {
    flow_particles.length = 0;
    for (var x = 0; x < 20; x++) {
        for (var y = 0; y < 8; y++) {
            if (!lattice[x*10][y*10].barrier) {
                flow_particles.push({'x':x*10, 'y':y*10});
            }
        }
    }
}


function draw_square(x, y, color, image) {
    for (var ypx = y * px_per_node; ypx < (y+1) * px_per_node; ypx++) {
        for (var xpx = x * px_per_node; xpx < (x + 1) * px_per_node; xpx++) {
            var index = (xpx + ypx * image.width) * 4;
            image.data[index+0] = color.r;
            image.data[index+1] = color.g;
            image.data[index+2] = color.b;
            image.data[index+3] = color.a;
        }
    }
}

function draw_flow_vector(x, y, ux, uy, ctx) {
    var scale = 200;
    var xpx = x * px_per_node;
    var ypx = y * px_per_node;
    ctx.beginPath();
    ctx.moveTo(xpx, ypx);
    ctx.lineTo(Math.round(xpx + (ux * px_per_node * scale)), ypx + (uy * px_per_node * scale));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(xpx, ypx, 1, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();
}

function draw_flow_particle(x,y, ctx) {
    ctx.beginPath();
    ctx.arc(x * px_per_node, y * px_per_node, 1, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.closePath();
}

function draw_barriers(ctx) {
    for (var x = 0; x < lattice_width; x++) {
        for (var y = 0; y < lattice_height; y++) {
            if (lattice[x][y].barrier) {
                ctx.beginPath();
                ctx.rect(x * px_per_node, y * px_per_node, px_per_node, px_per_node);
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function get_color(val, min, max) {
    // Returns a color for a given value in a range between min and max.
    // Min and max were experimentally derived for speed, density, etc.
    var mid = (min + max) / 2;
    var range = Math.abs(max-mid);
    var color = {'r': 0, 'g': 0, 'b': 0, 'a': 0};
    if (val > max) {
        val = max;
    }
    if (val < min) {
        val = min;
    }
    if (val >= mid) {
        color.r = 255;
        color.a = Math.floor(Math.abs(val) * (1/range) * 255);
    } else {
        color.g = 255;
        color.a = Math.floor(Math.abs(val) * (1/range) * 255);
    }
    return color;
}

function draw() {

    vectorcanvas.width = vectorcanvas.width; // Clear
    vectorctx.strokeStyle = "red";
    vectorctx.fillStyle = "red";


    particlecanvas.width = particlecanvas.width; // Clear
    particlectx.strokeStyle = "green";
    particlectx.fillStyle = "green";
    for (var x = 0, l=flow_particles.length; x < l; x++) {
        draw_flow_particle(flow_particles[x].x, flow_particles[x].y, particlectx);
    }

    if (new_barrier) {
        barriercanvas.width = barriercanvas.width; // Clear
        barrierctx.fillStyle = "yellow";
        draw_barriers(barrierctx);
        new_barrier = false;
    }
    var image = boltzctx.createImageData(canvas.width, canvas.height);
    for (var x = 0; x < lattice_width; x++) {
        for (var y = 0; y < lattice_height; y++) {
            if (!lattice[x][y].barrier) {
                var color = {'r': 0, 'g': 0, 'b': 0, 'a': 0};
                var ux = lattice[x][y].ux;
                var uy = lattice[x][y].uy;
                if (flow_vectors && x % 10 === 0 && y % 10 ===0) {
                    // Draw flow vectors every tenth node.
                    draw_flow_vector(x, y, ux, uy, vectorctx);
                }
                if (draw_mode === 0) {
                    // Speed
                    var speed = Math.sqrt(Math.pow(ux, 2) + Math.pow(uy, 2));
                    color = {'r': 0, 'a': Math.floor(speed*4000), 'b': 0, 'g': 255};
                    if (color.g > 255) {color.g = 255;}
                    if (color.g < 0) {color.g = 0;}
                } else if (draw_mode == 1) {
                    // X velocity
                    var xvel = ux;
                    color = get_color(xvel, -0.04, 0.04);
                } else if (draw_mode == 2) {
                    // Y Velocity
                    var yvel = uy;
                    color = get_color(yvel, -0.04, 0.04);
                } else if (draw_mode == 3) {
                    // Density
                    var dens = lattice[x][y].density;
                    color = {'r': 0, 'a': Math.floor((255 - (255 / Math.abs(dens)))*20), 'b': 0, 'g': 255};
                    if (color.g > 255) {color.g = 255;}
                    if (color.g < 0) {color.g = 0;}
                } else if (draw_mode == 4) {
                    // Curl
                    var curl = lattice[x][y].curl;
                    color = get_color(curl, -0.1, 0.1);
                } else if (draw_mode == 5) {
                    // Draw nothing. This mode is useful when flow vectors or particles are turned on.
                    continue;
                }
                draw_square(x, y, color, image);
            }
        }
    }
    boltzctx.putImageData(image, 0, 0);
}

function clear() {
    vectorcanvas.width = vectorcanvas.width;
    particlecanvas.width = particlecanvas.width;
    canvas.width = canvas.width;
    // Clear barrier canvas, but redraw in case barriers are still present
    barriercanvas.width = barriercanvas.width; // Clear
    barrierctx.fillStyle = "yellow";
    draw_barriers(barrierctx);
    new_barrier = false;
}

function mousedownListener(e) {
    var button = e.which || e.button;
    if (button !== 1) {return;} // Only capture left click
    var oldX = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
    var oldY = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;

    var moveListener = function(e) {
        var radius = 5;
        var newX = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
        var newY = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;
        var dx = (newX - oldX) / px_per_node / steps_per_frame;
        var dy = (newY - oldY) / px_per_node / steps_per_frame;
        // Ensure that push isn't too big
        if (Math.abs(dx) > 0.1) {
            dx = 0.1 * Math.abs(dx) / dx;
        }
        if (Math.abs(dy) > 0.1) {
            dy = 0.1 * Math.abs(dy) / dy;
        }
        // Scale from canvas coordinates to lattice coordinates
        var lattice_x = Math.floor(newX / px_per_node);
        var lattice_y = Math.floor(newY / px_per_node);
        for (var x = -radius; x <= radius; x++) {
            for (var y = -radius; y <= radius; y++) {
                // Push in circle around cursor. Make sure coordinates are in bounds.
                if (lattice_x + x >= 0 && lattice_x + x < lattice_width &&
                    lattice_y + y >= 0 && lattice_y + y < lattice_height &&
                    !lattice[lattice_x + x][lattice_y + y].barrier &&
                    Math.sqrt((x * x) + (y * y)) < radius) {
                    queue.push([lattice_x + x, lattice_y + y, dx, dy]);
                }
            }
        }
    oldX = newX;
    oldY = newY;
    };

    var mouseupListener = function(e) {
        canvas.removeEventListener('mousemove', moveListener, false);
        canvas.removeEventListener('mouseup', mouseupListener, false);

        canvas.removeEventListener('touchmove', moveListener, false);
        document.body.removeEventListener('touchend', mouseupListener, false);
    };

    canvas.addEventListener('mousemove', moveListener, false);
    canvas.addEventListener('mouseup', mouseupListener, false);

    canvas.addEventListener('touchmove', moveListener, false);
    document.body.addEventListener('touchend', mouseupListener, false);
}


function place_barrier(e) {
    e.preventDefault();
    var mouse_x = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
    var mouse_y = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;
    var lattice_x = Math.floor(mouse_x / px_per_node);
    var lattice_y = Math.floor(mouse_y / px_per_node);
    var draw = true; // Drawing, or erasing?
    if (lattice[lattice_x][lattice_y].barrier) {
        draw = false;
    }
    lattice[lattice_x][lattice_y].barrier = draw;

    var moveListener = function(e) {
        mouse_x = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
        mouse_y = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;
        // Scale from canvas coordinates to lattice coordinates
        lattice_x = Math.floor(mouse_x / px_per_node);
        lattice_y = Math.floor(mouse_y / px_per_node);
        // Draw/erase barrier
        lattice[lattice_x][lattice_y].barrier = draw;
        new_barrier = true;
    };

    var mouseupListener = function(e) {
        canvas.removeEventListener('mousemove', moveListener, false);
        canvas.removeEventListener('mouseup', mouseupListener, false);

        canvas.removeEventListener('touchmove', moveListener, false);
        document.body.removeEventListener('touchend', mouseupListener, false);
    };

    canvas.addEventListener('mousemove', moveListener, false);
    canvas.addEventListener('mouseup', mouseupListener, false);

    canvas.addEventListener('touchmove', moveListener, false);
    document.body.addEventListener('touchend', mouseupListener, false);
}
function change_draw_mode(e){
    var key = e.keyCode;
    if(key == 72) {
        draw_mode = (draw_mode + 1) % 6;
    }
    if (key == 74) {
        flow_vectors = !flow_vectors;
    }
    if (key == 75) {
        if (flow_particles.length > 0) {
            flow_particles.length = 0;
        } else {
            init_flow_particles();
        }
    }
    if (key == 76) {
        init();
    }
}

(function register(){
    // Register left click
    canvas.addEventListener('mousedown', mousedownListener, false);
    canvas.addEventListener('touchstart', mousedownListener, false);
    // Register right click 
    canvas.addEventListener('contextmenu', place_barrier, false);
    // Register keydown
    document.addEventListener('keydown', change_draw_mode, false); //ALREADY HAVE
})();



(function () {
    var four9ths = 4/9;
    var one9th = 1/9;
    var one36th = 1/36;
    var node_directions = {
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
    var node_weight = {
        0: four9ths,
        1: one9th,
        2: one9th,
        3: one9th,
        4: one9th,
        5: one36th,
        6: one36th,
        7: one36th,
        8: one36th
    };
    var reflection = {
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
    function LatticeNode() {
        this.distribution = [0,0,0,0,0,0,0,0,0]; // Individual density distributions for 
        // each of the nine possible discrete velocities of a node.
        this.stream = [0,0,0,0,0,0,0,0,0]; // Used to temporarily hold streamed values
        this.density = 0; // Macroscopic density of a node.
        this.ux = 0; // X component of macroscopic velocity of a node.
        this.uy = 0; // Y component of macroscopic velocity of a node.
        this.barrier = false; // Boolean indicating if node is a barrier.
        this.curl = 0; // Curl of node.
    }
    function make_lattice(lattice_width, lattice_height) {
        // Make a new empty lattice 
        for (var i = 0; i < lattice_width; i++) {
            lattice[i] = [];
            for (var j = 0; j < lattice_height; j++) {
                lattice[i][j] = new LatticeNode();
            }
        }
    }
    function init_flow(ux, uy, rho) {
        // Initialize all nodes in lattice to flow with velocity (ux, uy) and density rho
        for (var x = 0; x < lattice_width; x++) {
            for (var y = 0; y < lattice_height; y++) {
                var node = lattice[x][y];
                if (!node.barrier) {
                    node.density = rho;
                    node.ux = ux;
                    node.uy = uy;
                    var eq = equilibrium(ux, uy, rho);
                    node.distribution = eq.slice(0);
                    node.stream = eq.slice(0);
                }
            }
        }
    }
    function move_particles() {
        for (var x = 0, l=flow_particles.length; x < l; x++) {
            var p = flow_particles[x];
            var lx = Math.floor(p.x);
            var ly = Math.floor(p.y);
            if (lx >=0 && lx < lattice_width &&
                ly >=0 && ly < lattice_height) {
                var node = lattice[lx][ly];
                var ux = node.ux;
                var uy = node.uy;
                p.x += ux;
                p.y += uy;
            }
        }
    }
    function init_barrier(barrier) {
        // Initialize barrier nodes.
        // Clear all
        for (var x = 0; x < lattice_width; x++) {
            for (var y = 0; y < lattice_height; y++) {
                lattice[x][y].barrier = false;
            }
        }
        // Set new barriers from barrier array
        for (var i = 0; i < barrier.length; i++) {
            lattice[bar[i].x][bar[i].y].barrier = true;
        }
    }
    function equilibrium(ux, uy, rho) {
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
        eq[0] = four9ths * rho * (1 - u215);
        eq[1] = one9th * rho * (1 + ux3 + 4.5*ux2 - u215);
        eq[2] = one9th * rho * (1 - uy3 + 4.5*uy2 - u215);
        eq[3] = one9th * rho * (1 - ux3 + 4.5*ux2 - u215);
        eq[4] = one9th * rho * (1 + uy3 + 4.5*uy2 - u215);
        eq[5] = one36th * rho * (1 + ux3 - uy3 + 4.5*(u2-uxuy2) - u215);
        eq[6] = one36th * rho * (1 - ux3 - uy3 + 4.5*(u2+uxuy2) - u215);
        eq[7] = one36th * rho * (1 - ux3 + uy3 + 4.5*(u2-uxuy2) - u215);
        eq[8] = one36th * rho * (1 + ux3 + uy3 + 4.5*(u2+uxuy2) - u215);
        return eq;
    }

    function stream() {
        // Stream distributions from old lattice to new lattice. Boundary conditions are
        // considered at this stage, and distributions are bounced back to originating node
        // if a boundary is encountered.
        for (var x = 0; x < lattice_width; x++) {
            for (var y = 0; y < lattice_height; y++) {
                var node = lattice[x][y];
                if (!node.barrier) {
                    // Compute curl. Non-edge nodes only.
                    if (x > 0 && x < lattice_width - 1 &&
                        y > 0 && y < lattice_height - 1) {
                        node.curl = lattice[x+1][y].uy - lattice[x-1][y].uy - lattice[x][y+1].ux + lattice[x][y-1].ux;
                    }
                    for (var d = 0; d < 9; d++) {
                        var move = node_directions[d];
                        var newx = move.x + x;
                        var newy = move.y + y;
                        // Check if new node is in the lattice
                        if (newx >= 0 && newx < lattice_width && newy >= 0 && newy < lattice_height) {
                            // If destination node is barrier, bounce distribution back to 
                            // originating node in opposite direction.
                            // TODO: Look more closely into boundary conditions. 
                            // Simple reflection might be a bit simplistic.
                            if (lattice[newx][newy].barrier) {
                                lattice[x][y].stream[reflection[d]] = node.distribution[d];
                            } else {
                                lattice[newx][newy].stream[d] = node.distribution[d];
                            }
                        }
                    }
                }
            }
        }
    }

    function collide() {
        for (var x = 0; x < lattice_width; x++) {
            for (var y = 0; y < lattice_height; y++) {
                var node = lattice[x][y];
                if (!node.barrier) {
                    var d = node.distribution;
                    for (var p = 0; p < 9; p++) {
                        // Copy over values from streaming phase.
                        // While cloning with slice() would be simpler here, it
                        // seems to impose a bit of a performance penalty.
                        // This step would also be more naturally performed within 
                        // stream(), but that would require an extraneous full loop
                        // through the lattice array.
                        d[p] = node.stream[p];
                    }
                    // Calculate macroscopic density (rho) and velocity (ux, uy)
                    // Thanks to Daniel V. Schroeder for this optimization
                    // http://physics.weber.edu/schroeder/fluids/
                    var rho = d[0] + d[1] + d[2] + d[3] + d[4] + d[5] + d[6] + d[7] + d[8];
                    var ux = (d[1] + d[5] + d[8] - d[3] - d[6] - d[7]) / rho;
                    var uy = (d[4] + d[7] + d[8] - d[2] - d[5] - d[6]) / rho;
                    // Update values stored in node.
                    node.density = rho;
                    node.ux = ux;
                    node.uy = uy;
                    // Set node equilibrium for each velocity
                    var eq = equilibrium(ux, uy, rho);
                    for (var i = 0; i < 9; i++) {
                        var old_value = d[i];
                        node.distribution[i] = old_value + (omega * (eq[i] - old_value));
                    }
                }
            }
        }
    }
    function updater(){
        var q;
        for (var i = 0; i < steps_per_frame; i++) {
            stream();
            collide();
            if (flow_particles.length > 0) {
                move_particles();
            }
            while (queue.length > 0) {
                q = queue.shift();
                var node = lattice[q[0]][q[1]];
                var ux = q[2];
                var uy = q[3];
                node.distribution = equilibrium(ux, uy, node.density);
            }
        }
        draw();
        requestAnimationFrame(updater);
    }
    init = function init(){
        make_lattice(lattice_width, lattice_height);
        init_barrier([]);
        init_flow(0, 0, 1); // Initialize all lattice nodes with zero velocity, and density of 1
        queue.length = 0;
        init_flow_particles();
        updater(); // Call draw once to draw barriers, but don't start animating
    };
    init();
})();
