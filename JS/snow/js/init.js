var snow = snow || {};

snow = (function(module){
    module.canvas = document.getElementById('snowcanvas');
    module.ctx = module.canvas.getContext('2d');
    module.width = module.canvas.width;
    module.height = module.canvas.height;
    module.animation_id;
    module.block_size;
    module.snow_array = [];
    module.maximum_particles; // 'Suggested' maximum number of particles. Not necessarily a hard limit.
    module.density;
    module.speed;

    function initialize_snow() {
        // Initialize snow array. All snow begins off-canvas
        // Begin with a random number of particles...  not too many though
        var len = Math.floor(module.randomrange(0,module.maximum_particles/10));
        for (var i = 0; i < len; i++) {
            var new_snow = module.new_snow('top');
            module.snow_array.push(new_snow);
        }
    }

    module.init = function(settings) {
        module.density = settings.density || 50;
        module.speed = (100 / settings.speed) || 0.2;
        module.block_size = settings.block_size || 10;
        module.maximum_particles = settings.maximum_particles || 1000;
        initialize_snow();
    };

    module.randomrange = function(min, max) {
        return Math.random() * (max - min) + min;
    }

    module.Snow = function(x, y, z, sine) {
        // Single paprticle of snow. z represents z-index, or how close snow is to foreground,
        // which effects both the size of the particle, as well as its luminance.
        // sine is in charge of drifting snow back and forth (sinusoidally)
        this.x = x;
        this.y = y;
        this.z = z;
        this.sine = sine;
        this.rand = module.randomrange(0.3, 1); // Extra randomness, unrelated to z-pos
    };

    module.new_snow = function(position){
        var y;
        var x = module.randomrange(0, module.width);
        var z = module.randomrange(0,1);
        var sine = module.randomrange(0, Math.PI * 2);
        if (position === 'top') {
            y = -10;
        } else {
            y = module.height + 10;
        }
        return new module.Snow(x, y, z, sine);
    };

    return module;
})(snow);

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