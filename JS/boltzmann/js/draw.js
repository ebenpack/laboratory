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

        function get_color2(val, min, max) {
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
        function get_color(actual, minVal, maxVal) {
            var midVal = (maxVal - minVal)/2;
            var intR;
            var intG = 0;
            var intB = Math.round(0);

            if (actual >= midVal){
                 intR = 255;
                 intG = Math.round(255 * ((maxVal - actual) / (maxVal - midVal)));
            }
            else{
                intG = 255;
                intR = Math.round(255 * ((actual - minVal) / (midVal - minVal)));
            }

            return {'r': intR, 'g': intG, 'b': intB, 'a': 255};
        }

        function hslToRgb(h, s, l){
            var r, g, b;

            if(s == 0){
                r = g = b = l; // achromatic
            }else{
                function hue2rgb(p, q, t){
                    if(t < 0) t += 1;
                    if(t > 1) t -= 1;
                    if(t < 1/6) return p + (q - p) * 6 * t;
                    if(t < 1/2) return q;
                    if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                }

                var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                var p = 2 * l - q;
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }

            return {r:Math.round(r * 255), g:Math.round(g * 255), b:Math.round(b * 255), a:255};
        }

        function get_color2(actual, minVal, maxVal) {
            // Scale value to 0..1 range
            var leftSpan = maxVal - minVal;
            var rightSpan = 1;
            var valueScaled = actual - minVal / leftSpan;
            var h = (1 - valueScaled)
            var s = 1
            var l = valueScaled / 2
            return hslToRgb(h, s, l);
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
                            color = get_color(speed, 0, 0.1);
                        } else if (draw_mode == 1) {
                            // X velocity
                            var xvel = ux;
                            color = get_color2(xvel*5, -0.09, 0.03);
                        } else if (draw_mode == 2) {
                            // Y Velocity
                            var yvel = uy;
                            color = get_color2(yvel*5, -0.09, 0.03);
                        } else if (draw_mode == 3) {
                            // Density
                            var dens = lattice[x][y].density;
                            color = get_color(dens, 0.9,3);
                        } else if (draw_mode == 4) {
                            // Curl
                            var curl = lattice[x][y].curl;
                            color = get_color2(curl*5, -0.1, 0.03);
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
            image = boltzctx.createImageData(canvas_width, canvas_height);
            image_data = image.data;
            image_width = image.width;
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