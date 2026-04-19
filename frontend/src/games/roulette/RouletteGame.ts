import * as BABYLON from '@babylonjs/core';
import { PhysicsGame } from '../base/PhysicsGame';
import { spinRoulette } from '../utils/rng';

export type RouletteBet = 'red' | 'black' | 'even' | 'odd' | 'number';
export type RoulettePrediction = number | 'red' | 'black' | 'even' | 'odd'; // 0-36

/**
 * Roulette game - Spin wheel, ball lands on number
 *
 * Rules:
 * - European roulette: 0-36 (37 numbers)
 * - Red: 1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
 * - Black: 2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35
 * - Payout varies by bet type
 *
 * Payout:
 * - Single number: 35:1
 * - Red/Black: 1:1
 * - Even/Odd: 1:1
 */
export class RouletteGame extends PhysicsGame {
  private wheel: BABYLON.Mesh | null = null;
  private ball: BABYLON.Mesh | null = null;
  private gameSeed: string = '';
  private winningNumber: number = 0;

  async initialize(): Promise<void> {
    // Create scene
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.collisionsEnabled = true;
    this.scene.clearColor = new BABYLON.Color4(0.1, 0.15, 0.2, 1.0);

    // Create camera - top-down view
    this.createCamera(
      new BABYLON.Vector3(0, 8, 15),
      new BABYLON.Vector3(0, 0, 0)
    );

    // Create lighting
    this.createLighting();

    // Initialize physics
    await this.initializePhysics();

    // Create game environment
    this.createGround(20, 20);

    // Create roulette wheel
    this.wheel = this.createWheel();

    // Create ball
    this.ball = this.createBall();

    // Start render loop
    this.startRenderLoop();

    // Load default state
    this.state = {
      betAmount: 0,
      payout: 0,
      isPlaying: false,
    };
  }

  async placeBet(amount: number, prediction?: string): Promise<void> {
    const pred = (prediction ?? 'red') as RoulettePrediction;
    if (this.state.isPlaying) {
      throw new Error('Game already in progress');
    }

    if (amount <= 0) {
      throw new Error('Invalid bet amount');
    }

    this.state.betAmount = amount;
    this.state.prediction = String(pred);
    this.state.isPlaying = true;

    // Generate seed
    this.gameSeed = `${Date.now()}-${Math.random()}`;

    await this.play();
  }

  async play(): Promise<void> {
    if (!this.scene || !this.wheel || !this.ball) return;

    // Get winning number from seed
    this.winningNumber = spinRoulette(this.gameSeed);

    // Spin animation
    await this.spinWheel();

    // Roll ball
    await this.rollBall();

    // Wait for settlement
    await this.waitForPhysicsSettled([this.ball], 0.05, 5000);

    // Evaluate result
    this.evaluateResult();

    // Show result for 2 seconds
    await this.sleep(2000);

    // Reset for next game
    this.state.isPlaying = false;
  }

  private createWheel(): BABYLON.Mesh {
    if (!this.scene) throw new Error('Scene not initialized');

    // Create wheel as torus
    const wheel = BABYLON.MeshBuilder.CreateTorus(
      'wheel',
      { diameter: 6, thickness: 0.2 },
      this.scene
    );
    wheel.position.z = 0;

    // Material
    const wheelMaterial = new BABYLON.StandardMaterial('wheelMat', this.scene);
    wheelMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Dark
    wheelMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    wheel.material = wheelMaterial;

    // Physics (fixed, no movement) - only if physics available
    if (this.physics && this.scene) {
      wheel.physicsImpostor = new BABYLON.PhysicsImpostor(
        wheel,
        BABYLON.PhysicsImpostor.CylinderImpostor,
        { mass: 0, friction: 0.5 },
        this.scene
      );
    }

    return wheel;
  }

