// MANUAL MINIFICATION TODOS
// ######################
// REMOVE a,b,c globals
// REMOVE OUTER SIAF (~16bytes)
// SET DIMENSION=100
// SET FOO='WIDTH' (2bytes)
// REMOVE LEADING ZEROS (E.G. 0.1)(2bytes)
// RENAME TO c.pg && c.cI
// PUT ALL VARIABLES IN GLOBAL SCOPE (maybe ~50bytes??)
// LOOP CANVAS VARIABLE AND RENAME METHODS/PROPERTIES (width, height, style, onmousemove, style) (maybe ~10bytes??)
// CHANGE setInterval TO while LOOP??? (PROBABLY WON't WORK)
// 
// #######################
a = document.getElementById("js1k");
b = document.body;
c = a.getContext("2d");
//1282
(function(){  // remove SIAF: 16bytes
// MATHS
with(Math)S=sqrt,P=pow,F=floor;
// TODO: MANUALLY SET THESE VARIABLES. GOOGLE CLOSURE INLINES THEM
var lattice_dim = 100; // lattice dimensions
var lattice_sq = 1E4; // total # of nodes
var lattice=[]; // lattice
var x, x_pos, y_pos; // loop variables
var eq = []; // Instead of equilibrium() returning an array, we'll just use this one over and over again and hope we don't forget to initialize it before every use
var four9ths = 4/9;
var one9th = 1/9;
var one36th = 1/36;
var init=1;
var WIDTH = 'width';
var node_directions = [
    // Tacked weight on, instead of keepign in separate array. For speed.
    [ 0,  0, four9ths], // Origin
    [ 1,  0, one9th], // E
    [ 0, -1, one9th], // N
    [-1,  0, one9th], // W
    [ 0,  1, one9th], // S
    [ 1, -1, one36th], // NE
    [-1, -1, one36th], // NW
    [-1,  1, one36th], // SW
    [ 1,  1, one36th]  // SE
];
var px_per_node = F(a[WIDTH] / lattice_dim); // Pixels per node
a[WIDTH] = a.height = px_per_node *lattice_dim;
// END VARIABLES
// a.style.background="#000"; // remove: 26bytes


// Big thanks to Marijn Haverbeke for this 
// dirty, dirty hack: http://marijnhaverbeke.nl/js1k/
// for(var p in c){
//     c[p[0]+p[6]||'']=c[p];
// }

function equilibrium(ux, uy, rho) {
    // equilibrium
    eq = [];
    for (var d = 0; d < 9; d++) {
        // Calculate equilibrium value
        var velocity = node_directions[d]; // Node direction vector
        var eu = (velocity[0] * ux) + (velocity[1] * uy); // Macro velocity multiplied 
        eq[d] = node_directions[d][2] * rho * (1 + 3*eu + 4.5*(eu*eu) - 1.5*((ux * ux) + (uy * uy))); // Equilibrium equation
    }
}
function stream(){
    for (x = 0; x < lattice_sq; x++) {
        y_pos = F(x/lattice_dim);
        x_pos = x%lattice_dim;
        var node = lattice[x_pos][y_pos];
        for (var d = 0; d < 9; d++) {
            var move = node_directions[d];
            var newx = move[0] + x_pos;
            var newy = move[1] + y_pos;
            // Check if new node is in the l
            if (newx >= 0 && newx < lattice_dim &&
                newy >= 0 && newy < lattice_dim) {
                lattice[newx][newy].s[d] = node.d[d];
            }
        }
    }
}
function collide(){
    for (x = 0; x < lattice_sq; x++) {
        var node = lattice[x%lattice_dim][F(x/lattice_dim)];
        var d = node.d;
        // Copy over values from streaming phase.
        var d = node.s.slice(0);
        // Calculate macroscopic density (rho) and velocity (ux, uy)
        var d1 = d[1] + d[5] + d[8];
        var d2 = d[3] + d[6] + d[7];
        var rho = d1 + d2 + d[0] + d[2] + d[4];
        var ux = (d1 - d2) / rho;
        var uy = (d[4] + d[7] + d[8] - d[2] - d[5] - d[6]) / rho;
        // Update values stored in node.
        node.n = rho;
        node.x = ux;
        node.y = uy;
        // Set node equilibrium for each velocity
        equilibrium(ux, uy, rho);
        for (var i = 0; i < 9; i++) {
            var old_value = d[i];
            // TODO: TWEAK OMEGA (CURRENTLY 1.7)
            node.d[i] = old_value + (1.7 * (eq[i] - old_value));
        }
    }
}

function mousemove(e){
    // Scale from canvas coordinates to lattice coordinates
    for (var x = -25; x <= 25; x++) {
        // There's no OOB checks here anymore. It's fine so long as
        // you don't have your console open. Probably.
        var node = lattice[F(e.layerX / px_per_node) + F(x/5)][F(e.layerY / px_per_node) + x%5];
        equilibrium(.1, .1, node.n);
        node.d = eq;
    }
}
function draw(){
    // Drawing is going to initialize, too, because LOL, why not?
    var image = c.createImageData(a[WIDTH], a.height);
    var id = image.data;
    for (x = 0; x < lattice_sq; x++) {
        y_pos = F(x/lattice_dim);
        x_pos = x%lattice_dim;
        if (init) {
            // Inititialize lattice
            if (y_pos==0){
                lattice[x_pos]=[];
            }
            lattice[x_pos][y_pos] = {d:[],s:[],n:1,x:0,y:0};
            equilibrium(0,0,1);
            lattice[x_pos][y_pos].s = eq.slice(0);
            lattice[x_pos][y_pos].d = eq.slice(0);
        }
        var speed = S(P(lattice[x_pos][y_pos].x, 2) + P(lattice[x_pos][y_pos].y, 2));
        // TODO: Reduce to single loop
        for (var ypx = y_pos * px_per_node; ypx < (y_pos+1) * px_per_node; ypx++) {
            for (var xpx = x_pos * px_per_node; xpx < (x_pos + 1) * px_per_node; xpx++) {
                var index = (xpx + ypx * image[WIDTH]) * 4;
                // We only need to draw green and alpha.
                id[index+1] = lattice_sq; // Green
                id[index+3] = F(speed*4E3); // Alpha
            }
        }
    }
    c.putImageData(image, 0, 0);
    init=0;
}

a.onmousemove=mousemove;
(function update(){
    draw();
    stream();
    collide();
    setInterval(update,10); // sorry requestAnimationFrame, you're too long :(
})();

})();