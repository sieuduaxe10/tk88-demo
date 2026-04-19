export type QualityTier = 'high' | 'medium' | 'low';

export interface DeviceCapability {
  tier: QualityTier;
  maxTextureSize: number;
  maxPolygons: number;
  targetFPS: number;
  supportsWebGL2: boolean;
  isMobile: boolean;
  deviceMemory: number; // GB
  cpuBenchmark: number; // 0-100
  gpuBenchmark: number; // 0-100
}

/**
 * Detect WebGL capabilities
 */
const detectWebGLCapabilities = (): {
  maxTextureSize: number;
  supportsWebGL2: boolean;
} => {
  const canvas = document.createElement('canvas');
  const gl =
    canvas.getContext('webgl2') || canvas.getContext('webgl');

  if (!gl) {
    return { maxTextureSize: 512, supportsWebGL2: false };
  }

  const supportsWebGL2 = !!(gl instanceof WebGL2RenderingContext);
  const maxTextureSize = gl.getParameter(
    gl.MAX_TEXTURE_SIZE
  ) as number;

  return { maxTextureSize, supportsWebGL2 };
};

/**
 * Run CPU benchmark (measure frame rate)
 */
const benchmarkCPU = async (): Promise<number> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      resolve(50);
      return;
    }

    let frameCount = 0;
    const startTime = performance.now();

    const bench = () => {
      // Draw 1000 circles (CPU intensive)
      for (let i = 0; i < 1000; i++) {
        ctx.fillStyle = `hsl(${i % 360}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(
          Math.random() * 256,
          Math.random() * 256,
          Math.random() * 20,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      frameCount++;
      const elapsed = performance.now() - startTime;

      if (elapsed < 1000) {
        requestAnimationFrame(bench);
      } else {
        // Normalize to 0-100
        const fps = frameCount;
        const score = Math.min(100, (fps / 60) * 100);
        resolve(score);
      }
    };

    bench();
  });
};

/**
 * Run GPU benchmark (render cubes)
 */
const benchmarkGPU = async (): Promise<number> => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;

    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return 50;

    const vertexShader = `
      precision highp float;
      attribute vec3 position;
      uniform mat4 matrix;
      void main() { gl_Position = matrix * vec4(position, 1.0); }
    `;

    const fragmentShader = `
      precision highp float;
      void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); }
    `;

    const program = gl.createProgram();
    if (!program) return 50;

    // Compile shaders
    const vShader = gl.createShader(gl.VERTEX_SHADER);
    const fShader = gl.createShader(gl.FRAGMENT_SHADER);

    if (!vShader || !fShader) return 50;

    gl.shaderSource(vShader, vertexShader);
    gl.shaderSource(fShader, fragmentShader);
    gl.compileShader(vShader);
    gl.compileShader(fShader);

    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Benchmark
    let frameCount = 0;
    const startTime = performance.now();

    const bench = () => {
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 36 * 100); // Draw 100 cubes

      frameCount++;
      const elapsed = performance.now() - startTime;

      if (elapsed < 1000) {
        requestAnimationFrame(bench);
      } else {
        const fps = frameCount;
        const score = Math.min(100, (fps / 60) * 100);

        // Cleanup
        gl.deleteShader(vShader);
        gl.deleteShader(fShader);
        gl.deleteProgram(program);
        (canvas as any) = null;
      }
    };

    bench();

    return 50; // Default if async
  } catch (e) {
    console.error('GPU benchmark failed:', e);
    return 50;
  }
};

/**
 * Detect device capability tier
 */
export const detectDeviceCapability = async (): Promise<DeviceCapability> => {
  const glInfo = detectWebGLCapabilities();
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
  const deviceMemory = (navigator.deviceMemory as number) || 4; // GB

  // Run benchmarks
  const cpuScore = await benchmarkCPU();
  const gpuScore = glInfo.supportsWebGL2 ? 75 : 50;

  // Determine tier
  let tier: QualityTier = 'medium';
  let maxTextureSize = 1024;
  let maxPolygons = 50000;
  let targetFPS = 30;

  if (isMobile) {
    if (cpuScore > 70 && gpuScore > 70 && deviceMemory >= 6) {
      tier = 'high';
      maxTextureSize = 1024;
      maxPolygons = 50000;
      targetFPS = 60;
    } else if (cpuScore > 40 && gpuScore > 40 && deviceMemory >= 4) {
      tier = 'medium';
      maxTextureSize = 512;
      maxPolygons = 25000;
      targetFPS = 30;
    } else {
      tier = 'low';
      maxTextureSize = 256;
      maxPolygons = 12000;
      targetFPS = 30;
    }
  } else {
    // Desktop
    if (cpuScore > 80 && gpuScore > 80) {
      tier = 'high';
      maxTextureSize = 2048;
      maxPolygons = 200000;
      targetFPS = 60;
    } else if (cpuScore > 60 && gpuScore > 60) {
      tier = 'medium';
      maxTextureSize = 1024;
      maxPolygons = 100000;
      targetFPS = 60;
    } else {
      tier = 'low';
      maxTextureSize = 512;
      maxPolygons = 50000;
      targetFPS = 30;
    }
  }

  return {
    tier,
    maxTextureSize: Math.min(maxTextureSize, glInfo.maxTextureSize),
    maxPolygons,
    targetFPS,
    supportsWebGL2: glInfo.supportsWebGL2,
    isMobile,
    deviceMemory,
    cpuBenchmark: cpuScore,
    gpuBenchmark: gpuScore,
  };
};

/**
 * Dynamic resolution scaling based on target FPS
 */
export class ResolutionScaler {
  private targetFPS: number;
  private currentScale: number = 1;
  private frameCount: number = 0;
  private lastTime: number = performance.now();

  constructor(targetFPS: number = 60) {
    this.targetFPS = targetFPS;
  }

  /**
   * Update FPS counter and adjust resolution if needed
   */
  update = (): void => {
    this.frameCount++;

    const now = performance.now();
    const elapsed = now - this.lastTime;

    if (elapsed >= 1000) {
      const fps = this.frameCount;
      const ratio = fps / this.targetFPS;

      // Adjust scale if FPS deviates significantly
      if (ratio < 0.8) {
        // Too slow
        this.currentScale = Math.max(0.5, this.currentScale - 0.1);
      } else if (ratio > 1.1) {
        // Too fast, we can increase quality
        this.currentScale = Math.min(1, this.currentScale + 0.05);
      }

      this.frameCount = 0;
      this.lastTime = now;
    }
  };

  /**
   * Get current resolution multiplier
   */
  getScale = (): number => this.currentScale;

  /**
   * Get canvas size to render at
   */
  getCanvasSize = (
    displayWidth: number,
    displayHeight: number
  ): { width: number; height: number } => {
    return {
      width: Math.round(displayWidth * this.currentScale),
      height: Math.round(displayHeight * this.currentScale),
    };
  };
}
