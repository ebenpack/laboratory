var quad = quad || {};
var quad = (function(module) {
    var canvas = module.canvas;
    var ctx;
    var qctx;
    var quadcanvas = document.getElementById("qtree");
    var stats = document.getElementById("stats");
    var width = module.width;
    var height = module.height;
    var object_list = module.object_list;
    (function() {
        // Initialize
        if (module.canvas.getContext) {
            ctx = canvas.getContext('2d');
            qctx = quadcanvas.getContext('2d');
        } else {
            // ABORT!
        }
    })();

    qctx.fillStyle = "rgba(0,0,255,0.05)";
    qctx.strokeStyle = "black";

    // TODO: Optimize draw functions
    function drawBall(ball){
        if (ball.collide){
            ctx.strokeStyle = "blue";
            ctx.fillStyle = "rgba(255,0,0,0.1)";
        }
        else {
            ctx.strokeStyle = "black";
            ctx.fillStyle = "rgba(255,255,255,0.1)";
        }
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, 2*Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }
    
    function recursive_draw_quad(qtree){
        for (var i = 0; i < qtree.nodes.length; i++){
            recursive_draw_quad(qtree.nodes[i]);
        }
        var qs = qtree.bounds;
        qctx.beginPath();
        qctx.rect(qs.x, qs.y, qs.width, qs.height);
        qctx.fill();
        qctx.stroke();
        qctx.closePath();
    }

    function draw_quad(){
        qctx.clearRect(0,0, width, height);
        if (module.overlay) {
            recursive_draw_quad(module.qtree);
        }
    }

    function draw_balls(){
        ctx.clearRect(0,0, width, height);
        for (var i = 0; i < object_list.length; i++){
            ball = object_list[i];
            drawBall(ball);
        }
    }

    function draw_stats(){
        var ball_count = module.object_list.length;
        stats.innerHTML = "Collision Checks: ~" + Math.round(module.avg_collision_check);
        stats.innerHTML += "<br>Naive checks: " + ball_count * ball_count;
        stats.innerHTML += "<br>Balls: " + ball_count;
    }

    function draw(){
        draw_balls();
        draw_quad();
        draw_stats();
    }

    module.draw = draw;
    return module;
})(quad);
