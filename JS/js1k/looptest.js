var results = document.getElementById("results");

function test(x_pos, y_pos){
    var original_loop = [];
    var original_xy = [];
    var compacted_loop = [];
    var px_per_node = 6;
    var A = y_pos * px_per_node;
    var B = x_pos * px_per_node;
    var C = (y_pos+1) * px_per_node;
    var D = (x_pos + 1) * px_per_node;
    // ORIGINAL LOOP
    for (var ypx = y_pos * px_per_node; ypx < (y_pos+1) * px_per_node; ypx++) {
        for (var xpx = x_pos * px_per_node; xpx < (x_pos + 1) * px_per_node; xpx++) {
            var index = (xpx + ypx * 600) * 4;
            original_loop.push(index);
        }
    }
    // COMPACTED LOOP
    for (var x = 0; x < 36; x++) {
            var index = (((x%6)+x_pos * px_per_node) + (Math.floor(x/6)+ y_pos * px_per_node) * 600) * 4;
            compacted_loop.push(index);
    }
    var passed = false;
    // TEST EQUALITY
    if (original_loop.length !== compacted_loop.length) {
        results.innerHTML = "Loop lengths not equal. Halting.";
    } else {
        for (var x = 0; x < original_loop.length; x++) {
            passed=false;
            if (original_loop[x] !== compacted_loop[x]) {
                results.innerHTML = "Index mismatch at " + x + ". Index should have been " + original_loop[x] + ", received " + compacted_loop[x] + " instead. Halting.";
                break;
            }
        passed = true;
        }
    }
    if (passed) {
        results.innerHTML = "Looks okay!";
    }
}

test(20,30);