(function(){
    var Mesh = wireframe.geometry.Mesh;
    var Scene = wireframe.engine.Scene;
    var Camera = wireframe.engine.Camera;
    var vertices = [];
    var faces = [];
    var ROWS = 20;
    var COLS = 16
    for (var row = 0; row < ROWS; row++){
        for (var col = 0; col < COLS; col++){
            vertices.push([(col*10)-80, 0, (row*(-10))]);
            var i = vertices.length;
            faces.push({"face": [i-1, i-1, i], "color": "green"});
        }
        vertices.push([(col*10)-80, 0, (row*(-10))]); // push one extra
    }
    var mesh = Mesh.fromJSON({
        "name": "fft",
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

        analyser.fftSize = 32;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);

        analyser.getByteTimeDomainData(dataArray);
        update();
    }, false);
    var WIDTH = canvas.width;
    var HEIGHT = canvas.height;
    var last_update = new Date();
    function draw() {
        var current_time = new Date();
        // Shift everything back a row.
        if (current_time - last_update > 100){
            for (var row = ROWS - 2; row >= 0; row--){
                for (var col = 0; col <= COLS; col++){
                    var i = (row*17) + col;
                    var i2 = ((row+1)*17) + col;
                    mesh.vertices[i2].y = mesh.vertices[i].y
                }
            }
            last_update = current_time;
        }
        analyser.getByteFrequencyData(dataArray);

        var barHeight;

        for(var i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i]/4;
            mesh.vertices[i].y = -barHeight;
        }

        scene.renderScene();
    }


    function update(){
        draw();
        requestAnimationFrame(update);
    }

})();
