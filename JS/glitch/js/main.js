var glitch = glitch || {};

glitch = (function(module) {
    var base64_chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var base64byte_map = {};
    var bytebase64_map = {};
    for (var i = 0, len = base64_chars.length; i < len; i++) {
        base64byte_map[base64_chars[i]] = i;
        bytebase64_map[i] = base64_chars[i];
    }

    function base64_to_binary(n) {
        // Returns an padded binary string representation of the given base64 encoded character
        
        // Convert to binary and pad if necessary
        var padding = "00000000";
        var binary = base64byte_map[n].toString(2);
        var padding_length = 6 - binary.length;
        return padding.slice(0, padding_length) + binary;
    }

    function byte_to_binary(n) {
        var padding = "00000000";
        var binary = n.toString(2);
        var padding_length = 8 - binary.length;
        return padding.slice(0,padding_length) + binary;
    }

    function binary_to_base64(n) {
        var byte_val = parseInt(n, 2);
        return bytebase64_map[byte_val];
    }

    function base64_to_bytes(base64) {
        // Convert a base64 string to an array of bytes. Read four characters at a time,
        // and convert to three bytes.
        var bytes = [];
        base64 = base64.replace("=","");
        for (var i = 0, len = base64.length; i < len; i+=4) {
            if (i > len - 4) {
                var x = 10;
            } else {
                var binary = base64_to_binary(base64[i]) + base64_to_binary(base64[i+1]) + base64_to_binary(base64[i+2]) + base64_to_binary(base64[i+3]);
                bytes.push(parseInt(binary.slice(0,8), 2));
                bytes.push(parseInt(binary.slice(8,16), 2));
                bytes.push(parseInt(binary.slice(16,24), 2));

            }
        }
        return bytes;
    }

    function bytes_to_base64(bytes) {
        // Convert a an array of bytes to a base64 string. Read three bytes at a time,
        // and convert to four base64 encoded characters.
        var base64 = [];
        for (var i = 0, len = bytes.length; i < len; i+=3) {
            if (i > len - 3) {
                var x = 10;
            } else {

                var binary = byte_to_binary(bytes[i]) + byte_to_binary(bytes[i+1]) + byte_to_binary(bytes[i+2]);
                base64.push(binary_to_base64(binary.slice(0,6)));
                base64.push(binary_to_base64(binary.slice(6,12)));
                base64.push(binary_to_base64(binary.slice(12,18)));
                base64.push(binary_to_base64(binary.slice(18,24)));
            }
        }
        return base64.join('');
    }

    function jpeg_header_size(data) {
        // Return the size of the jpeg header for the diven base64 encoded image.
        // SOI = FFh D8h FFh E0h
        // EOI = EOI = FFh D9h
        for (var i = 10, len = data.length; i < len; i++) {
            if (data[i] == 255 && data[i+1] == 218) { // Find SOS (start of scan)
                return i + 2;
            }
        }
    }

    module.glitch = function(x, y) {
        var x_scale = module.width / module.scale;
        var y_scale = module.height / module.scale;

        // Convert original image fragment to base64 encoded JPG
        var image_fragment = module.ctx.getImageData(x, y, x_scale, y_scale);
        module.buffer_canvas.width = image_fragment.width;
        module.buffer_canvas.height = image_fragment.height;
        module.buffer_ctx.putImageData(image_fragment, 0, 0);
        var jpg = module.buffer_canvas.toDataURL('image/jpeg');

        // Glitch up
        var base64_image_data = base64_to_bytes(jpg.slice(23)); // remove 'data:image/jpeg;base64,'
        var stream_start = jpeg_header_size(base64_image_data);
        var image_stream = base64_image_data.slice(stream_start, - 2); // Remove header + EOI
        for (var i = 0, len = image_stream.length; i < len; i+=2) {
            if (Math.random() > 0.99) {
                image_stream[i] = Math.floor(image_stream[i] + Math.random()*2) % 256;
            }
        }

        var glitched_img = 'data:image/jpeg;base64,' + bytes_to_base64((base64_image_data.slice(0,stream_start).concat(image_stream)).concat([255, 217]));
        module.draw_fragment(glitched_img, x, y, x_scale, y_scale);
    };
    return module;
})(glitch);