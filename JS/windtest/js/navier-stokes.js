// shim layer with setTimeout fallback (Paul Irish)
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();


// Based on http://www.dgp.toronto.edu/people/stam/reality/Research/pdf/GDC03.pdf
var NavierStokes = function(settings){
    this.init(settings);
};

NavierStokes.prototype = {

        init : function(settings){
         var defaultSettings = {
                  resolution     : 64,
                  iterations     : 10,
                  fract          : 1/4,
                  diffusion      : 1,
                  gridmodify     : 0,
                  dt             : 0.1,
                  callbackUser : function(D, U, V, size){},
                  callbackDisplay : function(D, U, V, size){}
          };

          if (this.settings === undefined){
                this.settings = defaultSettings;
          }

          this._mergeRecursive(this.settings, settings);

          this.rows                 =    this.settings.resolution      + 2;
          this.arraySize            =   (this.settings.resolution+2)*(this.settings.resolution+2);


          this.U          = new Float32Array(this.arraySize);
          this.V          = new Float32Array(this.arraySize);
          this.D          = new Float32Array(this.arraySize);

          this.U_prev     = new Float32Array(this.arraySize);
          this.V_prev     = new Float32Array(this.arraySize);
          this.D_prev     = new Float32Array(this.arraySize);

          this.NullArray  = new Float32Array(this.arraySize);


          // Precalculate lookup table for 2D > 1D array.
          this.IX = new Array(this.rows);
          for (var i = 0; i < this.rows; i++){
              this.IX[i] = new Array(this.rows);
              for (var b = 0; b < this.rows; b++){
                  this.IX[i][b] = i+b*this.rows;
              }
          }
          // Init all Arrays.
          for (i = 0; i < this.arraySize; i++){
              this.D_prev[i] = this.U_prev[i] = this.V_prev[i] = this.D[i] = this.U[i] = this.V[i] = this.NullArray[i] = 0.0;
          }

          //Init some vars based on the Resolution settings:
          this.calculateSettings();
        },
        clear : function(){
            this.D.set(this.NullArray);
            this.U.set(this.NullArray);
            this.V.set(this.NullArray);
        },
        // Getter Setter
        getResolution : function(){
            return this.settings.resolution;
        },

        getSettings : function(){
            return this.settings;
        },

        update : function(){
             // Add user Action
            this.userAction();

            // Cals velosity & density
            this.vel_step  (this.U, this.V, this.U_prev, this.V_prev, this.settings.dt );
            this.dens_step (this.D, this.D_prev, this.U, this.V, this.settings.dt );

            this.settings.callbackDisplay(this.D, this.U, this.V, this.settings.resolution);
        },

        calculateSettings : function(){
            this.centerPos = (-0.5/this.settings.resolution) * (1 + this.settings.gridmodify);
            this.scale = this.settings.resolution * 0.5;
            this.dt0 = this.settings.dt * this.settings.resolution;
            this.p5 = this.settings.resolution + 0.5;
        },

        userAction : function (){
            this.D_prev.set(this.NullArray);
            this.U_prev.set(this.NullArray);
            this.V_prev.set(this.NullArray);
          
            this.settings.callbackUser(this.D_prev, this.U_prev, this.V_prev, this.settings.resolution);
        },
        vel_step : function (u, v, u0,  v0, dt ){
            var tmp;

            this.add_source(u, u0, dt );
            this.add_source(v, v0, dt );

            tmp = u0;
            u0 = u;
            u = tmp;
            this.diffuse ( 1, u, u0, dt );


            tmp = v0;
            v0 = v;
            v = tmp;
            this.diffuse ( 2, v, v0, dt );

            this.project(u, v, u0, v0);

            tmp = u0;
            u0 = u;
            u = tmp;

            tmp = v0;
            v0 = v;
            v = tmp;
            this.advect(1, u, u0, u0, v0, dt);
            this.advect(2, v, v0, u0, v0, dt);

            this.project(u, v, u0, v0 );
        },

        dens_step : function (x, x0, u, v,  dt){
            var tmp;
            this.add_source (x, x0, dt);
            //SWAP ( x0, x );
            this.diffuse (0, x0, x,  dt );
            //SWAP ( x0, x );
            this.advect ( 0, x, x0, u, v, dt );
        },

        add_source : function (x, s, dt){
            for (var i=0; i<this.arraySize ; i++ ){
                x[i] += dt * s[i];
            }
        },


        diffuse : function (b,  x,  x0,  dt){
            for (var i=1; i < this.arraySize;i++){
                x[i] = x0[i]*this.settings.diffusion;
            }
            this.set_bnd(b, x);
         },

        project : function ( u, v, p, div )  {
            var i, k,prevRow, thisRow, nextValue, nextRow, to, lastRow;
            for (i = 1 ; i <= this.settings.resolution; i++ ){
                prevRow   = this.IX[0][i-1];
                thisRow   = this.IX[0][i];
                nextRow   = this.IX[0][i+1];

                valueBefore  = thisRow - 1;
                valueNext    = thisRow + 1;

                to = this.settings.resolution + valueNext;
                for (k = valueNext; k < to; k++ ) {
                    p[k] = 0;
                    div[k] = (u[++valueNext] - u[++valueBefore] + v[++nextRow] - v[++prevRow]) * this.centerPos;
                }
            }

            this.set_bnd(0, div);
            this.set_bnd(0, p);

            for (k=0 ; k<this.settings.iterations; k++) {
                for (j=1 ; j<=this.settings.resolution; j++) {
                    lastRow = this.IX[0][j-1];
                    thisRow = this.IX[0][j];
                    nextRow = this.IX[0][j+1];
                    prevX = p[thisRow];
                    thisRow++;
                    for (i=1; i<=this.settings.resolution; i++){
                        p[thisRow] = prevX = (div[thisRow] + p[++lastRow] + p[++thisRow] + p[++nextRow] + prevX ) * this.settings.fract;
                    }
                }
                this.set_bnd(0, p);
            }

            for (j = 1; j <=  this.settings.resolution; j++ ) {
                lastRow =  this.IX[0][j-1];
                thisRow =  this.IX[0][j];
                nextRow =  this.IX[0][j+1];

                valueBefore  = thisRow - 1;
                valueNext    = thisRow + 1;

                for (i = 1; i <=  this.settings.resolution; i++) {
                    u[++thisRow] -= this.scale * (p[++valueNext] - p[++valueBefore]);
                    v[thisRow]   -= this.scale * (p[++nextRow]   - p[++lastRow]);
                }
            }
            this.set_bnd(1, u);
            this.set_bnd(2, v);
        },

        advect : function (b, d, d0, u, v, dt ){
            var to;
            for (var j = 1; j<= this.settings.resolution; j++) {
                var pos = j * this.rows;
                for (var k = 1; k <= this.settings.resolution; k++) {
                    var x = k - this.dt0 * u[++pos];
                    var y = j - this.dt0 * v[pos];

                    if (x < 0.5) x = 0.5
                    if (x > this.p5) x = this.p5;

                    var i0 = x | 0;
                    var i1 = i0 + 1;

                    if (y < 0.5) y = 0.5
                    if (y > this.p5) y = this.p5;

                    var j0 = y | 0;
                    var j1 = j0 + 1;
                    var s1 = x - i0;
                    var s0 = 1 - s1;
                    var t1 = y - j0;
                    var t0 = 1 - t1;
                    var toR1 = this.IX[0][j0];
                    var toR2 = this.IX[0][j1];
                    d[pos] = s0 * (t0 * d0[i0 + toR1] + t1 * d0[i0 + toR2]) + s1 * (t0 * d0[i1 + toR1] + t1 * d0[i1 + toR2]);
                }
            }
            this.set_bnd(b, d);
        },
        // Calculate Boundary's
        set_bnd : function (b, x ){
            var i, j;
            switch (b){
                case 1 :
                    for (i = 1; i <= this.settings.resolution; i++) {
                        x[i] =  x[i + this.rows];
                        x[this.IX[i][(this.settings.resolution+1)]] = x[this.IX[i][(this.settings.resolution)]];
                        x[this.IX[0][i]] = -x[this.IX[1][i]];
                        x[this.IX[(this.settings.resolution+1)][i]] = -x[this.IX[(this.settings.resolution)][i]];
                    }
                    break;
                case 2 :
                   for ( i = 1; i <= this.settings.resolution; i++) {
                        x[i] = -x[i + this.rows];
                        x[this.IX[i][(this.settings.resolution+1)]] = -x[this.IX[i][(this.settings.resolution)]];
                        x[this.IX[0][i]]                                            =  x[this.IX[1][i]];
                        x[this.IX[(this.settings.resolution+1)][i]] =  x[this.IX[(this.settings.resolution)][i]];
                    }
                    break;
                default :
                    for ( i = 1; i <= this.settings.resolution; i++) {
                        x[i] =  x[i + this.rows];
                        x[this.IX[i][(this.settings.resolution+1)]]       =   x[this.IX[i][(this.settings.resolution)]];
                        x[this.IX[0][i]]                                                        =   x[this.IX[1][i]];
                        x[this.IX[(this.settings.resolution+1)][i]]       =   x[this.IX[(this.settings.resolution)][i]];
                    }
            }
                        // Boundes of the Canvas
            var topPos                                    = this.IX[0][this.settings.resolution+1];
            x[0]                                            = (x[1] + x[this.rows]) / 2;
            x[topPos]                                       = (x[1 + topPos] + x[this.IX[this.settings.resolution][0]]) / 2;
            x[(this.settings.resolution+1)]           = (x[this.settings.resolution] + x[(this.settings.resolution + 1) + this.rows]) / 2;
            x[(this.settings.resolution+1)+topPos]    = (x[this.settings.resolution + topPos] + x[this.IX[this.settings.resolution+1][this.settings.resolution]]);

        },
        // Merge Settings.
         _mergeRecursive : function(obj1, obj2) {
              for (var p in obj2) {
                  if ( obj2[p].constructor==Object ) {
                    obj1[p] = this._mergeRecursive(obj1[p], obj2[p]);
                  } else {
                    obj1[p] = obj2[p];
                  }
              }
              return obj1;
        }
};


