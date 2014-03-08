var quad = quad || {};
var quad = (function(module) {
    var width = module.width;
    var height = module.height;
    var randInt = module.randInt;
    var randSign = module.randSign;
    var Ball = module.Ball;
    function addBall(){
        // Add object with random velocity to random position in canvas.
        // TODO: check to make sure object isn't already occupying tthat space
        var mv = 3; // Max velocity
        var radius = 4;
        var position = {x: randInt(20+radius, width-20-radius), y: randInt(20+radius, height-20-radius)};
        var velocity = {x: randSign(randInt(1,mv)), y: randSign(randInt(1,mv))};
        module.object_list.push(new Ball(position, velocity, radius));
    }
    (function(){
        // Register events
        var add = document.getElementById('add-ball');
        add.addEventListener('click', addBall, false);
    })();
    return module;
})(quad);