function mouse_handler (canvasid) {
    var canvas = document.getElementById(canvasid);
    // var graph_width = graph.length;
    // var graph_height = graph[0].length;
    // var canvas_width = canvas.width;
    // var canvas_height = canvas.height;
    // var px_per_node = Math.floor(canvas.width / graph_width);

    var moveListener = function(e) {
        mouse.x = e.hasOwnProperty('offsetX') ? e.offsetX : e.layerX;
        mouse.y = e.hasOwnProperty('offsetY') ? e.offsetY : e.layerY;
    };

    canvas.addEventListener('mousemove', moveListener);
    canvas.addEventListener('touchmove', moveListener);

}