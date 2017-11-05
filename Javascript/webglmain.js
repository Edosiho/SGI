
var gl;
var shaderProgram;

var lastTime = 0;
var mvMatrix = mat4.create();
var mvMatrixStack = [];
var pMatrix = mat4.create();

var pyramidVertexPositionBuffer;
var pyramidVertexColorBuffer;

var cubeVertexPositionBuffer;
var cubeVertexColorBuffer;
var cubeVertexIndexBuffer;

var sphereVertexPositionBuffer;
var sphereVertexNormalBuffer;
var sphereVertexTextureCoordBuffer;
var sphereVertexIndexBuffer;



var crateTexture;
var pyramidTexture;
var sphereTexture;
var rPyramid = 0;
var rCube = 0;
var rSphere =0;


//HTML Values
var figuresLen = 3 // Amount of figures on screen
var currFigure =0;
var currPaint = 0;
var camera=0;
var rotX = 0; 
var rotY= 0;
var rotZ = 0;
var zoom =30;
var zoomOrtho =10;
var figR=1;
var figG=0;
var figB=0;
var fringe=30;
var scale =1;

var rotMatrix = [];
var transMatrix = [];
var escMatrix = [];

var textureArrays = [];
var appliedTextures = [];

var currentlyPressedKeys = {};
function handleKeyDown(event) {
    currentlyPressedKeys[event.keyCode] = true;
}


function handleKeyUp(event) {
    currentlyPressedKeys[event.keyCode] = false;
}



function mvPushMatrix() {
    var copy = mat4.create();
    mat4.set(mvMatrix, copy);
    mvMatrixStack.push(copy);
  }

  function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
  }

function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

function initMatrices(){
	var xPos = -3;
	for (var i = 0; i <figuresLen ; i++) {
			rotMatrix.push({x:0,y:0,z:0}) //Rotation Matrix
            
      var pos = {x:xPos,y:0,z:-10}; // Translation Matrix
      transMatrix.push(pos);
      xPos += 3;

      escMatrix.push(1);

  }
}



function initShaders() {
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert("Shader Status: Beyond Repair");
    }

 	gl.useProgram(shaderProgram);

 	shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
    shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);


    shaderProgram.uPaintTypeUniform = gl.getUniformLocation(shaderProgram, "uPaintType");  
    shaderProgram.uLine = gl.getUniformLocation(shaderProgram, "uLine");  
    shaderProgram.vertexColorUniform = gl.getUniformLocation(shaderProgram, "uVertexColor");
    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.samplerUniform = gl.getUniformLocation(shaderProgram, "uSampler");
}

function getShader(gl, id) {
      var shaderScript = document.getElementById(id);
      if (!shaderScript) {
          return null;
      }

      var str = "";
      var k = shaderScript.firstChild;
      while (k) {
          if (k.nodeType == 3)
              str += k.textContent;
          k = k.nextSibling;
      }

      var shader;
      if (shaderScript.type == "x-shader/x-fragment") {
          shader = gl.createShader(gl.FRAGMENT_SHADER);
      } else if (shaderScript.type == "x-shader/x-vertex") {
          shader = gl.createShader(gl.VERTEX_SHADER);
      } else {
          return null;
      }

      gl.shaderSource(shader, str);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          alert(gl.getShaderInfoLog(shader));
          return null;
      }

      return shader;
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

function initGL(canvas) {	
	try {
	  gl = canvas.getContext("experimental-webgl");
	  gl.viewportWidth = canvas.width;
	  gl.viewportHeight = canvas.height;
	} catch(e) {
	}
	if (!gl) {
	  alert("Could not initialise WebGL,reconsider changing toaster");
	}
}

