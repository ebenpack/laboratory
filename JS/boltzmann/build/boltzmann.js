var config = {
    lattice_width: 200,
    lattice_height: 80
};
var boltzmann = boltzmann || {};
boltzmann = (function(settings){
    var canvas = document.getElementById("boltzmann");
    var lattice_width = settings.lattice_width;
    var lattice_height = settings.lattice_height;
    var viscosity = 0.02;
    var main = {
        // Variables at the top level of the namespace
        lattice_width: lattice_width,
        lattice_height: lattice_height,
        lattice: [], // Lattice consisting of lattice nodes.
        queue: [], // Mouse event queue
        viscosity: viscosity, // fluid viscosity
        omega: 1 / (3 * viscosity + 0.5), // "relaxation" parameter
        draw_mode: 0,
        flow_vectors: false,
        // new_barrier flag is set when new barriers are added, to let the draw
        // function know it needs to redraw barriers (this saves us from redrawing barriers every single frame)
        new_barrier: true,
        flow_particles: [],
        flow_speed: 0,
        // play: false, // Start the simulation in a paused state
        animation_id: null, // requestanimationframe ID
        boltzcanvas: canvas,
        vectorcanvas: document.getElementById("vectorcanvas"),
        particlecanvas: document.getElementById("particlecanvas"),
        barriercanvas: document.getElementById("barriercanvas"),
        boltzctx: null,
        vectorctx: null,
        particlectx: null,
        barrierctx: null,
        steps_per_frame: 10,
        px_per_node: Math.floor(canvas.width / lattice_width)
    };
    return main;
})(config);


/**
 * requestAnimationFrame polyfill.
 */
