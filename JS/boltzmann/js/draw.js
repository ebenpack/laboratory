function draw_lattice() {
    // TODO: Change color handling
    var lattice_width = lattice.length;
    var lattice_height = lattice[0].length;
    var px_per_node = Math.floor(canvas.width / lattice_width);
    if (canvas.getContext) {
        var ctx = canvas.getContext('2d');
        var vectorctx = vectorcanvas.getContext('2d');

        if (draw_flow_vectors) {
            // Clear the canvas if we're drawing flow vectors.
            vectorcanvas.width = vectorcanvas.width;
            vectorctx.strokeStyle = "red";
            vectorctx.fillStyle = "red";
        }

        var image = ctx.createImageData(canvas.width, canvas.height);
        for (var x = 0; x < lattice_width; x++) {
            for (var y = 0; y < lattice_height; y++) {
                if (lattice[x][y].barrier) {
                    draw_square(x, y, 0, 0, 0, 0);
                } else {
                    var color = {'r': 0, 'g': 0, 'b': 0, 'a': 0};
                    var ux = lattice[x][y].ux;
                    var uy = lattice[x][y].uy;
                    if (draw_mode === 0) {
                        // Speed
                        var speed = Math.sqrt(Math.pow(ux, 2) + Math.pow(uy, 2));
                        color = get_color(speed, 0, 0.4);
                        color = {'r': 0, 'g': (speed*3000), 'b': 0, 'a': 255};
                        if (color.g > 255) {color.g = 255;}
                        if (color.g < 0) {color.g = 0;}
                    } else if (draw_mode == 1) {
                        // X velocity
                        var xvel = ux;
                        color = get_color(xvel, -0.1, 0.1);
                    } else if (draw_mode == 2) {
                        // Y Velocity
                        var yvel = uy;
                        color = get_color(yvel, -0.1, 0.1);
                    } else if (draw_mode == 3) {
                        // Density
                        var dens = lattice[x][y].density;
                        color = {'r': 0, 'g': ((255 - (255 / Math.abs(dens)))*10), 'b': 0, 'a': 255};
                        if (color.g > 255) {color.g = 255;}
                        if (color.g < 0) {color.g = 0;}
                    } else if (draw_mode == 4) {
                        // Curl
                        var curl = lattice[x][y].curl;
                        color = get_color(curl, -0.2, 0.2);
                    }
                    draw_square(x, y, color);
                    if (draw_flow_vectors && x % 10 === 0 && y % 10 ===0) {
                        // Draw flow vectors every tenth node.
                        // TODO: Some flow vectors appear to be going in the wrong direction.
                        // Look into this.
                        draw_flow_vector(x, y, ux, uy);
                    }
                }
            }
        }
        ctx.putImageData(image, 0, 0);
    }
    function draw_square(x, y, color) {
        // Draw a square region on the canvas image corresponding to a
        // lattice node at (x,y).
        for (var ypx = y * px_per_node; ypx < (y+1) * px_per_node; ypx++) {
            for (var xpx = x * px_per_node; xpx < (x + 1) * px_per_node; xpx++) {
                var index = (xpx + ypx * image.width) * 4;
                image.data[index+0] = color.r;
                image.data[index+1] = color.g;
                image.data[index+2] = color.b;
                image.data[index+3] = color.a;
            }
        }
    }
    function draw_flow_vector(x,y,ux,uy) {
        var scale = 100;
        vectorctx.beginPath();
        vectorctx.moveTo(x * px_per_node, y * px_per_node);
        vectorctx.lineTo((x * px_per_node) + Math.round(ux * px_per_node * scale), (y * px_per_node) + Math.round(uy * px_per_node * scale));
        vectorctx.stroke();
        vectorctx.beginPath();
        vectorctx.arc(x * px_per_node, y * px_per_node, 1, 0, 2 * Math.PI, false);
        vectorctx.fill();
    }
    function get_color(val, min, max) {
        // Returns a color for a given value in a range between min and max.
        // Min and max were experimentally derived for speed, density, etc.
        var mid = (min + max) / 2;
        var range = Math.abs(max-mid);
        var color = {'r': 0, 'g': 0, 'b': 0, 'a': 0};
        if (val > max) {
            val = max;
        }
        if (val < min) {
            val = min;
        }
        if (val >= mid) {
            color.r = 255;
            color.a = Math.abs(val) * (1/range) * 255;
        } else {
            color.g = 255;
            color.a = Math.abs(val) * (1/range) * 255;
        }
        return color;
    }
}