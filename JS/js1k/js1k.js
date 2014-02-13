// MANUAL MINIFICATION TODOS
// ######################
// REMOVE a,b,c globals
// REMOVE OUTER IIFE (~16bytes)
// SET DIMENSION=100
// SET FOO='WIDTH' (2bytes)
// REMOVE LEADING ZEROS (E.G. 0.1)(2bytes)
// PUT ALL VARIABLES IN GLOBAL SCOPE (maybe ~50bytes??)
// LOOP CANVAS VARIABLE AND RENAME METHODS/PROPERTIES (width, height, style, onmousemove, style) (maybe ~10bytes??)
// CHANGE setInterval TO while LOOP??? (PROBABLY WON't WORK)
// 
// #######################
// These are givens for the contest, but it helps to have
// them here so Google closure doesn't use the names
a = document.getElementById("js1k");
b = document.body;
c = a.getContext("2d");
(function(){  // remove IIFE: ~16bytes
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
var weight;
// Instead of keeping this in an array, we'll put it in a string
// to save some space (although lookup is more complicated, so
// I'm not 100% sure if I actually gained anything). It might be
// possible to halve this string by negating the output for certain
// numbers (e.g. 1-> (1,0), 3->(-1,0); 5->(1,-1), 7->(-1,1)), but 
// the logic to achieve this might actually take longer than the savings
// it would gain. I may consider this later if I'm very desperate for bytes.
var ND = " 0 0 1 0 0-1-1 0 0 1 1-1-1-1-1 1 1 1";
var px_per_node = F(a[WIDTH] / lattice_dim); // Pixels per node
a[WIDTH] = a.height = px_per_node *lattice_dim;
function equilibrium(ux, uy, rho) {
    // equilibrium
    eq = [];
    for (var d = 0; d < 9; d++) {
        // Calculate equilibrium value
        var eu = (ND.slice(d*4,d*4+2) * ux) + (ND.slice(d*4+2,d*4+4) * uy);
        // Find the node weight. I think this is more succinct than keeping 
        // an array of these values
        if (d) {
            weight = (d<5)?1/9:1/36;
        } else {
            weight = 4/9;
        }
        // Equilibrium equation
        eq[d] = weight * rho * (1 + 3*eu + 4.5*(eu*eu) - 1.5*((ux * ux) + (uy * uy)));
        // TODO: Try returning eq. `return` takes up a few bytes, but I'm
        // also doing a lot of gymnastics to copy over eq outside the function
        // so it might be worth it in the end
    }
}
function stream(){
    for (x = 0; x < lattice_sq; x++) {
        y_pos = F(x/lattice_dim);
        x_pos = x%lattice_dim;
        var node = lattice[x_pos][y_pos];
        for (var d = 0; d < 9; d++) {
            // Multiply node direction by one to coerce to int
            var newx = ND.slice(d*4,d*4+2)*1 + x_pos;
            var newy = ND.slice(d*4+2,d*4+4)*1 + y_pos;
            // Check if new node is in the lattice
            if (newx >= 0 && newx < lattice_dim &&
                newy >= 0 && newy < lattice_dim) {
                lattice[newx][newy].s[d] = node.d[d];
            }
        }
    }
}
function collide(){
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
            lattice[x_pos][y_pos].s = eq;
        }
        var node = lattice[x_pos][y_pos];
        var d = node.d;
        // Copy over values from streaming phase.
        d = node.s.slice(0);
        // Calculate macroscopic density (rho) and velocity (ux, uy)
        // TODO: Can this be compacted any more?
        var d1 = d[1] + d[5] + d[8];
        var d2 = d[3] + d[6] + d[7];
        var rho = d1 + d2 + d[0] + d[2] + d[4];
        node.x = (d1 - d2) / rho;
        node.y = (d[4] + d[7] + d[8] - d[2] - d[5] - d[6]) / rho;
        // Update values stored in node.
        node.n = rho;
        // Set node equilibrium for each velocity
        equilibrium(node.x, node.y, rho);
        for (var i = 0; i < 9; i++) {
            // TODO: TWEAK OMEGA (CURRENTLY 1.7)
            node.d[i] = d[i] + (1.7 * (eq[i] - d[i]));
        }
        // DRAW
        // TODO: Reduce to single loop
        for (var ypx = y_pos * px_per_node; ypx < (y_pos+1) * px_per_node; ypx++) {
            for (var xpx = x_pos * px_per_node; xpx < (x_pos + 1) * px_per_node; xpx++) {
                var index = (xpx + ypx * image[WIDTH]) * 4;
                // We only need to draw green and alpha.
                id[index+1] = 255; // Green
                id[index+3] = F(S(P(lattice[x_pos][y_pos].x, 2) + P(lattice[x_pos][y_pos].y, 2))*4E3); // Alpha
            }
        }
    }
    c.putImageData(image, 0, 0);
    init=0;
}

function mousemove(e){
    // Scale from canvas coordinates to lattice coordinates
    for (var x = -25; x < 26; x++) {
        // There's no OOB checks here anymore. It's fine so long as
        // you don't have your console open. Probably.
        var node = lattice[F(e.layerX / px_per_node + x/5)][F(e.layerY / px_per_node) + x%5];
        equilibrium(.1, .1, node.n);
        node.s = eq;
    }
}
a.onmousemove=mousemove;
(function update(){
    collide();
    stream();
    setTimeout(update); // sorry requestAnimationFrame, your name is too long :(
})();

})();