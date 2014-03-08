var quad = quad || {};
var quad = (function(module) {
    var canvas = module.canvas;
    var ctx;
    var qctx;
    var quadcanvas = document.getElementById("qtree");
    var collisioncanvas = document.getElementById("collisioncanvas");
    var object_list = module.object_list;
    var collision_list = module.collision_list;
    var stats = document.getElementById("stats");
    (function() {
        // Initialize
        if (module.canvas.getContext) {
            ctx = canvas.getContext('2d');
            qctx = quadcanvas.getContext('2d');
            colctx = collisioncanvas.getContext('2d');
        } else {
            // ABORT!
        }
    })();

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
        ctx.arc(ball.x,ball.y,ball.radius,0,2*Math.PI);
        ctx.fill();
        ctx.stroke();
    }

    function drawCollision(collision){
        var alpha = 1/collision.age;
        colctx.strokeStyle = "rgba(255,0,0, " + alpha + ")";
        colctx.beginPath();
        colctx.arc(collision.x,collision.y,collision.age,0,2*Math.PI);
        colctx.stroke();
        colctx.closePath();
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
        quadcanvas.width = quadcanvas.width;
        qctx.fillStyle = "rgba(0,0,255,0.05)";
        qctx.strokeStyle = "black";
        recursive_draw_quad(module.qtree);
    }

    function draw_collisions(){
        collisioncanvas.width = collisioncanvas.width;
        colctx.lineWidth = 2;
        for (var i = 0; i < collision_list.length; i++){
            drawCollision(collision_list[i]);
        }
    }

    function draw_balls(){
        canvas.width = canvas.width; // Clear canvas
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
        draw_collisions();
        draw_stats();
    }

    module.draw = draw;
    return module;
})(quad);