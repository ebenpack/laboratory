var snow = snow || {};

snow = (function(module){

    module.move_snow = function(snow) {
        // Move up/down. Closer snow moves faster.
        snow.y += (snow.z * snow.rand * module.speed);
        // Move left/right. Update sinus. 
        snow.sine += (snow.z) % (0.12 * Math.floor(snow.z * (1 / snow.rand)));
        snow.x += (Math.sin(snow.sine) * snow.rand) * module.speed * 2;
    };


    module.update = function(){
        // Add new snow if snow_array is short of the maximum
        if (module.snow_array.length < module.maximum_particles && Math.random() < (module.density/100)) {
            var new_snow = module.new_snow('top');
            module.snow_array.push(new_snow)
        }
        var remove = []; // Keep track of off-screen particles for later removal
        var len = module.snow_array.length;
        // Move all particles and queue offscreen particles for removal
        for (var i = 0; i < len; i++) {
            var particle = module.snow_array[i];
            module.move_snow(particle);
            if (particle.y > module.height + 20 || particle.y < -20) {
                remove.push(i);
            }
        }
        // Remove offscreen particles
        remove.reverse();
        for (var i = 0, len = remove.length; i < len; i++) {
            module.snow_array.splice(remove[i], 1);
        }

        // Draw and schedule another frame
        module.draw();
        module.animation_id = requestAnimationFrame(module.update);
    };

    module.start = function(){
        module.update();
    };

    return module;
})(snow);

snow.init({});
snow.start();