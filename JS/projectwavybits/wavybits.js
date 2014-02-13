// MANUAL MINIFICATION TODOS
// ######################
// REMOVE OUTER IIFE
// REPLACE 99 W/ Z
// REPLACE 600 W/ Y
// REPLACE 9801 W/ Z*Z
// REPLACE `array.slice` with `X='slice'; array[X]`
// REMOVE LEADING ZEROS (E.G. 0.1)
// 
// #######################
// These are givens for the contest, but it helps to have
// them here so Google closure doesn't use the names
// a = document.getElementById("c");
// b = document.body;
// c = a.getContext("2d");
// d = 999;
X="slice";Y=600;Z=99;
(function(){
with(Math)S=sqrt,P=pow,F=floor;
// TODO: MANUALLY SET THESE VARIABLES. GOOGLE CLOSURE INLINES THEM
var lattice_dim = 99; // lattice dimensions. 99 saves me 1 byte vs 100. I'm seriously that desperate 
var lattice_sq = lattice_dim*lattice_dim; // total # of nodes
var lattice=[];
var x, x_pos, y_pos, d; // loop variables
var eq = []; // Instead of equilibrium() returning an array, we'll just use this one over and over again and hope we don't forget to initialize it before every use
var init=1; // This is only used once. Is there another variable that could be used instead?
var WIDTH = 'width';
var weight;
// Instead of keeping this in an array, we'll put it in a string
// to save some space (although lookup is more complicated, so
// I'm not 100% sure if I actually gained anything).
var ND = " 0 0 1 0 0-1-1 0 0 1 1-1-1-1-1 1 1 1";
var px_per_node = 6; // Pixels per node
function equilibrium(ux, uy, rho) {
    // D = loop variable
    // E = node_distribution index
    // G = velocity * node direction... or something
    eq = [];
    for (D = 0; D < 9; D++) {
        // Calculate equilibrium value
        E = D*4;
        G = (ND.slice(E,E+2) * ux) + (ND.slice(E+2,E+4) * uy);
        // Find the node weight. I think this is more succinct than keeping 
        // an array of these values
        if (D) {
            weight = (D<5)?1/9:1/36;
        } else {
            weight = 4/9;
        }
        // Equilibrium equation
        eq[D] = weight * rho * (1 + 3*G + 4.5*(G*G) - 1.5*((ux * ux) + (uy * uy)));
        // TODO: Try returning eq. `return` takes up a few bytes, but I'm
        // also doing a lot of gymnastics to copy over eq outside the function
        // so it might be worth it in the end
    }
}
function stream(){
    // Q = loop variable
    // K = loop variable
    // H = node directions index
    // N = newx
    // R = newy
    for (Q = 0; Q < lattice_sq; Q++) {
        y_pos = F(Q/lattice_dim);
        x_pos = Q%lattice_dim;
        for (K = 0; K < 9; K++) {
            // Multiply node direction by one to coerce to int
            H = K*4;
            N = ND.slice(H,H+2)*1 + x_pos;
            R = ND.slice(H+2,H+4)*1 + y_pos;
            // Check if new node is in the lattice
            if (N >= 0 && N < lattice_dim &&
                R >= 0 && R < lattice_dim) {
                lattice[N][R].s[K] = lattice[x_pos][y_pos].d[K];
            }
        }
    }
}
function collide(){
    // Collide is going to draw and initialize, too, because LOL, why not?
    // i = loop variable
    // I = Image
    // L = imagedata
    // M = node
    // C = dist
    // T = d1
    // U = d2
    // W = rho
    // V = index
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
        M = lattice[x_pos][y_pos];
        C = M.d;
        // Copy over values from streaming phase.
        C = M.s.slice(0);
        // Calculate macroscopic density (rho) and velocity (ux, uy)
        // and update values stored in node.
        // TODO: Can this be compacted any more?
        T = C[1] + C[5] + C[8];
        U = C[3] + C[6] + C[7];
        W = T + U + C[0] + C[2] + C[4];
        M.x = (T - U) / W;
        M.y = (C[4] + C[7] + C[8] - C[2] - C[5] - C[6]) / W;
        // Update values stored in node.
        M.n = W;
        // Set node equilibrium for each velocity
        equilibrium(M.x, M.y, W);
        for (i = 0; i < 9; i++) {
            // TODO: TWEAK OMEGA (CURRENTLY 1.7)
            M.d[i] = C[i] + (1.7 * (eq[i] - C[i]));
        }
        // DRAW
        for (i = 0; i < 36; i++) {
            // This loop was way too difficult for me to flatten.
            // I just wasn't getting my head around it. Maybe I
            // should take a break.
            V = 4*(i%6+6*x_pos+600*(F(i/6)+6*y_pos));
            L[V+1] = lattice_sq; // Green. Setting this way above the max 255, just to save 2 bytes
            L[V+3] = F(S(P(lattice[x_pos][y_pos].x, 2) + P(lattice[x_pos][y_pos].y, 2))*4E3); // Alpha
        }
    }
    c.putImageData(I, 0, 0);
    init=0;
}

function mousemove(e){
    // Scale from canvas coordinates to lattice coordinates
    // M = radius around mouse
    // J = node
    for (M = -16; M < 17; M++) {
        // There's no OOB checks here anymore. It's fine so long as
        // you don't have your console open. Probably.
        J = lattice[F(e.layerX / px_per_node + M/5)][F(e.layerY / px_per_node) + M%5];
        // TODO: Tweak strength of "push"
        equilibrium(.1, .1, J.n);
        J.s = eq;
    }
}
a.onmousemove=mousemove;
(function update(){
    collide();
    stream();
    setTimeout(update); // sorry requestAnimationFrame, your name is too long :(
})();

})();