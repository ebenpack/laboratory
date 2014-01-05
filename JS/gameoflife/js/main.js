function gameoflife(id, speed) {
    var canvas = document.getElementById(id);
    var board = [];
    var block_size = 15;
    var debug = true;
    var play = false;
    var intervalID;

    function Cell(x,y, alive) {
        // A single cell on the board.
        this.x = x; // X coordinate on canvas
        this.y = y; // Y coordinate on canvas
        this.alive = alive;
    }

    function init_board() {
        // Initializes a two-dimensional array of dead Cells.
        var x_size = Math.floor(canvas.width / block_size);
        var y_size = Math.floor(canvas.height / block_size);
        var new_board = [];
        for (var i = 0; i < x_size; i++) {
            var xpos = i * block_size;
            new_board[i] = [];
            for (var j = 0; j < y_size; j++) {
                var ypos = j * block_size;
                var new_cell = new Cell(
                    xpos, // X position
                    ypos, // Y position
                    0      // All cells are dead, initially.
                    );
                new_board[i][j] = new_cell;
            }
        }
        board = new_board;
        draw_board();
    }

    function update_board() {
        var board_width = board.length;
        var board_height = board[0].length;
        var new_board = [];
        // For each cell on the board.
        for (var x = 0; x < board_width; x++) {
            new_board[x] = [];
            for (var y = 0; y < board_height; y++) {
                var old_cell = board[x][y];
                var neighbours = 0;
                // Count neighbours
                for (var i = -1; i <= 1; i++) {
                    for (var j = -1; j <= 1; j++) {
                        var newx = x + i;
                        var newy = y + j;
                        if (i === 0 && j === 0) {
                            neighbours += 0;
                        } else {
                            if (newx < 0) {
                                newx = board_width + newx;
                            }
                            if (newy < 0){
                                newy = board_height + newy;
                            }
                            newx = newx % board_width;
                            newy = newy % board_height;
                            neighbours += board[newx][newy].alive;
                        }
                    }
                }
                // Apply rules for life and death.
                if (old_cell.alive === 1) {
                    if (neighbours === 2 || neighbours === 3) {
                        new_board[x][y] = new Cell(old_cell.x, old_cell.y, 1);
                    } else {
                        new_board[x][y] = new Cell(old_cell.x, old_cell.y, 0);
                    }
                } else {
                    if (neighbours === 3) {
                        new_board[x][y] = new Cell(old_cell.x, old_cell.y, 1);
                    } else {
                        new_board[x][y] = new Cell(old_cell.x, old_cell.y, 0);
                    }
                }
            }
        }
        board = new_board;
        draw_board();
    }

    function reset_board() {
        if (play) {
            clearInterval(intervalID);
            play = false;
            document.getElementById("start").innerHTML = "Start";
        }
        init_board();
    }

    function run_game() {
        if (!play) {
            intervalID = window.setInterval(function(){update_board();}, (500 - (speed / 0.75)));
            this.innerHTML = "Pause";
        } else {
            clearInterval(intervalID);
            this.innerHTML = "Start";
        }
        // Toggle play state.
        play = !play;
    }

    function draw_board() {
        if (canvas.getContext){
            var ctx = canvas.getContext('2d');
            // Reset canvas and redraw
            canvas.width = canvas.width;
            var row_length = board.length;
            var col_length = board[0].length;
            ctx.lineWidth = 2;
            ctx.strokeStyle = "grey";
            ctx.lineWidth = 0.4;
            ctx.fillStyle = "black";
            for (var i = 0; i < row_length; i++) {
                // Draw grid lines
                ctx.beginPath();
                ctx.moveTo(0, i * block_size);
                ctx.lineTo(canvas.width, i * block_size);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(i * block_size, 0);
                ctx.lineTo(i * block_size, canvas.height);
                ctx.stroke();
                for (var j = 0; j < col_length; j++) {
                    var cell = board[i][j];
                    // Draw if alive
                    if (cell.alive === 1) {
                        ctx.beginPath();
                        ctx.rect(cell.x,cell.y,block_size,block_size);
                        ctx.fill();
                        ctx.closePath();
                    }
                }
            }
        }
    }

    var button_handlers = function () {
        var start = document.getElementById("start");
        start.addEventListener("click", run_game, false);

        var reset = document.getElementById("reset");
        reset.addEventListener("click", reset_board, false);

    }();

    var mouse_handler = function() {
        var mousedownListener = function(event) {
            var board_width = board.length;
            var board_height = board[0].length;
            // var xpos = event.clientX;
            // var ypos = event.clientY;
            var xpos;
            var ypos;
            if (event.pageX || event.pageY) {
              xpos = event.pageX;
              ypos = event.pageY;
            }
            else {
              xpos = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
              ypos = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
            }
            xpos -= canvas.offsetLeft;
            ypos -= canvas.offsetTop;

            var board_x = Math.round(xpos / block_size);
            var board_y = Math.round(ypos / block_size);
            if (board_x >= board_width) {
                board_x = board_width - 1;
            }
            if (board_y >= board_height) {
                board_y = board_height - 1;
            }
            if (board_x < 0) {
                board_x = 0;
            }
            if (board_y < 0) {
                board_y = 0;
            }
            var cell = board[board_x][board_y];
            // On click, toggle cell life and redraw canvas.
            cell.alive = (cell.alive + 1) % 2;
            if (!play) {
                draw_board();
            }
        };
        canvas.addEventListener('mousedown', mousedownListener);
    }();
    
    init_board();
}

var init = function() {
    var id = 'gol';
    window.onload = function(){
        gameoflife(id, 1);
    };
}();
