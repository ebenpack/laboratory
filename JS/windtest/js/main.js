function wind(id, speed) {
    var canvas = document.getElementById(id);
    var lattice = [];
    var block_size = 6;
    var node_directions = {
        // Particles passing to other nodes can move in the four cardinal
        // directions (1,2,3,4), the four ordinal directions (5,6,7,8), 
        // or they can remain still (0). These directions are arranged as follows.
        // 6    2    5
        // 
        // 3    0    1
        // 
        // 7    4    8
        // N.b. The lattice origin is in the upper left of the canvas, so a move 'South'
        // would correspond to an increase in Y.

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
    var debug = true;

    function LatticeNode(x,y) {
        // A single node on the lattice. It can contain 
        // zero or more particles. It can also be a barrier. If a LatticeNode
        // becomes a barrier while it contains particles,
        // the particles it contains will be destroyed.
        this.x = x; // X coordinate on canvas
        this.y = y; // Y coordinate on canvas
        // Each node contains individual distributions of particles that are travelling in
        // one of eight directions (as well as particles at rest).
        this.particles = {
            0: {'mass':0, 'velocity':0},
            1: {'mass':0, 'velocity':0},
            2: {'mass':0, 'velocity':0},
            3: {'mass':0, 'velocity':0},
            4: {'mass':0, 'velocity':0},
            5: {'mass':0, 'velocity':0},
            6: {'mass':0, 'velocity':0},
            7: {'mass':0, 'velocity':0},
            8: {'mass':0, 'velocity':0}
        };
        this.barrier = false;
        // Keep track of overall node density and velocity. It would be easier to compute
        // these on the fly as needed, but it proved too computationally expensive.
        this.density = 0;
        this.velocity = 0;
        // previous_state is a canvas optimization, to avoid redrawing the entire canvas 
        // at every frame. A value of 0 represents a previous state of 'off', a value of 
        // 1 represents a previous state of 'on'. This value is checked, and if it appears
        // as if the current state differs from the previous state, the node is redrawn and
        // previous_state is updated.
        this.previous_state = 0;
        this.update_particle = function(direction, mass, velocity) {
            var particle = this.particles[direction];
            // Remove mass and velocity of old particle
            this.density -= particle.mass;
            this.velocity -= particle.velocity;

            // Add mass and velocity of new particle
            this.density += mass;
            this.velocity += velocity;

            // Update particle values
            particle.mass = mass;
            particle.velocity = velocity;
        };
        this.add_particle = function(direction, mass, velocity) {
            var particle = this.particles[direction];
            // Add mass and velocity of new particle
            this.density += mass;
            this.velocity += velocity;

            // Update particle values
            particle.mass += mass;
            particle.velocity += velocity;
        };
        this.remove_particle = function(direction) {
            var particle = this.particles[direction];
            // Remove mass and velocity of old particle.
            this.density -= particle.mass;
            this.velocity -= particle.velocity;

            // Reset particle.
            particle.mass = 0;
            particle.velocity = 0;
        };
    }

    function init_lattice() {
        // Initializes a two-dimensional array of LatticsNodes.
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
                // If we're at the edge, set the LatticeNode barrier
                // boolean to true.
                if (i === 0 || i === x_size - 1 ||
                    j === 0 || j === y_size - 1) {
                    new_lattice_node.barrier = true;
                }
                new_lattice[i][j] = new_lattice_node;
            }
        }
        return new_lattice;
    }

    function update_lattice() {
        // Create a new lattice and perform the stream phase, followed by the
        // collision phase.
        var new_lattice = init_lattice();
        stream(new_lattice);
        //collide(new_lattice);
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
                new_node.previous_state = old_node.previous_state;
                for (var p in old_node.particles) {
                    var particle = old_node.particles[p];
                    if (particle.mass > 0){
                        var move_to = node_directions[p];
                        var newx = x + move_to.x;
                        var newy = y + move_to.y;
                        if (newx > 0 && newy > 0 && newx < row_size && newy < col_size) {
                           lat[newx][newy].add_particle(p, particle.mass, particle.velocity);
                        }
                    }
                }
            }
        }
    }

    function collide(lat) {
        var row_size = lat.length;
        var col_size = lat[0].length;
        for (var x = 0; x < row_size; x++) {
            for (var y = 0; y < col_size; y++) {
                var node = lat[x][y];
                equilibrium(node);
            }
        }
    }

    function equilibrium(node) {
        var node_weight = {0:4/9, 1:1/9, 2:1/9, 3:1/9, 4:1/9,
            5:1/36, 6:1/36, 7:1/36, 8:1/36};
        for (var p in node.particles) {
            var d = node.density;
            if (d !== 0) {
                var particle = node.particles[p];
                var part_v = particle.velocity;
                var node_v = node.velocity;
                particle['mass'] = node_weight[p] * d * (1 + 3 * (part_v * node_v) + Math.pow((9/2)*(part_v * node_v), 2) - (3/2)*node_v*node_v);
            }
        }
    }

    function draw_particles() {
        // Draw nodes on the canvas. Only draw areas that have changed since
        // the last draw. Update lattice after drawing.
        if (canvas.getContext){
            var ctx = canvas.getContext('2d');
            var row_length = lattice.length;
            var col_length = lattice[0].length;
            ctx.lineWidth = 2;
            for (var i = 0; i < row_length; i++) {
                for (var j = 0; j < col_length; j++) {
                    // Draw
                    var node = lattice[i][j];
                    var density = node.density;
                    if (node.previous_state === 0 && node.density > 0.01) {
                        // Draw node if it has not been drawn already.
                        ctx.strokeStyle = "rgb(0, 204, 0)";
                        ctx.beginPath();
                        ctx.arc(node.x,node.y,0.3,0,2*Math.PI);
                        ctx.stroke();
                        ctx.closePath();
                        node.previous_state = 1;
                    } else if (node.previous_state === 1 && node.density <= 0.01) {
                        // Erase node if it has not been erased already.
                        ctx.fillStyle = "black";
                        ctx.beginPath();
                        ctx.arc(node.x,node.y,block_size/2,0,2*Math.PI);
                        ctx.fill();
                        ctx.closePath();
                        node.previous_state = 0;
                    }
                }
            }
            update_lattice();
        }
    }

    var mouse_handler = function() {
        function dist(x1, y1, x2, y2) {
            return Math.sqrt( Math.pow((x2 - x1),2) + Math.pow((y2 - y1),2) );
        }

        function radian_to_direction(angle){
            // Returns the discrete direction for a given angle.
            if (angle >= (Math.PI * (15/8)) || angle <  (Math.PI * (1/8))) {
                return 2;
            } else if (angle >= (Math.PI * (1/8)) && angle < (Math.PI * (3/8))) {
                return 5;
            } else if (angle >= (Math.PI * (3/8)) && angle < (Math.PI * (5/8))) {
                return 1;
            } else if (angle >= (Math.PI * (5/8)) && angle < (Math.PI * (7/8))) {
                return 8;
            } else if (angle >= (Math.PI * (7/8)) && angle < (Math.PI * (9/8))) {
                return 4;
            } else if (angle >= (Math.PI * (9/8)) && angle < (Math.PI * (11/8))) {
                return 7;
            } else if (angle >= (Math.PI * (11/8)) && angle < (Math.PI * (13/8))) {
                return 3;
            } else if (angle >= (Math.PI * (13/8)) && angle < (Math.PI * (15/8))) {
                return 6;
            } else {
                return 0;
            }
        }

        function speed(d, t) {
            return d / t;
        }

        function angle(x1, y1, x2, y2) {
            // Returns angle in radians, with 'North' being 0,
            // increasing clockwise to 3pi/2 at 'East', pi at 'South', etc.
            var dx = x1 - x2;
            var dy = y1 - y2;
            var theta = Math.atan2(-dx,dy);
            // atan2 returns results in the range -pi...pi. Convert results 
            // to the range 0...2pi
            if (theta < 0) {
                theta += (2 * Math.PI);
            }
            return theta;
        }

        var mousedownListener = function(e) {
            // Subtract 1 from time  to try to avoid t === 0 in moveListener, and 
            // thus divide by zero in dist function.
            var time = Date.now() - 1;
            var last_x = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
            var last_y = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;

            var moveListener = function(evt) {
                var t = Date.now() - time;
                var c = 1; // Arbitrary multiplier
                var radius = 10;
                var xpos = evt.hasOwnProperty('offsetX') ? evt.offsetX : evt.layerX;
                var ypos = evt.hasOwnProperty('offsetY') ? evt.offsetY : evt.layerY;
                var d = dist(last_x, last_y, xpos, ypos);
                var v = Math.abs(speed(d, t));
                var ang = angle(last_x, last_y, xpos, ypos);
                for (var i = -radius; i <= radius; i++) {
                    var newx = xpos + (i * c);
                    for (var j = -radius; j <= radius; j++) {
                        var newy = ypos + (j * c);
                        var d2 = Math.abs(dist(xpos, ypos, newx, newy));
                        // Update the particle distributions in a circle centered
                        // on the mouse
                        if (d2 <= radius && newx < canvas.width && newy < canvas.height) {
                            // Add particle to node. Don't add particles to edge (barrier) nodes.
                            var lattice_x = Math.round(newx / block_size);
                            var lattice_y = Math.round(newy / block_size);
                            if (lattice_x >= lattice.length - 1) {
                                lattice_x = lattice.length - 2;
                            }
                            if (lattice_x < 1) {
                                lattice_x = 1;
                            }
                            if (lattice_y >= lattice[0].length - 1) {
                                lattice_y = lattice[0].length - 2;
                            }
                            if (lattice_y < 1) {
                                lattice_y = 1;
                            }
                            var direction = radian_to_direction(ang);
                            lattice[lattice_x][lattice_y].add_particle(direction, 0.5, v);
                        }
                    }
                }
                time = Date.now();
                last_x = xpos;
                lst_y = ypos;
            };
            var mouseupListener = function(evt) {
                canvas.removeEventListener('mousemove', moveListener);
                canvas.removeEventListener('mouseup', mouseupListener);
            };
            canvas.addEventListener('mousemove', moveListener);
            canvas.addEventListener('mouseup', mouseupListener);
        };
        canvas.addEventListener('mousedown', mousedownListener);
        
    }();

    lattice = init_lattice();
    var intervalID = window.setInterval(function(){draw_particles();}, (150 - (speed / 0.75)));
}

var init = function() {
    var id = 'wind';
    window.onload = function(){
        wind(id, 50);
    };
}();
