(function() {
    var canvas = document.getElementById('imagecanvas');
    var ctx = canvas.getContext('2d');
    var controls = document.getElementById('controls');
    var height = 0;
    var width = 0;
    var imagedata;
    var red = [];
    var green = [];
    var blue = [];

    function init_image(img){
        // Draw image to canvas, store image data, store
        // red/green/blue values separately
        ctx = canvas.getContext('2d');
        height = img.height;
        width = img.width;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0);
        imagedata = ctx.getImageData(0, 0, width,height);
        for (var x = 0; x < width; x++) {
            red[x] = [];
            green[x] = [];
            blue[x] = [];
            for (var y = 0; y < height; y++) {
                var index = (x + y * width) * 4;
                    red[x][y] = imagedata.data[index+0];
                    green[x][y] = imagedata.data[index+2];
                    blue[x][y] = imagedata.data[index+3];
            }
        }
    }

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
                init_image(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(e.dataTransfer.files[0]);
    }

    function dragleave_handler(e) {
        this.style.backgroundColor = "";
    }

    function dragover_handler(e) {
        e.stopPropagation(); // Stops some browsers from redirecting.
        e.preventDefault();
        this.style.backgroundColor = "#d3d3d3";
    }

    function color_separation(e) {
        var offset = parseInt(this.value, 10) * 10;
        var img;
        for (var x = 0; x < width; x++) {
            for (var y = 0; y < height; y++) {
                var index = (x + y * width) * 4;
                if (x + offset < 0 || x + offset >= width) {
                    imagedata.data[index+0] = 0; //RED
                } else {
                    imagedata.data[index+0] = red[x + offset][y];
                }
                if (x - offset < 0 || x - offset >= width) {
                    imagedata.data[index+2] = 0;
                } else {
                    imagedata.data[index+2] = green[x - offset][y]; // GREEN
                }
                imagedata.data[index+3] = blue[x][y]; //Blue
            }
        }
        ctx.putImageData(imagedata,0,0);
    }

    var dropzone = document.getElementById('dropzone');
    dropzone.addEventListener('dragover', dragover_handler);
    dropzone.addEventListener('drop', image_handler);
    dropzone.addEventListener('dragleave', dragleave_handler);

    var colorslide = document.getElementById('colorslide');
    colorslide.addEventListener('input', color_separation);
})();