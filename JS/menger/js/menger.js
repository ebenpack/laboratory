(function() {
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');

    function forEachCell(carpet, dimensions, callback){
        function helper(carpet, dimensions, callback, indices){
            if (dimensions === 0){
                callback(carpet, indices);
            } else {
                carpet.forEach(function(curr, idx){
                    helper(curr, dimensions-1, callback, indices.concat(idx));
                });
            }
        }
        return helper(carpet, dimensions, callback, []);
    }

    function renderCanvas2D(carpet, highlightX, highlightY, z) {
        var size = canvas.width;
        canvas.height = size;
        ctx.fillStyle = 'black';
        ctx.stokeStyle = 'white';
        ctx.lineWidth = 5;
        var length = carpet.length;
        var unitSize = size / length;
        highlightX = highlightX ? Math.floor((highlightX / size) * length) : Infinity;
        highlightY = highlightY ? Math.floor((highlightY / size) * length) : Infinity;
        forEachCell(carpet, 2, function(val, indices) {
            var x = indices[0];
            var y = indices[1];
            var highlight = ((x === highlightX) && (y === highlightY));
            if (val) {
                drawSquare(indices[0], indices[1], z, unitSize, highlight);
            }
        });
        function drawSquare(x, y, z, size, highlight) {
            if (highlight){
                ctx.fillStyle = 'red';
                drawCoords(x,y,z);
            } else {
                ctx.fillStyle = 'black';
            }
            ctx.fillRect((x * size)-1, (y * size)-1, (size-1), (size-1));
        }
        function drawCoords(x,y,z){
            var center = canvas.width / 2;
            ctx.textAlign = 'center';
            ctx.font = '48px serif';
            ctx.fillText(('X: ' + x + ', Y: ' + y + ', Z: ' + z), center, center, (canvas.width / 3));
        }
        function border(x, y, size){
            ctx.strokeRect(x, y, size, size);
        }
    }

    function make3D(depth) {
        var size = Math.pow(3, depth);
        var sponge = [];
        for (var x = 0; x < size; x++) {
            sponge.push([]);
            for (var y = 0; y < size; y++) {
                sponge[x].push([]);
                for (var z = 0; z < size; z++) {
                    sponge[x][y].push(true);
                }
            }
        }

        function helper(x, y, z, size, depth) {
            var len = size / 3;
            var count = 0;
            var emptyInside = [4, 10, 12, 13, 14, 16, 22];
            if (depth > 0) {
                for (var xi = x; xi < x + size; xi += len) {
                    for (var yi = y; yi < y + size; yi += len) {
                        for (var zi = z; zi < z + size; zi += len) {
                            if (emptyInside.indexOf(count) !== -1) {
                                for (var xj = xi; xj < xi + len; xj++) {
                                    for (var yj = yi; yj < yi + len; yj++) {
                                        for (var zj = zi; zj < zi + len; zj++) {
                                            sponge[xj][yj][zj] = false;
                                        }
                                    }
                                }
                            } else {
                                helper(xi, yi, zi, len, depth - 1);
                            }
                            count += 1;
                        }
                    }
                }
            }
        }
        helper(0, 0, 0, size, depth);
        return sponge;
    }
    var mengerSponge = make3D(3);

    function renderCanvas3DSlice(sponge, z, highlightX, highlightY) {
        window.requestAnimationFrame(function(){
            renderCanvas2D(sponge[z], highlightX, highlightY, z);
        });
    }

    function getBlockCount(sponge){
        var count = 0;
        for (var z = 0, len = sponge.length; z < len; z++){
            var carpetSlice = sponge[z];
            forEachCell(carpetSlice, 2, function(val, indices) {
                if (val) {
                    count++;
                }
            });
        }
        return count;
    }

    var levelNode = document.getElementById('level');
    var depthNode = document.getElementById('depth');
    var blockCount = document.getElementById('block-count');

    levelNode.addEventListener('input', function(e) {
        renderCanvas3DSlice(mengerSponge, parseInt(this.value, 10));
    });

    depthNode.addEventListener('change', function(e) {
        var size = parseInt(this.value, 10);
        if (size > 4){
            size=4;
        }
        mengerSponge = make3D(size);
        levelNode.max = Math.pow(3, size) - 1;
        renderCanvas3DSlice(mengerSponge, parseInt(levelNode.value, 10));
        blockCount.innerText = getBlockCount(mengerSponge);
    });

    canvas.addEventListener('mousemove', function(e){
        var mouseX, mouseY;
        if(e.offsetX) {
            mouseX = e.offsetX;
            mouseY = e.offsetY;
        }
        else if(e.layerX) {
            mouseX = e.layerX;
            mouseY = e.layerY;
        }
        renderCanvas3DSlice(mengerSponge, parseInt(levelNode.value, 10), mouseX, mouseY);
    });

    renderCanvas3DSlice(mengerSponge, 0);
    blockCount.innerText = getBlockCount(mengerSponge);
})();