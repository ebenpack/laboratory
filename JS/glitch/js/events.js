var glitch = glitch || {};

glitch = (function(module) {

    var canvas = module.canvas;
    var glitch_canvas = module.glitch_canvas;
    var glitch_ctx = module.glitch_ctx;
    var cell_x = 0;
    var cell_y = 0;

    function image_handler(e){
        e.stopPropagation();
        e.preventDefault();
        module.init_canvas();
        var reader = new FileReader();
        reader.onload = function(e){
            var img = new Image();
            img.onload = function(){
                module.original_image = img;
                module.init_image(img);
                module.update_scale();
            };
            img.src = e.target.result;
        };

        if (e.dataTransfer.files.length > 0){
            reader.readAsDataURL(e.dataTransfer.files[0]);
        } else {
            var file_uri = e.dataTransfer.getData("text/uri-list");
            var img = new Image();
            img.onload = function(){
                module.original_image = img;
                module.init_image(img);
                module.update_scale()
            };
            img.src = file_uri;
        }
    }

    function update_scale(e) {
        var scale = parseInt(this.value, 10);
        module.scale = scale;
        module.draw_grid(scale);
    }

    function dragleave_handler(e) {
        this.style.backgroundColor = "";
    }

    function dragover_handler(e) {
        e.stopPropagation(); // Stops some browsers from redirecting.
        e.preventDefault();
        this.style.backgroundColor = "#d3d3d3";
    }

    function cell_coords(that, e) {
        var bounding_rect = that.getBoundingClientRect();
        var x_pos = Math.floor(e.pageX - bounding_rect.left);
        var y_pos = Math.floor(e.pageY - bounding_rect.top);
        var x_scale = module.width / module.scale;
        var y_scale = module.height / module.scale;
        return {'x': Math.floor(x_pos / x_scale) * x_scale, 'y': Math.floor(y_pos / y_scale ) * y_scale};
    }

    function mousemove_handler(e) {
        var coords = cell_coords(this, e);
        if (coords.x !== cell_x || coords.y !== cell_y) {
            // Highlight square
            module.draw_grid(module.scale);
            module.draw_square(coords.x, coords.y);
        }
        // Update coordinates
        cell_x = coords.x;
        cell_y = coords.y;

    }

    function scrollaroo(e) {
        e.stopPropagation();
        e.preventDefault();
        var coords = cell_coords(this, e);
        var random_glithiness = Math.random() * 100;
        module.glitch(coords.x, coords.y, random_glithiness);
    }

    var dropzone = module.dropzone;
    dropzone.addEventListener('dragover', dragover_handler);
    dropzone.addEventListener('drop', image_handler);
    dropzone.addEventListener('dragleave', dragleave_handler);

    var scale_slider = document.getElementById('scale');
    scale_slider.addEventListener('input', update_scale)

    var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel";
    module.glitch_canvas.addEventListener('mousemove', mousemove_handler, false);
    module.glitch_canvas.addEventListener(mousewheelevt, scrollaroo, false);

    module.update_scale = update_scale.bind(scale_slider);
    return module;
})(glitch);