function updateValues(){
	var radios = document.getElementsByName('figure');
    for (var i = 0, length = radios.length; i < length; i++) {
        if (radios[i].checked) {
            if (currFigure != i){
                figureChanged = true;
            	currFigure = i;
            	break;
           	}
        }
    }
  	if( document.getElementById('rotX').checked != rotX) rotX = !rotX;
  	if( document.getElementById('rotY').checked != rotY) rotY = !rotY;
  	if( document.getElementById('rotZ').checked != rotZ) rotZ = !rotZ;

  	var xTemp =  +rotX;
  	var yTemp = +rotY;
  	var zTemp = +rotZ;

  	rotMatrix[currFigure].x =xTemp;
  	rotMatrix[currFigure].y =yTemp;
  	rotMatrix[currFigure].z =zTemp;

  	radios = document.getElementsByName("paint");      
    for (var i = 0, length = radios.length; i < length; i++) {
        if (radios[i].checked) {
            currPaint = i;
            break;
        }
    }
    radios = document.getElementsByName("camera");  
    for (var i = 0, length = radios.length; i < length; i++) {
        if (radios[i].checked) {
            if (i != camera){
            	camera = i;
                break;
            }    
        }
   	}

    fringe = document.getElementById("sliderLines").value;
    fringe = parseInt(fringe);

    scale = document.getElementById("sliderScale").value;
    scale = parseFloat(scale);
    escMatrix[currFigure] = scale;


    //GET COLOR
    var colorHex = document.getElementById("color_value").value;
    var rr = colorHex[1]+colorHex[2];
    var gg = colorHex[3]+colorHex[4];
    var bb = colorHex[5]+colorHex[6]; 
    
    
    figR = parseFloat(parseInt(rr, 16)/255);
    figG = parseFloat(parseInt(gg, 16)/255);
    figB = parseFloat(parseInt(bb, 16)/255);

    //var audio =document.getElementById('audio');
    //if (!audio.paused && !audio.ended && 0 < audio.currentTime) console.log(audio.paused);
	

}
function handleKeys(){
	if (currentlyPressedKeys[65])
		transMatrix[currFigure].x =transMatrix[currFigure].x - 0.3; // A
		
	if (currentlyPressedKeys[68])  transMatrix[currFigure].x =transMatrix[currFigure].x + 0.3; // D

	if (currentlyPressedKeys[87])  transMatrix[currFigure].y =transMatrix[currFigure].y +0.3;// W
	if (currentlyPressedKeys[83])  transMatrix[currFigure].y =transMatrix[currFigure].y - 0.3; // S
	if (currentlyPressedKeys[90]){ //Z
		if(camera==0)zoom += 2.5;
		if(camera==1)zoomOrtho +=1;
	}
	if (currentlyPressedKeys[88]){ //X
		if(camera==0)zoom -= 2.5;
		if(camera==1)zoomOrtho -=1;

	}

            
    
}

