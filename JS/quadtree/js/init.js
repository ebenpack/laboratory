var quad = quad || {};
var quad = (function(module) {
    module.canvas = document.getElementById("quadcanvas");
    var width = module.canvas.width;
    var height = module.canvas.height;
    module.width = width;
    module.height = height;
    module.object_list = [];
    module.collision_list = [];
    module.animationId = null;
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
        this.radius = rad;
        this.collide = false;
        this.height = rad * 2;
        this.width = rad * 2;
    }
    Ball.prototype.update = function(){
        if (this.x + this.velx + this.radius > width || this.x + this.velx - this.radius < 0){
            this.velx *= -1;
        }
        if (this.y + this.vely + this.radius > height || this.y + this.vely - this.radius < 0){
            this.vely *= -1;
        }
        this.x += this.velx;
        this.y += this.vely;
    };
    Ball.prototype.bounce = function(ball){
        // v'_{1x}=\frac{v_1\cos(\theta_1-\varphi)(m_1-m_2)+2m_2v_2\cos(\theta_2-\varphi)}{m_1+m_2}\cos(\varphi)+v_1\sin(\theta_1-\varphi)\cos(\varphi+\frac{\pi}{2})}}
        this.velx *= -1;
        this.vely *= -1;
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