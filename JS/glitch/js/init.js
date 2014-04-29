var glitch = glitch || {};
glitch = (function(module) {
    module.canvas = document.getElementById('imagecanvas');
    module.glitch_canvas = document.getElementById('glitchcanvas');
    module.buffer_canvas = document.getElementById('buffercanvas');
    module.controls = document.getElementById('controls');
    module.dropzone = document.getElementById('dropzone');
    module.ctx;
    module.glitch_ctx;
    module.buffer_ctx;
    module.height = 0;
    module.width = 0;
    module.x_offset = 0;
    module.y_offset = 0;
    module.scale;
    module.max_img_size = 300;
    module.original_image;
    module.current_image;
    module.imagedata;

    module.init_image = function (img){
        // Draw image to canvas, store image data, store
        // red/green/blue values separately
        // Scale down images over 400px
        max_img_size = module.max_img_size;
        if (img.height >= img.width && img.height > max_img_size) {
            var ratio = max_img_size / img.height;
            module.height = max_img_size;
            module.width = Math.round(img.width * ratio);
        } else if (img.width > max_img_size) {
            var ratio = max_img_size / img.width;
            module.width = max_img_size;
            module.height = Math.round(img.height * ratio);
        } else {
            module.width = img.width;
            module.height = img.height;
        }
        module.ctx = module.canvas.getContext('2d');
        module.canvas.width = module.width;
        module.canvas.height = module.height;
        module.glitch_canvas.width = module.width;
        module.glitch_canvas.height = module.height;
        module.buffer_canvas.width = module.width;
        module.buffer_canvas.height = module.height;
        module.ctx = module.canvas.getContext('2d');
        module.glitch_ctx = module.glitch_canvas.getContext('2d');
        module.buffer_ctx = module.buffer_canvas.getContext('2d');
        module.glitch_ctx.strokeStyle = "black";
        module.glitch_ctx.lineWidth = 1;
        module.ctx.drawImage(img, 0, 0, module.width, module.height);
        module.imagedata = module.ctx.getImageData(0, 0, module.width, module.height);
    };
    return module;
})(glitch);