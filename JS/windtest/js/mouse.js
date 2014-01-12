function mouse_handler (canvas, lattice, queue, block_size) {
    var x_size = Math.floor(canvas.width / block_size);
    var y_size = Math.floor(canvas.height / block_size);
    function inbounds(x,y) {
        // Returns true if x,y coordinates satisfy in-bounds conditions
        // (inside lattice, not barrier, etc.), otherwise returns false.
        return (x < lattice.length && x >= 0 &&
                y < lattice[0].length && y >= 0 &&
                !lattice[x][y].barrier);
    }

        var node_directions = {
            // TODO: DELTE THIS AND ADD TO HELPER FUNCTIONS
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

    var mousedownListener = function(e) {
        var time = Date.now();
        var oldX = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
        var oldY = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;

        var moveListener = function(e) {
            var t = Date.now() - time;
            // If t === 0, set t to 1, to prevent divide by zero in speed function.
            t = t === 0 ? 1: t;
            var radius = 5;
            var newX = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
            var newY = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;
            var ang = angle(oldX, oldY, newX, newY);
            var quad = node_directions[radian_to_direction(ang)];
            var latX = Math.round(newX / block_size); // X position on the lattice
            var latY = Math.round(newY / block_size); // Y position on the lattice

            for (var i = -radius; i <= radius; i++) {
                var x_radius = latX + i;
                for (var j = -radius; j <= radius; j++) {
                    var y_radius = latY + j;
                    var dist_from_radius = Math.abs(dist(latX, latY, x_radius, y_radius));
                    // Update the particle distributions in a circle centered
                    // on the mouse
                    if (dist_from_radius <= radius && inbounds(x_radius, y_radius)) {
                        // var lattice_x = Math.round(x_radius / block_size);
                        // var lattice_y = Math.round(y_radius / block_size);
                        // Add particle to node. Don't add particles to edge (barrier) nodes.

                            var delta_x = (newX - oldX) ;
                            var delta_y = -(newY - oldY);   // y axis is flipped
                            if (Math.abs(delta_x) > 0.1) {
                                delta_x = 0.1 * Math.abs(delta_x) / delta_x;
                            }
                            if (Math.abs(delta_y) > 0.1) {
                                delta_y = 0.1 * Math.abs(delta_y) / delta_y;
                            }
                            queue.push([x_radius, y_radius, quad.x, quad.y, 0.5]);
                    }
                }
            }
            time = Date.now();
            oldX = newX;
            oldY = newY;
        };
        var mouseupListener = function(e) {
            canvas.removeEventListener('mousemove', moveListener);
            canvas.removeEventListener('mouseup', mouseupListener);

            canvas.removeEventListener('touchmove', moveListener, false);
            document.body.removeEventListener('touchend', mouseupListener, false);
        };
        canvas.addEventListener('mousemove', moveListener);
        canvas.addEventListener('mouseup', mouseupListener);

        canvas.addEventListener('touchmove', moveListener, false);
        document.body.addEventListener('touchend', mouseupListener, false);
    };
    canvas.addEventListener('mousedown', mousedownListener);
    canvas.addEventListener('touchstart', mousedownListener, false);
}