var Display = function(canvas){
                            this.colorFunctions = {  "BW"  : this.calcColorBW ,
                                                "Color": this.calcColor,
                                        "User" : this.calcUserColor};
                            this.currColorFunc = "BW";
                this.canvas = canvas;
                this.context = canvas.getContext("2d");
                this.supportImageData = !!this.context.getImageData;

                            this.colorUser = {
                  R : 0,
                  G : 255,
                  B : 0
                              }

};

Display.prototype = {

            init : function (res){
                this.calcResolution = res;
                this.imageData = null;
                this.showColors = false;
                            this.line = null;
            },

            density : function(D, U, V){
                var r,g,b, x, y, d;

                if (this.supportImageData){
                    // Get Image Data
                    if (this.imageData  === null){
                        this.imageData = this.context.getImageData(0, 0, this.calcResolution, this.calcResolution);
                    }


                    for (x = 0; x < this.calcResolution; x++) {
                        for (y = 0; y < this.calcResolution; y++){
                            var posC = (x + y * this.calcResolution) * 4;
                                  var pos = fluid.IX[x][y];

                            var cArray = this.colorFunctions[this.currColorFunc].call(this, D, U, V, pos);

                            this.imageData.data[posC]     = cArray[0]; // R
                            this.imageData.data[posC + 1] = cArray[1]; // G
                            this.imageData.data[posC + 2] = cArray[2]; // B
                            this.imageData.data[posC + 3] = 255; //A
                        }
                    }
                    this.context.putImageData(this.imageData, 0, 0);
                }else{
                    // Slow fallback for oldie
                    for (x = 0; x < this.calcResolution; x++) {
                        for (y = 0; y < this.calcResolution; y++) {
                            var pos = fluid.IX[x][y];
                            var c =(D[pos] / 2);
                            this.context.setFillColor(c , c, c , 1);
                            this.context.fillRect(x, y, 1, 1);
                        }
                    }
                }
              // Draw the line for creating an Emitter
              if (this.line != null){
                this.context.beginPath();
                            this.context.lineWidth = 1;
                this.context.strokeStyle  = "rgb(255,255,255)";
                this.context.moveTo(this.line[0][0],this.line[0][1]);
                this.context.lineTo(this.line[1][0],this.line[1][1]);
                    this.context.stroke();
              }
            },

            setColorFunction: function(colorFuncName){
              this.currColorFunc = "BW";
            },

            calcColorBW : function(D, U, V, pos){
                var bw = (D[pos] * 255 / 6) | 0;
                return [bw, bw, bw];
            },

            calcColor : function(D, U, V, pos){
                var r =  Math.abs((U[pos] * 1300 )   | 0);
                var b =  Math.abs((V[pos] * 1300 )   | 0);
                var g = (D[pos] * 255 / 6) | 0;

                return [r, g, b];
            },

           calcUserColor : function(D, U, V, pos){
                var r =  Math.abs((U[pos] *500* this.colorUser.R)   | 0);
                var g = (D[pos] *  this.colorUser.G) | 0;
                var b =  Math.abs((V[pos] *500* this.colorUser.B )   | 0);

                return [r, g, b];
            },

            drawLine : function (a0, a1, scale){
                    var l0 = [a0[0]*scale, a0[1]*scale];
                    var l1 = [a1[0]*scale, a1[1]*scale];

                    this.line = [l0, l1];
            },

            removeLine : function(){this.line = null},
  };



        var user = {
            displaySize : 500,
            canvas : null,
            canvasOffset : null,
            scale : 0,

            mouseStart: [],
            mouseEnd  : [],
            mouseLeftDown : false,
            mousePath : [],

            mouseRightDown : false,
            mouseRightStart : [],

            forceEmitters : [],

            insertedDensity : 50,

            init : function(canvas){
                this.canvas = $(canvas);

                this.canvasOffset = this.canvas.offset();

                var that = this;
                window.ontouchend = window.onmouseup   = function(e){that.handleInputEnd(e);};
                canvas.ontouchstart = canvas.onmousedown = function(e){that.handleInput(e);};
                canvas.ontouchmove = canvas.onmousemove = function(e){that.handleInputMove(e);};
                canvas.oncontextmenu = function(e){e.preventDefault();};
            },
            interact : function(D, U, V, size){
                    var x, y, pos, i ;

                    if (this.mouseLeftDown){
                            var dx =  this.mouseStart[0] -  this.mouseEnd[0];
                            var dy =  this.mouseStart[1] -  this.mouseEnd[1];

                            var mousePathLength = Math.sqrt(dx * dx + dy * dy) | 0;
                            mousePathLength = (mousePathLength < 1) ? 1 : mousePathLength;
                            for ( i = 0; i < mousePathLength; i++) {
                                x = (((this.mouseStart[0]  - (i / mousePathLength) * dx)) * this.scale) | 0;
                                y = (((this.mouseStart[1]  - (i / mousePathLength) * dy)) * this.scale) | 0;

                                pos = fluid.IX[x][y];

                                U[pos] = -dx / 6;
                                V[pos] = -dy / 6;
                                D[pos] = this.insertedDensity;
                             }
                            this.mouseStart[0] = this.mouseEnd[0];
                            this.mouseStart[1] = this.mouseEnd[1];
                    }

                    for (i = 0;i<this.forceEmitters.length;i++){
                                var posDir = this.forceEmitters[i];
                            var pos = fluid.IX[posDir[0]*this.scale | 0][posDir[1]*this.scale | 0];
                            U[pos] = posDir[2];
                            V[pos] = posDir[3];
                    }

            },
            initFluidWithResolution : function(){
                    fluid.init();
                  this.setCanvasSize(fluid.settings.resolution);
                  display.init(fluid.settings.resolution);
            },
            clearDisplay : function(){
                fluid.clear();
                this.forceEmitters = [];
            },

            setDisplay : function(e){
              var displaySize = parseInt(e);
              if (displaySize === 0){ // 1:1
                this.setDisplaySize(fluid.getSettings().resolution);
              }else{
                this.setDisplaySize(displaySize);
              }
            },
            setCanvasSize : function(size){
                this.canvas.attr("width", size);
                this.canvas.attr("height", size);
                this.calculateScale();
            },

                setDisplaySize : function(size){
                    $('#wrapper').width(size);
                    this.canvas.width(size);
                    this.canvas.height(size);
                this.calculateScale();
            },

            calculateScale : function(){
                this.scale = fluid.getResolution() / this.canvas.width();
                this.canvasOffset = this.canvas.offset();
            },

            handleInput : function(e){
                if (e.type === "touchstart"){
                    this.mouseLeftDown = true;
                    this.mouseEnd  = this.mouseStart = [e.pageX - this.canvasOffset.left, e.pageY - this.canvasOffset.top];
                }else if (e.button !== undefined){
                  var mPos = this.getMousePositon(e);
                  if (e.button == 0){
                      this.mouseLeftDown = true;
                        this.mouseEnd  = this.mouseStart =  mPos;
                    }else if (e.button == 2){
                        this.mouseRightDown  = true;
                        this.mouseRightStart = mPos;
                  }
                }
                e.preventDefault();
            },

            handleInputMove : function(e){
                var mPos = this.getMousePositon(e);
                if (this.mouseLeftDown){
                    if (e.type === "touchmove"){
                        this.mouseEnd = [e.pageX - this.canvasOffset.left, e.pageY - this.canvasOffset.top];
                    }else{
                        this.mouseEnd = mPos;
                    }
                }
                if (this.mouseRightDown){
                        display.drawLine(this.mouseRightStart, mPos, this.scale);
                }
            },
            handleInputEnd : function(e){
                    this.mouseLeftDown = false;
                if (this.mouseRightDown){
                    this.mouseRightDown = false;
                    var endPos = this.getMousePositon(e);
                    var x = this.mouseRightStart[0];
                    var y = this.mouseRightStart[1];

                    var dx = -(x - endPos[0]) / 10;
                    var dy = -(y - endPos[1]) / 10;
                        this.forceEmitters.push([x, y, dx, dy]);
                    display.removeLine();
                }
          },
          getMousePositon : function (e){
            var mouseX, mouseY;

            if(e.offsetX) {
                mouseX = e.offsetX;
                mouseY = e.offsetY;
            }
            else if(e.layerX) {
                mouseX = e.layerX;
                mouseY = e.layerY;
            }
            return [mouseX, mouseY];
          }
        };



        var canvas = document.getElementById("d");


                var display = new Display(canvas);
            var fluid = new NavierStokes({callbackDisplay : function(D, U, V, size){
                                           display.density(D, U, V, size);
                                         },callbackUser    : function(D, U, V, size){
                                           user.interact(D, U, V, size);
                                         }});


        user.init(canvas, fluid, display);
        user.initFluidWithResolution();

        // FPS Counter by Phrogz (http://stackoverflow.com/questions/4787431/check-fps-in-js)
        var filterStrength = 20;
        var frameTime = 0, lastLoop = new Date, thisLoop;
        var fpsOut = document.getElementById('fps');

        //Start Simulation
        function simulation(){
            window.requestAnimFrame(simulation);
            var thisFrameTime = (thisLoop=new Date) - lastLoop;
            frameTime+= (thisFrameTime - frameTime) / filterStrength;
            lastLoop = thisLoop;
            fluid.update();
        };

        // Run Simulation
        simulation();

        // Update FPS
        setInterval(function(){
          fpsOut.innerHTML = (1000/frameTime).toFixed(1) + " fps";
        },1000);

        // dat.GUI Settings
        var gui = new dat.GUI();
                var fluidFolder = gui.addFolder("Fluid");

        fluidFolder.add(fluid.settings, 'resolution', [64,128,256,512]).onFinishChange(function(e){
            fluid.settings.resolution = parseInt(e);
            user.initFluidWithResolution();
        });

        fluidFolder.add(fluid.settings, 'iterations', 1, 100).onFinishChange(function(e){
            fluid.settings.iterations = parseInt(e);
        });

                fluidFolder.add(fluid.settings, 'diffusion', 0.9000000, 1.1000000)

        fluidFolder.add(fluid.settings, 'dt', -1, 1).onChange(function(e){
                fluid.calculateSettings();
        });

        fluidFolder.add(user, 'insertedDensity', 0, 200).onFinishChange(function(e){
            user.insertedDensity = parseInt(e);
        });
                fluidFolder.open()

                var displayFolder = gui.addFolder("Display");

                displayFolder.add(user, 'displaySize', 0,900).onChange(function(e){
                user.setDisplay(e);
        });


        var currColorFunc = displayFolder.add(display, 'currColorFunc', {"Black & White" : "BW", "Color" : "Color", "User Defined" : "User"});

        var setColorFuncToUser = function(){
                display.currColorFunc = "User";
            currColorFunc.updateDisplay();
        }

                displayFolder.add(display.colorUser, 'R', 0, 50).name("R:").onChange(setColorFuncToUser);
                displayFolder.add(display.colorUser, 'G', 0, 1000).name("G:").onChange(setColorFuncToUser);
                displayFolder.add(display.colorUser, 'B', 0, 50).name("B:").onChange(setColorFuncToUser);
                displayFolder.open();


                gui.add(user, 'clearDisplay').name('Clear');




