var glitch = glitch || {};


// var strDataURI = module.canvas.toDataURL('image/jpeg', quality); // quality from 0.0 -1.0
// var img = new Image;
// img.onload = function(){
//   ctx.drawImage(img,0,0); // Or at whatever offset you like
// };
// img.src = strDataURI;


glitch = (function(module) {

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
                module.init_image(img);
            };
            img.src = file_uri;
            
        }
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
        var mouse_x = e.clientX;
        var mouse_y = e.clientY;
        // Register move
        var move_listener = function(e) {
            color_separation(e);
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

    function color_separation(e) {
        //var offset = parseInt(this.value, 10) * 10;\
        var offset_x = e.clientX - mouse_x;
        var offset_y = e.clientY - mouse_y;
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
        module.ctx.putImageData(module.imagedata,0,0);
    }

    }

    var dropzone = document.getElementById('dropzone');
    dropzone.addEventListener('dragover', dragover_handler);
    dropzone.addEventListener('drop', image_handler);
    dropzone.addEventListener('dragleave', dragleave_handler);

    canvas.addEventListener('mousedown', mousedown_listener);
    canvas.addEventListener('touchstart', mousedown_listener, false);

    return module;
})(glitch);