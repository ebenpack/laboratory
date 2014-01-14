function astar(id, graph_width, graph_height) {

    function GraphNode(x,y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.barrier = false;
    }

    function Particle(x,y) {
        // Single particle. Particles always seek to move towards
        // the cursor, using A*.
        this.speed = 2;
        this.x = x; // Current x location on the board.
        this.y = y; // Current y location on the board.
        this.ang = 0; //
        this.nearest_node = function(){
            // Finds nearest GraphNode.
            
        };
        this.update_dir = function(){

        };
        this.move = function(){
            this.ang = angle(this.x, this.y, mouse.x, mouse.y);
            var dy = -Math.ceil(this.speed * Math.cos(this.ang));
            var dx = -Math.ceil(this.speed * Math.sin(this.ang));
            this.x = this.x + dx;
            this.y = this.y + dy;
        };
    }

    function is_barrier(x,y) {
        // Returns true if the node should be initialized as a barrier node.
        return (x === 0 || x === graph_width - 1 ||
                y === 0 || y === graph_height - 1 ||
                (x % 10 > 6 && y % 10 > 6));
    }

    function init_graph(graph_width, graph_height) {
        // Make a new graph 
        var new_graph = [];
        for (var i = 0; i < graph_width; i++) {
            new_graph.push([]);
            for (var j = 0; j < graph_height; j++) {
                new_graph[i].push(new GraphNode(i*node_size, j*node_size));
                if (is_barrier(i,j)) {
                    new_graph[i][j].barrier = true;
                }
            }
        }
        return new_graph;
    }

    function init_particles(n) {
        // Make n new particles, placed in random spots on the board,
        // making certain they're not being placed on a barrier node.
        function random_range(min, max) {
            return Math.round(Math.random() * (max - min) + min);
        }
        for (var i = 0; i < n; i++){
            // Random x and y location.
            var x, y;
            do {
                x = random_range(1, graph_width-2);
                y = random_range(1, graph_height-2);
            } while(is_barrier(x,y));
            particles.push(new Particle(x*node_size,y*node_size));
        }
    }

    function update_particles() {
        for (var i = 0 ; i < particles.length; i++) {
            particles[i].move();
        }
    }

    graph = init_graph(graph_width, graph_height);
    init_particles(2);
    mouse_handler(id);

    // window.requestAnimFrame = (function(){
    //     return  window.requestAnimationFrame ||
    //     window.webkitRequestAnimationFrame ||
    //     window.mozRequestAnimationFrame    ||
    //     function( callback ){
    //     window.setTimeout(callback, 1000 / 60);
    //     };
    // })();

    (function updater(){
        var steps = 1;
        for (var i = 0; i < steps; i++) {
            update_particles();
        }
        draw_graph(id);
        // requestAnimFrame(updater);
        window.setTimeout(updater, 80);
    })();

}

var init = function() {
    var id = 'astar';
    window.onload = function(){
        astar(id, graph_width, graph_height);
    };
}();
