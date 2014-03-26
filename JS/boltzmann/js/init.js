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