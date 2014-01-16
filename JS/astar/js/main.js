var mapcanvas = document.getElementById("map");
var canvas = document.getElementById("particles");
var mapctx = mapcanvas.getContext('2d');
var ctx = canvas.getContext('2d');
var goal = {'x':10, 'y':4};
map_width = 60;
block_size = Math.floor(canvas.width / map_width);
height = Math.floor(canvas.height / block_size);

map = [];
particles = [];
var particle_size = 2;

function random_range(min, max) {
    return Math.random() * (max - min) + min;
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
    this.x = x;
    this.y = y;
    this.vel = {'x':0, 'y':0};
    this.ang = 0;
    this.speed = 1;
    this.path = [];
    this.move = function() {
        // Update velocity. When the angle the particle is moving in changes we don't
        // want the velocity to change instantly, so just nudge it towards where it belongs.
        // This is meant to be a very crude implementation of inertia.
        var inertia = 0.05;
        var dx = this.speed * Math.cos(this.ang);
        var dy = this.speed * Math.sin(this.ang);
        if (this.vel.x < dx) {
            this.vel.x += inertia;
        } else {
            this.vel.x -= inertia;
        }
        if (this.vel.y < dy) {
            this.vel.y += inertia;
        } else {
            this.vel.y -= inertia;
        }
        // Randomness
        this.vel.x += random_range(-inertia, inertia);
        this.vel.y += random_range(-inertia, inertia);


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
        this.ang = angle(this.x, this.y, goal.x, goal.y);
    };
}

function init_map(width) {
    for(var x = 0; x < width; x++){
        map[x] = [];
        for(var y = 0; y < height; y++) {
            if(Math.random() * 10 > 8){
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

init_map(map_width);
init_particles(20);

function update_paths() {
    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.set_path();
    }
}

function update() {
    var image = ctx.createImageData(canvas.width, canvas.height);

    for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.move();
        draw_particle(p.x, p.y, 0, 255, 0, 100);
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
    goal.x = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
    goal.y = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;
    // Clear old marker,
    // draw new marker
    update_paths();
}

var step = document.getElementById("step");
step.addEventListener('click', update);

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


