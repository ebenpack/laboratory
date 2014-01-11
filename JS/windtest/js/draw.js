function draw_lattice(canvas,lattice, block_size) {
    // Draw nodes on the canvas.
    function node_color_range(vx, vy) {
        // Map velocities to colors
        var color_map = {
            0: "black",
            1: "yellow",
            2: "red",
            3: "purple",
            4: "turquoise", // TODO: Find replacement color
            5: "orange",
            6: "HotPink",
            7: "blue",
            8: "chartreuse"
        };
        var ang = angle(0,0,vx,vy);
        var dir = radian_to_direction(ang);
        return color_map[dir];
    }

    if (canvas.getContext){
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
                if (v > 0.0001) {
                    if (vector) {
                        ctx.strokeStyle = node_color_range(velocity.x, velocity.y);
                        ctx.beginPath();
                        ctx.moveTo(node.x,node.y);
                        newx = node.x + velocity.x;
                        newy = node.y + velocity.y;
                        ctx.lineTo(newx, newy);
                        ctx.stroke();
                        ctx.closePath();
                    } else if (density > 0.00000001) {
                        ctx.fillStyle = node_color_range(velocity.x, velocity.y);
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