var boltzmann = boltzmann || {};
var boltzmann = (function (module) {
    module.main = (function () {
        var main = {};
        var queue = module.queue;
        var lattice_width = module.lattice_width;
        var lattice_height = module.lattice_height;
        var lattice = module.lattice;
        var particles = module.flow_particles;
        var omega = module.omega;
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
            for (var x = 0, l=particles.length; x < l; x++) {
                var p = particles[x];
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
            if (barrier !== undefined) {
                // Initialize from barrier array
            } else {
                for (var x = 0; x < lattice_width; x++) {
                    for (var y = 0; y < lattice_height; y++) {
                        if (x === 0 || x === lattice_width - 1 ||
                            y === 0 || y === lattice_height - 1 ||
                            (Math.abs((lattice_width/2)-x) < 10 &&
                                Math.abs((lattice_height/2)-y) < 10)) {
                            lattice[x][y].barrier = true;
                        }
                    }
                }
            }
        }
        function equilibrium(ux, uy, rho) {
            // Calculate equilibrium densities of a node
            // This is no longer performed in a loop, as that required
            // too many redundant calculations and was a performance drag.
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
        main.updater = function(){
            var steps = module.steps_per_frame;
            var q;
            for (var i = 0; i < steps; i++) {
                stream();
                collide();
                if (particles.length > 0) {
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
            module.drawing.draw();
            module.animation_id = requestAnimationFrame(main.updater);
        };
        main.init = function(){
            make_lattice(lattice_width, lattice_height);
            init_barrier();
            init_flow(0, 0, 1); // Initialize all lattice nodes with zero velocity, and density of 1
        };
        return main;
    })();
    return module;
})(boltzmann);

boltzmann.main.init();