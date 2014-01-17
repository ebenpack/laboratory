function draw_lattice() {
    // TODO: Change color handling
    var lattice_width = lattice.length;
    var lattice_height = lattice[0].length;
    var px_per_node = Math.floor(canvas.width / lattice_width);
    if (canvas.getContext){
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
                    var r = 0;
                    var g = 0;
                    var b = 0;
                    var a = 255;
                    var ux = lattice[x][y].ux;
                    var uy = lattice[x][y].uy;
                    if (draw_mode === 0) {
                        // Speed
                        g = Math.sqrt(Math.pow(ux, 2) + Math.pow(uy, 2)) * 2000;
                    } else if (draw_mode == 1) {
                        // X velocity
                        var xvel = ux * 3000;
                        if (xvel < 0) {
                            g = Math.abs(xvel);
                        } else {
                            r = Math.abs(xvel);
                        }
                    } else if (draw_mode == 2) {
                        // Y Velocity
                        var yvel = uy * 3000;
                        if (yvel < 0) {
                            g = Math.abs(yvel);
                        } else {
                            r = Math.abs(yvel);
                        }
                    } else if (draw_mode == 3) {
                        // Density
                        g = 255 - (255 / Math.abs(lattice[x][y].density));
                        g = g * 10;
                    } else if (draw_mode == 4) {
                        // Curl
                        var curl = lattice[x][y].curl;
                        if (curl > 0) {
                            g = Math.abs(curl) * 2000;
                        } else {
                            r = Math.abs(curl) * 2000;
                        }
                    }
                    //var ang = angle(0,0, lattice[x][y].ux, lattice[x][y].uy);
                    if (g > 255) {g = 255;}
                    if (g < 0) {g = 0;}
                    if (r > 255) {r = 255;}
                    if (r < 0) {r = 0;}
                    draw_square(x, y, r, g, b, a);
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
    function draw_square(x, y, r, g, b, a) {
        // Draw a square region on the canvas image corresponding to a
        // lattice node at (x,y).
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
    function draw_flow_vector(x,y,ux,uy) {
        // Translate y
        var scale = 100;
        vectorctx.beginPath();
        vectorctx.moveTo(x * px_per_node, y * px_per_node);
        vectorctx.lineTo((x * px_per_node) + Math.round(ux * px_per_node * scale), (y * px_per_node) + Math.round(uy * px_per_node * scale));
        vectorctx.stroke();
        vectorctx.beginPath();
        vectorctx.arc(x * px_per_node, y * px_per_node, 1, 0, 2 * Math.PI, false);
        vectorctx.fill();
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