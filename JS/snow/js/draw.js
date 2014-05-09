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

    var wind_canvas = document.getElementById('windcanvas');
    var wind_ctx = wind_canvas.getContext('2d');
    var directions = [{'x': 1, 'y': 0}, {'x': 0, 'y': -1}, {'x': -1, 'y': 0}, {'x': 0, 'y': 1}]; // ENWS
    module.draw_wind = function(){
        wind_ctx.clearRect(0, 0, module.width, module.height);
        for (var x = 0, xlen=module.wind_array.length; x < xlen; x++){
            for (var y = 0, ylen=module.wind_array[0].length; y < ylen; y++){
                var wind = module.wind_array[x][y];
                for (var i = 0; i < 4; i++){
                    if (wind.direction[i]) {
                        wind_ctx.strokeStyle = "red";
                        var NEWX = (x * module.block_size) + (directions[i].x * 5);
                        var NEWY = (y * module.block_size) + (directions[i].y * 5);
                        wind_ctx.beginPath();
                        wind_ctx.moveTo(x * module.block_size, y * module.block_size);
                        wind_ctx.lineTo(NEWX, NEWY);
                        wind_ctx.stroke();
                    }
                }
            }
        }
    };

    return module;
})(snow);