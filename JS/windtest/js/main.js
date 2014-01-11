function wind(id, speed) {
    var canvas = document.getElementById(id);
    var lattice = [];
    var block_size = 6;
    var viscosity = 0.1;
    var four9ths = 4/9;
    var one9th = 1/9;
    var one36th = 1/36;
    var queue = []; // Queue for mouse movements to prevent mouse movements from
    // altering lattice as it is being updated (might not be necessary).
    var node_directions = {
        // Particles passing to other nodes can move in the four cardinal
        // directions (1,2,3,4), the four ordinal directions (5,6,7,8), 
        // or they can remain where they are (0). These directions are arranged as follows.
        // 
        //      6    2    5
        // 
        //      3    0    1
        // 
        //      7    4    8
        // 
        // N.b. The lattice origin is in the upper left of the canvas, so a move 'Southeaste'
        // would correspond to an increase in X and Y.

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
        0: 4/9,
        1: 1/9,
        2: 1/9,
        3: 1/9,
        4: 1/9,
        5: 1/36,
        6: 1/36,
        7: 1/36,
        8: 1/36
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

    function LatticeNode(x,y) {
        // A single node on the lattice. It contains particle distributions
        // for each of nine directions. It can also be a barrier.
        this.x = x; // X coordinate on canvas
        this.y = y; // Y coordinate on canvas
        // Each node contains individual distributions of particles that are travelling in
        // one of eight directions (as well as particles at rest).
        this.particles = [
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0
        ];
        this.barrier = false;
        // Keep track of overall node density and velocity. It would be easier to compute
        // these on the fly as needed, but it proved too computationally expensive.
        this.density = 0; // Rho
        this.velocity = {'x':0,'y':0}; // U
        this.curl = 0;
        this.update_particle = function(direction, mass) {
            // Update the distribution of a direction distribution
                this.particles[direction] += mass;
        };
    }

    function make_lattice() {
        // Makes a two-dimensional array of LatticsNodes.
        var x_size = Math.floor(canvas.width / block_size);
        var y_size = Math.floor(canvas.height / block_size);
        var new_lattice = [];
        for (var i = 0; i < x_size; i++) {
            var x_pos = i * block_size;
            new_lattice[i] = [];
            for (var j = 0; j < y_size; j++) {
                var y_pos = j * block_size;
                var new_lattice_node = new LatticeNode(
                    x_pos, // X position
                    y_pos // Y position
                    );
                new_lattice[i][j] = new_lattice_node;
            }
        }
        return new_lattice;
    }

    function init_lattice(lat, barrier) {
        // Initializes a two-dimensional array of LatticsNodes.
        // TODO: Add barrier logic to load barriers from an array.
        for (var i = 0; i < lat.length; i++) {
            for (var j = 0; j < lat[0].length; j++) {
                var node = lat[i][j];
                var particles = node.particles;
                particles = [0,0,0,0,0,0,0,0,0];
                node.density = 1;
                node.velocity.x = 0;
                node.velocity.y = 0;
                if ((i === 0 || i === lat.length - 1 ||
                    j === 0 || j === lat[0].length - 1)
                   // || ((i > 45 && i < 55) &&
                    //(j > 12 && j < 18))
                    ) {
                    node.barrier = true;
                }
            }
        }
    }

    function update_lattice() {
        // Create a new lattice and perform the stream phase, followed by the
        // collision phase.
        var new_lattice = make_lattice();
        stream(new_lattice);
        collide(new_lattice);
        lattice = new_lattice;
    }
    
    function stream(lat){
        // For every node in the lattice, move the particles to the next
        // node in the direction that they are heading.
        var row_size = lat.length;
        var col_size = lat[0].length;
        for (var x = 0; x < row_size; x++) {
            for (var y = 0; y < col_size; y++) {
                var old_node = lattice[x][y];
                var new_node = lat[x][y];
                new_node.barrier = old_node.barrier;
                for (var d = 0; d < old_node.particles.length; d++) {
                    var particle = old_node.particles[d];
                    var move_to = node_directions[d];
                    var newx = x + move_to.x;
                    var newy = y + move_to.y;
                    if (newx >= 0 && newy >= 0 && newx < row_size && newy < col_size) {
                        // Diminish each particle a little each time it propagates
                        var multiplier = 0.8;
                        if (lat[newx][newy].barrier) {
                            // Bounce particle back to originating node and reverse direction.
                            // TODO: Order of n
                            lat[x][y].particles[reflection[d]] = (particle * multiplier);
                        } else {
                            lat[newx][newy].particles[d] = (particle * multiplier);
                        }
                    }
                }
            }
        }
    }

    function push_fluid(x, y, newux, newuy, newrho) {
        // Sets distributions of node for a given velocity and density.
        var node = lattice[x][y];
        if (typeof newrho == 'undefined') {
            newrho = node.density;
        }
        var p = node.particles;


        // var ux3 = 3 * newux;
        // var uy3 = 3 * newuy;
        // var ux2 = newux * newux;
        // var uy2 = newuy * newuy;
        // var uxuy2 = 2 * newux * newuy;
        // var u2 = ux2 + uy2;
        // var u215 = 1.5 * u2;
        // p[0]  = four9ths * newrho * (1                              - u215);
        // p[1]  =   one9th * newrho * (1 + ux3       + 4.5*ux2        - u215);
        // p[3]  =   one9th * newrho * (1 - ux3       + 4.5*ux2        - u215);
        // p[2]  =   one9th * newrho * (1 + uy3       + 4.5*uy2        - u215);
        // p[4]  =   one9th * newrho * (1 - uy3       + 4.5*uy2        - u215);
        // p[5] =  one36th * newrho * (1 + ux3 + uy3 + 4.5*(u2+uxuy2) - u215);
        // p[8] =  one36th * newrho * (1 + ux3 - uy3 + 4.5*(u2-uxuy2) - u215);
        // p[6] =  one36th * newrho * (1 - ux3 + uy3 + 4.5*(u2-uxuy2) - u215);
        // p[7] =  one36th * newrho * (1 - ux3 - uy3 + 4.5*(u2+uxuy2) - u215);

        var u2 = Math.abs(dot_product(newux, newuy, newux, newuy));
        for (var j = 0; j < p.length; j++) {
            // Equilibrium
            var ei = node_directions[j];
            var product = dot_product(ei.x, ei.y, newux, newuy);
            var eq = newrho * node_weight[j] * (1 + 3*(product) + 4.5*(Math.pow(product,2)) - 1.5*u2);
            var old = p[j];
            p[j] = old + viscosity * (eq - old);
        }

        node.density = newrho;
        node.velocity.x = newux;
        node.velocity.y = newuy;
    }

    function collide(lat) {
        // Apply BGK collision operator to all nodes in lattice.
        var row_size = lat.length;
        var col_size = lat[0].length;
        for (var x = 0; x < row_size; x++) {
            for (var y = 0; y < col_size; y++) {
                var node = lat[x][y];
                if (!node.barrier) {
                    var p = node.particles;
                    var rho = 0;
                    var ux = 0;
                    var uy = 0;
                    for (var i = 0; i < p.length; i++) {
                        rho += p[i];
                        ux += node_directions[i].x * p[i];
                        uy += node_directions[i].y * p[i];
                    }
                    node.density = rho;
                    if (rho !== 0) {
                        ux = ux / rho;
                        uy = uy / rho;
                    } else {
                        ux = 0;
                        uy = 0;
                    }
                    node.curl = lattice[x+1][y].velocity.y - lattice[x-1][y].velocity.y - lattice[x][y+1].velocity.x + lattice[x][y-1].velocity.x;
                    // TODO: is this correct? dot_product(Math.abs(ux), Math.abs(uy), etc)?
                    var u2 = Math.abs(dot_product(ux, uy, ux, uy));
                    node.velocity['x'] = ux;
                    node.velocity['y'] = uy;

                    for (var j = 0; j < p.length; j++) {
                        // Equilibrium
                        var ei = node_directions[j];
                        var product = dot_product(ei.x, ei.y, ux, uy);
                        var eq = rho * node_weight[j] * (1 + 3*(product) + 4.5*(Math.pow(product,2)) - 1.5*u2);
                        var old = p[j];
                        p[j] = old + viscosity * (eq - old);
                    }

                    // var f1=3;
                    // var f2=9/2;
                    // var f3=3/2;
                    // var rt0 = (4/9 )*rho;
                    // var rt1 = (1/9 )*rho;
                    // var rt2 = (1/36)*rho;
                    // var ueqxij = ux;
                    // var ueqyij = uy;
                    // var uxsq = ueqxij * ueqxij;
                    // var uysq = ueqyij * ueqyij;
                    // var uxuy5 = ueqxij + ueqyij;
                    // var uxuy6 = -ueqxij + ueqyij;
                    // var uxuy7 = -ueqxij + -ueqyij;
                    // var uxuy8 = ueqxij + -ueqyij;
                    // var usq = uxsq + uysq;
                    // var pt = [];
                    // var omega = 1 / (3*viscosity + 0.5);
                    // pt[0] = rt0*( 1 - f3*usq);
                    // pt[1] = rt1*( 1 + f1*ueqxij + f2*uxsq - f3*usq);
                    // pt[2] = rt1*( 1 + f1*ueqyij + f2*uysq - f3*usq);
                    // pt[3] = rt1*( 1 - f1*ueqxij + f2*uxsq - f3*usq);
                    // pt[4] = rt1*( 1 - f1*ueqyij + f2*uysq - f3*usq);
                    // pt[5] = rt2*( 1 + f1*uxuy5 + f2*uxuy5*uxuy5 - f3*usq);
                    // pt[6] = rt2*( 1 + f1*uxuy6 + f2*uxuy6*uxuy6 - f3*usq);
                    // pt[7] = rt2*( 1 + f1*uxuy7 + f2*uxuy7*uxuy7 - f3*usq);
                    // pt[8] = rt2*( 1 + f1*uxuy8 + f2*uxuy8*uxuy8 - f3*usq);
                    // p[0] = p[0] + omega * (pt[0] - p[0]);
                    // p[1] = p[1] + omega * (pt[1] - p[1]);
                    // p[2] = p[2] + omega * (pt[2] - p[2]);
                    // p[3] = p[3] + omega * (pt[3] - p[3]);
                    // p[4] = p[4] + omega * (pt[4] - p[4]);
                    // p[5] = p[5] + omega * (pt[5] - p[5]);
                    // p[6] = p[6] + omega * (pt[6] - p[6]);
                    // p[7] = p[7] + omega * (pt[7] - p[7]);
                    // p[8] = p[8] + omega * (pt[8] - p[8]);

                }
            }
        }
    }

    function updater() {
        draw_lattice(canvas,lattice, block_size);
        update_lattice();
        var q;
        while (queue.length > 0) {
            q = queue.shift();
            push_fluid(q[0],q[1],q[2],q[3],q[4]);
        }
    }

    lattice = make_lattice();
    init_lattice(lattice);
    mouse_handler(canvas, lattice, queue, block_size);

    var intervalID = window.setInterval(updater, (150 - (speed / 0.75)));
}

var init = function() {
    var id = 'wind';
    window.onload = function(){
        wind(id, 50);
    };
}();