  private createBall(): BABYLON.Mesh {
    if (!this.scene) throw new Error('Scene not initialized');

    const ball = BABYLON.MeshBuilder.CreateSphere(
      'ball',
      { diameter: 0.2 },
      this.scene
    );
    ball.position = new BABYLON.Vector3(3, 2, 0);

    // Material
    const ballMaterial = new BABYLON.StandardMaterial('ballMat', this.scene);
    ballMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1); // White
    ball.material = ballMaterial;

    // Physics - only if physics available
    if (this.physics && this.scene) {
      ball.physicsImpostor = new BABYLON.PhysicsImpostor(
        ball,
        BABYLON.PhysicsImpostor.SphereImpostor,
        { mass: 0.1, restitution: 0.8, friction: 0.3 },
        this.scene
      );
    }

    return ball;
  }

  private async spinWheel(): Promise<void> {
    if (!this.wheel) return;

    const duration = 3000; // 3 seconds
    const startTime = performance.now();
    const targetRotation = Math.PI * 4 + (this.winningNumber / 36) * Math.PI * 2;

    return new Promise((resolve) => {
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const eased = 1 - Math.pow(1 - progress, 3);

        // Rotate wheel
        this.wheel!.rotation.z = eased * targetRotation;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  private async rollBall(): Promise<void> {
    if (!this.ball) return;

    // Manual ball-on-wheel animation (no physics required)
    const duration = 2500;
    const startTime = performance.now();
    const startRadius = 3.5;
    const endRadius = 2.8;
    const targetAngle = (this.winningNumber / 37) * Math.PI * 2;
    const initialRotations = 6;

    return new Promise((resolve) => {
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);

        const angle = (initialRotations * (1 - ease) * Math.PI * 2) + targetAngle;
        const radius = startRadius + (endRadius - startRadius) * ease;

        this.ball!.position.x = Math.cos(angle) * radius;
        this.ball!.position.z = Math.sin(angle) * radius;
        this.ball!.position.y = 0.3 + (1 - ease) * (Math.abs(Math.sin(t * Math.PI * 8)) * 0.4);

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  private evaluateResult(): void {
    const prediction = this.state.prediction;
    let result = 'lose';
    let multiplier = 0;
    let payout = 0;

    // Determine if prediction matches
    if (prediction === String(this.winningNumber)) {
      // Single number bet
      result = 'win';
      multiplier = 35;
    } else if (prediction === 'red' && this.isRed(this.winningNumber)) {
      result = 'win';
      multiplier = 1;
    } else if (prediction === 'black' && this.isBlack(this.winningNumber)) {
      result = 'win';
      multiplier = 1;
    } else if (prediction === 'even' && this.winningNumber % 2 === 0 && this.winningNumber !== 0) {
      result = 'win';
      multiplier = 1;
    } else if (prediction === 'odd' && this.winningNumber % 2 === 1) {
      result = 'win';
      multiplier = 1;
    }

    payout = result === 'win' ? this.state.betAmount * multiplier : 0;

    this.state.result = `${result.toUpperCase()} - Number: ${this.winningNumber}`;
    this.state.payout = payout;
  }

  private isRed = (number: number): boolean => {
    const redNumbers = [
      1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
    ];
    return redNumbers.includes(number);
  };

  private isBlack = (number: number): boolean => {
    return number !== 0 && !this.isRed(number);
  };

  getResult(): string {
    return this.state.result || 'No result';
  }

  reset(): void {
    if (!this.ball) return;

    // Reset wheel rotation
    if (this.wheel) {
      this.wheel.rotation.z = 0;
    }

    // Reset ball position
    this.ball.position = new BABYLON.Vector3(3, 2, 0);
    this.ball.rotation = BABYLON.Vector3.Zero();

    if (this.ball.physicsImpostor) {
      this.ball.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
      this.ball.physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero());
    }

    // Reset state
    this.state = {
      betAmount: 0,
      payout: 0,
      isPlaying: false,
    };

    this.winningNumber = 0;
  }
}
