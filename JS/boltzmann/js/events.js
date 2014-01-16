function mouse_handler () {
    
    var lattice_width = lattice.length;
    var lattice_height = lattice[0].length;
    var canvas_width = canvas.width;
    var canvas_height = canvas.height;
    var px_per_node = Math.floor(canvas.width / lattice_width);
    var mousedownListener = function(e) {

        var oldX = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
        var oldY = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;

        var moveListener = function(e) {
            var radius = 5;
            var newX = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
            var newY = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;
            var dx = (newX - oldX) / px_per_node;
            var dy = (newY - oldY) / px_per_node;
            // Ensure that push isn't too big
            if (Math.abs(dx) > 0.5) {
                dx = 0.1 * Math.abs(dx) / dx;
            }
            if (Math.abs(dy) > 0.5) {
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
                        Math.sqrt((x * x) + (y * y) < radius)) {
                        queue.push([lattice_x + x, lattice_y + y, dx, dy]);
                    }
                }
            }
        };
        var mouseupListener = function(e) {
            canvas.removeEventListener('mousemove', moveListener);
            canvas.removeEventListener('mouseup', mouseupListener);

            canvas.removeEventListener('touchmove', moveListener);
            document.body.removeEventListener('touchend', mouseupListener);
        };
        canvas.addEventListener('mousemove', moveListener);
        canvas.addEventListener('mouseup', mouseupListener);

        canvas.addEventListener('touchmove', moveListener);
        document.body.addEventListener('touchend', mouseupListener);
    };
    canvas.addEventListener('mousedown', mousedownListener);
    canvas.addEventListener('touchstart', mousedownListener);
}

(function settingsHandler(){
    function update_draw_mode(e){
        var new_draw_mode = this.selectedIndex;
        draw_mode = new_draw_mode;
    }
    function update_viscosity(e){
        var new_viscosity = parseInt(this.value, 10) / 100;
        viscosity = new_viscosity;
        omega = 1 / (3 * viscosity + 0.5);
    }
    function toggle_vectors(e){
        if (this.checked) {
            draw_flow_vectors = true;
        } else {
            draw_flow_vectors = false;
            vectorcanvas.width = vectorcanvas.width;
        }
    }
    var options = document.getElementById("drawmode");
    options.addEventListener('change', update_draw_mode);
    var slider = document.getElementById("viscosity");
    slider.addEventListener('input', update_viscosity);
    var flowvector = document.getElementById("flowvectors");
    flowvector.addEventListener('click', toggle_vectors);
})();