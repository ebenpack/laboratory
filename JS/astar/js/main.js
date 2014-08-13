var Maze = (function(){

    function Maze(map_id, particle_id){
        this.mapcanvas = document.getElementById(map_id);
        this.canvas = document.getElementById(particle_id);
        this.mapctx = this.mapcanvas.getContext('2d');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.fillStyle = 'rgb(0, 255, 0)';
        this.mouse = {'x':10, 'y':4};
        this.map_width = 60;
        this.block_size = Math.floor(this.canvas.width / this.map_width);
        this.map_height = Math.floor(this.canvas.height / this.block_size);
        this.map = [];
        this.particles = [];
        this.particle_size = 2;
        this.path_queue = [];
        this.init();
    }
    Maze.prototype.init_map = function(width, height, density) {
        // Initialize and draw map.
        // Density is a number from [1-10). Lower = sparser barriers,
        // higher = denser barriers. 3 works fairly well
        if (density > 9){
            density = 9;
        }
        var map = this.map;
        for(var x = 0; x < width; x++){
            map[x] = [];
            for(var y = 0; y < height; y++) {
                if(Math.random() * 10 < density){
                    map[x][y] = {'x' : x, 'y' : y, 'barrier' : true};
                    this.mapctx.fillStyle = 'red';
                } else{
                    map[x][y] = {'x' : x, 'y' : y, 'barrier' : false};
                    this.mapctx.fillStyle = 'black';
                }
                this.mapctx.fillRect(x * this.block_size, y * this.block_size, this.block_size, this.block_size);
            }
        }
    };
    Maze.prototype.find_neighbors = function(x,y) {
        // Only return neighbors in cardinal directions
        // Particles can't navigate through barriers diagonally
        var neighbor_list = [];
        var map = this.map;
        for (var i = -1; i <= 1; i++) {
            for (var j = -1; j <= 1; j++) {
                if (!(i===j && i===0) &&
                    map[x+i] !== undefined && map[x+i][y+j] !== undefined &&
                    !map[x+i][y+j].barrier && (Math.abs(i) + Math.abs(j) < 2)) {
                    neighbor_list.push({'x': x+i, 'y':y+j, 'parent': {'x':x, 'y':y}});
                 }
            }
        }
        return neighbor_list;
    }
    Maze.prototype.collides = function(x,y) {
        // If a particle at x,y collides with a barrier on the map, return true
        // Check all four corners to see if any corner is within a barrier
        var map = this.map;
        for (var i = 0; i < 1; i++) {
            for (var j = 0; j < 1; j++) {
                 var mloc = this.map_location(x+(i*this.particle_size), y+(j*this.particle_size));
                 if (map[mloc.x] === undefined || map[mloc.x][mloc.y] === undefined || map[mloc.x][mloc.y].barrier === true) {
                    return true;
                 }
            }
        }
        return false;
    };
    Maze.prototype.map_location = function(x,y) {
        // Returns map coordinates for a given x,y on the canvas
        return {'x': Math.floor(x/this.block_size), 'y': Math.floor(y/this.block_size)};
    };
    Maze.prototype.init_particles = function(n) {
        // Add n particles to free (non-barrier) spaces on the map
        var added = 0;
        while (added < n) {
            var x = Math.floor(random_range(1, this.canvas.width - 2));
            var y = Math.floor(random_range(1, this.canvas.height - 2));
            if (!this.collides(x, y)) {
                var coords = this.map_location(x,y);
                this.particles.push( new Particle(x,y) );
                added += 1;
            }
        }
    };
    Maze.prototype.queue_path_updates = function() {
        // Queue all particles to find their path
        for (var i = 0; i < this.particles.length; i++) {
            this.path_queue.push(this.particles[i]);
        }
    };
    Maze.prototype.update_particles = function() {
        // Update and move particles. If any particles remain
        // in the path queue, dequeue one and find its path
        // Get the path for the first particle in the queue
        if (this.path_queue.length > 1) {
            var q = this.path_queue.shift();
            this.set_particle_path(q);
            // Loop through the queue and set the paths of any particles that are in the same area
            // This prevents much duplication of effort. E.g. if there are 20 particles all in
            // the same area, then we only need to find the path for one of them.
            var remove = []; // Indices for particles in path_queue to be removed.
            var particle1 = this.map_location(q.x, q.y);
            for (var j = 0; j < this.path_queue.length; j++) {
                var particle2 = this.map_location(this.path_queue[j].x, this.path_queue[j].y);
                if (particle1.x === particle2.x && particle1.y === particle2.y) {
                    remove.push(j);
                }
            }
            while (remove.length > 0) {
                var idx = remove.pop();
                this.path_queue[idx].path = q.path.slice(0); // Copy path
                this.path_queue.splice(idx, 1);
            }
        }
    };
    Maze.prototype.draw_particles = function(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.beginPath();
        for (var i = 0; i < this.particles.length; i++) {
            var p = this.particles[i];
            this.update_particle(p);
            this.move_particle(p);
            this.ctx.rect(Math.round(p.x), Math.round(p.y), this.particle_size, this.particle_size);
        }
        this.ctx.fill();
        this.ctx.closePath();
    };
    Maze.prototype.move_goal = function(e) {
        this.mouse.x = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
        this.mouse.y = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;
        // TODO: Clear old marker
        // TODO: draw new marker
        this.queue_path_updates();
    };
    Maze.prototype.init = function(){
        this.canvas.addEventListener('click', this.move_goal.bind(this));
        this.init_map(this.map_width, this.map_height, 3);
        this.init_particles(20);
        this.update();
    };
    Maze.prototype.update = function(){
        this.update_particles();
        this.draw_particles();
        window.requestAnimationFrame(this.update.bind(this));
    };
    Maze.prototype.update_particle = function(p) {
        // A particle's velocity doesn't change instantaneously. The angle
        // of its movement is nudged towards the angle towards its goal,
        // and then the goal angle is updated for its new position.
        
        // If particle has reached its current destination, remove the next
        // node in the path, and set that node as the new destination.
        var map_loc = this.map_location(p.x, p.y);
        if (map_loc.x === p.destination.x && map_loc.y === p.destination.y) {
            if (p.path.length > 0) {
                p.destination = p.path.pop();
            }
        }
        // Calculate angle to destination for current position.
        p.ang = angle(p.x, p.y, (p.destination.x * this.block_size) + (this.block_size / 2), (p.destination.y * this.block_size) + (this.block_size / 2));
        // Update particle velocity using new angle value
        var velx = p.speed * Math.cos(p.ang);
        var vely = p.speed * Math.sin(p.ang);
        // Velocity does not change instantaneously
        p.vel.x = p.vel.x + (velx - p.vel.x) * p.inertia;
        p.vel.y = p.vel.y + (vely - p.vel.y) * p.inertia;
    };
    Maze.prototype.move_particle = function(p) {
        // Get integer values for next position
        var newx = Math.round(p.vel.x + p.x);
        var newy = Math.round(p.vel.y + p.y );
        // Move if path unobstructed
        if (newx > 0 && newx < this.canvas.width - 1 &&
            newy > 0 && newy< this.canvas.height - 1 &&
            !this.collides(newx, newy)) {
            p.x = newx;
            p.y = newy;
        } else if (this.collides(newy,newx)) {
            // Bounce off. 
            p.vel.x = -p.vel.x;
            p.vel.y = -p.vel.y;
        }
    };
    Maze.prototype.set_particle_path = function(p) {
        // Find and set the path to the goal, using A*
        var start = this.map_location(p.x, p.y);
        var goal = this.map_location(this.mouse.x, this.mouse.y);
        start.parent = null;
        start.g = 0;
        start.h = calc_h(start, goal);
        start.f = start.g + start.h;
        var to_visit  = {};
        to_visit[to_str(start)] = start;
        var visited = {};
        while (!isEmpty(to_visit)) {
            // Find node with smalled F value is to_visit
            var idx = -1;
            var smallest_f = Infinity;
            for (var i in to_visit) {
                if (to_visit[i].f < smallest_f) {
                    idx = i;
                    smallest_f = to_visit[i].f;
                }
            }
            // Remove node with smallest F value from to_visit, add to visited
            var current = to_visit[idx];
            delete to_visit[idx];
            visited[idx] = current;
            // Calculate properties for neighbors of current and add to to_visit
            // if not already there and not already visited. 
            var neighbor_list = this.find_neighbors(current.x, current.y);
            for (var j = 0; j < neighbor_list.length; j++) {
                var neighbor = neighbor_list[j];
                neighbor.parent = current;
                neighbor.g = neighbor.parent.g + 1;
                neighbor.h = calc_h(neighbor, goal);
                neighbor.f = neighbor.g + neighbor.h;
                var key = to_str(neighbor);
                // Check if already visited, if so, check if F value here is better.
                if (key in to_visit && !(key in visited)) {
                    if (neighbor.g < to_visit[key].g) {
                        to_visit[key] = neighbor;
                    }
                } else if (!(key in visited)) {
                    to_visit[key] = neighbor;
                }
                // Stop if we've reached our goal
                if (neighbor.x === goal.x && neighbor.y === goal.y) {
                    visited[to_str(neighbor)] = neighbor;
                    // Work backwards from goal, adding parents to path, until we reach start
                    var path = [];
                    var curr = visited[to_str(goal)];
                    while (curr !== null) {
                        path.push({'x':curr.x, 'y':curr.y});
                        curr = curr.parent;
                    }
                    // Update current destination and path
                    p.destination = {'x':path[path.length-1].x, 'y':path[path.length-1].y};
                    p.path = path;
                    return;
                }
            }
        }
        if (isEmpty(to_visit)) {
            this.path.length = 0;
        }
    };

    function Particle(x,y) {
        this.x = x; // X position on canvas
        this.y = y; // Y position on canvas
        this.vel = {'x':0, 'y':0}; // Particle velocity vector
        this.ang = 0; // Angle the particle is travelling in
        this.speed = random_range(1,2);
        this.path = [];
        this.destination = {'x':0, 'y':0}; // The current destination
        this.inertia = random_range(0.05, 0.1);
    }

    function to_str(node) {
        return JSON.stringify([node.x,node.y]);
    }

    function calc_h(p0, p1){
        // Calculate H using Manhatten method.
        var d1 = Math.abs (p1.x - p0.x);
        var d2 = Math.abs (p1.y - p0.y);
        return d1 + d2;
    }

    function random_range(min, max) {
        return Math.random() * (max - min) + min;
    }

    function isEmpty(obj) {
        for(var key in obj) {
            if(obj.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }

    function angle(x1, y1, x2, y2) {
        // Return angle in radians, with 'East' being 0,
        // increasing clockwise to 3pi/2 at 'South', pi at 'West', etc.
        var dx = x2 - x1;
        var dy = y2 - y1;
        var theta = Math.atan2(dy, dx);
        // atan2 returns results in the range -pi...pi. Convert results 
        // to the range 0...2pi
        if (theta < 0) {
            theta += (2 * Math.PI);
        }
        return theta;
    }

    return Maze;
})();