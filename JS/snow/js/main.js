function snow(density, speed, id) {
    var canvas = document.getElementById(id);
    var allsnow = [];
    var block_size = 20;
    var debug = true;
    

    function Snow(y, x, z, sinus) {
        // Single paprticle of snow. z represents z-index, or how close snow is to foreground.
        // Sinus is in charge of drifting snow back and forth (sinusoidally)
        this.y = y;
        this.x = x;
        this.z = z;
        this.sinus = sinus;
        this.rand = randomrange(0.3, 1); // Extra randomness, unrelated to z-pos
        this.move = function() {
            // Move up/down. Closer snow moves faster.
            this.y += (this.z * this.rand * 2);
            // Move left/right. Update sinus. 
            // this.sinus += (0.3 * this.z) % 1;
            this.x += (Math.sin(this.sinus) * this.rand);
        };
    }

    function randomrange(min, max) {
        return Math.random() * (max - min) + min;
    }

    var init_snow = function(canvas, block_size, snow){
        var x = Math.floor(canvas.width / block_size);
        var y = Math.floor(canvas.height / block_size);
        for (var i = 0; i < x; i++) {
            for (var j = 0; j < y; j++) {
                var newsnow = new Snow(
                    j * block_size, // y-pos
                    i * block_size, // x-pos
                    1, // z-pos
                    0 // sinus start
                    );
                snow.push(newsnow);
            }
        }
    };

    function draw_snow(snow) {
        if (canvas.getContext){
            var ctx = canvas.getContext('2d');

            if (Math.random() < (density/100)) {
                var newsnow = new Snow(
                    -10, // y-pos
                    (Math.random() * canvas.width), // x-pos
                    Math.random(), // z-pos
                    randomrange(-1,1) // sinus start
                    );
                snow.push(newsnow);
            }
                
            // Reset canvas and redraw particles
            canvas.width = canvas.width;
            var remove = [];
            for (var i = 0; i < snow.length; i++) {

                // Update position
                snow[i].move();

                // Queue for removal
                if (snow[i].y > canvas.height + 10) {
                    // Record off-screen particles for later removal
                    remove.push(i);
                }

                // Draw
                ctx.fillStyle = "rgba(255, 255, 255, " + snow[i].z * 1.5 + ")";
                ctx.beginPath();
                ctx.arc(snow[i].x, snow[i].y, (snow[i].z * (2 - 0.5) + 2 ),0,Math.PI*2,true);
                ctx.closePath();
                ctx.fill();
            }
            remove.reverse();
            for (var j = 0; j < remove.length; j++) {
                snow.splice(remove[j], 1);
            }
        }
    }

    window.setInterval(function(){draw_snow(allsnow);}, 150 - (speed / 0.75));
}

var init = function() {
    var id = 'snow';

    function resize_canvas(id) {
        var canvas = document.getElementById(id);
        var viewportHeight = window.innerHeight;
        var viewportWidth = window.innerWidth;
        canvas.height = viewportHeight;
        canvas.width = viewportWidth;
    }

    window.onload = function(){
        resize_canvas(id);
        snow(50, 70, id);
    };
}();
