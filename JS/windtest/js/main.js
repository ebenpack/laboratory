function wind(id, speed) {
    var canvas = document.getElementById(id);
    var lattice = [];
    var block_size = 5;
    var row_size = Math.floor(canvas.width / block_size);
    var col_size = Math.floor(canvas.height / block_size);
    var viscosity = 0.02; // fluid viscosity
    var omega = 1 / (3*viscosity + 0.5); // "relaxation" parameter
    var four9ths = 4/9;
    var one9th = 1/9;
    var one36th = 1/36;
    var queue = []; // Queue for mouse movements to prevent mouse movements from
    // altering lattice as it is being updated (may not be strictly necessary).
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

        0: {'x':0, 'y':0},
        1: {'x':1, 'y':0},
        2: {'x':0, 'y':1},
        3: {'x':-1, 'y':0},
        4: {'x':0, 'y':-1},
        5: {'x':1, 'y':1},
        6: {'x':-1, 'y':1},
        7: {'x':-1, 'y':-1},
        8: {'x':1, 'y':-1}
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
        this.update = function(direction, mass) {
            // Update the distribution of a direction distribution
            this.particles[direction] = mass;
        };
    }

    function make_lattice() {
        // Makes a two-dimensional array of LatticsNodes.
        var new_lattice = [];
        for (var i = 0; i < row_size; i++) {
            var x_pos = i * block_size;
            new_lattice[i] = [];
            for (var j = 0; j < col_size; j++) {
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
                node.density = 0;
                node.velocity.x = 0;
                node.velocity.y = 0;
                if (i === 0 || i === lat.length - 1 ||
                    j === 0 || j === lat[0].length - 1)
                    
                   // || ((i > 45 && i < 55) &&
                    //(j > 12 && j < 18)) )
                {
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
                    if (newx >= 0 && newy >= 0 &&
                        newx < row_size && newy < col_size && !new_node.barrier) {
                        // Check lattice, not lat, as it's possible not all barrier data
                        // has been copied over yet. 
                        if (lattice[newx][newy].barrier) {
                            // Bounce particle back to originating node and reverse direction.
                            // Collision is inelastic
                            lat[x][y].update([reflection[d]], particle * 0.5);
                        } else {
                            lat[newx][newy].update(d, particle);
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

        var ux2 = newux * newux;
        var uy2 = newuy * newuy;
        var u2 = ux2 + uy2;

        for (var j = 0; j < p.length; j++) {
            // Equilibrium
            var ei = node_directions[j];
            var dp = dot_product(ei.x, ei.y, newux, newuy);
            var eq = newrho * node_weight[j] * (1 + 3*(dp) + 4.5*(Math.pow(dp,2)) - 1.5*u2);
            var old = p[j];
            p[j] = old + (omega * (eq - old));
        }

        node.density = newrho;
        node.velocity.x = newux;
        node.velocity.y = newuy;
    }

    function collide(lat) {
        // Apply BGK collision operator to all nodes in lattice.
        for (var x = 0; x < row_size; x++) {
            for (var y = 0; y < col_size; y++) {
                var node = lat[x][y];
                if (!node.barrier) {
                    var p = node.particles;
                    var ux = 0;
                    var uy = 0;
                    var rho = 0;
                    for (var i = 0; i < p.length; i++) {
                        rho += p[i];
                        ux += node_directions[i].x * p[i];
                        uy += node_directions[i].y * p[i];
                    }
                    if (rho !== 0) {
                        ux = ux / rho;
                        uy = uy / rho;
                    } else {
                        ux = 0;
                        uy = 0;
                    }
                    node.density = rho;
                    node.velocity.x = ux;
                    node.velocity.y = uy;

                    var ux2 = ux * ux;
                    var uy2 = uy * uy;
                    var u2 = ux2 + uy2;

                    for (var i = 0; i < p.length; i++) {
                        var ei = node_directions[i];
                        var dp = dot_product(ei.x,ei.y,ux,uy);
                        var eq = node_weight[i] * rho * (1 + 3*dp + 4.5*(Math.pow(dp, 2)) - 1.5*u2);
                        var old = p[i];
                        p[i] = old + omega*(eq - old);
                    }
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
