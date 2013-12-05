//Attempt 2 at a working webgl implementation

function webGLEntry(/*string*/canvasID)
{
	initGL(canvasID);
	loadObjectFile();
	initShaders();
	//loadScene();
	loadTexture();
	initMatrices();
	//pause a bit to let the texture load 
	
	document.getElementById(canvasID).onmousedown = mouseDownEvent;
	document.onmouseup = mouseUpEvent;
	document.onmousemove = mouseMoveEvent;
	document.getElementById(canvasID).onmousewheel = mouseScrollEvent;
	var marker = 0;
}

var gl;

function initGL(/*string*/canvasID)
{
    var canvas = document.getElementById(canvasID);
    
    try
    {
        //try the experimental if the normal isn't working
		gl = canvas.getContext("webgl");
		if(!gl)
			gl = canvas.getContext("experimental-webgl");
            
        gl.vpWidth = canvas.width;
        gl.vpHeight = canvas.height;
    }
    catch(err)
    {
        
    }
    
    if(!gl)
        alert("webGL could not be initialized.");
    else
    {
        //housekeeping init functions
		gl.clearColor(0.0,0.0,0.0,1.0); //base color = black
		gl.enable(gl.DEPTH_TEST);
    }
}

var vertShaderSrc =
//vertex position, textur coord, and normals
"attribute vec3 VertexPosition;" +
"attribute vec2 VertexTexture;"+
"attribute vec3 VertexNormal;"+

//interpol values passed out to frag shader
"varying highp vec2 textureCoord;"+
"varying highp vec3 lighting;"+

//uniform transform matrices
"uniform mat4 MVMatrix;"+
"uniform mat4 PMatrix;"+
"uniform mat3 NMatrix;"+

//light variables
"uniform highp vec3 ambLight;"+
"uniform highp vec3 dirDiffuseColor;"+
"uniform highp vec3 dirLightVector;"+ //must be normalized

"void main(void) {"+
	//calc position of vertex
    "gl_Position = PMatrix * MVMatrix * vec4(VertexPosition, 1.0);"+
	//pass along texture coord
	"textureCoord = VertexTexture;"+
	
	//normalize our normal
	"highp vec3 transformedNormal = normalize(NMatrix * VertexNormal);"+
	
	//calc the angle of incidence, alter the diffuse color with it, and add the amblight to that
	"highp float aOfIncidence = max(dot(transformedNormal,dirLightVector),0.0);"+
	"lighting = (1.5*abs(vec3(gl_Position.xy,gl_Position.z-5.0)))/20.0 + (dirDiffuseColor * aOfIncidence);"+
"}";

var fragShaderSrc = 
"varying highp vec2 textureCoord;"+
"varying highp vec3 lighting;"+
"uniform sampler2D sampler;"+
"void main(void) {"+
	"highp vec4 texelColor = texture2D(sampler, textureCoord);"+
    "gl_FragColor = vec4(texelColor.rgb * lighting, texelColor.a);"+	
"}";

var shaderProgram;

function initShaders()
{
    //create shaders
    var vShader = gl.createShader(gl.VERTEX_SHADER);
    var fShader = gl.createShader(gl.FRAGMENT_SHADER);
    
    //set shader sources
    gl.shaderSource(vShader, vertShaderSrc);
    gl.shaderSource(fShader, fragShaderSrc);
    
    //compile shaders
    gl.compileShader(vShader);
    gl.compileShader(fShader);
    
    //Check for compile errors
    if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) 
    {
            alert("vShader error: " + gl.getShaderInfoLog(vShader));
            vShader = null;
    }
    if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) 
    {
            alert("fShader error: " + gl.getShaderInfoLog(fShader));
            fShader = null;
    }
    
    //create program - attach compiled shaders - link shaders
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vShader);
    gl.attachShader(shaderProgram, fShader);
    gl.linkProgram(shaderProgram);

    //check linker errors
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) 
    {
        alert("Could not initialize shaders.");
    }
    
    //set active program
    gl.useProgram(shaderProgram);
    
    //save our attribute positions
    shaderProgram.vertexAttribPosition = gl.getAttribLocation(shaderProgram, "VertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexAttribPosition);
    
    shaderProgram.textureAttribPosition = gl.getAttribLocation(shaderProgram, "VertexTexture");
    gl.enableVertexAttribArray(shaderProgram.textureAttribPosition);
	
	shaderProgram.normalAttribPosition = gl.getAttribLocation(shaderProgram, "VertexNormal");
	gl.enableVertexAttribArray(shaderProgram.normalAttribPosition);
    
    //save our uniform positions
    shaderProgram.pMatrixPosition = gl.getUniformLocation(shaderProgram, "PMatrix");
    shaderProgram.mvMatrixPosition = gl.getUniformLocation(shaderProgram, "MVMatrix");
	shaderProgram.texSamplerPosition = gl.getUniformLocation(shaderProgram, "sampler");
	shaderProgram.normalMatrixPosition = gl.getUniformLocation(shaderProgram, "NMatrix");
	shaderProgram.dirLightPosition = gl.getUniformLocation(shaderProgram, "dirLightVector");
	shaderProgram.dirDiffusePosition = gl.getUniformLocation(shaderProgram, "dirDiffuseColor");
	shaderProgram.ambLightPosition = gl.getUniformLocation(shaderProgram, "ambLight");
}

