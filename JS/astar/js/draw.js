function draw_graph(canvasid, drawmode) {
    var particle_size = 5;
    if (canvas.getContext){
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = "red";
		
        var image = ctx.createImageData(canvas.width, canvas.height);

        // Draw barriers
        for (var x = 0; x < graph_width; x++) {
            for (var y = 0; y < graph_height; y++) {
                // Draw barriers
                var node = graph[x][y];
                if (node.barrier) {
                    draw_node(node.x,node.y);
                }
            }
        }
        // Draw particles
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            draw_particle(p.x,p.y);
        }
        // Draw mouse location
        draw_mouse(mouse.x, mouse.y);
        ctx.putImageData(image, 0, 0);
        
    }

    function draw_mouse(x,y) {
        // y = canvas.height - y - 3;
        for (var ypx = y; ypx < y+particle_size; ypx++) {
            for (var xpx = x; xpx < x+particle_size; xpx++) {
                var index = (xpx + ypx * image.width) * 4;
                image.data[index+0] = 0;
                image.data[index+1] = 0;
                image.data[index+2] = 255;
                image.data[index+3] = 255;
            }
        }
    }

    function draw_particle(x,y) {
        // y = canvas.height - y - 3;
        for (var ypx = y; ypx < y+particle_size; ypx++) {
            for (var xpx = x; xpx < x+particle_size; xpx++) {
                var index = (xpx + ypx * image.width) * 4;
                image.data[index+0] = 0;
                image.data[index+1] = 255;
                image.data[index+2] = 0;
                image.data[index+3] = 255;
            }
        }
    }

	function draw_node(x,y) {
        // y = canvas.height - y - 3;
        for (var ypx = y; ypx < y+node_size; ypx++) {
            for (var xpx = x; xpx < x+node_size; xpx++) {
                var index = (xpx + ypx * image.width) * 4;
                image.data[index+0] = 255;
                image.data[index+1] = 0;
                image.data[index+2] = 0;
                image.data[index+3] = 255;
            }
        }
	}
}