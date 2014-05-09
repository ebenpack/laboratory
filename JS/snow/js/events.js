var snow = snow || {};

snow = (function(module){

    var canvas = module.canvas;

    function mousedown_listener(e){
        var lattice_width = module.wind_array.length;
        var lattice_height = module.wind_array[0].length
        var oldX = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
        var oldY = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;

        function mousemove_listener(e){
            var radius = 5;
            var newX = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
            var newY = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;
            var dx = (newX - oldX) / module.block_size;
            var dy = (newY - oldY) / module.block_size;
            // Ensure that push isn't too big
            if (Math.abs(dx) > 0.1) {
                dx = 0.1 * Math.abs(dx) / dx;
            }
            if (Math.abs(dy) > 0.1) {
                dy = 0.1 * Math.abs(dy) / dy;
            }
            // Scale from canvas coordinates to lattice coordinates
            var lattice_x = Math.floor(newX / module.block_size);
            var lattice_y = Math.floor(newY / module.block_size);
            for (var x = -radius; x <= radius; x++) {
                for (var y = -radius; y <= radius; y++) {
                    // Push in circle around cursor. Make sure coordinates are in bounds.
                    if (lattice_x + x >= 0 && lattice_x + x < lattice_width &&
                        lattice_y + y >= 0 && lattice_y + y < lattice_height &&
                        Math.sqrt((x * x) + (y * y)) < radius) {
                        if (dx > 0.09) {
                            module.wind_array[lattice_x][lattice_y].direction[0] = true
                        }
                        if (dx < -0.09) {
                            module.wind_array[lattice_x][lattice_y].direction[2] = true
                        }
                        if (dy > 0.09) {
                            module.wind_array[lattice_x][lattice_y].direction[3] = true
                        }
                        if (dy < -0.09) {
                            module.wind_array[lattice_x][lattice_y].direction[1] = true
                        }
                    }
                }
            }
            oldX = newX;
            oldY = newY;
        }
        function mouseup_listener(){
            // On mouseup, un-register mousemove and mouseup listeners
            canvas.removeEventListener('mousemove', mousemove_listener, false);
            canvas.removeEventListener('mouseup', mouseup_listener, false);
        }
        // Register mousemove and mousup
        canvas.addEventListener('mousemove', mousemove_listener, false);
        canvas.addEventListener('mouseup', mouseup_listener, false);
    }
    canvas.addEventListener('mousedown', mousedown_listener, false);

    return module;
})(snow);