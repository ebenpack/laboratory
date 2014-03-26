var boltzmann = boltzmann || {};
boltzmann = (function (module) {
    module.drawing = (function () {
        var drawing = {};
        var boltzcanvas = module.boltzcanvas;
        var vectorcanvas = module.vectorcanvas;
        var particlecanvas = module.particlecanvas;
        var barriercanvas = module.barriercanvas;
        var boltzctx;
        var vectorctx;
        var particlectx;
        var barrierctx;
        var px_per_node = module.px_per_node;
        var lattice = module.lattice;
        var particles = module.flow_particles;
        var lattice_width = module.lattice_width;
        var lattice_height = module.lattice_height;
        var canvas_width = boltzcanvas.width;
        var canvas_height = boltzcanvas.height;
        var image;
        var image_data;
        var image_width;
        (function() {
            // Initialize
            if (boltzcanvas.getContext) {
                module.boltzctx = boltzcanvas.getContext('2d');
                module.vectorctx = vectorcanvas.getContext('2d');
                module.particlectx = particlecanvas.getContext('2d');
                module.barrierctx = barriercanvas.getContext('2d');
                boltzctx = module.boltzctx;
                vectorctx = module.vectorctx;
                particlectx = module.particlectx;
                barrierctx = module.barrierctx;
                vectorctx.strokeStyle = "red";
                vectorctx.fillStyle = "red";
                particlectx.strokeStyle = "green";
                particlectx.fillStyle = "green";
                barrierctx.fillStyle = "yellow";
                image = boltzctx.createImageData(canvas_width, canvas_height);
                image_data = image.data;
                image_width = image.width;
            } else {
                console.log("This browser does not support canvas");
                // ABORT!
            }
        })();

        function draw_square(x, y, color, image) {
            // Draw a square region on the canvas image corresponding to a
            // lattice node at (x,y). Credit to Daniel V. Schroeder
            // http://physics.weber.edu/schroeder/fluids/
            // for this drawing method.
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

        function draw_flow_vector(x, y, ux, uy, ctx) {
            var scale = 200;
            var xpx = x * px_per_node;
            var ypx = y * px_per_node;
            ctx.beginPath();
            ctx.moveTo(xpx, ypx);
            ctx.lineTo(Math.round(xpx + (ux * px_per_node * scale)), ypx + (uy * px_per_node * scale));
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(xpx, ypx, 1, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();
        }

        function draw_flow_particle(x,y, ctx) {
            ctx.beginPath();
            ctx.arc(x * px_per_node, y * px_per_node, 1, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();
        }

        function draw_barriers() {
            for (var x = 0; x < lattice_width; x++) {
                for (var y = 0; y < lattice_height; y++) {
                    if (lattice[x][y].barrier) {
                        barrierctx.beginPath();
                        barrierctx.rect(x * px_per_node, y * px_per_node, px_per_node, px_per_node);
                        barrierctx.fill();
                        barrierctx.closePath();
                    }
                }
            }
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
                color.a = Math.floor(Math.abs(val) * (1/range) * 255);
            } else {
                color.g = 255;
                color.a = Math.floor(Math.abs(val) * (1/range) * 255);
            }
            return color;
        }
        drawing.draw = function() {
            var draw_mode = module.draw_mode;
            if (module.flow_vectors) {
                vectorctx.clearRect(0, 0, canvas_width, canvas_height);
            }
            if (particles.length > 0) {
                particlectx.clearRect(0, 0, canvas_width, canvas_height);
                for (var x = 0, l=particles.length; x < l; x++) {
                    draw_flow_particle(particles[x].x, particles[x].y, particlectx);
                }
            }
            if (module.new_barrier) {
                barrierctx.clearRect(0, 0, canvas_width, canvas_height);
                draw_barriers(barrierctx);
                module.new_barrier = false;
            }
            
            for (var x = 0; x < lattice_width; x++) {
                for (var y = 0; y < lattice_height; y++) {
                    if (!lattice[x][y].barrier) {
                        var color = {'r': 0, 'g': 0, 'b': 0, 'a': 0};
                        var ux = lattice[x][y].ux;
                        var uy = lattice[x][y].uy;
                        if (module.flow_vectors && x % 10 === 0 && y % 10 ===0) {
                            // Draw flow vectors every tenth node.
                            draw_flow_vector(x, y, ux, uy, vectorctx);
                        }
                        if (draw_mode === 0) {
                            // Speed
                            var speed = Math.sqrt(Math.pow(ux, 2) + Math.pow(uy, 2));
                            color = {'r': 0, 'a': Math.floor(speed*4000), 'b': 0, 'g': 255};
                            if (color.g > 255) {color.g = 255;}
                            if (color.g < 0) {color.g = 0;}
                        } else if (draw_mode == 1) {
                            // X velocity
                            var xvel = ux;
                            color = get_color(xvel, -0.04, 0.04);
                        } else if (draw_mode == 2) {
                            // Y Velocity
                            var yvel = uy;
                            color = get_color(yvel, -0.04, 0.04);
                        } else if (draw_mode == 3) {
                            // Density
                            var dens = lattice[x][y].density;
                            color = {'r': 0, 'a': Math.floor((255 - (255 / Math.abs(dens)))*20), 'b': 0, 'g': 255};
                            if (color.g > 255) {color.g = 255;}
                            if (color.g < 0) {color.g = 0;}
                        } else if (draw_mode == 4) {
                            // Curl
                            var curl = lattice[x][y].curl;
                            color = get_color(curl, -0.05, 0.05);
                        } else if (draw_mode == 5) {
                            // Draw nothing. This mode is useful when flow vectors or particles are turned on.
                            continue;
                        }
                        // draw_square inlined for performance
                        for (var ypx = y * px_per_node; ypx < (y+1) * px_per_node; ypx++) {
                            for (var xpx = x * px_per_node; xpx < (x + 1) * px_per_node; xpx++) {
                                var index = (xpx + ypx * image_width) * 4;
                                image_data[index+0] = color.r;
                                image_data[index+1] = color.g;
                                image_data[index+2] = color.b;
                                image_data[index+3] = color.a;
                            }
                        }
                    }
                }
            }
            boltzctx.putImageData(image, 0, 0);
        };
        drawing.clear = function() {
            vectorctx.clearRect(0, 0, canvas_width, canvas_height);
            particlectx.clearRect(0, 0, canvas_width, canvas_height);
            boltzctx.clearRect(0, 0, canvas_width, canvas_height);
            // Clear barrier canvas, but redraw in case barriers are still present
            barrierctx.clearRect(0, 0, canvas_width, canvas_height);
            draw_barriers();
            module.new_barrier = false;
        };
        return drawing;
    })();
    return module;
})(boltzmann);