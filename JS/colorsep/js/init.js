var glitch = glitch || {};
glitch = (function(module) {
    module.canvas = document.getElementById('imagecanvas');
    module.ctx = module.canvas.getContext('2d');
    module.height = 0;
    module.width = 0;
    module.imagedata;
    module.red = [];
    module.green = [];
    module.blue = [];

    module.init_image = function (img){
        // Draw image to canvas, store image data, store
        // red/green/blue values separately
        module.ctx = module.canvas.getContext('2d');
        module.height = img.height;
        module.width = img.width;
        module.canvas.width = module.width;
        module.canvas.height = module.height;
        module.ctx.drawImage(img, 0, 0);
        module.imagedata = module.ctx.getImageData(0, 0, module.width, module.height);
        for (var x = 0; x < module.width; x++) {
            module.red[x] = [];
            module.green[x] = [];
            module.blue[x] = [];
            for (var y = 0; y < module.height; y++) {
                var index = (x + y * module.width) * 4;
                    module.red[x][y] = module.imagedata.data[index+0];
                    module.green[x][y] = module.imagedata.data[index+2];
                    module.blue[x][y] = module.imagedata.data[index+3];
            }
        }
    };
    return module;
})(glitch);