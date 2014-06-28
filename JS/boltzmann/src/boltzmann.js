var boltzmann = boltzmann || {};
boltzmann = (function (module) {
    module.main = (function () {
        var main = {};
        var queue = module.queue;
        var lattice_width = module.lattice_width;
        var lattice_height = module.lattice_height;
        var lattice = module.lattice;
        var particles = module.flow_particles;
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
         * A single node in the lattice.
         * @constructor
         * @struct
         */
        function LatticeNode() {
            this.distribution = new Float64Array(9); // Individual density distributions for 
            // each of the nine possible discrete velocities of a node.
            this.stream = new Float64Array(9); // Used to temporarily hold streamed values
            this.density = 0; // Macroscopic density of a node.
            this.ux = 0; // X component of macroscopic velocity of a node.
            this.uy = 0; // Y component of macroscopic velocity of a node.
            this.barrier = false; // Boolean indicating if node is a barrier.
            this.curl = 0; // Curl of node.
        }

        /**
         * Make a new empty lattice 
         * @param {number} lattice_width Width of the lattice being initialized, in nodes
         * @param {number} lattice_height Width of the lattice being initialized, in nodes
         */
        function make_lattice(lattice_width, lattice_height) {
            lattice.length = 0;
            for (var i = 0; i < lattice_width; i++) {
                lattice[i] = [];
                for (var j = 0; j < lattice_height; j++) {
                    lattice[i][j] = new LatticeNode();
                }
            }
        }

        /**
         * Initialize all nodes in lattice to flow with velocity (ux, uy) and density rho 
         * @param {number} ux X velocity of flow
         * @param {number} uy Y velocity of flow
         * @param {number} rho Macroscopic density
         */
        function init_flow(ux, uy, rho) {
            for (var x = 0; x < lattice_width; x++) {
                for (var y = 0; y < lattice_height; y++) {
                    var node = lattice[x][y];
                    if (!node.barrier) {
                        node.density = rho;
                        node.ux = ux;
                        node.uy = uy;
                        var eq = equilibrium(ux, uy, rho);
                        for (var i=0;i<9;i++){
                            node.distribution[i] = eq[i];
                            node.stream[i] = eq[i];
                        }
                    }
                }
            }
        }

        /**
         * Initialize flow particles
         */
        function init_flow_particles() {
            particles.length = 0;
            for (var x = 1; x < 20; x++) {
                for (var y = 1; y < 8; y++) {
                    if (!lattice[x*10][y*10].barrier) {
                        particles.push({'x':x*10, 'y':y*10});
                    }
                }
            }
        }

        /**
         * Move flow particles 
         */
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
                if (module.flow_speed > 0 && p.x > lattice_width - 2) {
                    // Wrap particles around to other side of screen
                    p.x = 1;
                }
            }
        }

        /**
         * Initialize barrier nodes.
         * @param {Array.<Object>=} barrier Optional barrier barrier array. Contains
         *      objects definining (x, y) coordinates of barrier nodes to initialize
         */
        function init_barrier(barrier) {
            if (barrier !== undefined) {
                // Clear all
                for (var x = 0; x < lattice_width; x++) {
                    for (var y = 0; y < lattice_height; y++) {
                        lattice[x][y].barrier = false;
                    }
                }
                // Set new barriers from barrier array
                for (var i = 0; i < barrier.length; i++) {
                    lattice[barrier[i].x][barrier[i].y].barrier = true;
                }
            } else {
                // Default barrier setup
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

        /**
         * Calculate equilibrium densities of a node
         * @param {number} ux X velocity of node
         * @param {number} uy Y velocity of node
         * @param {number} rho Macroscopic density
         */
        function equilibrium(ux, uy, rho) {
            // This is no longer performed in a loop, as that required
            // too many redundant calculations and was a performance drag.
            // Thanks to Daniel V. Schroeder http://physics.weber.edu/schroeder/fluids/
            // for this optimization
            var eq = []; // Equilibrium values for all velocities in a node.
            var ux3 = 3 * ux;
            var uy3 = 3 * -uy;
            var ux2 = ux * ux;
            var uy2 = -uy * -uy;
            var uxuy2 = 2 * ux * -uy;
            var u2 = ux2 + uy2;
            var u215 = 1.5 * u2;
            eq[0] = four9ths * rho * (1 - u215);
            eq[1] = one9th * rho * (1 + ux3 + 4.5*ux2 - u215);
            eq[2] = one9th * rho * (1 + uy3 + 4.5*uy2 - u215);
            eq[3] = one9th * rho * (1 - ux3 + 4.5*ux2 - u215);
            eq[4] = one9th * rho * (1 - uy3 + 4.5*uy2 - u215);
            eq[5] = one36th * rho * (1 + ux3 + uy3 + 4.5*(u2+uxuy2) - u215);
            eq[6] = one36th * rho * (1 - ux3 + uy3 + 4.5*(u2-uxuy2) - u215);
            eq[7] = one36th * rho * (1 - ux3 - uy3 + 4.5*(u2+uxuy2) - u215);
            eq[8] = one36th * rho * (1 + ux3 - uy3 + 4.5*(u2-uxuy2) - u215);
            return eq;
        }

        /**
         * Stream distributions from old lattice to new lattice. Boundary conditions are
         * considered at this stage, and distributions are bounced back to originating node
         * if a boundary is encountered.
         */
        function stream() {
            for (var x = 0; x < lattice_width; x++) {
                for (var y = 0; y < lattice_height; y++) {
                    var node = lattice[x][y];
                    if (!node.barrier) {
                        for (var d = 0; d < 9; d++) {
                            var move = node_directions[d];
                            var newx = move.x + x;
                            var newy = move.y + y;
                            // Check if new node is in the lattice
                            if (newx >= 0 && newx < lattice_width && newy >= 0 && newy < lattice_height) {
                                // If destination node is barrier, bounce distribution back to 
                                // originating node in opposite direction.
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

        /**
         * Collision phase of LBM
         */
        function collide() {
            var omega = module.omega;
            for (var x = 1; x < lattice_width-1; x++) {
                for (var y = 1; y < lattice_height-1; y++) {
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
                        // Compute curl. Non-edge nodes only.
                        // Don't compute if it won't get drawn
                        if (module.draw_mode == 4 && x > 0 && x < lattice_width - 1 &&
                            y > 0 && y < lattice_height - 1) {
                            node.curl = lattice[x+1][y].uy - lattice[x-1][y].uy - lattice[x][y+1].ux + lattice[x][y-1].ux;
                        }
                        // Set node equilibrium for each velocity
                        // Inlining the equilibrium function here provides significant performance improvements
                        var ux3 = 3 * ux;
                        var uy3 = 3 * uy;
                        var ux2 = ux * ux;
                        var uy2 = uy * uy;
                        var uxuy2 = 2 * ux * uy;
                        var u2 = ux2 + uy2;
                        var u215 = 1.5 * u2;
                        var one9thrho = one9th * rho;
                        var one36thrho = one36th * rho;
                        d[0] = d[0] + (omega * ((four9ths * rho * (1 - u215)) - d[0]));
                        d[1] = d[1] + (omega * ((one9thrho * (1 + ux3 + 4.5*ux2 - u215)) - d[1]));
                        d[2] = d[2] + (omega * ((one9thrho * (1 - uy3 + 4.5*uy2 - u215)) - d[2]));
                        d[3] = d[3] + (omega * ((one9thrho * (1 - ux3 + 4.5*ux2 - u215)) - d[3]));
                        d[4] = d[4] + (omega * ((one9thrho * (1 + uy3 + 4.5*uy2 - u215)) - d[4]));
                        d[5] = d[5] + (omega * ((one36thrho * (1 + ux3 - uy3 + 4.5*(u2-uxuy2) - u215)) - d[5]));
                        d[6] = d[6] + (omega * ((one36thrho * (1 - ux3 - uy3 + 4.5*(u2+uxuy2) - u215)) - d[6]));
                        d[7] = d[7] + (omega * ((one36thrho * (1 - ux3 + uy3 + 4.5*(u2-uxuy2) - u215)) - d[7]));
                        d[8] = d[8] + (omega * ((one36thrho * (1 + ux3 + uy3 + 4.5*(u2+uxuy2) - u215)) - d[8]));
                    }
                }
            }
        }
        /**
         * Set equilibrium values for boundary nodes.
         */
        function set_boundaries() {
            // Copied from Daniel V. Schroeder.
            var u0 = module.flow_speed;
            for (var x=0; x<lattice_width-1; x++) {
                lattice[x][0].distribution = equilibrium(u0, 0, 1);
                lattice[x][lattice_height-1].distribution = equilibrium(u0, 0, 1);
            }
            for (var y=0; y<lattice_height-1; y++) {
                lattice[0][y].distribution = equilibrium(u0, 0, 1);
                lattice[lattice_width-1][y].distribution = equilibrium(u0, 0, 1);
            }
        }
        /**
         * Update loop. 
         */
        main.updater = function(){
            var steps = module.steps_per_frame;
            var q;
            set_boundaries();
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
            /**
             * Initialize lattice.
             */
            make_lattice(lattice_width, lattice_height);
            init_barrier([]);
            init_flow(0, 0, 1); // Initialize all lattice nodes with zero velocity, and density of 1
            queue.length = 0;
            module.drawing.draw(); // Call draw once to draw barriers, but don't start animating
        };
        main.init_barrier = init_barrier;
        main.init_flow_particles = init_flow_particles;
        return main;
    })();
    return module;
})(boltzmann);

boltzmann.main.init();