var snow = snow || {};

snow = (function(module){
    var ctx = module.ctx;
    
    module.draw = function(){
        module.ctx.clearRect(0, 0, module.width, module.height);
        for (var i = 0, len = module.snow_array.length; i < len; i++) {
            var particle = module.snow_array[i];
            ctx.fillStyle = "rgba(255, 255, 255," + (particle.z) +")";
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, (particle.z * (2 - 0.5) + 2 ),0,Math.PI*2,true);
            ctx.closePath();
            ctx.fill();
        }
    };

    return module;
})(snow);