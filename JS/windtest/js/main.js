function wind(id, speed) {
    var canvas = document.getElementById(id);
    var wind_array = [];
    var block_size = 20;
    var debug = true;

    function Wind(velocity, angle, x, y) {
        this.x = x;
        this.y = y;
        this.velocity = velocity; // From 0 to 1
        this.angle = angle; // Radians
        this.delta_x = function() {
            return this.velocity * Math.sin(this.angle);
        };
        this.delta_y = function() {
            return this.velocity * Math.cos(this.angle);
        };
        this.endpoint_x = function () {
            return this.x + this.delta_x();
        };
        this.endpoint_y = function () {
            return this.y + this.delta_y();
        };
    }

    function randomrange(min, max) {
        return Math.random() * (max - min) + min;
    }

    function init_wind(){
        // Returns wind, a two-dimensional array of wind-points representing the direction 
        // and strength of wind at any given point on the canvas.
        // N.B. I'm fairly certain this is not going to resize well.
        var x_size = Math.floor(canvas.width / block_size);
        var y_size = Math.floor(canvas.height / block_size);
        for (var i = 0; i < x_size; i++) {
            var row = [];
            var x_pos = i * block_size;
            wind_array[i] = row;
            for (var j = 0; j < y_size; j++) {
                var y_pos = j * block_size;
                var newwind = new Wind(
                    0, // Velocity
                    0, // Direction
                    x_pos, // X position
                    y_pos  // Y position
                    );
                wind_array[i][j] = newwind;
            }
        }
    }

    function locate_wind(x,y) {
        var xpos = Math.floor(x / block_size);
        var ypos = Math.floor(y / block_size);
        if (xpos >= wind_array.length) {
            xpos = wind_array.length - 1;
        } else if (xpos < 0){
            xpos = 0;
        }
        if (ypos >= wind_array[0].length) {
            ypos = wind_array[0].length - 1;
        } else if (ypos < 0){
            ypos = 0;
        }
        var local_wind = wind_array[xpos][ypos];
        return local_wind;
    }

    function update_wind() {
        var new_wind_array = [];
        var row_length = wind_array.length;
        var col_length = wind_array[0].length;
        for (var i = 0; i < row_length; i++) {
            new_wind_array[i] = [];
            for (var j = 0; j < col_length; j++) {
                var w = wind_array[i][j];
                // Check neighbors, update velocity and angle
                var new_delta_x = 0;
                var new_delta_y = 0;
                var neighbors = 1;
                for (var k = -1; k <=1; k++) {
                    for (var m = -1; m <=1; m++) {
                        if (i + k >= 0 && j + m >= 0 && i + k < row_length && j + m < col_length) {
                            var w2 = wind_array[i+k][j+m];
                            
                            new_delta_x += w2.delta_x() * 0.99999999999;
                            new_delta_y += w2.delta_y() * 0.99999999999;
                            if (w2.velocity >= 0.0001) {
                                neighbors += 1;
                            }
                        }
                    }
                }
                new_delta_x /= neighbors;
                new_delta_y /= neighbors;
                var theta = Math.atan2(new_delta_x,new_delta_y);
                if (theta < 0) {
                    theta = theta + (2 * Math.PI);
                }
                var new_velocity = Math.sqrt( Math.abs(Math.pow(new_delta_x, 2)) + Math.abs(Math.pow(new_delta_y, 2)) );

                // In certain circumstances, either velocity and/or delats becomes infinite, which 
                // propagates throughout the wind_array to all other wind nodes. 
                // I would like to find exactly where/why this is happening, (I suspect the new_velocity is
                // simply too large of a number) but in the mean time, I'm setting up this dirty, dirty hack.
                if (isNaN(new_velocity) || !isFinite(new_velocity)) {
                    new_velocity = 0;
                }
                if (isNaN(theta) || !isFinite(theta)) {
                    theta = 0;
                }
                var newwind = new Wind(
                    new_velocity, // Velocity
                    theta, // Direction
                    w.x, // X position
                    w.y  // Y position
                    );
                new_wind_array[i][j] = newwind;

                // Die a little
            }
        }
    wind_array = new_wind_array;
    }

    function draw_wind() {
        if (canvas.getContext){
            var ctx = canvas.getContext('2d');
            // Reset canvas and redraw wind vectors
            canvas.width = canvas.width;
            var row_length = wind_array.length;
            var col_length = wind_array[0].length;
            ctx.strokeStyle = "green";
            ctx.lineWidth = 2;
            update_wind();
            for (var i = 0; i < row_length; i++) {
                for (var j = 0; j < col_length; j++) {
                    // Draw
                    var w = wind_array[i][j];
                    ctx.beginPath();
                    ctx.moveTo(w.x, w.y);
                    ctx.lineTo(w.endpoint_x(), w.endpoint_y());
                    ctx.stroke();
                    ctx.closePath();

                }
            }
        }
    }

    var mouse_handler = function() {
        function dist(x1, y1, x2, y2) {
            return Math.sqrt( Math.pow((x2 - x1),2) + Math.pow((y2 - y1),2) );
        }

        function velocity(d, t) {
            return d / t;
        }

        function angle(x1, y1, x2, y2) {
            var dx = x2 - x1;
            var dy = y2 - y1;
            var theta = Math.atan2(dx,dy);
            if (theta < 0) {
                theta = theta + (2 * Math.PI);
            }
            return theta;
        }

        var mousedownListener = function(event) {
            var time = Date.now();
            var last_x = event.clientX;
            var last_y = event.clientY;

            var moveListener = function(evt) {
                var t = Date.now() - time;
                var c = 1; // Arbitrary multiplier
                var radius = 50;
                var xpos = evt.clientX;
                var ypos = evt.clientY;
                var d = dist(last_x, last_y, xpos, ypos);
                var v = velocity(d, t);
                var ang = angle(xpos, ypos, last_x, last_y); // Somehow I got these backwards
                for (var i = -radius; i < radius; i++) {
                    var newx = xpos + (i * c);
                    for (var j = -radius; j < radius; j++) {
                        var newy = ypos + (j * c);
                        var d2 = Math.abs(dist(xpos, ypos, newx, newy));
                        if ( d2 < radius && newx < canvas.width && newy < canvas.height) { // Circle, not square
                            var local_wind = locate_wind(newx, newy);
                            local_wind.velocity = v - (10 *(v / d2)) * 100;
                            local_wind.angle = ang;
                        }
                    }
                }

                time = Date.now();
                last_x = xpos;
                lst_y = ypos;

                if (debug) {
                    var dbg = document.getElementById("debug");
                    var d3 = dist(last_x, last_y, newx, newy);
                    dbg.style['position'] = "absolute";
                    dbg.style['bottom'] = "0";
                    dbg.style['font-size'] = "30";
                    dbg.style['color'] = "red";
                    dbg.innerHTML = "Angle: " + angle(last_x, last_y, newx, newy);
                    dbg.innerHTML += "<br>Velocity: " + velocity(d3, t);
                }
                
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

    init_wind();
    var intervalID = window.setInterval(function(){draw_wind();}, (150 - (speed / 0.75)));
}

var init = function() {
    var id = 'wind';

    function resize_canvas(id) {
        var canvas = document.getElementById(id);
        var viewportHeight = window.innerHeight;
        var viewportWidth = window.innerWidth;
        canvas.height = viewportHeight;
        canvas.width = viewportWidth;
    }

    window.onload = function(){
        resize_canvas(id);
        wind(id, 50);
    };
}();
