var quad = quad || {};
var quad = (function(module) {
    var object_list = module.object_list;
    var qtree = module.qtree;
    module.avg_collision_check = 0;
    function mainLoop(){
        qtree.clear();
        var ball;
        for (var b = 0; b < object_list.length; b++){
            ball = object_list[b];
            qtree.insert(ball);
            ball.calculate_new_values();
            ball.collide = false;
        }
        // Detect collisions
        var collision_checks = 0;
        for (var c = 0; c < object_list.length; c++){
            ball = object_list[c];
            var possible_collides = qtree.retrieve(ball);
            for (var i = 0; i < possible_collides.length; i++){
                collision_checks += 1;
                var ball2 = possible_collides[i];
                if (ball !== ball2 && ball.detect_collide(ball2)){
                    ball.collide = true;
                }
            }
            module.avg_collision_check = collision_checks;
        }
        for (var e = 0; e < object_list.length; e++){
            object_list[e].update();
        }
        module.draw();
        module.animationId = requestAnimationFrame(mainLoop);
    }
    function init(){
        mainLoop();
    }
    module.init = init;
    return module;
})(quad);

quad.init();
