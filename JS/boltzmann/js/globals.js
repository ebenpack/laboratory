var lattice = []; // Lattice consisting of lattice nodes.
var queue = [];
var viscosity = 0.02; // fluid viscosity
var omega = 1 / (3 * viscosity + 0.5); // "relaxation" parameter
var draw_mode = 0;
var draw_flow_vectors = false;
var draw_flow_particles = false;
var new_barrier = true; // new_barrier flag is set when new barriers are added, to let
// the draw function know it needs to redraw barriers (this saves us from redrawing barriers every single frame)
var flow_particles = [];
var canvas = document.getElementById("boltzmann");
var vectorcanvas = document.getElementById("vectorcanvas");
var particlecanvas = document.getElementById("particlecanvas");
var barriercanvas = document.getElementById("barriercanvas");
var steps_per_frame = 10;
var px_per_node;
function init_flow_particles() {
    particles = [];
    for (var x = 0; x < 20; x++) {
        for (var y = 0; y < 8; y++) {
            if (!lattice[x*10][y*10].barrier) {
                particles.push({'x':x*10, 'y':y*10});
            }
        }
    }
}