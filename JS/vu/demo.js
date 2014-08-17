(function(){

    // "Globals"
    var Scene = wireframe.engine.Scene;
    var scene = new Scene({canvas_id: 'canvas', width:600, height:400});
    var mesh;
    var current_audio;
    var ROWS = 20;
    var COLS = 16;

    (function initializeScene(){
        /************************
        ***  Wireframe setup  ***
        *************************/
        var Mesh = wireframe.geometry.Mesh;
        var Camera = wireframe.engine.Camera;
        var vertices = [];
        var faces = [];

        // Build mesh vertices
        for (var row = 0; row < ROWS; row++){
            for (var col = 0; col < COLS; col++){
                vertices.push([(col*20)-160, 0, (row*(-20))]);
            }
        }

        // Build mesh edges.
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
        mesh = Mesh.fromJSON({
            "name": "vu",
            "vertices": vertices,
            "faces": faces
        });

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
        }

        scene.addListener('keydown', moveCamera);
        scene.toggleBackfaceCulling();
    })();

    (function initializeAudio(){
        /************************
        ***     DOM setup     ***
        *************************/
        var canvas = document.getElementById('canvas');

        // ready indicates whether audio is loaded and ready to be played.
        var ready = document.createElement('div');
        ready.appendChild(document.createTextNode(""));
        var start_button = document.createElement('button');
        start_button.style.marginLeft = "10px";
        start_button.appendChild(document.createTextNode("Start"));
        ready.appendChild(start_button);
        ready.loading = function(){
            this.childNodes[0].textContent = "Audio loading...";
            this.style.color = 'red';
            this.childNodes[1].disabled = true;
        }
        ready.ready = function(){
            this.childNodes[0].textContent = "Ready!";
            this.style.color = 'green';
            this.childNodes[1].disabled = false;
        }
        ready.loading();
        if (canvas.nextSibling) {
          canvas.parentNode.insertBefore(ready, canvas.nextSibling);
        }
        else {
          canvas.parentNode.appendChild(ready);
        }

        /************************
        ***    Audio setup    ***
        *************************/

        var audioctx = new (window.AudioContext || window.webkitAudioContext)();
        var analyser = audioctx.createAnalyser();
        analyser.fftSize = 128;

        var dataArray = new Uint8Array(analyser.frequencyBinCount)
        var audio_node, javascript_node;
        // clicklistener function needs to be held onto so that the event
        // listener can be removed, when necessary.
        var clicklistener;
        var playing = false;

        function initAudio() {
            javascript_node = audioctx.createScriptProcessor(2048, 1, 1);
            javascript_node.connect(audioctx.destination);

            audio_node = audioctx.createBufferSource();
            audio_node.connect(analyser);
            analyser.connect(javascript_node);

            audio_node.connect(audioctx.destination);
        }

        function decodeAudio(buffer){
            current_audio = buffer;
            audioctx.decodeAudioData(buffer, function(buffer) {
                // Remove clicklistener to avoid adding multiple
                // event listeners
                start_button.removeEventListener('click', clicklistener);
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

        // Keep track of where in the audio track we are.
        var playtime = 0;
        var time_started;
        function playAudio(buffer){
            playing = true;
            time_started = new Date();
            audio_node.start(0, playtime);
        }
        function pauseAudio(){
            // Convert times from miliseconds to seconds
            playtime = playtime + ((new Date() - time_started)/1000);
            playing = false;
            audio_node.stop();
            // Since buffersource is one-time use, we need
            // to reinitialize if we want to play again after pausing
            initAudio();
            decodeAudio(current_audio);
        }

        function soundReady(buffer){
            ready.ready();
            clicklistener = function(e){
                if (playing){
                    this.textContent = "Start";
                    pauseAudio();
                } else {
                    this.textContent = "Stop";
                    audio_node.buffer = buffer;
                    playAudio(buffer);
                }
            }
            start_button.addEventListener('click', clicklistener);
        }

        function onError(e) {
            console.log(e);
        }

        function fileDrop(e){
            e.preventDefault();
            played = false;
            ready.loading();
            var files = e.dataTransfer.files;
            var reader = new FileReader();
        
            reader.onload = function(e) {
                var data = e.target.result;
                decodeAudio(data);
            }
            reader.readAsArrayBuffer(files[0]);
            
        }

        // Required for drag 'n' drop to work on canvas
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

        // Start off with default audio file.
        initAudio();
        XHRLoadSound("../../audio/piano-sonata-no13.ogg");
        window.requestAnimationFrame(update)
    })();

})();