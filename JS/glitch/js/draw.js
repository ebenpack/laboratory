var glitch = glitch || {};

glitch = (function(module) {
    module.draw = {};
    module.draw_grid = function(units) {
        var glitch_canvas = module.glitch_canvas;
        var glitch_ctx = module.glitch_ctx;
        module.glitch_ctx.clearRect(0, 0, module.width, module.height);
        var x_scale = module.width / units;
        var y_scale = module.height / units;
        for (var i=0; i < module.width; i+=x_scale) {
            glitch_ctx.beginPath();
            glitch_ctx.moveTo((Math.round(i)+0.5), 0);
            glitch_ctx.lineTo((Math.round(i)+0.5), y_scale*units);
            glitch_ctx.stroke();
        }
        for (var i=0; i < module.height; i+=y_scale) {
            glitch_ctx.beginPath();
            glitch_ctx.moveTo(0, (Math.round(i)+0.5));
            glitch_ctx.lineTo(x_scale*units, (Math.round(i)+0.5));
            glitch_ctx.stroke();
        }
        // Draw right- and bottommost lines
        glitch_ctx.moveTo(module.width, 0);
        glitch_ctx.lineTo(module.width, module.height);
        glitch_ctx.stroke();
        glitch_ctx.moveTo(0, module.height);
        glitch_ctx.lineTo(module.width, module.height);
        glitch_ctx.stroke();
    }

    module.init_canvas = function(){
        // Hide dropzone, show canvases
        module.dropzone.style.display = "none";
        module.canvas.style.display = "";
        module.glitch_canvas.style.display = "";
        module.controls.style.display = "";
    }

    module.draw_square = function(x, y) {
        // Find square coordinates, given current scale
        var glitch_ctx = module.glitch_ctx;
        var x_scale = module.width / module.scale;
        var y_scale = module.height / module.scale;
        glitch_ctx.beginPath();
        glitch_ctx.rect(x + 1, y + 1, x_scale - 1, y_scale - 1);
        glitch_ctx.fillStyle = 'yellow';
        glitch_ctx.fill();
    }

    module.draw_jpg = function(jpg) {
        var img = new Image();
        img.src = jpg;
        module.ctx.drawImage(img, 0, 0, module.width, module.height);
    }

    module.draw_fragment = function(jpg, x, y, width, height) {
        var img = new Image();
        img.src = jpg;
        module.ctx.drawImage(img, x, y, width, height);
    }

    module.clear_square = function(x, y) {
        // Find square coordinates, given current scale
        var glitch_ctx = module.glitch_ctx;
        var x_scale = module.width / module.scale;
        var y_scale = module.height / module.scale;
        glitch_ctx.beginPath();
        glitch_ctx.rect(x, y, x_scale, y_scale);
        glitch_ctx.fillStyle = 'white';
        glitch_ctx.fill();
    }

    return module;
})(glitch);