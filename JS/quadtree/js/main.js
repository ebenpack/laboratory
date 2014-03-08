var quad = quad || {};
var quad = (function(module) {
    var object_list = module.object_list;
    var qtree = module.qtree;
    var collision_list = module.collision_list;
    module.avg_collision_check = 0;
    function mainLoop(){
        qtree.clear();
        var ball;
        for (var b = 0; b < object_list.length; b++){
            ball = object_list[b];
            ball.update();
            ball.collide = false;
            qtree.insert(ball);
        }
        // Detect collisions
        var collision_checks = 0;
        for (var c = 0; c < object_list.length; c++){
            ball = object_list[c];
            var x = ball.x - ball.radius;
            var y = ball.y - ball.radius;
            var width = x + (2 * ball.radius);
            var height = y + (2 * ball.radius);
            var possible_collides = qtree.retrieve(new module.Bounds(x, y, width, height));
            for (var i = 0; i < possible_collides.length; i++){
                collision_checks += 1;
                var ball2 = possible_collides[i];
                if (ball !== ball2 && ball.detect_collide(ball2)){
                    collision_list.push({x: ball.x, y:ball.y, age: 0});
                    ball.bounce(ball2);
                }
            }
            module.avg_collision_check = collision_checks;
        }
        // Update collisions
        for (var d = collision_list.length - 1; d >= 0; d--){
            if (collision_list[d].age >= 35){
                collision_list.splice(d, 1);
            }
            else {
                collision_list[d].age += 1;
            }
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
