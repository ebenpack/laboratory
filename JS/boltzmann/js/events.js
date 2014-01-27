function mouse_handler () {
    var lattice_width = lattice.length;
    var lattice_height = lattice[0].length;
    var px_per_node = Math.floor(canvas.width / lattice_width);
    var mousedownListener = function(e) {

        var oldX = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
        var oldY = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;

        var moveListener = function(e) {
            var radius = 5;
            var newX = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
            var newY = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;
            var dx = (newX - oldX) / px_per_node / steps_per_frame;
            var dy = (newY - oldY) / px_per_node / steps_per_frame;
            // Ensure that push isn't too big
            if (Math.abs(dx) > 0.1) {
                dx = 0.1 * Math.abs(dx) / dx;
            }
            if (Math.abs(dy) > 0.1) {
                dy = 0.1 * Math.abs(dy) / dy;
            }
            // Scale from canvas coordinates to lattice coordinates
            var lattice_x = Math.floor(newX / px_per_node);
            var lattice_y = Math.floor(newY / px_per_node);
            for (var x = -radius; x <= radius; x++) {
                for (var y = -radius; y <= radius; y++) {
                    // Push in circle around cursor. Make sure coordinates are in bounds.
                    if (lattice_x + x >= 0 && lattice_x + x < lattice_width &&
                        lattice_y + y >= 0 && lattice_y + y < lattice_height &&
                        !lattice[lattice_x + x][lattice_y + y].barrier &&
                        Math.sqrt((x * x) + (y * y)) < radius) {
                        queue.push([lattice_x + x, lattice_y + y, dx, dy]);
                    }
                }
            }
        oldX = newX;
        oldY = newY;
        };
        var mouseupListener = function(e) {
            canvas.removeEventListener('mousemove', moveListener, false);
            canvas.removeEventListener('mouseup', mouseupListener, false);

            canvas.removeEventListener('touchmove', moveListener, false);
            document.body.removeEventListener('touchend', mouseupListener, false);
        };
        canvas.addEventListener('mousemove', moveListener, false);
        canvas.addEventListener('mouseup', mouseupListener, false);

        canvas.addEventListener('touchmove', moveListener, false);
        document.body.addEventListener('touchend', mouseupListener, false);
    };
    canvas.addEventListener('mousedown', mousedownListener, false);
    canvas.addEventListener('touchstart', mousedownListener, false);
}

(function settingsHandler(){
    function update_draw_mode(e){
        draw_mode = this.selectedIndex;
    }
    function update_viscosity(e){
        viscosity = parseInt(this.value, 10) / 100;
        omega = 1 / (3 * viscosity + 0.5);
    }
    function toggle_vectors(e){
        if (this.checked) {
            draw_flow_vectors = true;
        } else {
            draw_flow_vectors = false;
            vectorcanvas.width = vectorcanvas.width; // Clear vector canvas
        }
    }
    var options = document.getElementById("drawmode");
    options.addEventListener('change', update_draw_mode, false);
    var slider = document.getElementById("viscosity");
    slider.addEventListener('input', update_viscosity, false);
    var flowvector = document.getElementById("flowvectors");
    flowvector.addEventListener('click', toggle_vectors, false);
})();