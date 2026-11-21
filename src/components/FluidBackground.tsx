import React, { useEffect, useRef } from 'react';

/**
 * WebGL Fluid Simulation – Navier-Stokes fluid & smoke solver.
 * Uses WebGL1 with OES_texture_half_float for broad compatibility.
 * Features:
 *   - Luminous emerald, cyan, and violet color palette matching TimeSlotter.
 *   - Ambient gentle swirling clouds so the background is always alive.
 *   - Interactive smoke trails on pointer movement and click/touch bursts.
 *   - Correct mathematical dissipation (1 / (1 + diss * dt)) preventing instant decay.
 */
export const FluidBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── WebGL Context ────────────────────────────────────────────────────────
    const params: WebGLContextAttributes = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: false,
      preserveDrawingBuffer: false,
    };
    const gl = (
      canvas.getContext('webgl', params) ||
      canvas.getContext('experimental-webgl', params)
    ) as WebGLRenderingContext | null;

    if (!gl) return;

    const halfFloatExt = gl.getExtension('OES_texture_half_float');
    const linearExt    = gl.getExtension('OES_texture_half_float_linear');
    if (!halfFloatExt) return;

    const halfFloat  = halfFloatExt.HALF_FLOAT_OES;
    const filterType = linearExt ? gl.LINEAR : gl.NEAREST;

    gl.clearColor(0, 0, 0, 0);

    const isMobile = window.innerWidth < 768;
    const CFG = {
      SIM: isMobile ? 64 : 128,
      DYE: isMobile ? 256 : 512,
      PRESSURE_ITERS: isMobile ? 12 : 20,
      DENSITY_DISS: 0.85,  // gentle dissipation: lingers beautifully
      VEL_DISS: 0.2,       // smooth, silky fluid momentum
      PRESSURE: 0.8,
      CURL: 32,            // nice swirling vortices
      SPLAT_R: 0.0045,     // lush, visible cloud radius
      SPLAT_F: 6000,       // responsive impulse
    };

    // ── Shader helpers ───────────────────────────────────────────────────────
    function compileShader(type: number, src: string): WebGLShader {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
        console.warn('[Fluid] shader compile error:', gl!.getShaderInfoLog(s));
      }
      return s;
    }

    function makeProgram(vsrc: string, fsrc: string) {
      const p = gl!.createProgram()!;
      gl!.attachShader(p, compileShader(gl!.VERTEX_SHADER, vsrc));
      gl!.attachShader(p, compileShader(gl!.FRAGMENT_SHADER, fsrc));
      gl!.linkProgram(p);
      if (!gl!.getProgramParameter(p, gl!.LINK_STATUS)) {
        console.warn('[Fluid] program link error:', gl!.getProgramInfoLog(p));
      }
      const uniforms: Record<string, WebGLUniformLocation | null> = {};
      const n = gl!.getProgramParameter(p, gl!.ACTIVE_UNIFORMS) as number;
      for (let i = 0; i < n; i++) {
        const name = gl!.getActiveUniform(p, i)!.name;
        uniforms[name] = gl!.getUniformLocation(p, name);
      }
      return { p, u: uniforms };
    }

    // ── GLSL Shaders ─────────────────────────────────────────────────────────
    const BASE_VS = `
      precision highp float;
      attribute vec2 aPos;
      varying vec2 vUv, vL, vR, vT, vB;
      uniform vec2 texel;
      void main(){
        vUv = aPos * .5 + .5;
        vL = vUv - vec2(texel.x, 0.);
        vR = vUv + vec2(texel.x, 0.);
        vT = vUv + vec2(0., texel.y);
        vB = vUv - vec2(0., texel.y);
        gl_Position = vec4(aPos, 0., 1.);
      }`;

    const DISPLAY_VS = `
      precision highp float;
      attribute vec2 aPos;
      varying vec2 vUv;
      void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;

    const CLEAR_FS = `
      precision mediump float;
      varying vec2 vUv;
      uniform sampler2D uTex;
      uniform float value;
      void main(){ gl_FragColor = value * texture2D(uTex, vUv); }`;

    const DISPLAY_FS = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTex;
      void main(){
        vec3 c = texture2D(uTex, vUv).rgb;
        float a = max(c.r, max(c.g, c.b));
        // Luminous smoke display blending with the dark theme
        gl_FragColor = vec4(c, clamp(a * 0.85, 0.0, 1.0));
      }`;

    const SPLAT_FS = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uTarget;
      uniform float aspect;
      uniform vec2 point;
      uniform vec3 color;
      uniform float radius;
      void main(){
        vec2 p = vUv - point;
        p.x *= aspect;
        vec3 base = texture2D(uTarget, vUv).rgb;
        vec3 splat = exp(-dot(p, p) / radius) * color;
        gl_FragColor = vec4(base + splat, 1.0);
      }`;

    const ADVECT_FS = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uVel, uSrc;
      uniform vec2 texel;
      uniform float dt, diss;
      void main(){
        vec2 coord = vUv - dt * texture2D(uVel, vUv).xy * texel;
        gl_FragColor = diss * texture2D(uSrc, coord);
      }`;

    const DIVERGENCE_FS = `
      precision mediump float;
      varying vec2 vUv, vL, vR, vT, vB;
      uniform sampler2D uVel;
      void main(){
        float L = texture2D(uVel, vL).x;
        float R = texture2D(uVel, vR).x;
        float T = texture2D(uVel, vT).y;
        float B = texture2D(uVel, vB).y;
        vec2 C = texture2D(uVel, vUv).xy;
        if(vL.x < 0.) L = -C.x;
        if(vR.x > 1.) R = -C.x;
        if(vT.y > 1.) T = -C.y;
        if(vB.y < 0.) B = -C.y;
        gl_FragColor = vec4(0.5 * (R - L + T - B), 0., 0., 1.);
      }`;

    const CURL_FS = `
      precision mediump float;
      varying vec2 vUv, vL, vR, vT, vB;
      uniform sampler2D uVel;
      void main(){
        float L = texture2D(uVel, vL).y;
        float R = texture2D(uVel, vR).y;
        float T = texture2D(uVel, vT).x;
        float B = texture2D(uVel, vB).x;
        gl_FragColor = vec4(0.5 * (R - L - T + B), 0., 0., 1.);
      }`;

    const VORTICITY_FS = `
      precision highp float;
      varying vec2 vUv, vL, vR, vT, vB;
      uniform sampler2D uVel, uCurl;
      uniform float curl, dt;
      void main(){
        float L = texture2D(uCurl, vL).x;
        float R = texture2D(uCurl, vR).x;
        float T = texture2D(uCurl, vT).x;
        float B = texture2D(uCurl, vB).x;
        float C = texture2D(uCurl, vUv).x;
        vec2 f = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
        f /= length(f) + 0.0001;
        f *= curl * C;
        f.y *= -1.0;
        vec2 v = texture2D(uVel, vUv).xy;
        gl_FragColor = vec4(v + f * dt, 0.0, 1.0);
      }`;

    const PRESSURE_FS = `
      precision mediump float;
      varying vec2 vUv, vL, vR, vT, vB;
      uniform sampler2D uPres, uDiv;
      void main(){
        float L = texture2D(uPres, vL).x;
        float R = texture2D(uPres, vR).x;
        float T = texture2D(uPres, vT).x;
        float B = texture2D(uPres, vB).x;
        float d = texture2D(uDiv, vUv).x;
        gl_FragColor = vec4((L + R + B + T - d) * 0.25, 0., 0., 1.);
      }`;

    const GRAD_FS = `
      precision mediump float;
      varying vec2 vUv, vL, vR, vT, vB;
      uniform sampler2D uPres, uVel;
      void main(){
        float L = texture2D(uPres, vL).x;
        float R = texture2D(uPres, vR).x;
        float T = texture2D(uPres, vT).x;
        float B = texture2D(uPres, vB).x;
        vec2 v = texture2D(uVel, vUv).xy;
        gl_FragColor = vec4(v - vec2(R - L, T - B), 0., 1.);
      }`;

    // ── Compile programs ─────────────────────────────────────────────────────
    const pClear    = makeProgram(BASE_VS, CLEAR_FS);
    const pSplat    = makeProgram(BASE_VS, SPLAT_FS);
    const pAdvect   = makeProgram(BASE_VS, ADVECT_FS);
    const pDiv      = makeProgram(BASE_VS, DIVERGENCE_FS);
    const pCurl     = makeProgram(BASE_VS, CURL_FS);
    const pVort     = makeProgram(BASE_VS, VORTICITY_FS);
    const pPressure = makeProgram(BASE_VS, PRESSURE_FS);
    const pGrad     = makeProgram(BASE_VS, GRAD_FS);
    const pDisplay  = makeProgram(DISPLAY_VS, DISPLAY_FS);

    // ── Quad Buffer ──────────────────────────────────────────────────────────
    const quadBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);

    function setupAttrib(prog: WebGLProgram) {
      const loc = gl!.getAttribLocation(prog, 'aPos');
      gl!.bindBuffer(gl!.ARRAY_BUFFER, quadBuf);
      gl!.vertexAttribPointer(loc, 2, gl!.FLOAT, false, 0, 0);
      gl!.enableVertexAttribArray(loc);
    }

    // ── FBO structure ────────────────────────────────────────────────────────
    type FBO = {
      texture: WebGLTexture;
      fbo: WebGLFramebuffer;
      width: number;
      height: number;
      texelX: number;
      texelY: number;
      bind(id: number): number;
    };

    function makeFBO(w: number, h: number, filter: number): FBO {
      const texture = gl!.createTexture()!;
      gl!.bindTexture(gl!.TEXTURE_2D, texture);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, filter);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, filter);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, w, h, 0, gl!.RGBA, halfFloat, null);

      const fbo = gl!.createFramebuffer()!;
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
      gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, texture, 0);

      return {
        texture,
        fbo,
        width: w,
        height: h,
        texelX: 1 / w,
        texelY: 1 / h,
        bind(id: number) {
          gl!.activeTexture(gl!.TEXTURE0 + id);
          gl!.bindTexture(gl!.TEXTURE_2D, texture);
          return id;
        },
      };
    }

    type DoubleFBO = {
      read: FBO;
      write: FBO;
      width: number;
      height: number;
      texelX: number;
      texelY: number;
      swap(): void;
    };

    function makeDoubleFBO(w: number, h: number, filter: number): DoubleFBO {
      let a = makeFBO(w, h, filter);
      let b = makeFBO(w, h, filter);
      return {
        get read() { return a; },
        get write() { return b; },
        width: w,
        height: h,
        texelX: a.texelX,
        texelY: a.texelY,
        swap() { [a, b] = [b, a]; },
      };
    }

    function blit(target: FBO | null) {
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, target ? target.fbo : null);
      if (target) gl!.viewport(0, 0, target.width, target.height);
      gl!.drawArrays(gl!.TRIANGLE_FAN, 0, 4);
    }

    // ── FBO Allocation ───────────────────────────────────────────────────────
    let vel: DoubleFBO, dye: DoubleFBO, div: FBO, curl: FBO, pres: DoubleFBO;
    let fboReady = false;

    function initFBOs() {
      const cw = canvas!.width;
      const ch = canvas!.height;
      if (!cw || !ch) { fboReady = false; return; }

      const simW = CFG.SIM;
      const simH = Math.max(1, Math.round(CFG.SIM * ch / cw));
      const dyeW = CFG.DYE;
      const dyeH = Math.max(1, Math.round(CFG.DYE * ch / cw));

      try {
        dye  = makeDoubleFBO(dyeW, dyeH, filterType);
        vel  = makeDoubleFBO(simW, simH, filterType);
        div  = makeFBO(simW, simH, gl!.NEAREST);
        curl = makeFBO(simW, simH, gl!.NEAREST);
        pres = makeDoubleFBO(simW, simH, gl!.NEAREST);
        fboReady = true;
      } catch (e) {
        console.warn('[Fluid] FBO init error:', e);
        fboReady = false;
      }
    }

    function resizeCanvas() {
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width  = w;
        canvas!.height = h;
        initFBOs();
      }
    }

    canvas.width  = Math.max(1, window.innerWidth);
    canvas.height = Math.max(1, window.innerHeight);
    initFBOs();
    window.addEventListener('resize', resizeCanvas);

    // ── Luminous Color Generator ─────────────────────────────────────────────
    let colorPhase = Math.random() * 10;
    function nextColor(): [number, number, number] {
      colorPhase += 0.12;
      // Cycles gracefully through emerald, turquoise, sky-blue, purple, and gold
      const r = (Math.sin(colorPhase * 0.5) * 0.5 + 0.5) * 0.45;
      const g = (Math.sin(colorPhase * 0.4 + 1.5) * 0.5 + 0.5) * 0.85 + 0.15;
      const b = (Math.cos(colorPhase * 0.3 + 0.5) * 0.5 + 0.5) * 0.90 + 0.10;
      return [r, g, b];
    }

    // ── Splat function ───────────────────────────────────────────────────────
    function splat(x: number, y: number, dx: number, dy: number, color: [number, number, number], customRadius?: number) {
      if (!fboReady) return;
      gl!.useProgram(pSplat.p);
      setupAttrib(pSplat.p);

      const r = customRadius || CFG.SPLAT_R;

      // 1. Splat velocity
      gl!.viewport(0, 0, vel.width, vel.height);
      gl!.uniform1i(pSplat.u.uTarget, vel.read.bind(0));
      gl!.uniform1f(pSplat.u.aspect, canvas!.width / canvas!.height);
      gl!.uniform2f(pSplat.u.point, x, y);
      gl!.uniform3f(pSplat.u.color, dx, dy, 0.0);
      gl!.uniform1f(pSplat.u.radius, r);
      blit(vel.write);
      vel.swap();

      // 2. Splat dye color
      gl!.viewport(0, 0, dye.width, dye.height);
      gl!.uniform1i(pSplat.u.uTarget, dye.read.bind(0));
      gl!.uniform3f(pSplat.u.color, color[0], color[1], color[2]);
      blit(dye.write);
      dye.swap();
    }

    // ── Ambient Autonomous Flow (so background is always alive) ──────────────
    let ambientTimer = 0;
    function tickAmbient() {
      ambientTimer++;
      // Every ~90 frames (~1.5s), create an organic gentle drift
      if (ambientTimer % 90 === 0 && fboReady) {
        const x = 0.2 + Math.random() * 0.6;
        const y = 0.2 + Math.random() * 0.6;
        const angle = Math.random() * Math.PI * 2;
        const speed = 1200 + Math.random() * 1000;
        const dx = Math.cos(angle) * speed;
        const dy = Math.sin(angle) * speed;
        splat(x, y, dx, dy, nextColor(), CFG.SPLAT_R * 1.5);
      }
    }

    // ── Initial Burst: multiple vivid smoke blooms ──────────────────────────
    function spawnInitialBursts() {
      if (!fboReady) return;
      const positions = [
        { x: 0.25, y: 0.35, dx: 1400, dy: -800 },
        { x: 0.75, y: 0.40, dx: -1200, dy: 1000 },
        { x: 0.50, y: 0.75, dx: 800, dy: -1400 },
        { x: 0.30, y: 0.80, dx: -900, dy: -1100 },
        { x: 0.70, y: 0.70, dx: 1100, dy: 700 },
      ];
      positions.forEach((p, idx) => {
        setTimeout(() => {
          splat(p.x, p.y, p.dx, p.dy, nextColor(), CFG.SPLAT_R * 1.8);
        }, idx * 120);
      });
    }

    // Trigger on mount after brief init
    setTimeout(spawnInitialBursts, 100);

    // ── Pointer Interaction ──────────────────────────────────────────────────
    let lastX = 0, lastY = 0, hasMoved = false;

    function handlePointerMove(cx: number, cy: number) {
      if (!fboReady) return;
      const x = cx / window.innerWidth;
      const y = 1.0 - cy / window.innerHeight;

      if (!hasMoved) {
        lastX = x;
        lastY = y;
        hasMoved = true;
        return;
      }

      const dx = (x - lastX) * CFG.SPLAT_F;
      const dy = (y - lastY) * CFG.SPLAT_F;

      if (Math.abs(dx) > 0.04 || Math.abs(dy) > 0.04) {
        splat(x, y, dx, dy, nextColor());
      }
      lastX = x;
      lastY = y;
    }

    function handlePointerDown(cx: number, cy: number) {
      if (!fboReady) return;
      const x = cx / window.innerWidth;
      const y = 1.0 - cy / window.innerHeight;
      lastX = x;
      lastY = y;
      hasMoved = true;
      // Burst on tap/click
      const angle = Math.random() * Math.PI * 2;
      const dx = Math.cos(angle) * 2500;
      const dy = Math.sin(angle) * 2500;
      splat(x, y, dx, dy, nextColor(), CFG.SPLAT_R * 2.2);
    }

    const onMouse = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseDown = (e: MouseEvent) => handlePointerDown(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener('mousemove', onMouse, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });

    // ── Animation Loop ───────────────────────────────────────────────────────
    let lastTime = performance.now();
    let animId: number;

    function step(now: number) {
      animId = requestAnimationFrame(step);

      if (!fboReady) return;

      const dt = Math.min((now - lastTime) / 1000, 0.02);
      lastTime = now;

      // Periodic ambient gentle swirl
      tickAmbient();

      // 1. Curl
      gl!.useProgram(pCurl.p);
      setupAttrib(pCurl.p);
      gl!.viewport(0, 0, vel.width, vel.height);
      gl!.uniform2f(pCurl.u.texel, vel.texelX, vel.texelY);
      gl!.uniform1i(pCurl.u.uVel, vel.read.bind(0));
      blit(curl);

      // 2. Vorticity confinement
      gl!.useProgram(pVort.p);
      setupAttrib(pVort.p);
      gl!.uniform2f(pVort.u.texel, vel.texelX, vel.texelY);
      gl!.uniform1i(pVort.u.uVel, vel.read.bind(0));
      gl!.uniform1i(pVort.u.uCurl, curl.bind(1));
      gl!.uniform1f(pVort.u.curl, CFG.CURL);
      gl!.uniform1f(pVort.u.dt, dt);
      blit(vel.write);
      vel.swap();

      // 3. Divergence
      gl!.useProgram(pDiv.p);
      setupAttrib(pDiv.p);
      gl!.uniform2f(pDiv.u.texel, vel.texelX, vel.texelY);
      gl!.uniform1i(pDiv.u.uVel, vel.read.bind(0));
      blit(div);

      // 4. Clear pressure
      gl!.useProgram(pClear.p);
      setupAttrib(pClear.p);
      gl!.viewport(0, 0, pres.width, pres.height);
      gl!.uniform1i(pClear.u.uTex, pres.read.bind(0));
      gl!.uniform1f(pClear.u.value, CFG.PRESSURE);
      blit(pres.write);
      pres.swap();

      // 5. Pressure solve
      gl!.useProgram(pPressure.p);
      setupAttrib(pPressure.p);
      gl!.uniform2f(pPressure.u.texel, vel.texelX, vel.texelY);
      gl!.uniform1i(pPressure.u.uDiv, div.bind(1));
      for (let i = 0; i < CFG.PRESSURE_ITERS; i++) {
        gl!.uniform1i(pPressure.u.uPres, pres.read.bind(0));
        blit(pres.write);
        pres.swap();
      }

      // 6. Gradient subtract
      gl!.useProgram(pGrad.p);
      setupAttrib(pGrad.p);
      gl!.uniform2f(pGrad.u.texel, vel.texelX, vel.texelY);
      gl!.uniform1i(pGrad.u.uPres, pres.read.bind(0));
      gl!.uniform1i(pGrad.u.uVel, vel.read.bind(1));
      blit(vel.write);
      vel.swap();

      // 7. Advect velocity (stable decay formula)
      gl!.useProgram(pAdvect.p);
      setupAttrib(pAdvect.p);
      gl!.uniform2f(pAdvect.u.texel, vel.texelX, vel.texelY);
      gl!.uniform1i(pAdvect.u.uVel, vel.read.bind(0));
      gl!.uniform1i(pAdvect.u.uSrc, vel.read.bind(0));
      gl!.uniform1f(pAdvect.u.dt, dt);
      // Proper stable dissipation: 1 / (1 + diss * dt)
      const velDiss = 1.0 / (1.0 + CFG.VEL_DISS * dt);
      gl!.uniform1f(pAdvect.u.diss, velDiss);
      blit(vel.write);
      vel.swap();

      // 8. Advect dye / color (stable decay formula)
      gl!.viewport(0, 0, dye.width, dye.height);
      gl!.uniform2f(pAdvect.u.texel, dye.texelX, dye.texelY);
      gl!.uniform1i(pAdvect.u.uVel, vel.read.bind(0));
      gl!.uniform1i(pAdvect.u.uSrc, dye.read.bind(1));
      const dyeDiss = 1.0 / (1.0 + CFG.DENSITY_DISS * dt);
      gl!.uniform1f(pAdvect.u.diss, dyeDiss);
      blit(dye.write);
      dye.swap();

      // 9. Display to screen
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
      gl!.useProgram(pDisplay.p);
      setupAttrib(pDisplay.p);
      gl!.uniform1i(pDisplay.u.uTex, dye.read.bind(0));
      gl!.drawArrays(gl!.TRIANGLE_FAN, 0, 4);
    }

    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchstart', onTouchStart);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ display: 'block' }}
    />
  );
};
