// MANUAL MINIFICATION TODOS
// ######################
// REMOVE a,b,c globals
// REMOVE OUTER IIFE (~16bytes)
// SET DIMENSION=99
// HEIGHT/WIDTH=600
// SET FOO='slice' (2bytes)
// REMOVE LEADING ZEROS (E.G. 0.1)(2bytes)
// PUT ALL VARIABLES IN GLOBAL SCOPE (possibly 28bytes)
// 
// #######################
// These are givens for the contest, but it helps to have
// them here so Google closure doesn't use the names
// a = document.getElementById("c");
// b = document.body;
// c = a.getContext("2d");
// d = 999;
X="slice";Y=600;Z=99;
(function(){  // remove IIFE: ~16bytes
with(Math)S=sqrt,P=pow,F=floor;
// TODO: MANUALLY SET THESE VARIABLES. GOOGLE CLOSURE INLINES THEM
var lattice_dim = 99; // lattice dimensions. 99 saves me 1 byte vs 100. I'm seriously that desperate 
var lattice_sq = lattice_dim*lattice_dim; // total # of nodes
var lattice=[]; // lattice
var x, x_pos, y_pos, d; // loop variables
var eq = []; // Instead of equilibrium() returning an array, we'll just use this one over and over again and hope we don't forget to initialize it before every use
var init=1; // This is only used once. Is there another variable that could be used instead?
var WIDTH = 'width';
var weight;
// Instead of keeping this in an array, we'll put it in a string
// to save some space (although lookup is more complicated, so
// I'm not 100% sure if I actually gained anything). It might be
// possible to halve this string by negating the output for certain
// numbers (e.g. [1-> (1,0), 3->(-1,0)]; [5->(1,-1), 7->(-1,1)]), but 
// the logic to achieve this might actually take longer than the savings
// it would gain. I may consider this later if I'm very desperate for bytes.
var ND = " 0 0 1 0 0-1-1 0 0 1 1-1-1-1-1 1 1 1";
var px_per_node = 6; // Pixels per node
function equilibrium(ux, uy, rho) {
    // equilibrium
    eq = [];
    for (D = 0; D < 9; D++) {
        // Calculate equilibrium value
        var idx = D*4;
        var eu = (ND.slice(idx,idx+2) * ux) + (ND.slice(idx+2,idx+4) * uy);
        // Find the node weight. I think this is more succinct than keeping 
        // an array of these values
        if (D) {
            weight = (D<5)?1/9:1/36;
        } else {
            weight = 4/9;
        }
        // Equilibrium equation
        eq[D] = weight * rho * (1 + 3*eu + 4.5*(eu*eu) - 1.5*((ux * ux) + (uy * uy)));
        // TODO: Try returning eq. `return` takes up a few bytes, but I'm
        // also doing a lot of gymnastics to copy over eq outside the function
        // so it might be worth it in the end
    }
}
function stream(){
    for (Q = 0; Q < lattice_sq; Q++) {
        y_pos = F(Q/lattice_dim);
        x_pos = Q%lattice_dim;
        var node = lattice[x_pos][y_pos];
        for (K = 0; K < 9; K++) {
            // Multiply node direction by one to coerce to int
            H = K*4;
            var newx = ND.slice(H,H+2)*1 + x_pos;
            var newy = ND.slice(H+2,H+4)*1 + y_pos;
            // Check if new node is in the lattice
            if (newx >= 0 && newx < lattice_dim &&
                newy >= 0 && newy < lattice_dim) {
                lattice[newx][newy].s[K] = node.d[K];
            }
        }
    }
}
function collide(){
    // Collide is going to draw and initialize, too, because LOL, why not?
    I = c.createImageData(600, 600);
    L = I.data;
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
        var dist = node.d;
        // Copy over values from streaming phase.
        dist = node.s.slice(0);
        // Calculate macroscopic density (rho) and velocity (ux, uy)
        // and update values stored in node.
        // TODO: Can this be compacted any more?
        var d1 = dist[1] + dist[5] + dist[8];
        var d2 = dist[3] + dist[6] + dist[7];
        var rho = d1 + d2 + dist[0] + dist[2] + dist[4];
        node.x = (d1 - d2) / rho;
        node.y = (dist[4] + dist[7] + dist[8] - dist[2] - dist[5] - dist[6]) / rho;
        // Update values stored in node.
        node.n = rho;
        // Set node equilibrium for each velocity
        equilibrium(node.x, node.y, rho);
        for (i = 0; i < 9; i++) {
            // TODO: TWEAK OMEGA (CURRENTLY 1.7)
            node.d[i] = dist[i] + (1.7 * (eq[i] - dist[i]));
        }
        // DRAW
        for (i = 0; i < 36; i++) {
            // This loop was way too difficult for me to flatten.
            // I just wasn't getting my head around it. Maybe I
            // should take a break.
            var index = 4*(i%6+6*x_pos+600*(F(i/6)+6*y_pos));
            L[index+1] = lattice_sq; // Green. Setting this way above the max 255, just to save 2 bytes
            L[index+3] = F(S(P(lattice[x_pos][y_pos].x, 2) + P(lattice[x_pos][y_pos].y, 2))*4E3); // Alpha
        }
    }
    c.putImageData(I, 0, 0);
    init=0;
}

function mousemove(e){
    // Scale from canvas coordinates to lattice coordinates
    for (M = -16; M < 17; M++) {
        // There's no OOB checks here anymore. It's fine so long as
        // you don't have your console open. Probably.
        var node = lattice[F(e.layerX / px_per_node + M/5)][F(e.layerY / px_per_node) + M%5];
        // TODO: Tweak strength of "push"
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