var quad = quad || {};
var quad = (function(module) {
    module.canvas = document.getElementById("quadcanvas");
    var width = module.canvas.width;
    var height = module.canvas.height;
    module.width = width;
    module.height = height;
    module.object_list = [];
    module.animationId = null;
    module.overlay = true;
    module.randInt = function(max, min){
        return Math.floor(Math.random() * (max - min) + min);
    };
    module.randSign = function(){
        return Math.random() < 0.5 ? -1 : 1;
    };
    function Ball(pos, vel, rad) {
        this.x = pos.x;
        this.y = pos.y;
        this.velx = vel.x;
        this.vely = vel.y;
        // Store position/velocity for next step, but
        // keep old position/velocity in case they're needed
        // for other collisions.
        this.newx = pos.x;
        this.newy = pos.y;
        this.newvelx = vel.x;
        this.newvely = vel.y;
        this.radius = rad;
        this.collide = false;
        this.height = rad * 2;
        this.width = rad * 2;
    }
    Ball.prototype.calculate_new_values = function(){
        if (this.x + this.velx + this.radius > width || this.x + this.velx - this.radius < 0){
            this.newvelx *= -1;
        }
        if (this.y + this.vely + this.radius > height || this.y + this.vely - this.radius < 0){
            this.newvely *= -1;
        }
        this.newx += this.newvelx;
        this.newy += this.newvely;
    };
    Ball.prototype.update = function(){
        this.x = this.newx;
        this.y = this.newy;
        this.velx = this.newvelx;
        this.vely = this.newvely;
    };
    Ball.prototype.bounce = function(ball){
        var v1 = Math.sqrt(Math.pow(this.velx, 2) + Math.pow(this.vely, 2));
        var v2 = Math.sqrt(Math.pow(ball.velx, 2) + Math.pow(ball.vely, 2));
        var dx = ball.x - this.x;
        var dy = ball.y - this.y;
        var movement_angle1 = Math.atan2(this.vely, this.velx);
        var movement_angle2 = Math.atan2(ball.vely, ball.velx);
        var contact_angle = Math.atan2(dy, dx);
        this.newvelx = ((2 * v2 * Math.cos(movement_angle2 - contact_angle))/2) * (Math.cos(contact_angle) + v1 * Math.sin(movement_angle1 - contact_angle) * Math.cos(contact_angle + (Math.PI / 2)));
        this.newvelx = ((2 * v2 * Math.cos(movement_angle2 - contact_angle))/2) * (Math.sin(contact_angle) + v1 * Math.sin(movement_angle1 - contact_angle) * Math.sin(contact_angle + (Math.PI / 2)));
    };
    Ball.prototype.detect_collide = function(ball){
        return (Math.pow(ball.x - this.x, 2) + Math.pow(this.y - ball.y, 2) <= 
                Math.pow(this.radius + ball.radius, 2));
    };
    module.Ball = Ball;
    return module;
})(quad);

(function() {
    // requestAnimationFrame polyfill, courtesy of
    // http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
