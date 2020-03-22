(function projectT() {
	var positions, texcoords, colors, subdivide, style, size, triNumber, flag, theta, twist, wire;
	var positionBuffer, colorBuffer, textureBuffer, xplus, yplus, xmax, ymax, texture;
	var wgl, wbuffers, wprogramInfo;
	(function initT() {
		flag = true;
		subdivide = 0;
		theta = 0;
		style = 0;
		size = 1;
		twist = 0;
		const canvas = document.getElementById("projectT");
  		// Initialize the GL context
  		const cgl = canvas.getContext("webgl");
		const tgl = cgl;
		wgl = cgl;

  		// Only continue if WebGL is available and working
  		if (!cgl) {
    		alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    		return;
  		}

  		// Vertex shader program
		const vsSource = `
			attribute vec4 aVertexPosition;
			attribute vec4 aVertexColor;
			uniform mat4 uModelViewMatrix;
			uniform mat4 uProjectionMatrix;
			uniform float uTheta;
			uniform float uTwist;
			varying mediump vec4 vColor;

			void main(void) {
				float distance = 1.0;
				if(uTwist == 1.0){
					distance = sqrt(aVertexPosition.x * aVertexPosition.x + aVertexPosition.y * aVertexPosition.y);
				}
				float rot = uTheta * distance;
				mat4 rotmat = mat4(cos(rot),    sin(rot),   0,  0,
								  -sin(rot),    cos(rot),   0,  0,
										  0,           0,   1,  0,
										  0,           0,   0,  1);
				gl_Position = uProjectionMatrix * uModelViewMatrix * rotmat * aVertexPosition;
				vColor = aVertexColor;
			}`;

		const vsTSource = `
			attribute vec4 aVertexPosition;
			attribute vec2 aTextureCoord;
			uniform mat4 uModelViewMatrix;
			uniform mat4 uProjectionMatrix;
			uniform float uTheta;
			uniform float uTwist;
    		varying highp vec2 vTextureCoord;

			void main(void) {
				float distance = 1.0;
				if(uTwist == 1.0){
					distance = sqrt(aVertexPosition.x * aVertexPosition.x + aVertexPosition.y * aVertexPosition.y);
				}
				float rot = uTheta * distance;
				mat4 rotmat = mat4(cos(rot),    sin(rot),   0,  0,
								  -sin(rot),    cos(rot),   0,  0,
										  0,           0,   1,  0,
										  0,           0,   0,  1);
				gl_Position = uProjectionMatrix * uModelViewMatrix * rotmat * aVertexPosition;
				vTextureCoord = aTextureCoord;
			}`;
		const vsWSource = `
			attribute vec4 aVertexPosition;
			uniform mat4 uModelViewMatrix;
			uniform mat4 uProjectionMatrix;
			uniform float uTheta;
			uniform float uTwist;

			void main(void) {
				float distance = 1.0;
				if(uTwist == 1.0){
					distance = sqrt(aVertexPosition.x * aVertexPosition.x + aVertexPosition.y * aVertexPosition.y);
				}
				float rot = uTheta * distance;
				mat4 rotmat = mat4(cos(rot),    sin(rot),   0,  0,
								  -sin(rot),    cos(rot),   0,  0,
										  0,           0,   1,  0,
										  0,           0,   0,  1);
				gl_Position = uProjectionMatrix * uModelViewMatrix * rotmat * aVertexPosition;
			}`;
		// Fragment shader program
		const fsSource = `
			varying mediump vec4 vColor;
			void main(void) {
				gl_FragColor = vColor;
			}`;
		const fsTSource = `
			varying highp vec2 vTextureCoord;
			uniform sampler2D uSampler;
			
			void main(void) {
				gl_FragColor = texture2D(uSampler, vTextureCoord);
			}`;
		const fsWSource = `			
			void main(void) {
				gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
			}`;

		// Initialize a shader program; this is where all the lighting
		// for the vertices and so forth is established.
		const cshaderProgram = initShaderProgram(cgl, vsSource, fsSource);
		const tshaderProgram = initShaderProgram(tgl, vsTSource, fsTSource);
		const wshaderProgram = initShaderProgram(wgl, vsWSource, fsWSource);

		// Collect all the info needed to use the shader program.
		// Look up which attributes our shader program is using
		// for aVertexPosition, aVevrtexColor and also
		// look up uniform locations.
		const cprogramInfo = {
			program: cshaderProgram,
			attribLocations: {
			  vertexPosition: cgl.getAttribLocation(cshaderProgram, 'aVertexPosition'),
			  vertexColor: cgl.getAttribLocation(cshaderProgram, 'aVertexColor'),
			},
			uniformLocations: {
			  projectionMatrix: cgl.getUniformLocation(cshaderProgram, 'uProjectionMatrix'),
			  modelViewMatrix: cgl.getUniformLocation(cshaderProgram, 'uModelViewMatrix'),
					theta: cgl.getUniformLocation(cshaderProgram, 'uTheta'),
					twist: cgl.getUniformLocation(cshaderProgram, 'uTwist'),
			},
		};  
		const tprogramInfo = {
			program: tshaderProgram,
			attribLocations: {
			  vertexPosition: tgl.getAttribLocation(tshaderProgram, 'aVertexPosition'),
			  textureCoord: tgl.getAttribLocation(tshaderProgram, 'aTextureCoord'),
			},
			uniformLocations: {
			  projectionMatrix: tgl.getUniformLocation(tshaderProgram, 'uProjectionMatrix'),
			  modelViewMatrix: tgl.getUniformLocation(tshaderProgram, 'uModelViewMatrix'),
			  theta: tgl.getUniformLocation(tshaderProgram, 'uTheta'),
			  twist: tgl.getUniformLocation(tshaderProgram, 'uTwist'),
			  sampler: tgl.getUniformLocation(tshaderProgram, 'uSampler'),
			},
		};  
		wprogramInfo = {
			program: wshaderProgram,
			attribLocations: {
			  vertexPosition: tgl.getAttribLocation(wshaderProgram, 'aVertexPosition'),
			},
			uniformLocations: {
			  projectionMatrix: tgl.getUniformLocation(wshaderProgram, 'uProjectionMatrix'),
			  modelViewMatrix: tgl.getUniformLocation(wshaderProgram, 'uModelViewMatrix'),
			  theta: tgl.getUniformLocation(wshaderProgram, 'uTheta'),
			  twist: tgl.getUniformLocation(wshaderProgram, 'uTwist'),
			},
		};  

		// Here's where we call the routine that builds all the
		// objects we'll be drawing.
		var cbuffers = initColorBuffers(cgl);
		var tbuffers = initTextureBuffers(tgl);
		wbuffers = initPositionBuffers(wgl);
		
		texture = loadTexture(tgl, "/res/img/mandrill.jpg");
		
		var buffers = cbuffers;
		var gl = cgl;
		var programInfo = cprogramInfo;

		// Draw the scene
		drawScene(gl, programInfo, buffers);

		// Controls
		const sliderTheta = document.getElementById('slider-theta');
		const numberTheta = document.getElementById('number-theta');
		sliderTheta.addEventListener('input', function() {
			var tmp = sliderTheta.value;
			tmp = tmp < 0 ? 0 : tmp > 360 ? 360 : tmp;
			numberTheta.value = sliderTheta.value = tmp;
			theta = tmp * Math.PI / 180;
			drawScene(gl, programInfo, buffers);
		});
		numberTheta.addEventListener('input', function() {
			var tmp = numberTheta.value;
			tmp = tmp < 0 ? 0 : tmp > 360 ? 360 : tmp;
			sliderTheta.value = numberTheta.value = tmp;
			theta = tmp * Math.PI / 180;
			drawScene(gl, programInfo, buffers);
		});
		const slidersubdivide = document.getElementById('slider-subdivide');
		const numbersubdivide = document.getElementById('number-subdivide');
		slidersubdivide.addEventListener('input', function() {
			var tmp = slidersubdivide.value;
			tmp = tmp < 0 ? 0 : tmp > 10 ? 10 : tmp;
			numbersubdivide.value = slidersubdivide.value = tmp;
			subdivide = slidersubdivide.value;
			updateSize(gl, buffers);
			if (style != 2) {
				updateColors(gl, buffers);
			} else {
				updateSize(wgl, wbuffers);	
			}
			drawScene(gl, programInfo, buffers);
		});
		numbersubdivide.addEventListener('input', function() {
			var tmp = numbersubdivide.value;
			tmp = tmp < 0 ? 0 : tmp > 10 ? 10 : tmp;
			slidersubdivide.value = numbersubdivide.value = tmp;
			subdivide = numbersubdivide.value;
			updateSize(gl, buffers);
			if (style != 2) {
				updateColors(gl, buffers);
			} else {
				updateSize(wgl, wbuffers);	
			}
			drawScene(gl, programInfo, buffers);
		});
		const slidersize = document.getElementById('slider-size');
		const numbersize = document.getElementById('number-size');
		slidersize.addEventListener('input', function() {
			var tmp = slidersize.value;
			tmp = tmp < 0 ? 0 : tmp > 4 ? 4 : tmp;
			numbersize.value = slidersize.value = tmp;
			size = slidersize.value;
			updateSize(gl, buffers);
			drawScene(gl, programInfo, buffers);
		});
		numbersize.addEventListener('input', function() {
			var tmp = numbersize.value;
			tmp = tmp < 0 ? 0 : tmp > 4 ? 4 : tmp;
			slidersize.value = numbersize.value = tmp;
			size = numbersize.value;
			updateSize(gl, buffers);
			drawScene(gl, programInfo, buffers);
		});
		const checkboxtwist = document.getElementById('checkbox-twist');
		checkboxtwist.addEventListener('input', function() {
			twist = checkboxtwist.checked ? 1.0 : 0.0;
			drawScene(gl, programInfo, buffers);
		});
		const checkboxwire = document.getElementById('checkbox-wire');
		checkboxwire.addEventListener('input', function() {
			wire = checkboxwire.checked;
			if (wire)
				updateSize(wgl, wbuffers);	
			drawScene(gl, programInfo, buffers);
		});
		const labelwire = document.getElementById('label-wire');
		const btndisplaytype = document.getElementById('btn-displaytype');
		const btnsolid = document.getElementById('btn-solid');
		const btngradient = document.getElementById('btn-gradient');
		const btntexture = document.getElementById('btn-texture');
		btnsolid.addEventListener('click', function() {
			btndisplaytype.textContent = "Solid";
			style = 0;
			labelwire.style.display = "none";
			checkboxwire.style.display = "none";
			gl = cgl;
			programInfo = cprogramInfo;
			buffers = initColorBuffers(cgl);
			updateColors(gl, buffers);
			drawScene(gl, programInfo, buffers);
		});
		btngradient.addEventListener('click', function() {
			btndisplaytype.textContent = "Gradient";
			style = 1;
			labelwire.style.display = "none";
			checkboxwire.style.display = "none";
			gl = cgl;
			programInfo = cprogramInfo;
			buffers = initColorBuffers(cgl);
			updateColors(gl, buffers);
			drawScene(gl, programInfo, buffers);
		});
		btntexture.addEventListener('click', function() {
			btndisplaytype.textContent = "Texture";
			style = 2;
			labelwire.style.display = "block";
			checkboxwire.style.display = "block";
			gl = tgl;
			programInfo = tprogramInfo;
			buffers = initTextureBuffers(tgl);
			drawScene(gl, programInfo, buffers);
		});
	})();
	
	function triangle(points) {
		positions.push(points[0]);
		positions.push(points[1]);
		positions.push(points[2]);
		positions.push(points[3]);
		positions.push(points[4]);
		positions.push(points[5]);
		
		texcoords.push((points[0] + xplus)/xmax);
		texcoords.push((points[1] + yplus)/ymax);
		texcoords.push((points[2] + xplus)/xmax);
		texcoords.push((points[3] + yplus)/ymax);
		texcoords.push((points[4] + xplus)/xmax);
		texcoords.push((points[5] + yplus)/ymax);
	}
	
	function tColors() {
		if (style == 0) {
			var r = Math.random(), g = Math.random(), b = Math.random();
			colors.push(r);
			colors.push(g);
			colors.push(b);
			colors.push(r);
			colors.push(g);
			colors.push(b);
			colors.push(r);
			colors.push(g);
			colors.push(b);
		} else if (style == 1) {
			colors.push(Math.random());
			colors.push(Math.random());
			colors.push(Math.random());
			colors.push(Math.random());
			colors.push(Math.random());
			colors.push(Math.random());
			colors.push(Math.random());
			colors.push(Math.random());
			colors.push(Math.random());
		}
	}
	
	function divideTriangle(points, count, color) {
		if (count == 0) {
			triangle(points);
			if (color) {
				tColors();
			}
		} else {
			var midabx = (points[0] + points[2]) / 2;
			var midaby = (points[1] + points[3]) / 2;
			var midacx = (points[0] + points[4]) / 2;
			var midacy = (points[1] + points[5]) / 2;
			var midbcx = (points[2] + points[4]) / 2;
			var midbcy = (points[3] + points[5]) / 2;
			divideTriangle([points[0], points[1], midabx, midaby, midacx, midacy], count - 1);
			divideTriangle([points[2], points[3], midabx, midaby, midbcx, midbcy], count - 1);
			divideTriangle([points[4], points[5], midbcx, midbcy, midacx, midacy], count - 1);
			divideTriangle([midbcx, midbcy, midabx, midaby, midacx, midacy], count - 1);
			if (color) {
				tColors();
				tColors();
				tColors();
				tColors();
			}
		}
	}
		
	function initTextureBuffers(gl) {
		if (flag) {
			// Create a buffer for the triangle's positions.
			positionBuffer = gl.createBuffer();
			textureBuffer = gl.createBuffer();
		}
		
		// prepare empty lists
		positions = [];
		texcoords = [];
		
		// Now create an array of positions for the square.
		const r = Math.sqrt(3);
		var points = [0.0, size/r, -size/2., -size/(2.*r), size/2., -size/(2.*r),];
		xplus = size/2.;
		yplus = size/(2.*r);
		xmax = size;
		ymax = (size/r) + yplus;
		// Generate list
		divideTriangle(points, subdivide, true);
		
		// Select the positionBuffer as the one to apply buffer
		// operations to from here out.
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		
		// Now pass the list of positions into WebGL to build the
		// shape. We do this by creating a Float32Array from the
		// JavaScript array, then use it to fill the current buffer.
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
		
		var vertexCount = positions.length/2;
		document.getElementById('label-triangles').textContent = vertexCount/3;
		
		positions = [];
		texcoords = [];
		return {
			position: positionBuffer,
			vertexCount: vertexCount,
			textureCoord: textureBuffer,
		};
	}
	
	function initColorBuffers(gl) {
		if (flag) {
			// Create a buffer for the triangle's positions.
			positionBuffer = gl.createBuffer();
			colorBuffer = gl.createBuffer();
		}
		
		// prepare empty lists
		positions = [];
		colors = [];
		texcoords = [];
		// Now create an array of positions for the square.
		const r = Math.sqrt(3);
		var points = [0.0, size/r, -size/2., -size/(2.*r), size/2., -size/(2.*r),];
		xplus = size/2;
		yplus = size/(2*r);
		xmax = size;
		ymax = (size/r) + yplus;
		// Generate list
		divideTriangle(points, subdivide, true);
		
		// Select the positionBuffer as the one to apply buffer
		// operations to from here out.
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		
		// Now pass the list of positions into WebGL to build the
		// shape. We do this by creating a Float32Array from the
		// JavaScript array, then use it to fill the current buffer.
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
		
		var vertexCount = positions.length/2;
		document.getElementById('label-triangles').textContent = vertexCount/3;
		
		positions = [];
		colors = [];
		texcoords = [];
		return {
			position: positionBuffer,
			vertexCount: vertexCount,
			color: colorBuffer,
		};
	}
	
	function initPositionBuffers(gl) {
		if (flag) {
			// Create a buffer for the triangle's positions.
			positionBuffer = gl.createBuffer();
		}
		
		// prepare empty lists
		positions = [];
		texcoords = [];
		// Now create an array of positions for the square.
		const r = Math.sqrt(3);
		var points = [0.0, size/r, -size/2., -size/(2.*r), size/2., -size/(2.*r),];
		xplus = size/2;
		yplus = size/(2*r);
		xmax = size;
		ymax = (size/r) + yplus;
		// Generate list
		divideTriangle(points, subdivide, true);
		
		// Select the positionBuffer as the one to apply buffer
		// operations to from here out.
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		
		// Now pass the list of positions into WebGL to build the
		// shape. We do this by creating a Float32Array from the
		// JavaScript array, then use it to fill the current buffer.
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);		
		var vertexCount = positions.length/2;
		
		document.getElementById('label-triangles').textContent = vertexCount/3;
		
		positions = [];
		texcoords = [];
		return {
			position: positionBuffer,
			vertexCount: vertexCount,
		};
	}
	
	function updateSize(gl, buffers) {
		positions = [];
		texcoords = [];
		
		// Now create an array of positions for the square.
		const r = Math.sqrt(3);
		var points = [0.0, size/r, -size/2., -size/(2.*r), size/2., -size/(2.*r),];
		xplus = size/2.;
		yplus = size/(2.*r);
		xmax = size;
		ymax = (size/r) + yplus;
		
		divideTriangle(points, subdivide, false);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
		var vertexCount = positions.length/2;
		document.getElementById('label-triangles').textContent = vertexCount/3;
		
		gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
		
		positions = [];
		texcoords = [];
		
		buffers.vertexCount = vertexCount;
		buffers.position = positionBuffer;
		buffers.textureCoord = textureBuffer;
	}
	
	function updateColors(gl, buffers) {
		if (style != 2) {	
			colors = [];
			for (var i = 0; i < buffers.vertexCount; i+=3){
				tColors();
			}
			// Now create an array of positions for the square.	
			gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
			buffers.color = colorBuffer;
			colors = [];
		} else {
			updateSize(gl, buffers);
		}
	}
	
	function drawScene(gl, programInfo, buffers) {
		gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
		gl.clearDepth(1.0);                 // Clear everything
		gl.enable(gl.DEPTH_TEST);           // Enable depth testing
		gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
		
		// Clear the canvas before we start drawing on it.
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		
		if (style != 2) {
			drawCScene(gl, programInfo, buffers);
		} else {
			drawTScene(gl, programInfo, buffers);
		}
	}
	
	function drawCScene(gl, programInfo, buffers) {
		// Create a perspective matrix, a special matrix that is
		// used to simulate the distortion of perspective in a camera.
		// Our field of view is 45 degrees, with a width/height
		// ratio that matches the display size of the canvas
		// and we only want to see objects between 0.1 units
		// and 100 units away from the camera.
		
		const fieldOfView = 45 * Math.PI / 180;   // in radians
		const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		const zNear = 0.1;
		const zFar = 100.0;
		const projectionMatrix = mat4.create();
		
		// note: glmatrix.js always has the first argument
		// as the destination to receive the result.
		mat4.perspective(projectionMatrix,
							fieldOfView,
							aspect,
							zNear,
							zFar);
		
		// Set the drawing position to the "identity" point, which is
		// the center of the scene.
		const modelViewMatrix = mat4.create();
		
		// Now move the drawing position a bit to where we want to
		// start drawing the square.
		
		mat4.translate(modelViewMatrix,     // destination matrix
		 			   modelViewMatrix,     // matrix to translate
		 			   [-0.0, -0.0, -6.0]);  // amount to translate
		
		gl.useProgram(programInfo.program);
		gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,
			false,
			projectionMatrix);
		gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix,
			false,
			modelViewMatrix);
		
		
		// Tell WebGL how to pull out the positions from the position
		// buffer into the vertexPosition attribute
		{
			const numComponents = 2;
			const type = gl.FLOAT;
			const normalize = false;
			const stride = 0;
			const offset = 0;
			gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
			gl.vertexAttribPointer(
			programInfo.attribLocations.vertexPosition,
			numComponents,
			type,
			normalize,
			stride,
			offset);
			gl.enableVertexAttribArray(
			programInfo.attribLocations.vertexPosition);
		}
		
		// Tell WebGL how to pull out the colors from the color buffer
		// into the vertexColor attribute.
		{
			const numComponents = 3;
			const type = gl.FLOAT;
			const normalize = false;
			const stride = 0;
			const offset = 0;
			gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
			gl.vertexAttribPointer(
			programInfo.attribLocations.vertexColor,
			numComponents,
			type,
			normalize,
			stride,
			offset);
			gl.enableVertexAttribArray(
			programInfo.attribLocations.vertexColor);
		}
		
		// Set the shader uniforms
		gl.uniform1f(programInfo.uniformLocations.theta, theta);
		gl.uniform1f(programInfo.uniformLocations.twist, twist);
		{
			const offset = 0;
			gl.drawArrays(gl.TRIANGLES, offset, buffers.vertexCount);
		}
	}
	
	function drawTScene(gl, programInfo, buffers) {		
		// Create a perspective matrix, a special matrix that is
		// used to simulate the distortion of perspective in a camera.
		// Our field of view is 45 degrees, with a width/height
		// ratio that matches the display size of the canvas
		// and we only want to see objects between 0.1 units
		// and 100 units away from the camera.
		
		const fieldOfView = 45 * Math.PI / 180;   // in radians
		const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		const zNear = 0.1;
		const zFar = 100.0;
		const projectionMatrix = mat4.create();
		
		// note: glmatrix.js always has the first argument
		// as the destination to receive the result.
		mat4.perspective(projectionMatrix,
							fieldOfView,
							aspect,
							zNear,
							zFar);
		
		// Set the drawing position to the "identity" point, which is
		// the center of the scene.
		const modelViewMatrix = mat4.create();
		
		// Now move the drawing position a bit to where we want to
		// start drawing the square.
		
		mat4.translate(modelViewMatrix,     // destination matrix
		 			   modelViewMatrix,     // matrix to translate
		 			   [-0.0, -0.0, -6.0]);  // amount to translate
		
		gl.useProgram(programInfo.program);
		gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,
			false,
			projectionMatrix);
		gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix,
			false,
			modelViewMatrix);
		
		// Tell WebGL how to pull out the positions from the position
		// buffer into the vertexPosition attribute
		{
			const numComponents = 2;
			const type = gl.FLOAT;
			const normalize = false;
			const stride = 0;
			const offset = 0;
			gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
			gl.vertexAttribPointer(
			programInfo.attribLocations.vertexPosition,
			numComponents,
			type,
			normalize,
			stride,
			offset);
			gl.enableVertexAttribArray(
			programInfo.attribLocations.vertexPosition);
		}
		
		// Tell WebGL how to pull out the texture coordinates from
		// the texture coordinate buffer into the textureCoord attribute.
		{
			const numComponents = 2;
			const type = gl.FLOAT;
			const normalize = false;
			const stride = 0;
			const offset = 0;
			gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
			gl.vertexAttribPointer(
				programInfo.attribLocations.textureCoord,
				numComponents,
				type,
				normalize,
				stride,
				offset);
			gl.enableVertexAttribArray(
				programInfo.attribLocations.textureCoord);
		}

		// Tell WebGL we want to affect texture unit 0
		gl.activeTexture(gl.TEXTURE0);
		
		// Bind the texture to texture unit 0
		gl.bindTexture(gl.TEXTURE_2D, texture);
		
		// Set the shader uniforms
		gl.uniform1f(programInfo.uniformLocations.theta, theta);
		gl.uniform1f(programInfo.uniformLocations.twist, twist);
		gl.uniform1i(programInfo.uniformLocations.sampler, 0);
		{
			const offset = 0;
			gl.drawArrays(gl.TRIANGLES, offset, buffers.vertexCount);
			if (wire) {
				drawWScene(wgl, wprogramInfo, wbuffers);
			}
		}
	}
	
	function drawWScene(gl, programInfo, buffers) {		
		// Create a perspective matrix, a special matrix that is
		// used to simulate the distortion of perspective in a camera.
		// Our field of view is 45 degrees, with a width/height
		// ratio that matches the display size of the canvas
		// and we only want to see objects between 0.1 units
		// and 100 units away from the camera.
		
		const fieldOfView = 45 * Math.PI / 180;   // in radians
		const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
		const zNear = 0.1;
		const zFar = 100.0;
		const projectionMatrix = mat4.create();
		
		// note: glmatrix.js always has the first argument
		// as the destination to receive the result.
		mat4.perspective(projectionMatrix,
							fieldOfView,
							aspect,
							zNear,
							zFar);
		
		// Set the drawing position to the "identity" point, which is
		// the center of the scene.
		const modelViewMatrix = mat4.create();
		
		// Now move the drawing position a bit to where we want to
		// start drawing the square.
		
		mat4.translate(modelViewMatrix,     // destination matrix
		 			   modelViewMatrix,     // matrix to translate
		 			   [-0.0, -0.0, -6.0]);  // amount to translate
		
		gl.useProgram(programInfo.program);
		gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix,
			false,
			projectionMatrix);
		gl.uniformMatrix4fv(programInfo.uniformLocations.modelViewMatrix,
			false,
			modelViewMatrix);
		
		// Tell WebGL how to pull out the positions from the position
		// buffer into the vertexPosition attribute
		{
			const numComponents = 2;
			const type = gl.FLOAT;
			const normalize = false;
			const stride = 0;
			const offset = 0;
			gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
			gl.vertexAttribPointer(
				programInfo.attribLocations.vertexPosition,
				numComponents,
				type,
				normalize,
				stride,
				offset);
			gl.enableVertexAttribArray(
				programInfo.attribLocations.vertexPosition);
		}
		// Set the shader uniforms
		gl.uniform1f(programInfo.uniformLocations.theta, theta);
		gl.uniform1f(programInfo.uniformLocations.twist, twist);
		{
			for(var i = 0; i < buffers.vertexCount; i+=3){
				gl.drawArrays(gl.LINE_LOOP, i, 3);
			}
		}
	}
	//
	// Initialize a texture and load an image.
	// When the image finished loading copy it into the texture.
	//
	function loadTexture(gl, url) {
		var texture = gl.createTexture();
		texture.image = new Image();
		texture.image.onload = function () {
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.bindTexture(gl.TEXTURE_2D, null);
		}
		texture.image.src = url;
		return texture;
	}
})();