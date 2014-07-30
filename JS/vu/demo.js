(function(){
    var Mesh = wireframe.geometry.Mesh;
    var Scene = wireframe.engine.Scene;
    var Camera = wireframe.engine.Camera;
    var vertices = [];
    var faces = [];
    var ROWS = 20;
    var COLS = 16;
    // Build mesh
    for (var row = 0; row < ROWS; row++){
        for (var col = 0; col < COLS; col++){
            vertices.push([(col*20)-160, 0, (row*(-20))]);
        }
    }
    // Add one fewer edge per row than vertices in row
    var index = 0;
    for (var row = 0; row < ROWS; row++){
        for (var col = 1; col < COLS; col++){
            var index = col + (row * COLS);
            faces.push({"face": [index-1, index-1, index], "color": "green"});
        }
    }
    var mesh = Mesh.fromJSON({
        "name": "vu",
        "vertices": vertices,
        "faces": faces
    });

    var scene = new Scene({canvas_id: 'canvas', width:600, height:400});
    scene.camera.moveTo(0, -200, 400);
    scene.camera.lookDown(0.2);
    scene.addMesh(mesh);

    function moveCamera(E, H){
        if (scene.isKeyDown('w')) {
            scene.camera.moveForward(3);
        }
        if (scene.isKeyDown('s')) {
            scene.camera.moveBackward(3);
        }
        if (scene.isKeyDown('a')) {
            scene.camera.moveLeft(3);
        }
        if (scene.isKeyDown('d')) {
            scene.camera.moveRight(3);
        }
        if (scene.isKeyDown('r')) {
            scene.camera.moveUp(3);
        }
        if (scene.isKeyDown('f')) {
            scene.camera.moveDown(3);
        }
        if (scene.isKeyDown('t')) {
            scene.camera.lookUp(0.02);
        }
        if (scene.isKeyDown('g')) {
            scene.camera.lookDown(0.02);
        }
        if (scene.isKeyDown('q')) {
            scene.camera.turnLeft(0.02);
        }
        if (scene.isKeyDown('e')) {
            scene.camera.turnRight(0.02);
        }
        scene._needs_update = true;
    }
    scene.addListener('keydown', moveCamera);
    scene.toggleBackfaceCulling();

    var audio_node = document.getElementById('audio');
    var audioctx = new (window.AudioContext || window.webkitAudioContext)();
    var analyser = audioctx.createAnalyser();

    var canvas = document.getElementById('canvas');
    var canvas_ctx = canvas.getContext('2d');
    var dataArray, bufferLength;
    window.addEventListener('load', function(e) {
        var source = audioctx.createMediaElementSource(audio_node);
        source.connect(analyser);
        analyser.connect(audioctx.destination);

        analyser.fftSize = 128;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        analyser.getByteTimeDomainData(dataArray);
        update();
    }, false);

    var last_update = new Date();
    function draw() {
        var current_time = new Date();
        // Shift everything back one row.
        if (current_time - last_update > 100){
            // Take rows from back to front,
            // otherwise we would overwrite rows we haven't copied over yet.
            for (var row = ROWS - 1; row >= 1; row--){
                for (var col = 0; col < COLS; col++){
                    var i = col + ((row - 1) * COLS);
                    var i2 = col + (row * COLS);
                    mesh.vertices[i2].y = mesh.vertices[i].y
                }
            }
            last_update = current_time;
        }

        analyser.getByteFrequencyData(dataArray);

        var barHeight;
        for(var i = 0; i < COLS; i++) {
            barHeight = dataArray[i]/2;
            mesh.vertices[i].y = -barHeight;
        }

        scene.renderScene();
    }


    function update(){
        draw();
        requestAnimationFrame(update);
    }

})();