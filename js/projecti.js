(function imageProcessing() {
	"use strict";
	var buffers, frameBuffers = [], textures = [], depths = [], programInfos = {}, programOrder = [], panels = [];
	var type = "Threshold", textureMandrill, gl, imagew, imageh;
	const reg = new RegExp('[0-9]+$');
	const blurreg = new RegExp('blur');
	const sharpenreg = new RegExp('sharpen');
	(function initImage() {
		const canvas = document.getElementById("projecti");
		gl = canvas.getContext("webgl");
		if(!gl) {
			alert("Unable to initialize WebGL. Your browser or machine may not support it.");
			return;
		}
		
		buffers = initBuffers(gl);
		programInfos = initShaders(gl);
		textureMandrill = loadTexture(gl, "/res/img/mandrill.jpg");
		
		// Controls
		var control = 0;
		const btnadd = document.getElementById('btn-plus');
		btnadd.addEventListener('click', function() {
			createTextureFrameBuffer(gl);
			switch (type) {
				case "Threshold" : 
					programOrder.push(programInfos.thresholdShader);
					break;
				case "Contrast" :
					programOrder.push(programInfos.contrastShader);
					break;
				case "Brightness":
					programOrder.push(programInfos.brightnessShader);
					break;
				case "Gamma":
					programOrder.push(programInfos.gammaShader);
					break;
				case "Quantization":
					programOrder.push(programInfos.quantizationShader);
					break;
				case "Histogram Stretch":
					programOrder.push(programInfos.histogramstretchShader);
					break;
				case "Blur":
					programOrder.push(programInfos.blurShader);
					break;
				case "Sharpen":
					programOrder.push(programInfos.sharpenShader);
					break;
				case "Transform":
					programOrder.push(programInfos.transformShader);
					break;
			}
			makeControls(type, control++);
			drawAllFilters();
		});
		const btnfilter = document.getElementById('btn-filter');
		const btnthreshold = document.getElementById('btn-threshold');
		const btncontrast = document.getElementById('btn-contrast');
		const btnbrightness = document.getElementById('btn-brightness');
		const btngamma = document.getElementById('btn-gamma');
		const btnquantization = document.getElementById('btn-quantization');
		const btnhistogramstrech = document.getElementById('btn-histogram');
		const btnblur = document.getElementById('btn-blur');
		const btnsharpen = document.getElementById('btn-sharpen');
		const btntransform = document.getElementById('btn-transform');
		
		btnthreshold.addEventListener('click', function() {
			btnfilter.textContent = type = "Threshold";
		});
		btnbrightness.addEventListener('click', function() {
			btnfilter.textContent = type = "Brightness";
		});
		btncontrast.addEventListener('click', function() {
			btnfilter.textContent = type = "Contrast";
		});
		btngamma.addEventListener('click', function() {
			btnfilter.textContent = type = "Gamma";
		});
		btnquantization.addEventListener('click', function() {
			btnfilter.textContent = type = "Quantization";
		});
		btnhistogramstrech.addEventListener('click', function() {
			btnfilter.textContent = type = "Histogram Stretch";
		});
		btnblur.addEventListener('click', function() {
			btnfilter.textContent = type = "Blur";
		});
		btnsharpen.addEventListener('click', function() {
			btnfilter.textContent = type = "Sharpen";
		});
		btntransform.addEventListener('click', function() {
			btnfilter.textContent = type = "Transform"
		})
		
	})();
	
	function drawAllFilters() {
		// start with the original image
		gl.bindTexture(gl.TEXTURE_2D, textureMandrill);
		
		for (var i = 0; i < programOrder.length; i++) {
			var fbo = frameBuffers[i];
			// make this the framebuffer we are rendering to.
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
			
			// Tell webgl the viewport setting needed for framebuffer.
			gl.viewport(0, 0, imagew, imageh);
			
			var ith = reg.exec(panels[i].id);
			drawFilter(gl, programOrder[i], buffers, ith);
			
			gl.bindTexture(gl.TEXTURE_2D, textures[i]);
		}
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		drawFilter(gl, programInfos.basicShader, buffers, 0);
	}
	
	function drawFilter(gl, programInfo, buffers, num) {
		gl.clearColor(0.0, 0.0, 0.0, 1.0);	// Clear to black, fully opaque
		gl.clearDepth(1.0);					// Clear everything
		gl.enable(gl.DEPTH_TEST);			// Enable depth testing
		gl.depthFunc(gl.LEQUAL);			// Near things obscure far things
		
		// Clear the canvas before we start drawing on it.
		
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		// Cre
		// used to simulate the distortion of perspective in a camera.
		// Our field of view is 45 degrees, with a width/height
		// ratio that matches the display size of the canvas
		// and we only want to see objects between 0.1 units
		// and 100 units away from the camera.
		
		const fieldOfView = 45 * Math.PI / 180;	// in radians
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
		
		mat4.translate(modelViewMatrix,		// destination matrix
						modelViewMatrix,		// matrix to translate
						[-0.0, -0.0, -6.0]);	// amount to translate	
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
		
		// Set the shader uniforms
		switch (programInfo.name) {
			case "threshold" :
				var threshold = document.getElementById("number-threshold-"+num).value/256.;
				gl.uniform1f(programInfo.uniformLocations.threshold, threshold);
				break;
			case "contrast" :
				var contrast = document.getElementById("number-contrast-"+num).value;
				contrast = (contrast >= 0. ? contrast/25. : contrast/50.) + 1.;
				gl.uniform1f(programInfo.uniformLocations.contrast, contrast);
				var ref = document.getElementById("number-refrence-"+num).value/256.;
				gl.uniform1f(programInfo.uniformLocations.refrence, ref);
				break;
			case "brightness":
				var brightness = document.getElementById("number-brightness-"+num).value/256.;
				gl.uniform1f(programInfo.uniformLocations.brightness, brightness);
				break;
			case "gamma":
				var gamma = document.getElementById("number-gamma-"+num).value;
				gl.uniform1f(programInfo.uniformLocations.gamma, gamma);
				break;
			case "quantization":
				var quantization = 1./document.getElementById("number-level-"+num).value;
				gl.uniform1f(programInfo.uniformLocations.quantization, quantization);
				break;
			case "histogram stretch":
				var min = document.getElementById("number-min-"+num).value/256.;
				gl.uniform1f(programInfo.uniformLocations.min, min);
				var max = document.getElementById("number-max-"+num).value/256.;
				gl.uniform1f(programInfo.uniformLocations.max, max);
				break;
			case "blur":
				var xsize = document.getElementById("number-horizontal-"+num).value;
				var ysize = document.getElementById("number-vertical-"+num).value;
				var kernel = [];
				var square = xsize * ysize;
				for (var i = 0; i < square; i++) {
					kernel.push(1.);
				}
				gl.uniform1fv(programInfo.uniformLocations.kernel, kernel);
				gl.uniform1f(programInfo.uniformLocations.factor, 1./square);
				break;
			case "sharpen":
				var xsize = document.getElementById("number-horizontal-"+num).value;
				var ysize = document.getElementById("number-vertical-"+num).value;
				var factor = document.getElementById("number-factor-"+num).value;
				var kernel = [];
				var square = xsize * ysize;
				for (var i = 0; i < square; i++) {
					kernel.push(1.);
				}
				gl.uniform1fv(programInfo.uniformLocations.kernel, kernel);
				gl.uniform1f(programInfo.uniformLocations.size, 1./square);
				gl.uniform1f(programInfo.uniformLocations.factor, factor);
				break;
			case "transform":
				var type = document.getElementById("button-"+num).textContent;
				var mode = type == "Cartesian" ? 0. : type == "Polar" ? 1. : 2.;
				gl.uniform1f(programInfo.uniformLocations.mode, mode);
				gl.uniform1f(programInfo.uniformLocations.width, 512.);
		}
		
		// Set the shader uniforms
		gl.uniform1i(programInfo.uniformLocations.sampler, 0);
		{
			const offset = 0;
			gl.drawArrays(gl.TRIANGLE_STRIP, offset, 4);
		}
	}
	
	function initBuffers(gl) {
		var positionBuffer = gl.createBuffer();
		const positions = [
			-2.5, -2.5,
			-2.5,  2.5,
			 2.5, -2.5,
			 2.5,  2.5,
		];
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
		
		var textureBuffer = gl.createBuffer();
		const texcoords = [
			0.0, 0.0,
			0.0, 1.0,
			1.0, 0.0,
			1.0, 1.0,
		];
		gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
		return {
			position: positionBuffer,
			textureCoord: textureBuffer,
		};
	}	
	
	function initShaders(gl) {
		var programInfos = {};
		programInfos.basicShader = initBasicShader(gl);
		programInfos.thresholdShader = initThresholdShader(gl);
		programInfos.contrastShader = initContrastShader(gl);
		programInfos.brightnessShader = initBrightnessShader(gl);
		programInfos.gammaShader = initGammaShader(gl);
		programInfos.quantizationShader = initQuantizationShader(gl);
		programInfos.histogramstretchShader = initHistogramStretchShader(gl);
		programInfos.blurShader = initBlurShader(gl, 1, 1);
		programInfos.sharpenShader = initSharpenShader(gl, 1, 1);
		programInfos.transformShader = initTransformShader(gl);
		return programInfos;
	}
	
	function initTransformShader(gl) {
		// Vertex Shader
		const vsSource = `
			attribute vec4 aVertexPosition;
			attribute vec2 aTextureCoord;
			uniform mat4 uModelViewMatrix;
			uniform mat4 uProjectionMatrix;
			varying highp vec2 vTextureCoord;

			void main(void) {
				gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
				vTextureCoord = aTextureCoord;
			}`;
		
		const fsSource = `
			precision mediump float;
			varying highp vec2 vTextureCoord;
			uniform sampler2D uSampler;
			uniform float uMode;
			uniform float uWidth;
			
			void main(void) {	
				float PI = 3.14159265358979323844;
				if(uMode == 0.){
					gl_FragColor = texture2D(uSampler, vTextureCoord);
				}
				// For Polar
				else if(uMode == 1.){
					vec2  point = vTextureCoord;
					// Cast (0,1) -> (0,2PI)
					float theta = (point.y * 2.* PI);
					// Cast (0,1) -> (0, sqrt(.5))
					float distance = point.x * sqrt(.5);
					vec2  polar = vec2(distance * cos(theta) + .5, .5 - distance * sin(theta));
					gl_FragColor = texture2D(uSampler, polar);
				}
				// For Log-Polar
				else{
					vec2 point  = vTextureCoord;
					// Cast (0,1) -> (0,2PI)
					float theta = (point.y * 2. * PI);
					float distance = log(1. - point.x)/log(sqrt(uWidth)) * sqrt(.5);
					vec2  polar = vec2(distance * cos(theta) + .5, distance * sin(theta) + .5);

					gl_FragColor = texture2D(uSampler, polar);
				}
			}`;
		const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
		const programInfo = {
			name: "transform",
			program: shaderProgram,
			attribLocations: {
				vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
				textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
			},
			uniformLocations: {
				projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
				modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
				sampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
				mode: gl.getUniformLocation(shaderProgram, 'uMode'),
				width: gl.getUniformLocation(shaderProgram, 'uWidth'),
			},
		};
		
		return programInfo;
	}
	
	function initSharpenShader(gl, xsize, ysize) {
		// Vertex Shader
		const vsSource = `
			attribute vec4 aVertexPosition;
			attribute vec2 aTextureCoord;
			uniform mat4 uModelViewMatrix;
			uniform mat4 uProjectionMatrix;
			varying highp vec2 vTextureCoord;

			void main(void) {
				gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
				vTextureCoord = aTextureCoord;
			}`;
		
		var fsSource = `
			precision mediump float;
			varying highp vec2 vTextureCoord;
			uniform sampler2D uSampler;
			uniform float	uSize;
			uniform float	uFactor;
			`;
		fsSource += `uniform float uKernel[` + (xsize*ysize) + `];
			void main() {
				vec4 colorsum = \n`;
		var k = 0;
		const xstep = 1./512.;
		const ystep = 1./512.;
		var y = ((ysize-1)/2)/512.;
		var x = ((xsize-1)/2)/512.;
		for (var i = -y; i <= y; i += ystep) {
			for (var j = -x; j <= x; j += xstep) {
				fsSource += `texture2D(uSampler, vTextureCoord + vec2(`+j+`,`+i+` )) * uKernel[` + k + `]`;
				k++;
				if (k < xsize * ysize) {
					fsSource += `+\n`;
				} else {
					fsSource += `;\n`;
				}
			}
		}
		fsSource += `
			colorsum = vec4((colorsum * uSize).rgb, 1.);
			vec4 original = texture2D(uSampler, vTextureCoord);
			// figure out difference
			vec4 tmp = uFactor * (original - colorsum);
			// add it back
			tmp += original;
			// clamp it
			clamp(tmp,0.,1.);
			// set it
			gl_FragColor = vec4(tmp.rgb,1.);}
			`;
		const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
		const programInfo = {
			name: "sharpen",
			program: shaderProgram,
			attribLocations: {
				vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
				textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
			},
			uniformLocations: {
				projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
				modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
				sampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
				kernel: gl.getUniformLocation(shaderProgram, 'uKernel'),
				size: gl.getUniformLocation(shaderProgram, 'uSize'),
				factor: gl.getUniformLocation(shaderProgram, 'uFactor'),
			},
		};
		return programInfo;
	}
	
	function initBlurShader(gl, xsize, ysize) {
		// Vertex Shader
		const vsSource = `
			attribute vec4 aVertexPosition;
			attribute vec2 aTextureCoord;
			uniform mat4 uModelViewMatrix;
			uniform mat4 uProjectionMatrix;
			varying highp vec2 vTextureCoord;

			void main(void) {
				gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
				vTextureCoord = aTextureCoord;
			}`;
		
		var fsSource = `
			precision mediump float;
			varying highp vec2 vTextureCoord;
			uniform sampler2D uSampler;
			uniform float	uFactor;
			`;
		fsSource += `uniform float uKernel[` + (xsize*ysize) + `];
			void main() {
				vec4 colorsum = `;
		var k = 0;
		const xstep = 1./512.;
		const ystep = 1./512.;
		var y = ((ysize-1)/2)/512.;
		var x = ((xsize-1)/2)/512.;
		for (var i = -y; i <= y; i += ystep) {
			for (var j = -x; j <= x; j += xstep) {
				fsSource += `texture2D(uSampler, vTextureCoord + vec2(`+j+`,`+i+` )) * uKernel[` + k + `]`;
				k++;
				if (k < xsize * ysize) {
					fsSource += `+\n`;
				} else {
					fsSource += `;\n`;
				}
			}
		}
		fsSource += `gl_FragColor = vec4((colorsum * uFactor).rgb, 1.);}`;
		const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
		const programInfo = {
			name: "blur",
			program: shaderProgram,
			attribLocations: {
				vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
				textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
			},
			uniformLocations: {
				projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
				modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
				sampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
				kernel: gl.getUniformLocation(shaderProgram, 'uKernel'),
				factor: gl.getUniformLocation(shaderProgram, 'uFactor'),
			},
		};
		return programInfo;
	}
	
	function initHistogramStretchShader(gl) {
		// Vertex Shader
		const vsSource = `
			attribute vec4 aVertexPosition;
			attribute vec2 aTextureCoord;
			uniform mat4 uModelViewMatrix;
			uniform mat4 uProjectionMatrix;
			varying highp vec2 vTextureCoord;

			void main(void) {
				gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
				vTextureCoord = aTextureCoord;
			}`;
		
		const fsSource = `
			precision mediump float;
			varying highp vec2 vTextureCoord;
			uniform sampler2D uSampler;
			uniform float uMin;
			uniform float uMax;
			
			void main(void) {
				gl_FragColor = texture2D(uSampler, vTextureCoord);
				gl_FragColor = (gl_FragColor - uMin)/(uMax - uMin);
			}`;
		const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
		const programInfo = {
			name: "histogram stretch",
			program: shaderProgram,
			attribLocations: {
				vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
				textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
			},
			uniformLocations: {
				projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
				modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
				sampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
				min: gl.getUniformLocation(shaderProgram, 'uMin'),
				max: gl.getUniformLocation(shaderProgram, 'uMax'),
			},
		};
		
		return programInfo;
	}
	
	function initQuantizationShader(gl) {
		// Vertex Shader
		const vsSource = `
			attribute vec4 aVertexPosition;
			attribute vec2 aTextureCoord;
			uniform mat4 uModelViewMatrix;
			uniform mat4 uProjectionMatrix;
			varying highp vec2 vTextureCoord;

			void main(void) {
				gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
				vTextureCoord = aTextureCoord;
			}`;
		
		const fsSource = `
			varying highp vec2 vTextureCoord;
			uniform sampler2D uSampler;
			uniform mediump float uQuantization;
			
			void main(void) {
				gl_FragColor = texture2D(uSampler, vTextureCoord);
				gl_FragColor = (uQuantization) * floor(gl_FragColor/uQuantization);
			}`;
		const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
		const programInfo = {
			name: "quantization",
			program: shaderProgram,
			attribLocations: {
				vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
				textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
			},
			uniformLocations: {
				projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
				modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
				sampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
				quantization: gl.getUniformLocation(shaderProgram, 'uQuantization'),
			},
		};
		
		return programInfo;
	}
	
	function initGammaShader(gl) {
		// Vertex Shader
		const vsSource = `
			attribute vec4 aVertexPosition;
			attribute vec2 aTextureCoord;
			uniform mat4 uModelViewMatrix;
			uniform mat4 uProjectionMatrix;
			varying highp vec2 vTextureCoord;

			void main(void) {
				gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
				vTextureCoord = aTextureCoord;
			}`;
		
		const fsSource = `
			varying highp vec2 vTextureCoord;
			uniform sampler2D uSampler;
			uniform mediump float uGamma;
			
			void main(void) {
				gl_FragColor = texture2D(uSampler, vTextureCoord);
				gl_FragColor = vec4(pow(gl_FragColor.rgb, vec3(uGamma)),1.);
			}`;
		const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
		const programInfo = {
			name: "gamma",
			program: shaderProgram,
			attribLocations: {
				vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
				textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
			},
			uniformLocations: {
				projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
				modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
				sampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
				gamma: gl.getUniformLocation(shaderProgram, 'uGamma'),
			},
		};
		
		return programInfo;
	}
	
	function initBrightnessShader(gl) {
		// Vertex Shader
		const vsSource = `
			attribute vec4 aVertexPosition;
			attribute vec2 aTextureCoord;
			uniform mat4 uModelViewMatrix;
			uniform mat4 uProjectionMatrix;
			varying highp vec2 vTextureCoord;

			void main(void) {
				gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
				vTextureCoord = aTextureCoord;
			}`;
		
		const fsSource = `
			varying highp vec2 vTextureCoord;
			uniform sampler2D uSampler;
			uniform mediump float uBrightness;
			
			void main(void) {
				gl_FragColor = texture2D(uSampler, vTextureCoord) + uBrightness;
			}`;
		const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
		const programInfo = {
			name: "brightness",
			program: shaderProgram,
			attribLocations: {
				vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
				textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
			},
			uniformLocations: {
				projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
				modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
				sampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
				brightness: gl.getUniformLocation(shaderProgram, 'uBrightness'),
			},
		};
		
		return programInfo;
	}
	
	function initContrastShader(gl) {
		// Vertex Shader
		const vsSource = `
			attribute vec4 aVertexPosition;
			attribute vec2 aTextureCoord;
			uniform mat4 uModelViewMatrix;
			uniform mat4 uProjectionMatrix;
			varying highp vec2 vTextureCoord;

			void main(void) {
				gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
				vTextureCoord = aTextureCoord;
			}`;
		
		const fsSource = `
			precision mediump	float;
			varying highp vec2	vTextureCoord;
			uniform sampler2D	uSampler;
			uniform float	uContrast;
			uniform float	uRefrence;
			
			void main(void) {
				vec4 color = texture2D(uSampler, vTextureCoord);
				color = (color - uRefrence) * uContrast + uRefrence;
				gl_FragColor = clamp(color, 0., 1.);
			}`;
		const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
		const programInfo = {
			name: "contrast",
			program: shaderProgram,
			attribLocations: {
				vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
				textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
			},
			uniformLocations: {
				projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
				modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
				sampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
				contrast: gl.getUniformLocation(shaderProgram, 'uContrast'),
				refrence: gl.getUniformLocation(shaderProgram, 'uRefrence'),
			},
		};
		
		return programInfo;
	}
	
	function initThresholdShader(gl) {
		// Vertex Shader
		const vsSource = `
			attribute vec4 aVertexPosition;
			attribute vec2 aTextureCoord;
			uniform mat4 uModelViewMatrix;
			uniform mat4 uProjectionMatrix;
			varying highp vec2 vTextureCoord;

			void main(void) {
				gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
				vTextureCoord = aTextureCoord;
			}`;
		
		const fsSource = `
			varying highp vec2 vTextureCoord;
			uniform sampler2D uSampler;
			uniform mediump float uThreshold;
			
			void main(void) {
				gl_FragColor = texture2D(uSampler, vTextureCoord);
				gl_FragColor.r < uThreshold ? gl_FragColor.r = 0. : gl_FragColor.r = 1.;
				gl_FragColor.g < uThreshold ? gl_FragColor.g = 0. : gl_FragColor.g = 1.;
				gl_FragColor.b < uThreshold ? gl_FragColor.b = 0. : gl_FragColor.b = 1.;
			}`;
		const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
		const programInfo = {
			name: "threshold",
			program: shaderProgram,
			attribLocations: {
				vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
				textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
			},
			uniformLocations: {
				projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
				modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
				sampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
				threshold: gl.getUniformLocation(shaderProgram, 'uThreshold'),
			},
		};
		
		return programInfo;
	}
	
	function initBasicShader(gl) {
		// Vertex Shader
		const vsSource = `
			attribute vec4 aVertexPosition;
			attribute vec2 aTextureCoord;
			uniform mat4 uModelViewMatrix;
			uniform mat4 uProjectionMatrix;
			varying highp vec2 vTextureCoord;

			void main(void) {
				gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
				vTextureCoord = aTextureCoord;
			}`;
		
		const fsSource = `
			varying highp vec2 vTextureCoord;
			uniform sampler2D uSampler;
			
			void main(void) {
				gl_FragColor = texture2D(uSampler, vTextureCoord);
			}`;
		const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
		const programInfo = {
			name: "basic",
			program: shaderProgram,
			attribLocations: {
				vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
				textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
			},
			uniformLocations: {
				projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
				modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
				sampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
			},
		};
		
		return programInfo;
	}
	
	function createTextureFrameBuffer(gl) {
		var framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		framebuffer.width = 512;
		framebuffer.height = 512;
		
		var texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, framebuffer.width, framebuffer.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		var renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, framebuffer.width, framebuffer.height);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		
		frameBuffers.push(framebuffer);
		textures.push(texture);
		depths.push(renderbuffer);
	}
	
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
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			imagew = texture.image.width;
			imageh = texture.image.height;
			drawAllFilters();
			
		}
		texture.image.src = url;
		return texture;
	}
	
	// control handle functions
	function reDraw(type, control, val1, val2) {
		var loc = control;
		var typereg;
		if (type == "Blur") {
			typereg = blurreg;
		} else if (type == "Sharpen") {
			typereg = sharpenreg;
		}
		for (var i = 0; i < panels.length; i++) {
			if (typereg.exec(panels[i].id) != null && reg.exec(panels[i].id)[0] == control) {
				loc = i;
				break;
			}
		}
		if (type == "Blur") {
			programOrder[loc] = initBlurShader(gl, val1, val2);	
		} else if (type == "Sharpen") {
			programOrder[loc] = initSharpenShader(gl, val1, val2);	
		}
		drawAllFilters();
	}
	
	function resetControls(type, control) {
		switch (type) {
			case "Threshold":
				document.getElementById("number-threshold-"+control).value = 128;
				document.getElementById("range-threshold-"+control).value = 128;
				break;
			case "Contrast":
				document.getElementById("number-contrast-"+control).value = 0;
				document.getElementById("number-refrence-"+control).value = 128;
				document.getElementById("range-contrast-"+control).value = 0;
				document.getElementById("range-refrence-"+control).value = 128;
				break;
			case "Brightness":
				document.getElementById("number-brightness-"+control).value = 0;
				document.getElementById("range-brightness-"+control).value = 0;
				break;
			case "Gamma":
				document.getElementById("number-gamma-"+control).value = 3;				
				document.getElementById("range-gamma-"+control).value = 3;
				break;
			case "Quantization":
				document.getElementById("number-quantiation-"+control).value = 15;
				document.getElementById("range-quantiation-"+control).value = 15;
				break;
			case "Histogram Stretch":
				document.getElementById("number-min-"+(control)).value = 0;
				document.getElementById("number-max-"+(control)).value = 256;
				document.getElementById("range-min-"+(control)).value = 0;
				document.getElementById("range-max-"+(control)).value = 256;
				break;
			case "Blur":
				document.getElementById("number-horizontal-"+(control)).value = 1;
				document.getElementById("number-vertical-"+(control)).value = 1;
				document.getElementById("range-horizontal-"+(control)).value = 1;
				document.getElementById("range-vertical-"+(control)).value = 1;
				reDraw(type, control, 1, 1);
				break;
			case "Sharpen":
				document.getElementById("number-horizontal-"+(control)).value = 1;
				document.getElementById("number-vertical-"+(control)).value = 1;
				document.getElementById("number-factor-"+(control)).value = 1;
				document.getElementById("range-horizontal-"+(control)).value = 1;
				document.getElementById("range-vertical-"+(control)).value = 1;
				document.getElementById("range-factor-"+(control)).value = 1;
				reDraw(type, control, 1, 1);
				break;
					}
		drawAllFilters();
	}
	
	function swapPanels(panel, up, type, control) {
		var loc = -1;
		for (var i = 0; i < panels.length; i++) {
			if (panels[i] == panel) {
				loc = i;
				break;
			}
		}
		if (up) {
			if (loc != 0) {
				var panel1 = panels[loc-1];
				panels[loc-1] = panel;
				panels[loc] = panel1;
				var pro = programOrder[loc-1];
				programOrder[loc-1] = programOrder[loc];
				programOrder[loc] = pro;
			}
		} else {
			if (loc != panels.length-1) {
				var panel1 = panels[loc+1];
				panels[loc+1] = panel;
				panels[loc] = panel1;
				var pro = programOrder[loc+1];
				programOrder[loc+1] = programOrder[loc];
				programOrder[loc] = pro;
			}
		}
		drawPanels();
		drawAllFilters();
	}
	
	function drawPanels() {
		for (var i = 0; i < panels.length; i++) {
			fieldset.appendChild(panels[i]);
			var up = document.getElementById("up-" + programOrder[i].name.toLowerCase().replace(" ", "_") + "-" + reg.exec(panels[i].id)[0]);
			var down = document.getElementById("down-" + programOrder[i].name.toLowerCase().replace(" ", "_") + "-" + reg.exec(panels[i].id)[0]);
			up.disabled = i == 0;
			down.disabled = i == panels.length - 1;
		}
	}
	
	// Control creation functions
	function makeControls(type, control) {
		var panel = makePanel(type, control);
		panels.push(panel);
		drawPanels();
		var div = makeDiv();
		panel.appendChild(div);
		switch (type) {
			case "Threshold":
				makeLabelRangeNumber("Threshold", {min:1, max:256, value:128,}, control, div);
				break;
			case "Contrast":
				makeLabelRangeNumber("Contrast", {min:-50, max:50, value:0,}, control, div);
				var div2 = makeDiv();
				panel.appendChild(div2);
				makeLabelRangeNumber("Refrence", {min:0, max:256, value:128,}, control, div2);
				break;
			case "Brightness":
				makeLabelRangeNumber("Brightness", {min:-100, max:100, value:0,}, control, div);
				break;
			case "Gamma":
				makeLabelRangeNumber("Gamma" , {min:0, max:3, value:3, step:.1,}, control, div);
				break;
			case "Quantization":
				makeLabelRangeNumber("Level" , {min:1, max:15, value:15,}, control, div);
				break;
			case "Histogram Stretch":
				makeLabelRangeNumber("Min" , {min:0, max:256, value:0,}, control, div);
				var div2 = makeDiv();
				panel.appendChild(div2);
				makeLabelRangeNumber("Max" , {min:0, max:256, value:256,}, control, div2);
				var minnum = document.getElementById("number-min-"+(control));
				var maxnum = document.getElementById("number-max-"+(control));
				var minran = document.getElementById("range-min-"+(control));
				var maxran = document.getElementById("range-max-"+(control));
				minnum.addEventListener("input", function() {
					maxnum.min = minnum.value;
					maxran.min = minran.value;
				});
				maxnum.addEventListener("input", function() {
					minnum.max = maxnum.value;
					minran.max = maxran.value;
				});
				minran.addEventListener("input", function() {
					maxnum.min = minnum.value;
					maxran.min = minran.value;
				});
				maxran.addEventListener("input", function() {
					minnum.max = maxnum.value;
					minran.max = maxran.value;
				});
				break;
			case "Blur":
				makeLabelRangeNumber("Horizontal" , {min:1, max:15, value:1, step:2}, control, div);
				var div2 = makeDiv();
				panel.appendChild(div2);
				makeLabelRangeNumber("Vertical" , {min:1, max:15, value:1, step:2}, control, div2);
				var xnum = document.getElementById("number-horizontal-"+(control));
				var ynum = document.getElementById("number-vertical-"+(control));
				var xran = document.getElementById("range-horizontal-"+(control));
				var yran = document.getElementById("range-vertical-"+(control));
				xnum.addEventListener('input', function() {
					reDraw(type, control, xnum.value, ynum.value);
				});
				ynum.addEventListener('input', function() {
					reDraw(type, control, xnum.value, ynum.value);
				});
				xran.addEventListener('input', function() {
					reDraw(type, control, xnum.value, ynum.value);
				});
				yran.addEventListener('input', function() {
					reDraw(type, control, xnum.value, ynum.value);
				});
				break;
			case "Sharpen":
				makeLabelRangeNumber("Horizontal", {min:1, max:15, value:1, step:2}, control, div);
				var div2 = makeDiv();
				panel.appendChild(div2);
				makeLabelRangeNumber("Vertical", {min:1, max:15, value:1, step:2}, control, div2);
				var div3 = makeDiv();
				panel.appendChild(div3);
				makeLabelRangeNumber("Factor", {min:1, max:15, value:1, step:1}, control, div3);
				var xnum = document.getElementById("number-horizontal-"+(control));
				var ynum = document.getElementById("number-vertical-"+(control));
				var xran = document.getElementById("range-horizontal-"+(control));
				var yran = document.getElementById("range-vertical-"+(control));
				xnum.addEventListener('input', function() {
					reDraw(type, control, xnum.value, ynum.value);
				});
				ynum.addEventListener('input', function() {
					reDraw(type, control, xnum.value, ynum.value);
				});
				xran.addEventListener('input', function() {
					reDraw(type, control, xnum.value, ynum.value);
				});
				yran.addEventListener('input', function() {
					reDraw(type, control, xnum.value, ynum.value);
				});
				break;
			case "Transform":
				div.classList.add("btn-group");
				var base = document.createElement("a");
				base.classList.add("btn");
				base.classList.add("btn-default");
				base.textContent = "Cartesian"
				base.id = "button-" + control;
				div.appendChild(base);
				var car = document.createElement("a");
				car.classList.add("btn");
				car.classList.add("btn-default");
				car.classList.add("dropdown-toggle");
				car.setAttribute("data-toggle", "dropdown");
				car.setAttribute("aria-expanded", "false");
				var carrot = document.createElement("span");
				carrot.classList.add("caret");
				car.appendChild(carrot);
				div.appendChild(car);
				var menu = document.createElement("ul");
				menu.classList.add("dropdown-menu");
				div.appendChild(menu);
				var cart1 = document.createElement("li");
				var cart2 = document.createElement("a");
				cart2.textContent = "Cartesian";
				cart1.appendChild(cart2);
				menu.appendChild(cart1);
				cart2.addEventListener("click", function() {
					base.textContent = "Cartesian";
					drawAllFilters();
				});
				
				var pol1 = document.createElement("li");
				var pol2 = document.createElement("a");
				pol2.textContent = "Polar";
				pol1.appendChild(pol2);
				menu.appendChild(pol1);
				pol2.addEventListener("click", function() {
					base.textContent = "Polar";
					drawAllFilters();
				});
				
				var log1 = document.createElement("li");
				var log2 = document.createElement("a");
				log2.textContent = "Log Polar";
				log1.appendChild(log2);
				menu.appendChild(log1);
				log2.addEventListener("click", function() {
					base.textContent = "Log Polar";
					drawAllFilters();
				});
				menu.appendChild(document.createElement("div"));
				break;
					}
		var up = document.getElementById("up-" + type.toLowerCase().replace(" ", "_") + "-" + control);
		up.addEventListener('click', function(e) {
			e.preventDefault();
			swapPanels(panel, true, type, control);
		});
		var down = document.getElementById("down-" + type.toLowerCase().replace(" ", "_") + "-" + control);	
		down.addEventListener('click', function(e) {
			e.preventDefault();
			swapPanels(panel, false, type, control);
		});
		var reset = document.getElementById("reset-" + type.toLowerCase().replace(" ", "_") + "-" + control);
		reset.addEventListener('click', function(e) {
			e.preventDefault();
			resetControls(type, control);
		});
		var minus = document.getElementById("minus-" + type.toLowerCase().replace(" ", "_") + "-" + control);
		minus.addEventListener('click', function(e) {
			e.preventDefault();
			var loc = panels.indexOf(panel);
			fieldset.removeChild(panel);
			frameBuffers.splice(loc, 1);
			textures.splice(loc, 1);
			programOrder.splice(loc, 1);
			panels.splice(loc, 1);
			drawPanels();
			drawAllFilters();
		});
	}
	
	function makeLabelRangeNumber(name, {min, max, value, step,}, ith, div) {
		var label = makeLabel(name, ith);
		div.appendChild(label);
		label.htmlFor = ("number-"+name.toLowerCase().replace(" ", "_")+"-" + ith);
		var range = makeRange(name, min, max, value, ith);
		var divh1 = document.createElement("div");
		divh1.classList.add("col-sm-5");
		div.appendChild(divh1);
		divh1.appendChild(range);
		var number = makeNumber(name, min, max, value, ith);
		var divh2 = document.createElement("div");
		divh2.classList.add("col-sm-5");
		div.appendChild(divh2);
		divh2.appendChild(number);
		range.addEventListener('input', function() {
			var tmp = range.value;
			if (tmp < min) {
				tmp = min;
			} else if (tmp > max) {
				tmp = max;
			}
			number.value = tmp;
			range.value = tmp;
			drawAllFilters();
		});
		number.addEventListener('input', function() {
			var tmp = number.value;
			if (tmp < min) {
				tmp = min;
			} else if (tmp > max) {
				tmp = max;
			}
			number.value = tmp;
			range.value = tmp;
			drawAllFilters();
		});
		if (typeof step !== 'undefined') {
			number.step = step;
			range.step = step;
		}
		range.value = number.value;
	}
	
	function makeCheckbox(name, ith) {	
		var checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.classList.add("form-control");
		checkbox.classList.add("col-sm-2");
		checkbox.id = "checkbox-"+name.toLowerCase().replace(" ", "_")+"-" + ith;
		return checkbox;
	}
	
	function makeNumber(name, min, max, value, ith) {	
		var number = document.createElement("input");
		number.type = "number";
		number.classList.add("form-control");
		number.classList.add("col-sm-5");
		number.classList.add("center-block");
		number.value = value;
		number.min = min;
		number.max = max;
		number.id = "number-"+name.toLowerCase().replace(" ", "_")+"-" + ith;
		return number;
	}
	
	function makeRange(name, min, max, value, ith) {
		var range = document.createElement("input");
		range.type = "range";
		range.classList.add("form-control");
		range.classList.add("col-sm-12");
		range.classList.add("center-block");
		range.value = value;
		range.min = min;
		range.max = max;
		range.id = "range-"+name.toLowerCase().replace(" ", "_")+"-" + ith;
		return range;
	}
	
	function makeLabel(name, ith) {	
		var label = document.createElement("label");
		label.classList.add("col-sm-2");
		label.classList.add("center-block");
		label.classList.add("control-label");
		label.textContent = name;
		return label;
	}
	
	function makeDiv() {
		var div = document.createElement("div");
		div.classList.add("form-group");
		div.classList.add("row");
		div.classList.add("panel-body");
		return div;
	}
	
	function makePanel(name, ith) {
		var div = document.createElement("div");
		div.classList.add("panel");
		div.classList.add("panel-default");
		div.id = "panel-" + name.toLowerCase().replace(" ", "_") + "-" + ith;
		var divh = document.createElement("div");
		divh.classList.add("panel-heading");
		divh.classList.add("container-fluid");
		var h3 = document.createElement("h3");
		h3.classList.add("panel-title");
		h3.classList.add("col-sm-4");
		h3.classList.add("col-md-offset-3");
		h3.style.paddingTop = "7.5px";
		h3.textContent = name;
		divh.appendChild(h3);
		var divbtn = document.createElement("div");
		var up = document.createElement("button");
		up.classList.add("col-sm-1");
		up.classList.add("btn");
		up.classList.add("col-md-offset-1");
		up.classList.add("btn-info");
		up.classList.add("fa");
		up.classList.add("fa-chevron-up");
		up.classList.add("align-right");
		up.id = "up-" + name.toLowerCase().replace(" ", "_") + "-" + ith;
		divbtn.appendChild(up);
		var down = document.createElement("button");
		down.classList.add("col-sm-1");
		down.classList.add("btn");
		down.classList.add("btn-info");
		down.classList.add("fa");
		down.classList.add("fa-chevron-down");
		down.classList.add("align-right");
		down.id = "down-" + name.toLowerCase().replace(" ", "_") + "-" + ith;
		divbtn.appendChild(down);
		var reset = document.createElement("button");
		reset.classList.add("col-sm-1");
		reset.classList.add("btn");
		reset.classList.add("btn-info");
		reset.classList.add("fa");
		reset.classList.add("fa-refresh");
		reset.classList.add("align-right");
		reset.id = "reset-" + name.toLowerCase().replace(" ", "_") + "-" + ith;
		divbtn.appendChild(reset);
		var minus = document.createElement("button");
		minus.classList.add("col-sm-1");
		minus.classList.add("btn");
		minus.classList.add("btn-danger");
		minus.classList.add("fa");
		minus.classList.add("fa-minus");
		minus.classList.add("align-right");
		minus.id = "minus-" + name.toLowerCase().replace(" ", "_") + "-" + ith;
		divbtn.appendChild(minus);
		divh.appendChild(divbtn);
		div.appendChild(divh);
		return div;
	}
})();