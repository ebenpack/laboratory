function draw_lattice(canvasid, drawmode) {
    // TODO: (optionally) Draw flow vectors
    // Change color handling
    // Implement curl
    var lattice_width = lattice.length;
    var lattice_height = lattice[0].length;
    var canvas = document.getElementById(canvasid);
    var px_per_node = Math.floor(canvas.width / lattice_width);
    if (canvas.getContext){
        var ctx = canvas.getContext('2d');
        var image = ctx.createImageData(canvas.width, canvas.height);
        for (var x = 0; x < lattice_width; x++) {
            for (var y = 0; y < lattice_height; y++) {
                if (lattice[x][y].barrier) {
                    draw_square(x, y, 0, 0, 0, 0);
                } else {
                    var r = 0;
                    var g = 0;
                    var b = 0;
                    var a = 255;
                    if (draw_mode === 0) {
                        // Speed
                        g = Math.sqrt(Math.pow(lattice[x][y].ux, 2) + Math.pow(lattice[x][y].uy, 2)) * 2000;
                    } else if (draw_mode == 1) {
                        // X velocity
                        g = Math.abs(lattice[x][y].ux * 2000);
                    } else if (draw_mode == 2) {
                        // Y Velocity
                        g = Math.abs(lattice[x][y].uy * 2000);
                    } else if (draw_mode == 3) {
                        // Density
                        g = 255 - (255 / Math.abs(lattice[x][y].density));
                        g = g * 10;
                    }
                    //var ang = angle(0,0, lattice[x][y].ux, lattice[x][y].uy);
                    if (g > 255) {g = 255;}
                    if (g < 0) {g = 0;}
                    draw_square(x, y, r, g, b, a);
                }
            }
        }
        ctx.putImageData(image, 0, 0);
    }
    function draw_square(x, y, r, g, b, a) {
        // Draw a square region on the canvas image corresponding to a
        // lattice node at (x,y).
        // Lattice origin is at bottom, but canvas origin is at top.
        y = lattice_height - y - 1;
        for (var ypx = y * px_per_node; ypx < (y+1) * px_per_node; ypx++) {
            for (var xpx = x * px_per_node; xpx < (x + 1) * px_per_node; xpx++) {
                var index = (xpx + ypx * image.width) * 4;
                image.data[index+0] = r;
                image.data[index+1] = g;
                image.data[index+2] = b;
                image.data[index+3] = a;
            }
        }
    }
}

function angle(x1, y1, x2, y2) {
    // Return angle in radians, with 'North' being 0,
    // increasing clockwise to 3pi/2 at 'East', pi at 'South', etc.
    var dx = x1 - x2;
    var dy = y1 - y2;
    var theta = Math.atan2(-dx,dy);
    // atan2 returns results in the range -pi...pi. Convert results 
    // to the range 0...2pi
    if (theta < 0) {
        theta += (2 * Math.PI);
    }
    return theta;
}