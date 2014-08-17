(function(){

    /************************
    ***  Wireframe setup  ***
    *************************/
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

    // Build fully connected mesh
    for (var row = 0; row < ROWS-1; row++){
        for (var col = 0; col < COLS-1; col++){
            var a = col + (row * COLS);
            var b = (col + 1) + (row * COLS);
            var d = (col +1)+ ((row+1) * COLS);
            var c = col + ((row +1)* COLS);
            faces.push({"face": [a, c, d], "color": "green"});
            faces.push({"face": [a, d, b], "color": "green"});
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

    var canvas = document.getElementById('canvas');
    var canvas_ctx = canvas.getContext('2d');

    // Indicates whether audio is loaded and ready to be played.
    var ready = document.createElement('div');
    ready.loading = function(){
        this.textContent = "Audio loading...";
        this.style.color = 'red';
    }
    ready.ready = function(){
        this.textContent = "Ready!";
        this.style.color = 'green';
    }
    ready.loading();
    if (canvas.nextSibling) {
      canvas.parentNode.insertBefore(ready, canvas.nextSibling);
    }
    else {
      canvas.parentNode.appendChild(ready);
    }
    canvas.parentNode.appendChild(ready);

    /************************
    ***    Audio setup    ***
    *************************/

    var audioctx = new (window.AudioContext || window.webkitAudioContext)();
    var analyser = audioctx.createAnalyser();

    var dataArray = new Uint8Array(analyser.frequencyBinCount)
    var audio_node;
    var analyser;
    var javascript_node;
    // clicklistener needs to be held onto so that the event
    // listener can be removed, when necessary.
    var clicklistener;

    initAudio();
    XHRLoadSound("../../audio/piano-sonata-no13.ogg");

    function initAudio() {
        javascript_node = audioctx.createScriptProcessor(2048, 1, 1);
        javascript_node.connect(audioctx.destination);

        analyser.fftSize = 128;

        audio_node = audioctx.createBufferSource();
        audio_node.connect(analyser);
        analyser.connect(javascript_node);

        audio_node.connect(audioctx.destination);
    }

    function decodeAudio(buffer){
        audioctx.decodeAudioData(buffer, function(buffer) {
            canvas.removeEventListener('click', clicklistener);
            soundReady(buffer);
        }, onError);
    }

    function XHRLoadSound(url) {
        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onload = function() {
            decodeAudio(request.response)
        }
        request.send();
    }

    var played = false;
    function playSound(buffer) {
        if (played){
            audio_node.stop();
            canvas.removeEventListener('click', clicklistener)
        } else {
            played = true;
            audio_node.start(0);
        }
    }

    function soundReady(buffer){
        ready.ready();
        clicklistener = function(){
            audio_node.buffer = buffer;
            playSound(buffer);
        }
        canvas.addEventListener('click', clicklistener);
    }

    function onError(e) {
        console.log(e);
    }

    function fileDrop(e){
        e.preventDefault();
        played = false;
        var files = e.dataTransfer.files;
        var reader = new FileReader();
    
        reader.onload = function(e) {
            var data = e.target.result;
            decodeAudio(data);
        }
        reader.readAsArrayBuffer(files[0]);
        
    }

    canvas.addEventListener("dragover", function (e) {
        e.preventDefault();
    }, false);
    canvas.addEventListener('drop', fileDrop);
    
    function draw(array) {
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

        var barHeight;
        for(var i = 0; i < COLS; i++) {
            barHeight = array[i]/2;
            mesh.vertices[i].y = -barHeight;
        }

        scene.renderScene();
    }

    var last_update = new Date();
    function update(){
        analyser.getByteFrequencyData(dataArray);

        draw(dataArray);
        window.requestAnimationFrame(update);
    }

    window.requestAnimationFrame(update)

})();