var /*json 3D object*/ objectData;
function loadObjectFile()
{
	var request = new XMLHttpRequest();
	request.open("GET", "squarepillar.json");
	request.onreadystatechange = function()
	{
		if(request.readyState == 4)
		{
			objectData = JSON.parse(request.responseText);
			loadScene();
		}
	}
	request.send();
}
 
var /*float array*/	vertexBuffer;
var /*float array*/	textureBuffer;
var /*float array*/	normalBuffer;
var /*int array*/	indexBuffer;

function loadScene()
{
	var vertexData = objectData.vertices;
	var textureData = objectData.texCoords;
	var vertexNormals = objectData.normals;
	var vertexIndices = objectData.elements; 
	objectData.numElements = objectData.elements.length;


    //create, bind, and load color buffer
    textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureData), gl.STATIC_DRAW);
    
    //create, bind, and load vertex buffer
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexData), gl.STATIC_DRAW);
	
	//create, bind, and load normal buffer
	normalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
	
	//create, bind, and load index buffer
    indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vertexIndices), gl.STATIC_DRAW);
       
	setInterval(function(){drawScene(); if(texIsLoaded) clearInterval();},50);
}

var /*mat4*/ pMatrix;
var /*mat4*/ cameraMatrix;
var /*mat4*/ mvMatrix; //all init'ed in initMatrices
var /*mat3*/ imvMatrix; //for calculating rotation axes (and lighting?)

function setUniforms()
{
	//set matrices
    gl.uniformMatrix4fv(shaderProgram.pMatrixPosition, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixPosition, false, mat4.multiply(mat4.create(),cameraMatrix,mvMatrix));
	gl.uniformMatrix3fv(shaderProgram.normalMatrixPosition, false, mat3.transpose(mat3.create(),imvMatrix));	
	
	//set texture
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, baseTexture);
	gl.uniform1i(shaderProgram.texSamplerPosition, 0);
	
	//set lighting
	gl.uniform3fv(shaderProgram.dirLightPosition, vec3.normalize(vec3.create(), vec3.fromValues(-.5,.5,0.1)));
	gl.uniform3fv(shaderProgram.dirDiffusePosition, vec3.fromValues(.8,.8,.8));
	gl.uniform3fv(shaderProgram.ambLightPosition, vec3.fromValues(.2,.2,.2));
}

function initMatrices()
{
	pMatrix = mat4.create();
	cameraMatrix = mat4.create();
	mvMatrix = mat4.create();
	imvMatrix = mat3.create();
	
	//generate the default perspective matrix
    mat4.perspective(pMatrix, Math.PI/4, gl.vpWidth / gl.vpHeight, 0.1, 100.0);    
    
    //generate default cameraMatrix
    mat4.translate(cameraMatrix, cameraMatrix, [0.0, 0.0, -17.0]);
   // mat4.rotate(cameraMatrix, cameraMatrix, Math.PI/10.0, [1.0,0,0]);
   // mat4.rotate(cameraMatrix, cameraMatrix, Math.PI/10.0, [0,1.0,0]);
 
    //move obj from identity pos to default position
    mat4.translate(mvMatrix, mvMatrix, [0,-7,0]);//*/[3.0, -1.25, 0.0]);
	mat3.invert(imvMatrix, (mat3.fromMat4(imvMatrix,mvMatrix)));

}


function drawScene()
{
    //set viewport, clear canvas
    gl.viewport(0, 0, gl.vpWidth, gl.vpHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);    
        
    //set up vertex data
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexAttribPosition, 3, gl.FLOAT, false, 0, 0);
	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
	gl.vertexAttribPointer(shaderProgram.textureAttribPosition, 2, gl.FLOAT, false, 0,0);
	gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
	gl.vertexAttribPointer(shaderProgram.normalAttribPosition, 3, gl.FLOAT, false, 0,0 );
	
	//bind element array
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	
	
	
	
	
	//set uniforms and draw
    setUniforms();
    gl.drawElements(gl.TRIANGLES, objectData.numElements, gl.UNSIGNED_SHORT, 0);
	//alert("drawn");
	
	//reload if we didn't have a texture (bad work around)
	//if(!texIsLoaded) 
	//	setTimeout(function() {drawScene();}, 500);
}

var baseTexture;
var textureImage;
var texIsLoaded = false;

