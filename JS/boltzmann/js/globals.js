var lattice = []; // Lattice consisting of lattice nodes.
var queue = [];
var viscosity = 0.02; // fluid viscosity
var omega = 1 / (3 * viscosity + 0.5); // "relaxation" parameter
var draw_mode = 0;
var draw_flow_vectors = false;