import * as BABYLON from '@babylonjs/core';

/**
 * Game state interface
 */
export interface GameState {
  betAmount: number;
  prediction?: string;
  result?: string;
  payout: number;
  isPlaying: boolean;
  error?: string;
}

/**
 * Base class for all games
 */
export abstract class GameBase {
  protected scene: BABYLON.Scene | null = null;
  public engine: BABYLON.Engine;
  protected canvas: HTMLCanvasElement;
  protected camera: BABYLON.Camera | null = null;
  protected state: GameState = {
    betAmount: 0,
    payout: 0,
    isPlaying: false,
  };

  protected renderLoop: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // Create Babylon.js engine
    this.engine = new BABYLON.Engine(
      canvas,
      true,
      {
        antialias: true,
        stencil: true,
        preserveDrawingBuffer: true,
      },
      true
    );

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize);
  }

  /**
   * Initialize game scene
   */
  abstract initialize(): Promise<void>;

  /**
   * Place bet and start game
   */
  abstract placeBet(amount: number, prediction?: string): Promise<void>;

  /**
   * Play game animation
   */
  abstract play(): Promise<void>;

  /**
   * Get result
   */
  abstract getResult(): string;

  /**
   * Reset for next round
   */
  abstract reset(): void;

  /**
   * Cleanup resources
   */
  dispose(): void {
    if (this.renderLoop) {
      this.engine.stopRenderLoop();
      this.renderLoop = null;
    }

    if (this.scene) {
      this.scene.dispose();
      this.scene = null;
    }

    this.engine.dispose();
    window.removeEventListener('resize', this.onWindowResize);
  }

  /**
   * Get current game state
   */
  getState = (): GameState => {
    return { ...this.state };
  };

  /**
   * Set bet amount
   */
  setBetAmount = (amount: number): void => {
    this.state.betAmount = amount;
  };

  /**
   * Start render loop
   */
  protected startRenderLoop = (): void => {
    if (!this.scene) return;

    this.renderLoop = () => {
      this.scene?.render();
    };

    this.engine.runRenderLoop(this.renderLoop);
  };

  /**
   * Stop render loop
   */
  protected stopRenderLoop = (): void => {
    if (this.renderLoop) {
      this.engine.stopRenderLoop();
      this.renderLoop = null;
    }
  };

  /**
   * Handle window resize
   */
  private onWindowResize = (): void => {
    this.engine.resize();
  };

  /**
   * Create standard camera
   */
  protected createCamera = (
    position: BABYLON.Vector3,
    target: BABYLON.Vector3
  ): BABYLON.Camera => {
    const camera = new BABYLON.UniversalCamera('camera', position, this.scene!);
    camera.attachControl(this.canvas, true);
    camera.setTarget(target);
    camera.inertia = 0.7;
    camera.angularSensibility = 1000;

    this.camera = camera;
    return camera;
  };

  /**
   * Create standard lighting
   */
  protected createLighting = (): void => {
    if (!this.scene) return;

    const light1 = new BABYLON.HemisphericLight(
      'light1',
      new BABYLON.Vector3(1, 1, 1),
      this.scene
    );
    light1.intensity = 0.8;

    const light2 = new BABYLON.PointLight(
      'light2',
      new BABYLON.Vector3(0, 10, 0),
      this.scene
    );
    light2.intensity = 0.7;
  };

  /**
   * Sleep utility for animations
   */
  protected async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  };

  /**
   * Animate value from start to end
   */
  protected async animateValue(
    startValue: number,
    endValue: number,
    duration: number,
    onFrame: (value: number) => void
  ): Promise<void> {
    const startTime = performance.now();

    return new Promise((resolve) => {
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const currentValue = startValue + (endValue - startValue) * progress;
        onFrame(currentValue);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  };
}
