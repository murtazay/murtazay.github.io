(function projectP() {
	function initBuffers(gl) {
		
		// Create a buffer for the square's positions.
		
		const positionBuffer = gl.createBuffer();
		
		// Select the positionBuffer as the one to apply buffer
		// operations to from here out.
		
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		
		// Now create an array of positions for the square.
		
		const positions = [
			.70, .75,
			.75, .65,
			.70, .55,
			.25, .55,
			.25, .45,
			.75, .45,
			.80, .55,
			.85, .65,
			.80, .75,
			.75, .85,//Set this to be last keeping order looks cool
			.15, .85,
			.15, .15,
			.10, .10,
			.30, .10,//Interesting as well
			.25, .15,//Probably the best
			.25, .75,
		];
		
		// Now pass the list of positions into WebGL to build the
		// shape. We do this by creating a Float32Array from the
		// JavaScript array, then use it to fill the current buffer.
		
		gl.bufferData(gl.ARRAY_BUFFER,
					  new Float32Array(positions),
					  gl.STATIC_DRAW);
		
		return {
			position: positionBuffer,
		};
	};

	function drawScene(gl, programInfo, buffers) {
	  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
	  gl.clearDepth(1.0);                 // Clear everything
	  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
	  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

	  // Clear the canvas before we start drawing on it.
	  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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
				 [-0.5, -0.5, 0.0]);  // amount to translate

	  // Tell WebGL how to pull out the positions from the position
	  // buffer into the vertexPosition attribute.
	  {
		const numComponents = 2;  // pull out 2 values per iteration
		const type = gl.FLOAT;    // the data in the buffer is 32bit floats
		const normalize = false;  // don't normalize
		const stride = 0;         // how many bytes to get from one set of values to the next
								  // 0 = use type and numComponents above
		const offset = 0;         // how many bytes inside the buffer to start from
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

	  // Tell WebGL to use our program when drawing

	  gl.useProgram(programInfo.program);

	  // Set the shader uniforms
	  gl.uniformMatrix4fv(
		  programInfo.uniformLocations.modelViewMatrix,
		  false,
		  modelViewMatrix);
	  gl.uniformMatrix4fv(
		  programInfo.uniformLocations.projectionMatrix,
		  false,
		  projectionMatrix);
	  drawModes = [gl.POINTS,gl.LINES,gl.LINE_STRIP,gl.LINE_LOOP,gl.TRIANGLES,gl.TRIANGLE_STRIP,gl.TRIANGLE_FAN,gl.QUADS,gl.POLYGON];
	  const w = gl.canvas.width/3;
	  const h = gl.canvas.height/3;
	  {
		const vertexCount = 16;
		const offset = 0;
		for(var i = 0; i < 9; i++){
			gl.viewport(i%3*w, (2-Math.floor(i/3)) * h, w, h);
			gl.drawArrays(drawModes[i], offset, vertexCount);
		};
	  }
	};

	(function initP() {
		const canvas = document.getElementById("projectP");
		// Initialize the GL context
		const gl = canvas.getContext("webgl");

		// Only continue if WebGL is available and working
		if (!gl) {
			alert("Unable to initialize WebGL. Your browser or machine 	may not support it.");
			return;
		}
		

		const vShader = `
			attribute   vec2 a_Position; 
			varying     vec4 v_Color;
			uniform     mat4 u_modelViewMatrix;
			uniform     mat4 u_projectionMatrix;

			void main(){
				gl_Position =  u_modelViewMatrix * vec4(a_Position, 0, 1) ;
				v_Color = vec4(1.0, 1.0, 0.0, 1.0);
			}`;

		const fShader = `
			precision mediump float;
			varying   vec4 v_Color;
			void main() {
				gl_FragColor = v_Color;
			}`;

		const shaderProgram = initShaderProgram(gl,vShader,fShader);
		const programInfo = {
			program: shaderProgram,
			attribLocations: {
				vertexPosition: gl.getAttribLocation(shaderProgram, 'a_Position'),
			},
			uniformLocations: {
				modelViewMatrix: gl.getUniformLocation(shaderProgram, 'u_modelViewMatrix'),
				projectionMatrix: gl.getUniformLocation(shaderProgram, 'u_projectionMatrix'),
			},
		};

		const buffers = initBuffers(gl);
		
		drawScene(gl, programInfo, buffers);
	})();
})();