function loadTexture()
{
	baseTexture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, baseTexture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,1,1,0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([50,50,50,255]));
	textureImage = new Image();
	textureImage.onload = function() {textureLoadCallback(textureImage, baseTexture);};
	textureImage.onerror=function() {alert('image failed to load.');};
	textureImage.onabort=function() {alert('image loading aborted');};
	textureImage.src = "nwn2.png";	
}

function textureLoadCallback(image, texture)
{
	//nitty gritty texture setting details
	var extension = gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic");
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameterf(gl.TEXTURE_2D, extension.TEXTURE_MAX_ANISOTROPY_EXT, 4);
	gl.generateMipmap(gl.TEXTURE_2D);
	gl.bindTexture(gl.TEXTURE_2D, null);
	texIsLoaded = true;
}


//------------------------------------------------Event functions-----------------------------------------------

function mouseScrollEvent(event)
{
	//alert(event.detail+ ", " + event.wheelDelta);
	if(event.wheelDelta > 0)
		mat4.translate(cameraMatrix, cameraMatrix, [0,0,2]);
	else
		mat4.translate(cameraMatrix, cameraMatrix, [0,0,-2]);
	return false;
}

var mouseDown = false;
var lastMouseX = null;
var lastMouseY = null;

function mouseDownEvent(event)
{
	mouseDown = true;
	lastMouseX = event.clientX;
	lastMouseY = event.clientY;
}

function mouseUpEvent(event)
{
	var transitioning = false;
	if(mouseDown)
		transitioning = true;
	
	mouseDown = false;
	var dx = event.clientX-lastMouseX;
	var dy = event.clientY-lastMouseY;
	var delta = Math.sqrt(dx*dx + dy*dy);
	
	if(delta > .05 && transitioning)
		decelerate(dx, dy, Math.min(500, delta));
}

function mouseMoveEvent(event)
{
	if(!mouseDown)
		return;
	
	var dx = event.clientX - lastMouseX;
	var dy = event.clientY - lastMouseY;
	var delta = Math.sqrt(dx*dx + dy*dy);
	
	rotate(Math.min(8,delta/5) , [dy,dx,0]);
	lastMouseX = event.clientX;
	lastMouseY = event.clientY;
}

function decelerate(dx,dy,delta)
{	
	if(mouseDown || delta <= .05)
		return;
		
	rotate(Math.min(8,delta/5) , [dy,dx,0]);	
	delta -= .3;
	
	setTimeout(function() {decelerate(dx,dy,delta);}, 15);
}

//------------------------------------------------Manipulation functions-----------------------------------------------

function rotate(/*int*/ degrees, /*vec3*/ axis)
{
	//convert degrees to radians
	/*float*/var radians = (Math.PI/180.0)*degrees;
	
	/*vec3*/var transformedAxis = calcRotationAxis(axis);
	
	//rotate (and update inverse)
	mat4.translate(mvMatrix, mvMatrix, objectData.Offset);
	mat4.rotate(mvMatrix, mvMatrix, radians, transformedAxis);
	mat4.translate(mvMatrix, mvMatrix, vec3.negate(vec3.create(),objectData.Offset));
	mat3.invert(imvMatrix, (mat3.fromMat4(imvMatrix,mvMatrix)));
	
	//redraw
	drawScene();
}

function rotateRight(/*int*/degrees)
{
	//call rotate on the Y axis 
	rotate(degrees, vec3.fromValues(0,1,0));
}

function rotateLeft(/*int*/degrees)
{
	//call rotate on the Y axis with -degrees
	rotate(-1*degrees, vec3.fromValues(0,1,0));
}

function rotateUp(degrees)
{
	//call rotate on the X axi with -degrees
	rotate(-1*degrees, vec3.fromValues(1,0,0));
}

function rotateDown(degrees)
{
	//call rotate on the X axis 
	rotate(degrees, vec4.fromValues(1,0,0));
}

function rotateCwise(degrees)
{
	//call rotate on the Z axis with -degrees
	rotate(-1*degrees, vec3.fromValues(0,0,1));
}

function rotateCCwise(degrees)
{
	//call rotate on the Z axis 
	rotate(degrees, vec3.fromValues(0,0,1));
}

function calcRotationAxis(/*vec4*/axis)
{
	
	//do the reverse transforms on the rotation axis 
	vec3.transformMat3(axis, axis, imvMatrix);
	
	//normalize
	vec3.normalize(axis, axis);
	
	return axis;
}

function rotateCamera(/*int*/degrees, /*vec3*/axis)
{
	//convert degrees to radians
	/*float*/var radians = (Math.PI/180.0)*(-1*degrees);
	
	///*vec3*/var transformedAxis = calcRotationAxis(axis);
	
	//rotate (and update inverse)
	mat4.rotate(cameraMatrix, cameraMatrix, radians, axis);
	//mat3.invert(imvMatrix, (mat3.fromMat4(imvMatrix,mvMatrix)));
	
	//redraw
	drawScene();
}
