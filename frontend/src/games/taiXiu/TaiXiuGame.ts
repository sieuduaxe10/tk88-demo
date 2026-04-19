import * as BABYLON from '@babylonjs/core';
import { PhysicsGame } from '../base/PhysicsGame';
import { rollDice, getTaiXiuOutcome } from '../utils/rng';

export type TaiXiuPrediction = 'tai' | 'xiu'; // Tài = High, Xỉu = Low

/**
 * Tài xỉu game - Roll 3 dice, bet on High (>10) or Low (<11)
 *
 * Rules:
 * - Sum of 3 dice > 11: Tài (High) wins
 * - Sum of 3 dice < 11: Xỉu (Low) wins
 * - Sum = 11: Draw
 *
 * Payout:
 * - Win: 1.95x (95% edge)
 * - Draw: Return bet
 */
export class TaiXiuGame extends PhysicsGame {
  private dice: BABYLON.Mesh[] = [];
  private diceValues: number[] = [0, 0, 0];
  private gameSeed: string = '';

  async initialize(): Promise<void> {
    // Create scene
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.collisionsEnabled = true;
    this.scene.clearColor = new BABYLON.Color4(0.1, 0.15, 0.2, 1.0);

    // Create camera
    this.createCamera(
      new BABYLON.Vector3(0, 5, 15),
      new BABYLON.Vector3(0, 1, 0)
    );

    // Create lighting
    this.createLighting();

    // Initialize physics
    await this.initializePhysics();

    // Create game environment
    this.createGround(15, 15);

    // Create 3 dice
    const startX = -3;
    const spacing = 3;

    for (let i = 0; i < 3; i++) {
      const dice = this.createDice(
        `dice${i}`,
        new BABYLON.Vector3(startX + i * spacing, 2, 0)
      );
      this.dice.push(dice);
    }

    // Start render loop
    this.startRenderLoop();

    // Load default state
    this.state = {
      betAmount: 0,
      payout: 0,
      isPlaying: false,
    };
  }

  async placeBet(amount: number, prediction: TaiXiuPrediction): Promise<void> {
    if (this.state.isPlaying) {
      throw new Error('Game already in progress');
    }

    if (amount <= 0) {
      throw new Error('Invalid bet amount');
    }

    this.state.betAmount = amount;
    this.state.prediction = prediction;
    this.state.isPlaying = true;

    // Generate seed (in production, this comes from server)
    this.gameSeed = `${Date.now()}-${Math.random()}`;

    await this.play();
  }

  async play(): Promise<void> {
    if (!this.scene) return;

    // Get predicted outcome from seeded RNG
    const [d1, d2, d3] = rollDice(this.gameSeed);
    const predictedSum = d1 + d2 + d3;
    const outcome = getTaiXiuOutcome(this.gameSeed);

    this.diceValues = [d1, d2, d3];

    // Roll dice with physics animation
    await this.rollDicePhysics();

    // Wait for physics to settle
    await this.waitForPhysicsSettled(this.dice, 0.1, 5000);

    // Evaluate result
    this.evaluateResult();

    // Show result for 2 seconds
    await this.sleep(2000);

    // Reset for next game
    this.state.isPlaying = false;
  }

  private async rollDicePhysics(): Promise<void> {
    // Manual tumble animation (no physics engine required)
    const duration = 2500;
    const startTime = performance.now();

    const rotSpeeds = this.dice.map(() => ({
      x: (Math.random() + 0.5) * 8,
      y: (Math.random() + 0.5) * 8,
      z: (Math.random() + 0.5) * 8,
    }));
    const baseX = [-3, 0, 3];

    return new Promise((resolve) => {
      const animate = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);

        for (let i = 0; i < this.dice.length; i++) {
          const d = this.dice[i];
          const s = rotSpeeds[i];
          d.rotation.x += s.x * 0.05 * (1 - ease);
          d.rotation.y += s.y * 0.05 * (1 - ease);
          d.rotation.z += s.z * 0.05 * (1 - ease);

          // Bounce up/down with decaying amplitude
          const bounce = Math.abs(Math.sin(t * Math.PI * 4)) * (1 - ease) * 2.5;
          d.position.x = baseX[i] + Math.sin(t * Math.PI * 3 + i) * 0.8 * (1 - ease);
          d.position.y = 0.5 + bounce;
          d.position.z = Math.cos(t * Math.PI * 2 + i) * 0.5 * (1 - ease);
        }

        if (t < 1) {
          requestAnimationFrame(animate);
        } else {
          // Snap dice to seeded face orientation at rest
          for (let i = 0; i < this.dice.length; i++) {
            this.dice[i].position = new BABYLON.Vector3(baseX[i], 0.5, 0);
          }
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  private evaluateResult(): void {
    // Get actual dice faces (simplified - using seeded values)
    const sum = this.diceValues.reduce((a, b) => a + b, 0);
    const actualOutcome = sum > 11 ? 'tai' : sum < 11 ? 'xiu' : 'draw';

    const prediction = this.state.prediction as TaiXiuPrediction;
    let result = 'lose';
    let multiplier = 0;

    if (actualOutcome === 'draw') {
      result = 'draw';
      multiplier = 1; // Return bet
    } else if (actualOutcome === prediction) {
      result = 'win';
      multiplier = 1.95; // 95% payout
    } else {
      result = 'lose';
      multiplier = 0;
    }

    this.state.result = `${result} - ${this.diceValues.join(',')} = ${sum}`;
    this.state.payout =
      result === 'draw'
        ? this.state.betAmount
        : result === 'win'
          ? this.state.betAmount * multiplier
          : 0;
  }

  getResult(): string {
    return this.state.result || 'No result';
  }

  reset(): void {
    if (!this.scene) return;

    // Reset dice positions and rotations
    for (let i = 0; i < 3; i++) {
      const dice = this.dice[i];
      dice.position = new BABYLON.Vector3(-3 + i * 3, 2, 0);
      dice.rotation = BABYLON.Vector3.Zero();

      if (dice.physicsImpostor) {
        dice.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
        dice.physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero());
      }
    }

    // Reset state
    this.state = {
      betAmount: 0,
      payout: 0,
      isPlaying: false,
    };

    this.diceValues = [0, 0, 0];
  }
}
