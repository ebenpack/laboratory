function draw_lattice(canvas,lattice, block_size) {
    // Draw nodes on the canvas.
    function velocity_to_color(vx, vy) {
        // Map velocities to colors
        var color_map = {
            0: "255, 255, 255", // black
            1: "255, 255, 0", // Yellow
            2: "255, 0, 0", // Red
            3: "128, 0, 128", // purple
            4: "64, 224, 208", // turquoise TODO: Find replacement color
            5: "255, 165, 0", // orange
            6: "255, 105, 180", // HotPink
            7: "0, 0, 255", // Blue
            8: "127, 255, 0" // Chartreuse
        };
        var ang = angle(0,0,vx,vy);
        var dir = radian_to_direction(ang);
        return color_map[dir];
    }

    if (canvas.getContext){
        // TODO: Add drawing modes
        var ctx = canvas.getContext('2d');
        var row_length = lattice.length;
        var col_length = lattice[0].length;
        var vector = false;
        canvas.width = canvas.width;
        ctx.lineWidth = 2;
        for (var i = 0; i < row_length; i++) {
            for (var j = 0; j < col_length; j++) {
                // Draw
                var node = lattice[i][j];
                var velocity = node.velocity;
                var density = node.density;
                var vx = Math.abs(velocity.x);
                var vy = Math.abs(velocity.y);
                var v = vx + vy;
                if (v > 0.1) {
                    if (vector) {
                        ctx.strokeStyle = "rgba(" + velocity_to_color(velocity.x, velocity.y) + ", " + density + ")";
                        ctx.beginPath();
                        ctx.moveTo(node.x,node.y);
                        newx = node.x + velocity.x;
                        newy = node.y + velocity.y;
                        ctx.lineTo(newx, newy);
                        ctx.stroke();
                        ctx.closePath();
                    } else if (density > 0.00000001) {
                        ctx.fillStyle = "rgba(" + velocity_to_color(velocity.x, velocity.y) + ", " + 1 + ")";
                        ctx.beginPath();
                        ctx.rect(node.x, node.y, block_size, block_size);
                        ctx.fill();
                        ctx.closePath();
                    }
                }
            }
        }
    }
}