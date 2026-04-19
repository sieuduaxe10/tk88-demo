import * as BABYLON from '@babylonjs/core';
import { CardGame } from '../base/CardGame';
import { dealLongHo } from '../utils/rng';

export type LongHoPrediction = 'dragon' | 'tiger' | 'tie';

/**
 * Long Hổ (Dragon-Tiger) game - Compare 2 cards
 *
 * Rules:
 * - One card to Dragon (left)
 * - One card to Tiger (right)
 * - Highest card wins
 * - Same card = Tie
 * - Card value: Ace=1, 2-10=face value, J=11, Q=12, K=13
 *
 * Payout:
 * - Dragon/Tiger wins: 1:1
 * - Tie: 8:1
 */
export class LongHoGame extends CardGame {
  private gameSeed: string = '';
  private dragonCard: string = '';
  private tigerCard: string = '';
  private outcome: 'dragon' | 'tiger' | 'draw' = 'draw';

  async initialize(): Promise<void> {
    // Create scene
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.collisionsEnabled = true;
    this.scene.clearColor = new BABYLON.Color4(0.05, 0.3, 0.1, 1.0);

    // Create camera
    this.createCamera(
      new BABYLON.Vector3(0, 5, 10),
      new BABYLON.Vector3(0, 0, 0)
    );

    // Initialize card scene
    await this.initializeCardScene();

    // Start render loop
    this.startRenderLoop();

    // Load default state
    this.state = {
      betAmount: 0,
      payout: 0,
      isPlaying: false,
    };
  }

  async placeBet(amount: number, prediction: LongHoPrediction): Promise<void> {
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

    // Deal cards
    const result = dealLongHo(this.gameSeed);
    this.dragonCard = result.dragon;
    this.tigerCard = result.tiger;
    this.outcome = result.winner;

    // Clear previous cards
    this.clearCards();

    // Animate card dealing
    await this.dealCards();

    // Wait to show cards
    await this.sleep(1000);

    // Evaluate result
    this.evaluateResult();

    // Show result
    await this.sleep(2000);

    // Reset for next game
    this.state.isPlaying = false;
  }

  private async dealCards(): Promise<void> {
    if (!this.scene) return;

    // Deal dragon card (left)
    const dragonCard = this.createCard('dragonCard', new BABYLON.Vector3(-5, 2, 0));

    await this.moveCard(
      dragonCard,
      new BABYLON.Vector3(-5, 2, 0),
      new BABYLON.Vector3(-4, 0, 0),
      500
    );

    await this.flipCard(dragonCard, 400);
    this.displayCardName(`🐉 ${this.dragonCard}`, new BABYLON.Vector3(-4, 1.5, 0));

    await this.sleep(500);

    // Deal tiger card (right)
    const tigerCard = this.createCard('tigerCard', new BABYLON.Vector3(5, 2, 0));

    await this.moveCard(
      tigerCard,
      new BABYLON.Vector3(5, 2, 0),
      new BABYLON.Vector3(4, 0, 0),
      500
    );

    await this.flipCard(tigerCard, 400);
    this.displayCardName(`🐯 ${this.tigerCard}`, new BABYLON.Vector3(4, 1.5, 0));
  }

  private evaluateResult(): void {
    const prediction = this.state.prediction as LongHoPrediction;
    let result = 'lose';
    let multiplier = 0;

    if (this.outcome === 'draw' && prediction === 'tie') {
      result = 'win';
      multiplier = 8; // 8:1 on tie
    } else if (this.outcome === prediction) {
      result = 'win';
      multiplier = 1; // 1:1
    } else {
      result = 'lose';
      multiplier = 0;
    }

    const dragonValue = this.getCardValue(this.dragonCard);
    const tigerValue = this.getCardValue(this.tigerCard);

    this.state.result = `${result.toUpperCase()} - Dragon: ${this.dragonCard}(${dragonValue}), Tiger: ${this.tigerCard}(${tigerValue})`;
    this.state.payout =
      result === 'win' ? this.state.betAmount * multiplier : 0;
  }

  private getCardValue = (card: string): number => {
    const rank = card.charAt(0);

    if (rank === 'A') return 1;
    if (rank === 'J') return 11;
    if (rank === 'Q') return 12;
    if (rank === 'K') return 13;

    return parseInt(rank);
  };

  getResult(): string {
    return this.state.result || 'No result';
  }

  reset(): void {
    this.clearCards();

    this.state = {
      betAmount: 0,
      payout: 0,
      isPlaying: false,
    };

    this.dragonCard = '';
    this.tigerCard = '';
    this.outcome = 'draw';
  }
}
