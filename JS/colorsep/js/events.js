var colorsep = colorsep || {};

colorsep = (function(module) {

    var canvas = module.canvas;

    function image_handler(e){
        e.stopPropagation();
        e.preventDefault();
        // Hide dropzone, show canvas
        this.style.display = "none";
        canvas.style.display = "";
        controls.style.display = "";
        var reader = new FileReader();
        reader.onload = function(e){
            var img = new Image();
            img.onload = function(){
                module.original_image = img;
                module.init_image(img);
            };
            img.src = e.target.result;
        };

        if(e.dataTransfer.files.length > 0){
            reader.readAsDataURL(e.dataTransfer.files[0]);
        } else {
            var file_uri = e.dataTransfer.getData("text/uri-list");
            var img = new Image();
            img.onload = function(){
                module.original_image = img;
                module.init_image(img);
            };
            img.src = file_uri;
        }
    }

    function change_quality(e){
        var quality = this.value / 1000;
        //module.init_image(module.current_image);
        module.buffer_ctx.drawImage(module.original_image, 0, 0);
        var strDataURI = module.buffer_canvas.toDataURL('image/jpeg', quality); // quality from 0.0 -1.0
        var img = new Image;
        img.onload = function(){
            module.init_image(img);
            color_separation(0, 0, module.x_offset, module.y_offset)
        };
        img.src = strDataURI;
    }

    function color_separation(start_x, start_y, current_x, current_y) {
            var offset_x = current_x - start_x;
            var offset_y = current_y - start_y;
            module.x_offset = offset_x;
            module.y_offset = offset_y;
            var img;
            for (var x = 0; x < module.width; x++) {
                for (var y = 0; y < module.height; y++) {
                    var index = (x + y * module.width) * 4;
                    if (x + offset_x < 0 || x + offset_x >= module.width || y + offset_y < 0 || y + offset_y >= module.height ) {
                        module.imagedata.data[index+0] = 0; //RED
                    } else {
                        module.imagedata.data[index+0] = module.red[x + offset_x][y + offset_y];
                    }
                    if (x - offset_x < 0 || x - offset_x >= module.width || y - offset_y < 0 || y - offset_y >= module.height) {
                        module.imagedata.data[index+2] = 0;
                    } else {
                        module.imagedata.data[index+2] = module.green[x - offset_x][y - offset_y]; // GREEN
                    }
                    module.imagedata.data[index+3] = module.blue[x][y]; //Blue
                }
            }
            var strDataURI = module.canvas.toDataURL(); // quality from 0.0 -1.0
            var img = new Image;
            img.src = strDataURI
            module.current_image = img;
            module.ctx.putImageData(module.imagedata,0,0);
        }

    function dragleave_handler(e) {
        this.style.backgroundColor = "";
    }

    function dragover_handler(e) {
        e.stopPropagation(); // Stops some browsers from redirecting.
        e.preventDefault();
        this.style.backgroundColor = "#d3d3d3";
    }

    function mousedown_listener(e) {
        var mouse_x = e.clientX - module.x_offset;
        var mouse_y = e.clientY - module.y_offset;
        // Register move
        var move_listener = function(e) {
            color_separation(mouse_x, mouse_y, e.clientX, e.clientY);
        }
        // Remove mousemove listeners on mouseup
        var mouseup_listener = function(e) {
            canvas.removeEventListener('mousemove', move_listener, false);
            canvas.removeEventListener('mouseup', mouseup_listener, false);

            canvas.removeEventListener('touchmove', move_listener, false);
            document.body.removeEventListener('touchend', mouseup_listener, false);
        };

        canvas.addEventListener('mousemove', move_listener, false);
        canvas.addEventListener('mouseup', mouseup_listener, false);

        canvas.addEventListener('touchmove', move_listener, false);
        document.body.addEventListener('touchend', mouseup_listener, false);

    }

    var dropzone = document.getElementById('dropzone');
    dropzone.addEventListener('dragover', dragover_handler);
    dropzone.addEventListener('drop', image_handler);
    dropzone.addEventListener('dragleave', dragleave_handler);

    var quality_slider = document.getElementById('quality');
    quality_slider.addEventListener('input', change_quality);

    canvas.addEventListener('mousedown', mousedown_listener);
    canvas.addEventListener('touchstart', mousedown_listener, false);

    return module;
})(colorsep);