function drawScene(){
	handleKeys();
	updateValues();
	gl.uniform1i(shaderProgram.uLine, fringe);
	gl.uniform1i(shaderProgram.uPaintTypeUniform, currPaint);
	var tempR =parseFloat(figR);
	var tempG =parseFloat(figG);
	var tempB =  parseFloat(figB);
	gl.uniform3f(shaderProgram.vertexColorUniform,tempR,tempG,tempB);


	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(camera ==0)    mat4.perspective(zoom, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
    else mat4.ortho(-zoomOrtho,zoomOrtho,-zoomOrtho,zoomOrtho, 0.1, 100, pMatrix);

    mat4.identity(mvMatrix);

    //Pyramid
    
    mvPushMatrix();
    mat4.translate(mvMatrix, [transMatrix[0].x, transMatrix[0].y, transMatrix[0].z]);
    mat4.rotate(mvMatrix, degToRad(rPyramid), [rotMatrix[0].x, rotMatrix[0].y, rotMatrix[0].z]);
    mat4.scale(mvMatrix,[escMatrix[0],escMatrix[0],escMatrix[0]]);

    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, pyramidVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);


    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexTextureCoordBuffer);
	  gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, pyramidVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, appliedTextures[0]);
    gl.uniform1i(shaderProgram.samplerUniform, 0);
    //gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);
    //gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, pyramidVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, pyramidVertexPositionBuffer.numItems);

    mvPopMatrix();

    //Cube
    

    mvPushMatrix();
    mat4.translate(mvMatrix, [transMatrix[1].x, transMatrix[1].y, transMatrix[1].z]);
    mat4.rotate(mvMatrix, degToRad(rCube), [rotMatrix[1].x, rotMatrix[1].y, rotMatrix[1].z]);
    mat4.scale(mvMatrix,[escMatrix[1],escMatrix[1],escMatrix[1]]);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    /*
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, cubeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);
	*/
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
	gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);
	gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, appliedTextures[1]);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    mvPopMatrix();


    //Spbere
     mvPushMatrix();
    //mat4.rotate(mvMatrix, degToRad(sphereAngle), [0, 1, 0]);
    //mat4.translate(mvMatrix, [5, 0, 0]);
    mat4.translate(mvMatrix, [transMatrix[2].x, transMatrix[2].y, transMatrix[2].z]);
    mat4.rotate(mvMatrix, degToRad(rSphere), [rotMatrix[2].x, rotMatrix[2].y, rotMatrix[2].z]);
    mat4.scale(mvMatrix,[escMatrix[2],escMatrix[2],escMatrix[2]]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, appliedTextures[2]);
    gl.uniform1i(shaderProgram.samplerUniform, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, sphereVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexTextureCoordBuffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, sphereVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, sphereVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, sphereVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    mvPopMatrix();


}
function initBuffers(){
	pyramidVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexPositionBuffer);
    var vertices = [
        // Front face
         0.0,  1.0,  0.0,
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
        // Right face
         0.0,  1.0,  0.0,
         1.0, -1.0,  1.0,
         1.0, -1.0, -1.0,
        // Back face
         0.0,  1.0,  0.0,
         1.0, -1.0, -1.0,
        -1.0, -1.0, -1.0,
        // Left face
         0.0,  1.0,  0.0,
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    pyramidVertexPositionBuffer.itemSize = 3;
    pyramidVertexPositionBuffer.numItems = 12;

    pyramidVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexColorBuffer);

    pyramidVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pyramidVertexTextureCoordBuffer);
    var textureCoords = [
        // Front face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

        // Back face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,

        // Right face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,

        // Left face
        0.0, 0.0,
        1.0, 0.0,
        0.0, 1.0,
        // Bottom face1
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        // Bottom face2
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0

        
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    pyramidVertexTextureCoordBuffer.itemSize = 2;
    pyramidVertexTextureCoordBuffer.numItems = 18;

   //CUBE
   cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    vertices = [
      // Front face
      -1.0, -1.0,  1.0,
       1.0, -1.0,  1.0,
       1.0,  1.0,  1.0,
      -1.0,  1.0,  1.0,

      // Back face
      -1.0, -1.0, -1.0,
      -1.0,  1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0, -1.0, -1.0,

      // Top face
      -1.0,  1.0, -1.0,
      -1.0,  1.0,  1.0,
       1.0,  1.0,  1.0,
       1.0,  1.0, -1.0,

      // Bottom face
      -1.0, -1.0, -1.0,
       1.0, -1.0, -1.0,
       1.0, -1.0,  1.0,
      -1.0, -1.0,  1.0,

      // Right face
       1.0, -1.0, -1.0,
       1.0,  1.0, -1.0,
       1.0,  1.0,  1.0,
       1.0, -1.0,  1.0,

      // Left face
      -1.0, -1.0, -1.0,
      -1.0, -1.0,  1.0,
      -1.0,  1.0,  1.0,
      -1.0,  1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numItems = 24;

    cubeVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
    

    cubeVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    var textureCoords = [
      // Front face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,

      // Back face
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,

      // Top face
      0.0, 1.0,
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,

      // Bottom face
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,
      1.0, 0.0,

      // Right face
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
      0.0, 0.0,

      // Left face
      0.0, 0.0,
      1.0, 0.0,
      1.0, 1.0,
      0.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    cubeVertexTextureCoordBuffer.itemSize = 2;
    cubeVertexTextureCoordBuffer.numItems = 24;

    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    var cubeVertexIndices = [
      0, 1, 2,      0, 2, 3,    // Front face
      4, 5, 6,      4, 6, 7,    // Back face
      8, 9, 10,     8, 10, 11,  // Top face
      12, 13, 14,   12, 14, 15, // Bottom face
      16, 17, 18,   16, 18, 19, // Right face
      20, 21, 22,   20, 22, 23  // Left face
    ]
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    cubeVertexIndexBuffer.itemSize = 1;
    cubeVertexIndexBuffer.numItems = 36;



    //ESFERA
    var latitudeBands = 30;
    var longitudeBands = 30;
    var radius = 2;

    var vertexPositionData = [];
    var normalData = [];
    var textureCoordData = [];
    for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
        var theta = latNumber * Math.PI / latitudeBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);

        for (var longNumber=0; longNumber <= longitudeBands; longNumber++) {
            var phi = longNumber * 2 * Math.PI / longitudeBands;
            var sinPhi = Math.sin(phi);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1 - (longNumber / longitudeBands);
            var v = 1 - (latNumber / latitudeBands);

            normalData.push(x);
            normalData.push(y);
            normalData.push(z);
            textureCoordData.push(u);
            textureCoordData.push(v);
            vertexPositionData.push(radius * x);
            vertexPositionData.push(radius * y);
            vertexPositionData.push(radius * z);
        }
    }

    var indexData = [];
    for (var latNumber=0; latNumber < latitudeBands; latNumber++) {
        for (var longNumber=0; longNumber < longitudeBands; longNumber++) {
            var first = (latNumber * (longitudeBands + 1)) + longNumber;
            var second = first + longitudeBands + 1;
            indexData.push(first);
            indexData.push(second);
            indexData.push(first + 1);

            indexData.push(second);
            indexData.push(second + 1);
            indexData.push(first + 1);
        }
    }

    sphereVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
    sphereVertexNormalBuffer.itemSize = 3;
    sphereVertexNormalBuffer.numItems = normalData.length / 3;

    sphereVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexTextureCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
    sphereVertexTextureCoordBuffer.itemSize = 2;
    sphereVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

    sphereVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sphereVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
    sphereVertexPositionBuffer.itemSize = 3;
    sphereVertexPositionBuffer.numItems = vertexPositionData.length / 3;

    sphereVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sphereVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STREAM_DRAW);
    sphereVertexIndexBuffer.itemSize = 1;
    sphereVertexIndexBuffer.numItems = indexData.length;
        

    
  
}
function animate() {
    var timeNow = new Date().getTime();
    if (lastTime != 0) {
      var elapsed = timeNow - lastTime;
      rPyramid += (90 * elapsed) / 1000.0;
      rCube += (75 * elapsed) / 1000.0;
      rSphere += (60 * elapsed) / 1000.0;
    }
    lastTime = timeNow;
}
function tick(){
	requestAnimFrame(tick);
	drawScene();
    animate();
}
function handleLoadedTexture(texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
}
function setTexture(value){
	appliedTextures[currFigure] = textureArrays[value];
}
function initTextures(){
	crateTexture= gl.createTexture();
    crateTexture.image = new Image();
    crateTexture.image.onload = function() {
      handleLoadedTexture(crateTexture)
    }
    crateTexture.image.src = "crate.jpg";

    pyramidTexture= gl.createTexture();
    pyramidTexture.image = new Image();
    pyramidTexture.image.onload = function() {
      handleLoadedTexture(pyramidTexture)
    }
    pyramidTexture.image.src = "pyramid.png";

    sphereTexture =gl.createTexture();
    sphereTexture.image = new Image();
    sphereTexture.image.onload = function() {
      handleLoadedTexture(sphereTexture)
    }
    sphereTexture.image.src = "death_star.jpg";

    textureArrays.push(pyramidTexture);
    textureArrays.push(crateTexture);
    textureArrays.push(sphereTexture);
    //sets the default textures
    appliedTextures[0] = textureArrays[0];
    appliedTextures[1] = textureArrays[1];
    appliedTextures[2] = textureArrays[2];

}
function webGLStart() {
    var canvas = document.getElementById("webgl-canvas");
    initGL(canvas);
    initShaders();
    initBuffers();
    initTextures();
    initMatrices()

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.enable(gl.DEPTH_TEST);
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    tick();
}


//Pure Javascript CODE
function allowDrop(ev) {
          ev.preventDefault();
      }

function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
	ev.preventDefault();
	var data = ev.dataTransfer.getData("text");

	var temp = ev.target.id;
	temp = data.slice(data.length-1)

	ev.target.appendChild(document.getElementById(data).cloneNode(true));

	setTexture(temp); //metodo que cambia la textura de la figura
	ev.preventDefault();

}
