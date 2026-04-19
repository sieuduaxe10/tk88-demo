import * as BABYLON from '@babylonjs/core';
import { PhysicsGame } from '../base/PhysicsGame';
import { rollCup } from '../utils/rng';

export type XocDiaPrediction = 'even' | 'odd';

/**
 * Xóc đĩa game - Cup with 3 coins, bet on Even or Odd
 *
 * Rules:
 * - 3 coins hidden under cups
 * - Player guesses Even (2 heads) or Odd (1 or 3 heads)
 * - Cups revealed showing outcome
 *
 * Payout:
 * - Win: 1.95x (95% edge)
 * - Loss: 0x
 */
export class XocDiaGame extends PhysicsGame {
  private cups: BABYLON.Mesh[] = [];
  private coins: BABYLON.Mesh[] = [];
  private cupStates: boolean[] = [false, false, false]; // true = heads, false = tails
  private gameSeed: string = '';

  async initialize(): Promise<void> {
    // Create scene
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.collisionsEnabled = true;
    this.scene.clearColor = new BABYLON.Color4(0.1, 0.15, 0.2, 1.0);

    // Create camera - positioned to see cups from above
    this.createCamera(
      new BABYLON.Vector3(0, 8, 12),
      new BABYLON.Vector3(0, 1, 0)
    );

    // Create lighting
    this.createLighting();

    // Initialize physics
    await this.initializePhysics();

    // Create game environment
    this.createGround(20, 20);

    // Create 3 cups
    const positions = [-4, 0, 4];
    for (let i = 0; i < 3; i++) {
      const cup = this.createCup(i, new BABYLON.Vector3(positions[i], 0, 0));
      this.cups.push(cup);
    }

    // Create coins (hidden under cups initially)
    for (let i = 0; i < 3; i++) {
      const coin = this.createCoin(i, new BABYLON.Vector3(positions[i], -10, 0));
      this.coins.push(coin);
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

  async placeBet(amount: number, prediction: XocDiaPrediction): Promise<void> {
    if (this.state.isPlaying) {
      throw new Error('Game already in progress');
    }

    if (amount <= 0) {
      throw new Error('Invalid bet amount');
    }

    this.state.betAmount = amount;
    this.state.prediction = prediction;
    this.state.isPlaying = true;

    // Generate seed
    this.gameSeed = `${Date.now()}-${Math.random()}`;

    await this.play();
  }

  async play(): Promise<void> {
    if (!this.scene) return;

    // Get outcome from seeded RNG
    const outcome = rollCup(this.gameSeed);

    // Generate coin states (3 coins, each heads or tails)
    // outcome: 'even' = 0, 2 heads; 'odd' = 1, 3 heads
    const randomValues = this.generateCoinStates(this.gameSeed);
    this.cupStates = randomValues;

    // Animate cup shake
    await this.shakeCups();

    // Wait for animation
    await this.sleep(1000);

    // Reveal cups
    await this.revealCups();

    // Wait to show result
    await this.sleep(2000);

    // Evaluate result
    this.evaluateResult();

    // Show result for 2 seconds
    await this.sleep(2000);

    // Reset for next game
    this.state.isPlaying = false;
  }

  private createCup(index: number, position: BABYLON.Vector3): BABYLON.Mesh {
    if (!this.scene) throw new Error('Scene not initialized');

    // Create cone shape for cup
    const cup = BABYLON.MeshBuilder.CreateCylinder(
      `cup${index}`,
      { height: 2, diameterTop: 2.5, diameterBottom: 2 },
      this.scene
    );
    cup.position = position;

    // Material
    const cupMaterial = new BABYLON.StandardMaterial(`cupMat${index}`, this.scene);
    cupMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2); // Red
    cupMaterial.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    cup.material = cupMaterial;

    return cup;
  }

  private createCoin(index: number, position: BABYLON.Vector3): BABYLON.Mesh {
    if (!this.scene) throw new Error('Scene not initialized');

    // Create thin cylinder for coin
    const coin = BABYLON.MeshBuilder.CreateCylinder(
      `coin${index}`,
      { height: 0.1, diameter: 0.5 },
      this.scene
    );
    coin.position = position;

    // Material
    const coinMaterial = new BABYLON.StandardMaterial(`coinMat${index}`, this.scene);
    coinMaterial.diffuseColor = new BABYLON.Color3(1, 0.84, 0); // Gold
    coin.material = coinMaterial;

    return coin;
  }

  private generateCoinStates(seed: string): boolean[] {
    // Simplified: generate 3 coin states from seed
    // Using hash for determinism
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    const states: boolean[] = [];
    for (let i = 0; i < 3; i++) {
      const bit = (hash >> i) & 1;
      states.push(bit === 1);
    }

    return states;
  }

  private async shakeCups(): Promise<void> {
    if (!this.scene) return;

    const duration = 1500; // 1.5 seconds
    const startTime = performance.now();
    const originalPositions = this.cups.map((cup) => cup.position.clone());

    return new Promise((resolve) => {
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = elapsed / duration;

        if (progress < 1) {
          // Shake animation
          const shakeAmount = Math.sin(progress * Math.PI * 10) * 0.3;

          for (let i = 0; i < this.cups.length; i++) {
            const originalPos = originalPositions[i];
            this.cups[i].position.x = originalPos.x + shakeAmount * (i % 2 === 0 ? 1 : -1);
            this.cups[i].position.y = originalPos.y + Math.sin(progress * Math.PI * 20) * 0.2;
          }

          requestAnimationFrame(animate);
        } else {
          // Reset positions
          for (let i = 0; i < this.cups.length; i++) {
            this.cups[i].position = originalPositions[i];
          }
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  private async revealCups(): Promise<void> {
    if (!this.scene) return;

    const duration = 800; // 0.8 seconds
    const startTime = performance.now();

    return new Promise((resolve) => {
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Rotate cups upward
        for (let i = 0; i < this.cups.length; i++) {
          this.cups[i].rotation.x = -progress * Math.PI * 0.3;
        }

        // Show coins
        if (progress > 0.5) {
          for (let i = 0; i < this.coins.length; i++) {
            // Move coins to cup positions
            const cupPos = this.cups[i].position;
            this.coins[i].position.x = cupPos.x;
            this.coins[i].position.y = cupPos.y + 0.5;
            this.coins[i].position.z = cupPos.z;

            // Rotate to show heads/tails
            this.coins[i].rotation.x = this.cupStates[i] ? 0 : Math.PI;
          }
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  private evaluateResult(): void {
    // Count heads
    const headsCount = this.cupStates.filter((heads) => heads).length;
    const outcome = headsCount % 2 === 0 ? 'even' : 'odd';

    const prediction = this.state.prediction as XocDiaPrediction;
    let result = 'lose';
    let multiplier = 0;

    if (outcome === prediction) {
      result = 'win';
      multiplier = 1.95; // 95% payout
    } else {
      result = 'lose';
      multiplier = 0;
    }

    const headsStr = this.cupStates.map((h) => (h ? 'H' : 'T')).join(',');
    this.state.result = `${result.toUpperCase()} - ${headsStr} (${headsCount} heads)`;
    this.state.payout =
      result === 'win' ? this.state.betAmount * multiplier : 0;
  }

  getResult(): string {
    return this.state.result || 'No result';
  }

  reset(): void {
    if (!this.scene) return;

    // Reset cups
    for (let i = 0; i < 3; i++) {
      this.cups[i].rotation = BABYLON.Vector3.Zero();
      this.cups[i].position.y = 0;
    }

    // Hide coins
    for (let i = 0; i < 3; i++) {
      this.coins[i].position.y = -10;
    }

    // Reset state
    this.state = {
      betAmount: 0,
      payout: 0,
      isPlaying: false,
    };

    this.cupStates = [false, false, false];
  }
}
