// MANUAL MINIFICATION TODOS
// REMOVE OUTER SIAF
// SET WIDTH=200
// SET HEIGHT=80
// SET FOO='WIDTH'
// REMOVE BLACK BACKGROUND
// LOOP CONTEXT VARIABLE AND RENAME METHODS?? (createImageData, putImageData)
// LOOP CANVAS VARIABLE AND RENAME METHODS/PROPERTIES (width, height, style, onmousemove, style)

(function(){  // remove SIAF: 16bytes
// TODO: MANUALLY SET THESE VARIABLES. GOOGLE CLOSURE INLINES THEM
var lattice_dim = 125; // lattice
var lattice=[]; // lattice
var x; // loop variable
var y;// loop variable
var eq = []; // Instead of equilibrium() returning an array, we'll just use this one over and over again and hope we don't forget to initialize it before every use
var four9ths = 4/9;
var one9th = 1/9;
var one36th = 1/36;
var WIDTH = 'width';
// MATHS
with(Math)S=sqrt,P=pow,F=floor;
var px_per_node = F(a[WIDTH] / lattice_dim); // Pixels per node
a[WIDTH] = a.height = px_per_node *lattice_dim;
var node_directions = [
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
// END VARIABLES
a.style.background="#000"; // remove: 26bytes

function equilibrium(ux, uy, rho) {
    // equilibrium
    eq = [];
    for (var d = 0; d < 9; d++) {
        // Calculate equilibrium value
        var velocity = node_directions[d]; // Node direction vector
        var eu = (velocity[0] * ux) + (velocity[1] * uy); // Macro velocity multiplied by distribution velocity
        // var node_weight = d;
        // if (node_weight){
        //     node_weight = (node_weight < 5) ? one9th: one36th;
        // } else {
        //     node_weight = four9ths;
        // }
        eq.push(node_directions[d][2] * rho * (1 + 3*eu + 4.5*(eu*eu) - 1.5*((ux * ux) + (uy * uy)))); // Equilibrium equation
    }
}
function stream(){
    for (x = 0; x < lattice_dim; x++) {
        for(y = 0; y < lattice_dim; y++) {
            var node = lattice[x][y];
            for (var d = 0; d < 9; d++) {
                var move = node_directions[d];
                var newx = move[0] + x;
                var newy = move[1] + y;
                // Check if new node is in the l
                if (newx >= 0 && newx < lattice_dim &&
                    newy >= 0 && newy < lattice_dim) {
                    lattice[newx][newy].s[d] = node.d[d];
                }
            }
        }
    }
}
function collide(){
    for (x = 0; x < lattice_dim; x++) {
        for(y = 0; y < lattice_dim; y++) {
            var node = lattice[x][y];
            var d = node.d;
            for (var p = 0; p < 9; p++) {
                // Copy over values from streaming phase.
                d[p] = node.s[p];
            }
            // Calculate macroscopic density (rho) and velocity (ux, uy)
            var d1 = d[1] + d[5] + d[8];
            var d2 = d[4] + d[7] + d[8];
            var rho = d[0] +  d[2] + d[3] + d[6] + d1 + d2 - d[8];
            var ux = (d1 - d[3] - d[6] - d[7]) / rho;
            var uy = (d2 - d[2] - d[5] - d[6]) / rho;
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
}

function mousemove(e){
    // Scale from canvas coordinates to lattice coordinates
    var lattice_x = F(e.layerX / px_per_node);
    var lattice_y = F(e.layerY / px_per_node);
    for (var x = -5; x <= 5; x++) {
        for (var y = -5; y <= 5; y++) {
            // Push in circle around cursor. Make sure coordinates are in bounds.
            // if (lattice_x + x >= 0 && lattice_x + x < lattice_dim &&
            //     lattice_y + y >= 0 && lattice_y + y < lattice_dim &&
            //     S((x * x) + (y * y)) < 5) {
                var node = lattice[lattice_x + x][lattice_y + y];
                equilibrium(.1, .1, node.n);
                node.d = eq;
            // }
        }
    }
}
function draw(){
    var image = c.createImageData(a[WIDTH], a.height);
    var id = image.data;
    for (x = 0; x < lattice_dim; x++) {
        for(y = 0; y < lattice_dim; y++) {
            var speed = S(P(lattice[x][y].x, 2) + P(lattice[x][y].y, 2));
            for (var ypx = y * px_per_node; ypx < (y+1) * px_per_node; ypx++) {
                for (var xpx = x * px_per_node; xpx < (x + 1) * px_per_node; xpx++) {
                    var index = (xpx + ypx * image[WIDTH]) * 4;
                    id[index+0] = 0; // Red
                    id[index+1] = 255; // Green
                    id[index+2] = 0; // Blue
                    id[index+3] = F(speed*4E3); // Alpha
                }
            }
        }
    }
    c.putImageData(image, 0, 0);
}
// Initialize lattice
for (x = 0; x < lattice_dim; x++) {
    lattice[x]=[];
    for(y = 0; y < lattice_dim; y++) {
        // lattice[x][y] = new LatticeNode();
        lattice[x][y] = {'d':[],'s':[],'n':1,'x':0,'y':0};
        equilibrium(0,0,1);
        lattice[x][y].s = eq.slice(0);
        lattice[x][y].d = eq.slice(0);
    }
}

a.onmousemove=mousemove;
(function update(){
    //for (var i = 0; i < 10; i++) { // Loop takes too many bytes :(
        stream();
        collide();
    //}
    draw();
    setInterval(update,10); // sorry requestAnimationFrame, you're too long :(
})();

})();