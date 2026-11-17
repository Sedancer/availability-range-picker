import React, { useEffect, useRef } from 'react';

/**
 * WebGL Fluid Simulation based on the classic Navier-Stokes fluid solver by PavelDoGreat.
 * Runs in the background with pointer-events: none, listening to global window movements.
 */
export const FluidBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // WebGL configuration
    const isMobile = window.innerWidth < 768;
    const config = {
      SIM_RESOLUTION: isMobile ? 64 : 128,
      DYE_RESOLUTION: isMobile ? 256 : 512,
      DENSITY_DISSIPATION: 1.2,
      VELOCITY_DISSIPATION: 0.3,
      PRESSURE: 0.8,
      PRESSURE_ITERATIONS: isMobile ? 10 : 18,
      CURL: 28,
      SPLAT_RADIUS: isMobile ? 0.22 : 0.28,
      SPLAT_FORCE: 5500,
      COLOR_UPDATE_SPEED: 8,
    };

    const params = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    };

    let gl = (canvas.getContext('webgl2', params) ||
      canvas.getContext('webgl', params) ||
      canvas.getContext('experimental-webgl', params)) as WebGLRenderingContext | WebGL2RenderingContext | null;

    if (!gl) return;

    const isWebGL2 = 'WebGL2RenderingContext' in window && gl instanceof WebGL2RenderingContext;
    let halfFloatExt: any;
    let linearExt: any;

    if (isWebGL2) {
      gl.getExtension('EXT_color_buffer_float');
      linearExt = gl.getExtension('OES_texture_float_linear');
    } else {
      halfFloatExt = gl.getExtension('OES_texture_half_float');
      linearExt = gl.getExtension('OES_texture_half_float_linear');
    }

    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    const halfFloatTexType = isWebGL2
      ? (gl as WebGL2RenderingContext).HALF_FLOAT
      : halfFloatExt
      ? halfFloatExt.HALF_FLOAT_OES
      : gl.UNSIGNED_BYTE;

    function createShader(glCtx: any, type: number, source: string) {
      const shader = glCtx.createShader(type);
      glCtx.shaderSource(shader, source);
      glCtx.compileShader(shader);
      return shader;
    }

    function createProgram(glCtx: any, vsSource: string, fsSource: string) {
      const vs = createShader(glCtx, glCtx.VERTEX_SHADER, vsSource);
      const fs = createShader(glCtx, glCtx.FRAGMENT_SHADER, fsSource);
      const program = glCtx.createProgram();
      glCtx.attachShader(program, vs);
      glCtx.attachShader(program, fs);
      glCtx.linkProgram(program);

      const uniforms: Record<string, WebGLUniformLocation> = {};
      const uniformCount = glCtx.getProgramParameter(program, glCtx.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        const name = glCtx.getActiveUniform(program, i).name;
        uniforms[name] = glCtx.getUniformLocation(program, name);
      }
      return { program, uniforms };
    }

    // Base Quad Shaders
    const baseVertexShader = `
      precision highp float;
      attribute vec2 aPosition;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform vec2 texelSize;

      void main () {
        vUv = aPosition * 0.5 + 0.5;
        vL = vUv - vec2(texelSize.x, 0.0);
        vR = vUv + vec2(texelSize.x, 0.0);
        vT = vUv + vec2(0.0, texelSize.y);
        vB = vUv - vec2(0.0, texelSize.y);
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    const clearShader = `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      uniform sampler2D uTexture;
      uniform float value;
      void main () {
        gl_FragColor = value * texture2D(uTexture, vUv);
      }
    `;

    const splatShader = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspectRatio;
      uniform vec3 color;
      uniform vec2 point;
      uniform float radius;

      void main () {
        vec2 p = vUv - point.xy;
        p.x *= aspectRatio;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        vec3 base = texture2D(uTarget, vUv).xyz;
        gl_FragColor = vec4(base + splat, 1.0);
      }
    `;

    const advectionShader = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uVelocity;
      uniform sampler2D uSource;
      uniform vec2 texelSize;
      uniform float dt;
      uniform float dissipation;

      void main () {
        vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
        gl_FragColor = dissipation * texture2D(uSource, coord);
      }
    `;

    const divergenceShader = `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;

      void main () {
        float L = texture2D(uVelocity, vL).x;
        float R = texture2D(uVelocity, vR).x;
        float T = texture2D(uVelocity, vT).y;
        float B = texture2D(uVelocity, vB).y;
        vec2 C = texture2D(uVelocity, vUv).xy;
        if (vL.x < 0.0) { L = -C.x; }
        if (vR.x > 1.0) { R = -C.x; }
        if (vT.y > 1.0) { T = -C.y; }
        if (vB.y < 0.0) { B = -C.y; }
        float div = 0.5 * (R - L + T - B);
        gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
      }
    `;

    const curlShader = `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uVelocity;

      void main () {
        float L = texture2D(uVelocity, vL).y;
        float R = texture2D(uVelocity, vR).y;
        float T = texture2D(uVelocity, vT).x;
        float B = texture2D(uVelocity, vB).x;
        float vorticity = R - L - T + B;
        gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
      }
    `;

    const vorticityShader = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      varying vec2 vL;
      varying vec2 vR;
      varying vec2 vT;
      varying vec2 vB;
      uniform sampler2D uVelocity;
      uniform sampler2D uCurl;
      uniform float curl;
      uniform float dt;

      void main () {
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;

        vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        force /= length(force) + 0.0001;
        force *= curl * C;
        force.y *= -1.0;

        vec2 vel = texture2D(uVelocity, vUv).xy;
        gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
      }
    `;

    const pressureShader = `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uDivergence;

      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        float C = texture2D(uPressure, vUv).x;
        float divergence = texture2D(uDivergence, vUv).x;
        float pressure = (L + R + B + T - divergence) * 0.25;
        gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
      }
    `;

    const gradientSubtractShader = `
      precision mediump float;
      precision mediump sampler2D;
      varying highp vec2 vUv;
      varying highp vec2 vL;
      varying highp vec2 vR;
      varying highp vec2 vT;
      varying highp vec2 vB;
      uniform sampler2D uPressure;
      uniform sampler2D uVelocity;

      void main () {
        float L = texture2D(uPressure, vL).x;
        float R = texture2D(uPressure, vR).x;
        float T = texture2D(uPressure, vT).x;
        float B = texture2D(uPressure, vB).x;
        vec2 velocity = texture2D(uVelocity, vUv).xy;
        velocity.xy -= vec2(R - L, T - B);
        gl_FragColor = vec4(velocity, 0.0, 1.0);
      }
    `;

    // Display shader tailored for aesthetic smoke on dark background
    const displayShader = `
      precision highp float;
      precision highp sampler2D;
      varying vec2 vUv;
      uniform sampler2D uTexture;

      void main () {
        vec3 c = texture2D(uTexture, vUv).rgb;
        float a = max(c.r, max(c.g, c.b));
        // Subtle opacity so text remains 100% readable
        gl_FragColor = vec4(c, a * 0.65);
      }
    `;

    // Compile programs
    const clearProg = createProgram(gl, baseVertexShader, clearShader);
    const splatProg = createProgram(gl, baseVertexShader, splatShader);
    const advectionProg = createProgram(gl, baseVertexShader, advectionShader);
    const divergenceProg = createProgram(gl, baseVertexShader, divergenceShader);
    const curlProg = createProgram(gl, baseVertexShader, curlShader);
    const vorticityProg = createProgram(gl, baseVertexShader, vorticityShader);
    const pressureProg = createProgram(gl, baseVertexShader, pressureShader);
    const gradSubtractProg = createProgram(gl, baseVertexShader, gradientSubtractShader);
    const displayProg = createProgram(gl, baseVertexShader, displayShader);

    // Quad Buffer
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    function blit(targetFBO: any) {
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, targetFBO ? targetFBO.fbo : null);
      gl!.bindBuffer(gl!.ARRAY_BUFFER, quadBuffer);
      gl!.vertexAttribPointer(0, 2, gl!.FLOAT, false, 0, 0);
      gl!.enableVertexAttribArray(0);
      gl!.drawArrays(gl!.TRIANGLE_FAN, 0, 4);
    }

    // FBO Creation
    function createFBO(w: number, h: number, internalFormat: any, format: any, type: any, minFilter: number) {
      const texture = gl!.createTexture();
      gl!.bindTexture(gl!.TEXTURE_2D, texture);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, minFilter);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, minFilter);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

      const fbo = gl!.createFramebuffer();
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, texture, 0);

      return {
        texture,
        fbo,
        width: w,
        height: h,
        texelSizeX: 1.0 / w,
        texelSizeY: 1.0 / h,
        attach(id: number) {
          gl!.activeTexture(gl!.TEXTURE0 + id);
          gl!.bindTexture(gl!.TEXTURE_2D, texture);
          return id;
        },
      };
    }

    function createDoubleFBO(w: number, h: number, internalFormat: any, format: any, type: any, minFilter: number) {
      let fbo1 = createFBO(w, h, internalFormat, format, type, minFilter);
      let fbo2 = createFBO(w, h, internalFormat, format, type, minFilter);
      return {
        width: w,
        height: h,
        texelSizeX: fbo1.texelSizeX,
        texelSizeY: fbo1.texelSizeY,
        get read() {
          return fbo1;
        },
        set read(val) {
          fbo1 = val;
        },
        get write() {
          return fbo2;
        },
        set write(val) {
          fbo2 = val;
        },
        swap() {
          const temp = fbo1;
          fbo1 = fbo2;
          fbo2 = temp;
        },
      };
    }

    let density: any;
    let velocity: any;
    let divergence: any;
    let curl: any;
    let pressure: any;

    function initFBOs() {
      const simW = config.SIM_RESOLUTION;
      const simH = Math.round(config.SIM_RESOLUTION * (canvas!.height / canvas!.width));
      const dyeW = config.DYE_RESOLUTION;
      const dyeH = Math.round(config.DYE_RESOLUTION * (canvas!.height / canvas!.width));

      const filter = linearExt ? gl!.LINEAR : gl!.NEAREST;
      const rgba = isWebGL2 ? (gl as WebGL2RenderingContext).RGBA16F : gl!.RGBA;
      const rg = isWebGL2 ? (gl as WebGL2RenderingContext).RG16F : gl!.RGBA;
      const r = isWebGL2 ? (gl as WebGL2RenderingContext).R16F : gl!.RGBA;
      const formatRG = isWebGL2 ? (gl as WebGL2RenderingContext).RG : gl!.RGBA;
      const formatR = isWebGL2 ? (gl as WebGL2RenderingContext).RED : gl!.RGBA;

      density = createDoubleFBO(dyeW, dyeH, rgba, gl!.RGBA, halfFloatTexType, filter);
      velocity = createDoubleFBO(simW, simH, rg, formatRG, halfFloatTexType, filter);
      divergence = createFBO(simW, simH, r, formatR, halfFloatTexType, gl!.NEAREST);
      curl = createFBO(simW, simH, r, formatR, halfFloatTexType, gl!.NEAREST);
      pressure = createDoubleFBO(simW, simH, r, formatR, halfFloatTexType, gl!.NEAREST);
    }

    function resizeCanvas() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
        initFBOs();
      }
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Color generator - refined emerald, cyan, and subtle violet palette to match the app
    let colorTimer = 0;
    function generateColor() {
      colorTimer += 0.05;
      // High-elegance emerald/cyan palette with occasional warm tones
      const r = (Math.sin(colorTimer * 0.4) * 0.5 + 0.5) * 0.2;
      const g = (Math.sin(colorTimer * 0.5) * 0.3 + 0.7) * 0.8;
      const b = (Math.cos(colorTimer * 0.3) * 0.5 + 0.5) * 0.6;
      return [r, g, b];
    }

    function splat(x: number, y: number, dx: number, dy: number, color: number[]) {
      gl!.viewport(0, 0, velocity.width, velocity.height);
      gl!.useProgram(splatProg.program);
      gl!.uniform1i(splatProg.uniforms.uTarget, velocity.read.attach(0));
      gl!.uniform1f(splatProg.uniforms.aspectRatio, canvas!.width / canvas!.height);
      gl!.uniform2f(splatProg.uniforms.point, x, y);
      gl!.uniform3f(splatProg.uniforms.color, dx, dy, 0.0);
      gl!.uniform1f(splatProg.uniforms.radius, config.SPLAT_RADIUS / 100.0);
      blit(velocity.write);
      velocity.swap();

      gl!.viewport(0, 0, density.width, density.height);
      gl!.uniform1i(splatProg.uniforms.uTarget, density.read.attach(0));
      gl!.uniform3f(splatProg.uniforms.color, color[0], color[1], color[2]);
      blit(density.write);
      density.swap();
    }

    // Pointer event listeners on WINDOW so fluid reacts to ALL movements everywhere
    let lastX = 0;
    let lastY = 0;
    let hasMoved = false;

    function handlePointerMove(clientX: number, clientY: number) {
      const x = clientX / window.innerWidth;
      const y = 1.0 - clientY / window.innerHeight;

      if (!hasMoved) {
        lastX = x;
        lastY = y;
        hasMoved = true;
        return;
      }

      const dx = (x - lastX) * config.SPLAT_FORCE;
      const dy = (y - lastY) * config.SPLAT_FORCE;

      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        splat(x, y, dx, dy, generateColor());
      }

      lastX = x;
      lastY = y;
    }

    const onMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    // Initial gentle splats for visual beauty on load
    setTimeout(() => {
      for (let i = 0; i < 3; i++) {
        const x = 0.3 + Math.random() * 0.4;
        const y = 0.3 + Math.random() * 0.4;
        const dx = (Math.random() - 0.5) * 1200;
        const dy = (Math.random() - 0.5) * 1200;
        splat(x, y, dx, dy, generateColor());
      }
    }, 200);

    // Animation Loop
    let lastTime = Date.now();
    let animId: number;

    function step() {
      const now = Date.now();
      let dt = Math.min((now - lastTime) / 1000, 0.02);
      lastTime = now;

      // 1. Curl
      gl!.viewport(0, 0, velocity.width, velocity.height);
      gl!.useProgram(curlProg.program);
      gl!.uniform2f(curlProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl!.uniform1i(curlProg.uniforms.uVelocity, velocity.read.attach(0));
      blit(curl);

      // 2. Vorticity
      gl!.useProgram(vorticityProg.program);
      gl!.uniform2f(vorticityProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl!.uniform1i(vorticityProg.uniforms.uVelocity, velocity.read.attach(0));
      gl!.uniform1i(vorticityProg.uniforms.uCurl, curl.attach(1));
      gl!.uniform1f(vorticityProg.uniforms.curl, config.CURL);
      gl!.uniform1f(vorticityProg.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      // 3. Divergence
      gl!.useProgram(divergenceProg.program);
      gl!.uniform2f(divergenceProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl!.uniform1i(divergenceProg.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergence);

      // 4. Clear Pressure
      gl!.useProgram(clearProg.program);
      gl!.uniform1i(clearProg.uniforms.uTexture, pressure.read.attach(0));
      gl!.uniform1f(clearProg.uniforms.value, config.PRESSURE);
      blit(pressure.write);
      pressure.swap();

      // 5. Pressure Poisson iterations
      gl!.useProgram(pressureProg.program);
      gl!.uniform2f(pressureProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl!.uniform1i(pressureProg.uniforms.uDivergence, divergence.attach(1));
      for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
        gl!.uniform1i(pressureProg.uniforms.uPressure, pressure.read.attach(0));
        blit(pressure.write);
        pressure.swap();
      }

      // 6. Subtract Pressure Gradient
      gl!.useProgram(gradSubtractProg.program);
      gl!.uniform2f(gradSubtractProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl!.uniform1i(gradSubtractProg.uniforms.uPressure, pressure.read.attach(0));
      gl!.uniform1i(gradSubtractProg.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      // 7. Advect Velocity
      gl!.useProgram(advectionProg.program);
      gl!.uniform2f(advectionProg.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl!.uniform1i(advectionProg.uniforms.uVelocity, velocity.read.attach(0));
      gl!.uniform1i(advectionProg.uniforms.uSource, velocity.read.attach(0));
      gl!.uniform1f(advectionProg.uniforms.dt, dt);
      gl!.uniform1f(advectionProg.uniforms.dissipation, 1.0 - config.VELOCITY_DISSIPATION * dt);
      blit(velocity.write);
      velocity.swap();

      // 8. Advect Density (Color Dye)
      gl!.viewport(0, 0, density.width, density.height);
      gl!.uniform2f(advectionProg.uniforms.texelSize, density.texelSizeX, density.texelSizeY);
      gl!.uniform1i(advectionProg.uniforms.uVelocity, velocity.read.attach(0));
      gl!.uniform1i(advectionProg.uniforms.uSource, density.read.attach(1));
      gl!.uniform1f(advectionProg.uniforms.dissipation, 1.0 - config.DENSITY_DISSIPATION * dt);
      blit(density.write);
      density.swap();

      // 9. Display to screen
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
      gl!.useProgram(displayProg.program);
      gl!.uniform1i(displayProg.uniforms.uTexture, density.read.attach(0));
      blit(null);

      animId = requestAnimationFrame(step);
    }

    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, []);

  return (
    <canvas
      id="fluid-canvas"
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-80"
      style={{ display: 'block' }}
    />
  );
};
