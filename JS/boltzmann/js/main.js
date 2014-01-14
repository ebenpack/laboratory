function boltzmann(id, lattice_width, lattice_height) {
    var four9ths = 4/9;
    var one9th = 1/9;
    var one36th = 1/36;
    var node_directions = {
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

    function LatticeNode() {
        this.distribution = [0,0,0,0,0,0,0,0,0]; // Individual density distributions for 
        // each of the nine possible discrete velocities of a node.
        this.density = 0; // Macroscopic density of a node.
        this.ux = 0; // X component of macroscopic velocity of a node.
        this.uy = 0; // Y component of macroscopic velocity of a node.
        this.barrier = false; // Boolean indicating if node is a barrier.
    }

    function make_lattice(lattice_width, lattice_height) {
        // Make a new lattice 
        var new_lattice = [];
        for (var i = 0; i < lattice_width; i++) {
            new_lattice.push([]);
            for (var j = 0; j < lattice_height; j++) {
                new_lattice[i].push(new LatticeNode());
            }
        }
        return new_lattice;
    }

    function init_flow(ux, uy, rho) {
        // Initialize all nodes in lattice to flow with velocity (ux, uy)
        for (var x = 0; x < lattice_width; x++) {
            for (var y = 0; y < lattice_height; y++) {
                var node = lattice[x][y];
                if (!node.barrier) {
                    node.density = rho;
                    node.ux = ux;
                    node.uy = uy;
                    node.distribution = equilibrium(lattice[x][y], ux, uy, rho);
                }
            }
        }
    }

    function init_barrier(barrier_array) {
        // Barrier is an array of arrays. The inner arrays consist of [x,y]
        // coordinates for barrier in the lattice.
        // for (var i = 0; i < barrier_array.length; i++ ) {
        //     var x = barrier_array[i][0];
        //     var y = barrier_array[i][1];
        //     lattice[x][y].barrier = true;
        // }
        // For now, I'm going to hard-code the outer edges as barriers.
        // I suspect there's some additional logic I would need to implement for
        // streaming nodes at edges.
        for (var x = 0; x < lattice_width; x++) {
            for (var y = 0; y < lattice_height; y++) {
                if (x === 0 || x === lattice_width - 1 ||
                    y === 0 || y === lattice_height - 1) {
                    lattice[x][y].barrier = true;
                }
            }
        }
    }

    function equilibrium(node, ux, uy, rho) {
        // Calculate equilibrium densities of a node
        var eq = []; // Equilibrium values for all velocities in a node.
        var u2 = (ux * ux) + (uy * uy); // Magnitude of macroscopic velocity
        for (var d = 0; d < node.distribution.length; d++) {
            // Calculate equilibrium value
            var velocity = node_directions[d]; // Node direction vector
            var eu = (velocity.x * ux) + (velocity.y * uy); // Macro velocity multiplied by distribution velocity
            eq.push(node_weight[d] * rho * (1 + 3*eu + 4.5*(eu*eu) - 1.5*u2)); // Equilibrium equation
        }
        return eq;
    }

    function stream(new_lattice) {
        // Stream distributions from old lattice to new lattice. Boundary conditions are
        // considered at this stage, and distributions are bounced back to originating node
        // if a boundary is encountered.
        for (var x = 0; x < lattice_width; x++) {
            for (var y = 0; y < lattice_height; y++) {
                var old_node = lattice[x][y];
                var new_node = new_lattice[x][y];
                // Copy barrier data
                new_node.barrier = old_node.barrier;
                if (!new_node.barrier) {
                    for (var d = 0; d < old_node.distribution.length; d++) {
                        var move = node_directions[d];
                        var newx = move.x + x;
                        var newy = move.y + y;
                        // Check if new node is in the lattice
                        if (newx >= 0 && newx < lattice_width && newy >= 0 && newy < lattice_height) {
                            // If destination node is barrier, bounce distribution back to originating
                            // node in opposite direction. lattice barrier is checked as 
                            // the barrier flag for new_lattice may not yet have been set for
                            // destination node.
							// TODO: Look more closely into boundary conditions. Simple reflection might be
							// a bit simplistic.
                            if (lattice[newx][newy].barrier) {
                                new_lattice[x][y].distribution[reflection[d]] = old_node.distribution[d];
                            } else {
                                new_lattice[newx][newy].distribution[d] = old_node.distribution[d];
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
                    // Calculate macroscopic density (rho) and velocity (ux, uy)
                    var d = node.distribution;
                    var rho = d[0] + d[1] + d[2] + d[3] + d[4] + d[5] + d[6] + d[7] + d[8];
                    var ux = (d[1] + d[5] + d[8] - d[3] - d[6] - d[7]) / rho;
                    var uy = (d[2] + d[5] + d[6] - d[4] - d[7] - d[8]) / rho;
                    // Update values stored in node.
                    node.density = rho;
                    node.ux = ux;
                    node.uy = uy;
                    // Set node equilibrium for each velocity
                    var eq = equilibrium(node, ux, uy, rho);
                    for (var i = 0; i < eq.length; i++) {
                        var old_value = d[i];
                        node.distribution[i] = old_value + omega*(eq[i] - old_value);
                    }
                }
            }
        }
    }

    function update_lattice() {
        var new_lattice = make_lattice(lattice_width, lattice_height);
        stream(new_lattice);
        lattice = new_lattice;
        collide();
    }

    lattice = make_lattice(lattice_width, lattice_height);
    init_barrier();
    init_flow(0, 0, 1); // Initialize all lattice nodes with zero velocity, and density of 1
    mouse_handler(id);

    window.requestAnimFrame = (function(){
        return  window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        function( callback ){
        window.setTimeout(callback, 1000 / 60);
        };
    })();

    (function updater(){
        var steps = 1;
        for (var i = 0; i < steps; i++) {
            update_lattice();
        }
        var q;
        while (queue.length > 0) {
            q = queue.shift();
            var node = lattice[q[0]][q[1]];
            var ux = q[2];
            var uy = q[3];
            node.distribution = equilibrium(node, ux, uy, node.density);
        }
        draw_lattice(id);
        // requestAnimFrame(updater);
        window.setTimeout(updater, 20);
    })();

}

var init = function() {
    var id = 'boltzmann';
    window.onload = function(){
        boltzmann(id, 200, 80);
    };
}();