(function() {
    // requestAnimationFrame polyfill, courtesy of
    // http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
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
        var color_array = [];
        var num_colors = 400;

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
                particlectx.strokeStyle = "black";
                particlectx.fillStyle = "black";
                barrierctx.fillStyle = "yellow";
                image = boltzctx.createImageData(canvas_width, canvas_height);
                image_data = image.data;
                image_width = image.width;
                // Pre-compute color array
                compute_color_array(num_colors);

            } else {
                console.log("This browser does not support canvas");
                // ABORT!
            }
        })();

        /**
         * Convert HSL to RGB
         * @param {number} h Hue
         * @param {number} s Saturation
         * @param {number} l Luminance
         * @return {Object} RGBa color object
         */
        function hslToRgb(h, s, l){
            var r, g, b;

            if(s == 0){
                r = g = b = l;
            } else {
                /**
                 * Convert hue RGB
                 * @param {number} p Hue
                 * @param {number} q Saturation
                 * @param {number} t Luminance
                 * @return {number} RGBa color object
                 */
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

        /**
         * Given a range and a value within that range, return a color for that value.
         * @param {number} min Minimum value in range
         * @param {number} max Maximum value in range
         * @param {number} val Value within the range for which a color will be returned
         * @return {object} RGBa color object
         */
        function get_color(min, max, val) {
            // This function is actually being called
            // incorrectly, but it produces interesting results.
            var left_span = max - min;
            var right_span = 1;
            var value_scaled = val - min / left_span;
            var h = (1 - value_scaled);
            var s = 1;
            var l = value_scaled / 2;
            return hslToRgb(h, s, l);
        }

        /**
         * Precompute color values and place them in an array
         * @param {number} n Number of colors to compute
         */
        function compute_color_array(n){
            for (var i = 0; i < n; i++){
                color_array[i] = get_color(n, i, 0);
            }
        }

        /**
         * Draw a square region on the canvas image corresponding to a
         * lattice node at (x,y).
         * @param {number} x X position of node to be drawn
         * @param {number} y Y position of node to be drawn
         * @param {Object} color Color of node to be drawn
         * @param {Object} image ImageData
         */
        function draw_square(x, y, color, image) {
            // Credit to Daniel V. Schroeder
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

        /**
         * Draw flow vectors for the node at (x, y).
         * @param {number} x X position of node
         * @param {number} y Y position of node
         * @param {number} ux X component of velocity at node (x, y)
         * @param {number} uy Y component of velocity at node (x, y)
         */
        function draw_flow_vector(x, y, ux, uy) {
            var scale = 200;
            var xpx = x * px_per_node;
            var ypx = y * px_per_node;
            vectorctx.beginPath();
            vectorctx.moveTo(xpx, ypx);
            vectorctx.lineTo(Math.round(xpx + (ux * px_per_node * scale)), ypx + (uy * px_per_node * scale));
            vectorctx.stroke();
            vectorctx.beginPath();
            vectorctx.arc(xpx, ypx, 1, 0, 2 * Math.PI, false);
            vectorctx.fill();
            vectorctx.closePath();
        }

        /**
         * Draw flow particle.
         * @param {number} x X position of particle
         * @param {number} y Y position of particle
         */
        function draw_flow_particle(x,y) {
            particlectx.beginPath();
            particlectx.arc(x * px_per_node, y * px_per_node, 1, 0, 2 * Math.PI, false);
            particlectx.fill();
            particlectx.closePath();
        }

        /**
         * Draw barriers.
         */
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

        /**
         * Draw to canvas.
         */
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
                        var color_index = 0;
                        var ux = lattice[x][y].ux;
                        var uy = lattice[x][y].uy;
                        if (module.flow_vectors && x % 10 === 0 && y % 10 ===0) {
                            // Draw flow vectors every tenth node.
                            draw_flow_vector(x, y, ux, uy);
                        }
                        // There are a lot of magic numbers ahead.
                        // They are primarily expiramentally derived values chosen
                        // to produce aesthetically pleasing results.
                        if (draw_mode === 0) {
                            // Speed
                            var speed = Math.sqrt(Math.pow(ux, 2) + Math.pow(uy, 2));
                            color_index = parseInt((speed + 0.21) * num_colors);
                        } else if (draw_mode == 1) {
                            // X velocity
                            var xvel = ux;
                            color_index = parseInt((xvel + 0.21052631578) * num_colors);
                        } else if (draw_mode == 2) {
                            // Y Velocity
                            var yvel = uy;
                            color_index = parseInt((yvel + 0.21052631578) * num_colors);
                        } else if (draw_mode == 3) {
                            // Density
                            var dens = lattice[x][y].density;
                            color_index = parseInt((dens - 0.75) * num_colors);
                        } else if (draw_mode == 4) {
                            // Curl
                            var curl = lattice[x][y].curl;
                            color_index = parseInt((curl + 0.25196850393) * num_colors);
                        } else if (draw_mode == 5) {
                            // Draw nothing. This mode is useful when flow vectors or particles are turned on.
                            continue;
                        }
                        if (color_index >= num_colors) {
                            color_index = num_colors - 1;
                        } else if (color_index < 0) {
                            color_index = 0;
                        }
                        var color = color_array[color_index];
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
        /**
         * Clear canvas.
         */
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
var boltzmann = boltzmann || {};
boltzmann = (function (module) {
    module.events = (function () {
        var lattice_width = module.lattice_width;
        var lattice_height = module.lattice_height;
        var lattice = module.lattice;
        var px_per_node = module.px_per_node;
        var queue = module.queue;
        var canvas = module.boltzcanvas;
        var steps_per_frame = module.steps_per_frame;
        var particles = module.flow_particles;
        // The reset button also affects the start button and vector and particle
        // checkboxes, , so they need to be available outside of the register function
        var startbutton;
        var flowvector;
        var flowparticle;

        /**
         * Push fluid with mouse 
         * @param {Object} e MouseEvent 'mousedown'
         */
        function mousedownListener(e) {
            var button = e.which || e.button;
            if (button !== 1) {return;} // Only capture left click
            if (!module.animation_id) {return;} // Don't capture if stopped
            var oldX = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
            var oldY = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;

            /**
             * Push fluid with mouse 
             * @param {Object} e MouseEvent 'mousemove'
             */
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

            /**
             * Remove mousemove listeners
             * @param {Object} e MouseEvent 'mouseup'
             */
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
        }

        /**
         * Place/remove barrier
         * @param {Object} e MouseEvent right 'click'
         */
        function place_barrier(e) {
            e.preventDefault();
            var mouse_x = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
            var mouse_y = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;
            var lattice_x = Math.floor(mouse_x / px_per_node);
            var lattice_y = Math.floor(mouse_y / px_per_node);
            var draw = true; // Drawing, or erasing?
            if (lattice[lattice_x][lattice_y].barrier) {
                draw = false;
            }
            lattice[lattice_x][lattice_y].barrier = draw;

            /**
             * Place/remove barrier
             * @param {Object} e MouseEvent 'mousemove'
             */
            var moveListener = function(e) {
                mouse_x = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
                mouse_y = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;
                // Scale from canvas coordinates to lattice coordinates
                lattice_x = Math.floor(mouse_x / px_per_node);
                lattice_y = Math.floor(mouse_y / px_per_node);
                // Draw/erase barrier
                lattice[lattice_x][lattice_y].barrier = draw;
                module.new_barrier = true;
                if (!module.animation_id) {
                    // If stopped, we need to explicitly call draw()
                    module.drawing.draw();
                }
            };

            /**
             * Remove mousemove listeners
             * @param {Object} e MouseEvent 'mouseup'
             */
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
        }

        /**
         * Change draw mode.
         * @param {Object} e Event 'change'
         */
        function update_draw_mode(e) {
            module.draw_mode = this.selectedIndex;
            if (module.draw_mode == 5) {
                // Clear canvas
                module.drawing.clear();
            }
        }

        /**
         * Change animation speed.
         * @param {Object} e Event 'input'
         */
        function update_speed(e) {
            module.steps_per_frame = parseInt(this.value, 10);
        }

        /**
         * Change viscosity of fluid.
         * @param {Object} e Event 'input'
         */
        function update_viscosity(e){
            module.viscosity = parseInt(this.value, 10) / 100;
            module.omega = 1 / (3 * module.viscosity + 0.5);
        }

        /**
         * Toggle whether vectors are drawn.
         * @param {Object} e MouseEvent 'click'
         */
        function toggle_vectors(e) {
            if (this.checked) {
                module.flow_vectors = true;
            } else {
                module.flow_vectors = false;
                module.vectorctx.clearRect(0, 0, canvas.width, canvas.height); // Clear vector canvas
            }
        }
        
        /**
         * Toggle whether particles are drawn.
         * @param {Object} e MouseEvent 'click'
         */
        function toggle_particles(e) {
            if (this.checked) {
                module.main.init_flow_particles();
            } else {
                particles.length = 0;
                module.particlectx.clearRect(0, 0, canvas.width, canvas.height); // Clear
            }
        }

        /**
         * Stop animation
         * @param {Object} bttn Button DOM node
         */
        function stop(bttn) {
            // Stop animation
            window.cancelAnimationFrame(module.animation_id);
            module.animation_id = null;
            bttn.innerHTML = "Start";
        }

        /**
         * Stop animation
         * @param {Object} bttn Button DOM node
         */
        function start(bttn) {
            // Start animation
            // Flush any mouse events that occured while the program was stopped
            module.queue.length = 0;
            module.main.updater();
            bttn.innerHTML = "Pause";
        }

        /**
         * Play/pause animation
         * @param {Object} e MouseEvent 'click'
         */
        function toggle_play_state(e) {
            if (module.animation_id) {
                stop(this);
            } else {
                start(this);
            }
        }

        /**
         * Reset simulation (removing barriers, particles, etc.) and stop animation
         * @param {Object} e MouseEvent 'click'
         */
        function reset(e) {
            stop(startbutton);
            module.flow_vectors = false;
            module.flow_particles.length = 0;
            flowvector.checked = false;
            flowparticle.checked = false;
            module.main.init(); // Reset lattice, barriers
            module.drawing.clear();
        }

        /**
         * Remove all barriers
         * @param {Object} e MouseEvent 'click'
         */
        function clear_barriers(e) {
            module.main.init_barrier([]);
            module.drawing.clear();
        }

        /**
         * Change speed of flow
         * @param {Object} e Event 'input'
         */
        function set_flow_speed(e){
            module.flow_speed = parseInt(this.value, 10) / 833;
        }

        /**
         * Register events
         */
        (function register(){
            // Register left click
            canvas.addEventListener('mousedown', mousedownListener, false);
            canvas.addEventListener('touchstart', mousedownListener, false);
            // Register right click 
            canvas.addEventListener('contextmenu', place_barrier, false);
            // Register dropdown
            var drawoptions = document.getElementById("drawmode");
            drawoptions.addEventListener('change', update_draw_mode, false);
            // Register sliders
            var viscoslider = document.getElementById("viscosity");
            viscoslider.addEventListener('input', update_viscosity, false);
            var speedslider = document.getElementById("speed");
            speedslider.addEventListener('input', update_speed, false);
            // Register checkboxes
            flowvector = document.getElementById("flowvectors");
            flowvector.addEventListener('click', toggle_vectors, false);
            flowparticle = document.getElementById("flowparticles");
            flowparticle.addEventListener('click', toggle_particles, false);
            // Register start/stop
            startbutton = document.getElementById('play');
            startbutton.addEventListener('click', toggle_play_state, false);
            // Register reset
            var resetbutton = document.getElementById('reset');
            resetbutton.addEventListener('click', reset, false);
            // Register clear barriers
            var clear = document.getElementById('clearbarriers');
            clear.addEventListener('click', clear_barriers, false);
            // Register flow speed slider
            var flow_speed = document.getElementById('flow-speed');
            flow_speed.addEventListener('input', set_flow_speed, false);
        })();
    })();
    return module;
})(boltzmann);
var boltzmann = boltzmann || {};
boltzmann = (function (module) {
    module.main = (function () {
        var main = {};
        var queue = module.queue;
        var lattice_width = module.lattice_width;
        var lattice_height = module.lattice_height;
        var lattice = module.lattice;
        var particles = module.flow_particles;
        var four9ths = 4/9;
        var one9th = 1/9;
        var one36th = 1/36;
        var node_directions = {
            0: {'x':0, 'y':0},
            1: {'x':1, 'y':0},
            2: {'x':0, 'y':-1},
            3: {'x':-1, 'y':0},
            4: {'x':0, 'y':1},
            5: {'x':1, 'y':-1},
            6: {'x':-1, 'y':-1},
            7: {'x':-1, 'y':1},
            8: {'x':1, 'y':1}
        };
        var node_weight = {
            0: four9ths,
            1: one9th,
            2: one9th,
            3: one9th,
            4: one9th,
            5: one36th,
            6: one36th,
            7: one36th,
            8: one36th
        };
        var reflection = {
            0: 0,
            1: 3,
            2: 4,
            3: 1,
            4: 2,
            5: 7,
            6: 8,
            7: 5,
            8: 6
        };

        /**
         * A single node in the lattice.
         * @constructor
         * @struct
         */
        function LatticeNode() {
            this.distribution = new Float64Array(9); // Individual density distributions for 
            // each of the nine possible discrete velocities of a node.
            this.stream = new Float64Array(9); // Used to temporarily hold streamed values
            this.density = 0; // Macroscopic density of a node.
            this.ux = 0; // X component of macroscopic velocity of a node.
            this.uy = 0; // Y component of macroscopic velocity of a node.
            this.barrier = false; // Boolean indicating if node is a barrier.
            this.curl = 0; // Curl of node.
        }

        /**
         * Make a new empty lattice 
         * @param {number} lattice_width Width of the lattice being initialized, in nodes
         * @param {number} lattice_height Width of the lattice being initialized, in nodes
         */
        function make_lattice(lattice_width, lattice_height) {
            lattice.length = 0;
            for (var i = 0; i < lattice_width; i++) {
                lattice[i] = [];
                for (var j = 0; j < lattice_height; j++) {
                    lattice[i][j] = new LatticeNode();
                }
            }
        }

        /**
         * Initialize all nodes in lattice to flow with velocity (ux, uy) and density rho 
         * @param {number} ux X velocity of flow
         * @param {number} uy Y velocity of flow
         * @param {number} rho Macroscopic density
         */
        function init_flow(ux, uy, rho) {
            for (var x = 0; x < lattice_width; x++) {
                for (var y = 0; y < lattice_height; y++) {
                    var node = lattice[x][y];
                    if (!node.barrier) {
                        node.density = rho;
                        node.ux = ux;
                        node.uy = uy;
                        var eq = equilibrium(ux, uy, rho);
                        for (var i=0;i<9;i++){
                            node.distribution[i] = eq[i];
                            node.stream[i] = eq[i];
                        }
                    }
                }
            }
        }

        /**
         * Initialize flow particles
         */
        function init_flow_particles() {
            particles.length = 0;
            for (var x = 1; x < 20; x++) {
                for (var y = 1; y < 8; y++) {
                    if (!lattice[x*10][y*10].barrier) {
                        particles.push({'x':x*10, 'y':y*10});
                    }
                }
            }
        }

        /**
         * Move flow particles 
         */
        function move_particles() {
            for (var x = 0, l=particles.length; x < l; x++) {
                var p = particles[x];
                var lx = Math.floor(p.x);
                var ly = Math.floor(p.y);
                if (lx >=0 && lx < lattice_width &&
                    ly >=0 && ly < lattice_height) {
                    var node = lattice[lx][ly];
                    var ux = node.ux;
                    var uy = node.uy;
                    p.x += ux;
                    p.y += uy;
                }
                if (module.flow_speed > 0 && p.x > lattice_width - 2) {
                    // Wrap particles around to other side of screen
                    p.x = 1;
                }
            }
        }

        /**
         * Initialize barrier nodes.
         * @param {Array.<Object>=} barrier Optional barrier barrier array. Contains
         *      objects definining (x, y) coordinates of barrier nodes to initialize
         */
        function init_barrier(barrier) {
            if (barrier !== undefined) {
                // Clear all
                for (var x = 0; x < lattice_width; x++) {
                    for (var y = 0; y < lattice_height; y++) {
                        lattice[x][y].barrier = false;
                    }
                }
                // Set new barriers from barrier array
                for (var i = 0; i < barrier.length; i++) {
                    lattice[barrier[i].x][barrier[i].y].barrier = true;
                }
            } else {
                // Default barrier setup
                for (var x = 0; x < lattice_width; x++) {
                    for (var y = 0; y < lattice_height; y++) {
                        if (x === 0 || x === lattice_width - 1 ||
                            y === 0 || y === lattice_height - 1 ||
                            (Math.abs((lattice_width/2)-x) < 10 &&
                                Math.abs((lattice_height/2)-y) < 10)) {
                            lattice[x][y].barrier = true;
                        }
                    }
                }
            }
        }

        /**
         * Calculate equilibrium densities of a node
         * @param {number} ux X velocity of node
         * @param {number} uy Y velocity of node
         * @param {number} rho Macroscopic density
         */
        function equilibrium(ux, uy, rho) {
            // This is no longer performed in a loop, as that required
            // too many redundant calculations and was a performance drag.
            // Thanks to Daniel V. Schroeder http://physics.weber.edu/schroeder/fluids/
            // for this optimization
            var eq = []; // Equilibrium values for all velocities in a node.
            var ux3 = 3 * ux;
            var uy3 = 3 * -uy;
            var ux2 = ux * ux;
            var uy2 = -uy * -uy;
            var uxuy2 = 2 * ux * -uy;
            var u2 = ux2 + uy2;
            var u215 = 1.5 * u2;
            eq[0] = four9ths * rho * (1 - u215);
            eq[1] = one9th * rho * (1 + ux3 + 4.5*ux2 - u215);
            eq[2] = one9th * rho * (1 + uy3 + 4.5*uy2 - u215);
            eq[3] = one9th * rho * (1 - ux3 + 4.5*ux2 - u215);
            eq[4] = one9th * rho * (1 - uy3 + 4.5*uy2 - u215);
            eq[5] = one36th * rho * (1 + ux3 + uy3 + 4.5*(u2+uxuy2) - u215);
            eq[6] = one36th * rho * (1 - ux3 + uy3 + 4.5*(u2-uxuy2) - u215);
            eq[7] = one36th * rho * (1 - ux3 - uy3 + 4.5*(u2+uxuy2) - u215);
            eq[8] = one36th * rho * (1 + ux3 - uy3 + 4.5*(u2-uxuy2) - u215);
            return eq;
        }

        /**
         * Stream distributions from old lattice to new lattice. Boundary conditions are
         * considered at this stage, and distributions are bounced back to originating node
         * if a boundary is encountered.
         */
        function stream() {
            for (var x = 0; x < lattice_width; x++) {
                for (var y = 0; y < lattice_height; y++) {
                    var node = lattice[x][y];
                    if (!node.barrier) {
                        for (var d = 0; d < 9; d++) {
                            var move = node_directions[d];
                            var newx = move.x + x;
                            var newy = move.y + y;
                            // Check if new node is in the lattice
                            if (newx >= 0 && newx < lattice_width && newy >= 0 && newy < lattice_height) {
                                var new_node = lattice[newx][newy];
                                var dist = node.distribution;
                                // If destination node is barrier, bounce distribution back to 
                                // originating node in opposite direction.
                                if (new_node.barrier) {
                                    node.stream[reflection[d]] = dist[d];
                                } else {
                                    new_node.stream[d] = dist[d];
                                }
                            }
                        }
                    }
                }
            }
        }

        /**
         * Collision phase of LBM
         */
        function collide() {
            var omega = module.omega;
            for (var x = 1; x < lattice_width-1; x++) {
                for (var y = 1; y < lattice_height-1; y++) {
                    var node = lattice[x][y];
                    if (!node.barrier) {
                        var d = node.distribution;
                        var s = node.stream;
                        // Calculate macroscopic density (rho) and velocity (ux, uy)
                        // Thanks to Daniel V. Schroeder for this optimization
                        // http://physics.weber.edu/schroeder/fluids/
                        var rho = s[0] + s[1] + s[2] + s[3] + s[4] + s[5] + s[6] + s[7] + s[8];
                        var ux = (s[1] + s[5] + s[8] - s[3] - s[6] - s[7]) / rho;
                        var uy = (s[4] + s[7] + s[8] - s[2] - s[5] - s[6]) / rho;
                        // Update values stored in node.
                        node.density = rho;
                        node.ux = ux;
                        node.uy = uy;
                        // Compute curl. Non-edge nodes only.
                        // Don't compute if it won't get drawn
                        if (module.draw_mode == 4 && x > 0 && x < lattice_width - 1 &&
                            y > 0 && y < lattice_height - 1) {
                            node.curl = lattice[x+1][y].uy - lattice[x-1][y].uy - lattice[x][y+1].ux + lattice[x][y-1].ux;
                        }
                        // Set node equilibrium for each velocity
                        // Inlining the equilibrium function here provides significant performance improvements
                        var ux3 = 3 * ux;
                        var uy3 = 3 * uy;
                        var ux2 = ux * ux;
                        var uy2 = uy * uy;
                        var uxuy2 = 2 * ux * uy;
                        var u2 = ux2 + uy2;
                        var u215 = 1.5 * u2;
                        var one9thrho = one9th * rho;
                        var one36thrho = one36th * rho;
                        d[0] = s[0] + (omega * ((four9ths * rho * (1 - u215)) - s[0]));
                        d[1] = s[1] + (omega * ((one9thrho * (1 + ux3 + 4.5*ux2 - u215)) - s[1]));
                        d[2] = s[2] + (omega * ((one9thrho * (1 - uy3 + 4.5*uy2 - u215)) - s[2]));
                        d[3] = s[3] + (omega * ((one9thrho * (1 - ux3 + 4.5*ux2 - u215)) - s[3]));
                        d[4] = s[4] + (omega * ((one9thrho * (1 + uy3 + 4.5*uy2 - u215)) - s[4]));
                        d[5] = s[5] + (omega * ((one36thrho * (1 + ux3 - uy3 + 4.5*(u2-uxuy2) - u215)) - s[5]));
                        d[6] = s[6] + (omega * ((one36thrho * (1 - ux3 - uy3 + 4.5*(u2+uxuy2) - u215)) - s[6]));
                        d[7] = s[7] + (omega * ((one36thrho * (1 - ux3 + uy3 + 4.5*(u2-uxuy2) - u215)) - s[7]));
                        d[8] = s[8] + (omega * ((one36thrho * (1 + ux3 + uy3 + 4.5*(u2+uxuy2) - u215)) - s[8]));
                    }
                }
            }
        }
        /**
         * Set equilibrium values for boundary nodes.
         */
        function set_boundaries() {
            // Copied from Daniel V. Schroeder.
            var u0 = module.flow_speed;
            for (var x=0; x<lattice_width-1; x++) {
                lattice[x][0].distribution = equilibrium(u0, 0, 1);
                lattice[x][lattice_height-1].distribution = equilibrium(u0, 0, 1);
            }
            for (var y=0; y<lattice_height-1; y++) {
                lattice[0][y].distribution = equilibrium(u0, 0, 1);
                lattice[lattice_width-1][y].distribution = equilibrium(u0, 0, 1);
            }
        }
        /**
         * Update loop. 
         */
        main.updater = function(){
            var steps = module.steps_per_frame;
            var q;
            set_boundaries();
            for (var i = 0; i < steps; i++) {
                stream();
                collide();
                if (particles.length > 0) {
                    move_particles();
                }
                while (queue.length > 0) {
                    q = queue.shift();
                    var node = lattice[q[0]][q[1]];
                    var ux = q[2];
                    var uy = q[3];
                    node.distribution = equilibrium(ux, uy, node.density);
                }
            }
            module.drawing.draw();
            module.animation_id = requestAnimationFrame(main.updater);
        };
        main.init = function(){
            /**
             * Initialize lattice.
             */
            make_lattice(lattice_width, lattice_height);
            init_barrier([]);
            init_flow(0, 0, 1); // Initialize all lattice nodes with zero velocity, and density of 1
            queue.length = 0;
            module.drawing.draw(); // Call draw once to draw barriers, but don't start animating
        };
        main.init_barrier = init_barrier;
        main.init_flow_particles = init_flow_particles;
        return main;
    })();
    return module;
})(boltzmann);

boltzmann.main.init();