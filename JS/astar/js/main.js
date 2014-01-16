var mapcanvas = document.getElementById("map");
var canvas = document.getElementById("particles");
var mapctx = mapcanvas.getContext('2d');
var ctx = canvas.getContext('2d');
var mouse = {'x':10, 'y':4};
var map_width = 60;
var block_size = Math.floor(canvas.width / map_width);
var map_height = Math.floor(canvas.height / block_size);
var map = [];
var particles = [];
var particle_size = 2;
var queue = []; // Used to queue particles for path updating. Prevents momentary freeze 
                        // that occurs if all particles update path on same frame.

function random_range(min, max) {
    return Math.random() * (max - min) + min;
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function angle(x1, y1, x2, y2) {
    // Return angle in radians, with 'North' being 0,
    // increasing clockwise to 3pi/2 at 'East', pi at 'South', etc.
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

function Particle(x,y) {
    this.x = x; // X position on canvas
    this.y = y; // Y position on canvas
    this.vel = {'x':0, 'y':0};
    this.ang = 0; // Angle the particle is travelling in
    this.speed = random_range(1,2);
    this.path = [];
    this.destination = {'x':0, 'y':0}; // The current destination
    this.inertia = random_range(0.05, 0.1);
    this.update = function() {
        // A particle's velocity doesn't change instantaneously. The angle
        // of its movement is nudges towards the angle towards its goal,
        // and then the goal angle is updated for its new position.
        
        // If particle has reached a node along its path, remove the next
        // node in the path, and set the 
        var map_loc = map_location(this.x, this.y);
        if (map_loc.x === this.destination.x && map_loc.y === this.destination.y) {
            if (this.path.length > 0) {
                this.destination = this.path.pop();
            }
        }
        // Calculate angle to goal for current position.
        this.ang = angle(this.x, this.y, (this.destination.x * block_size) + (block_size / 2), (this.destination.y * block_size) + (block_size / 2));
        // Update particle velocity using new angle value
        var velx = this.speed * Math.cos(this.ang);
        var vely = this.speed * Math.sin(this.ang);
        this.vel.x = this.vel.x + (velx - this.vel.x) * this.inertia;
        this.vel.y = this.vel.y + (vely - this.vel.y) * this.inertia;
    };
    this.move = function() {
        // Get integer values for next position
        var newx = Math.round(this.vel.x + this.x);
        var newy = Math.round(this.vel.y + this.y );
        // Move if path unobstructed
        if (newx > 0 && newx < canvas.width - 1 &&
            newy > 0 && newy< canvas.height - 1 &&
            !collides(newx, newy)) {
            this.x = newx;
            this.y = newy;
        }
    };
    this.set_path = function() {
        // Find and set the path to the goal, using A*
        // This would 
        // F = G + H
        var start = map_location(this.x, this.y);
        var goal = map_location(mouse.x, mouse.y);
        start.parent = null;
        start.g = 0;
        start.h = 0; // do this
        start.f = start.g + start.h;
        var to_visit  = {};
        to_visit[to_str(start)] = start;
        var visited = {};
        while (!isEmpty(to_visit)) {
            var idx = -1;
            var smallest_f = Infinity;
            // Find smalled F value
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
            // Calculate properties for neighbors and add to to_visit
            var neighbor_list = neighbors(current.x, current.y);
            for (var j = 0; j < neighbor_list.length; j++) {
                // diag 14, cardinal 10
                var nbr = neighbor_list[j];
                nbr.parent = current;
                if (nbr.x !== nbr.parent.x && nbr.y !== nbr.parent.y) {
                    // Diagonal movement costs more than horizontal or vertical movement
                    nbr.g = nbr.parent.g + 14;
                } else {
                    nbr.g = nbr.parent.g + 10;
                }
                nbr.h = calc_h(nbr, goal);
                nbr.f = nbr.g + nbr.h;

                var key = to_str(nbr);
                // Check if already visited, if so, check if F value here is better.
                if (key in to_visit && !(key in visited)) {
                    if (nbr.g < to_visit[key].g) {
                        to_visit[key] = nbr;
                    }
                } else if (!(key in visited)) {
                    to_visit[key] = nbr;
                }
                // Stop if we've reached our goal
                if (nbr.x === goal.x && nbr.y === goal.y) {
                    visited[to_str(nbr)] = nbr;
                    // Work backwards from goal, adding parents to list, until we reach start
                    var path = [];
                    var curr = visited[to_str(goal)];
                    while (curr !== null) {
                        path.push({'x':curr.x, 'y':curr.y});
                        curr = curr.parent;
                    }
                    this.destination = {'x':path[path.length-1].x, 'y':path[path.length-1].y};
                    this.path = path;
                    return;
                }
            }
        }
        if (isEmpty(to_visit)) {
            this.path = [];
        }
        function to_str(node) {
                return node.x + '' + node.y;
            }
        function calc_h(p0, p1){
            var d1 = Math.abs (p1.x - p0.x);
            var d2 = Math.abs (p1.y - p0.y);
            return d1 + d2;
        }
    };
}

function neighbors(x,y) {
    // Only return neighbors in cardinal directions
    // Particles can't navigate through barriers diagonally
    var neighbor_list = [];
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            if (!(i===j && i===0) && map[x+i] !== undefined && map[x+i][y+j] !== undefined && !map[x+i][y+j].barrier && (Math.abs(i) + Math.abs(j) < 2)) {
                neighbor_list.push({'x': x+i, 'y':y+j, 'parent': {'x':x, 'y':y}});
             }
        }
    }
    return neighbor_list;
}

function init_map(width, height) {
    for(var x = 0; x < width; x++){
        map[x] = [];
        for(var y = 0; y < height; y++) {
            if(Math.random() * 10 > 7){
                map[x][y] = {'x' : x, 'y' : y, 'barrier' : true};
                mapctx.fillStyle = 'red';
            } else{
                map[x][y] = {'x' : x, 'y' : y, 'barrier' : false};
                mapctx.fillStyle = 'black';
            }
            mapctx.fillRect(x * block_size, y * block_size, block_size, block_size);
        }
    }
}

function collides(x,y) {
    // If a particle at x,y collides with a barrier on the map, return true
    // Check all four corners to see if any corner is within a barrier
    for (var i = 0; i < 1; i++) {
        for (var j = 0; j < 1; j++) {
             var mloc = map_location(x+(i*particle_size), y+(j*particle_size));
             if (map[mloc.x] === undefined || map[mloc.x][mloc.y] === undefined || map[mloc.x][mloc.y].barrier === true) {
                return true;
             }
        }
    }
    return false;
}

function map_location(x,y) {
    // Returns map coordinates for a given x,y on the canvas
    return {'x': Math.floor(x/block_size), 'y': Math.floor(y/block_size)};
}

function init_particles(n) {
    var added = 0;
    while (added < n) {
        var x = Math.floor(random_range(1, canvas.width - 2));
        var y = Math.floor(random_range(1, canvas.height - 2));
        if (!collides(x, y)) {
            var coords = map_location(x,y);
            particles.push( new Particle(x,y) );
            added += 1;
        }
    }
}

init_map(map_width, map_height);
init_particles(20);

function update_paths() {
    for (var i = 0; i < particles.length; i++) {
        queue.push(particles[i]);
    }
}

function update() {
    var image = ctx.createImageData(canvas.width, canvas.height);

    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.update();
        p.move();
        draw_particle(p.x, p.y, 0, 255, 0, 100);
    }
    if (queue.length > 1) {
            var q = queue.shift();
            q.set_path();
            // TODO: Save path, scan queue, remove all particles in queu
            // in same starting square and set path to saved path.
        }

    ctx.putImageData(image, 0, 0);

    function draw_particle(x, y, r, g, b, a) {
        px_per_node = 2;
        for (var ypx = y; ypx < y + px_per_node; ypx++) {
            for (var xpx = x; xpx < x + px_per_node; xpx++) {
                var index = (xpx + ypx * image.width) * 4;
                image.data[index+0] = r;
                image.data[index+1] = g;
                image.data[index+2] = b;
                image.data[index+3] += a;
            }
        }
    }
}

function move_goal(e) {
    mouse.x = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
    mouse.y = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;
    // Clear old marker,
    // draw new marker
    update_paths();
}

canvas.addEventListener('click', move_goal);


window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();

(function animloop(){
    update();
    requestAnimFrame(animloop);
})();


