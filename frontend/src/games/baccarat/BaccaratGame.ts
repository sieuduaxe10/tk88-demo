import * as BABYLON from '@babylonjs/core';
import { CardGame } from '../base/CardGame';
import { dealBaccarat } from '../utils/rng';

export type BaccaratPrediction = 'player' | 'banker' | 'tie';

/**
 * Baccarat game - Compare Player vs Banker hands
 *
 * Rules:
 * - Each gets 2 cards initially
 * - Value = sum mod 10 (face cards = 0, Ace = 1)
 * - Natural 8 or 9 wins immediately
 * - Otherwise third card rules apply
 * - Highest hand wins
 *
 * Payout:
 * - Player wins: 1:1
 * - Banker wins: 1:0.95 (5% commission)
 * - Tie: 8:1
 */
export class BaccaratGame extends CardGame {
  private gameSeed: string = '';
  private playerCards: string[] = [];
  private bankerCards: string[] = [];
  private outcome: 'player' | 'banker' | 'draw' = 'draw';

  async initialize(): Promise<void> {
    // Create scene
    this.scene = new BABYLON.Scene(this.engine);
    this.scene.collisionsEnabled = true;
    this.scene.clearColor = new BABYLON.Color4(0.05, 0.3, 0.1, 1.0);

    // Create camera
    this.createCamera(
      new BABYLON.Vector3(0, 5, 12),
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

  async placeBet(amount: number, prediction: BaccaratPrediction): Promise<void> {
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
    const result = dealBaccarat(this.gameSeed);
    this.playerCards = result.player.cards;
    this.bankerCards = result.banker.cards;
    this.outcome = result.winner;

    // Clear previous cards
    this.clearCards();

    // Animate card dealing
    await this.dealCards();

    // Wait to show cards
    await this.sleep(1500);

    // Evaluate result
    this.evaluateResult();

    // Show result
    await this.sleep(2000);

    // Reset for next game
    this.state.isPlaying = false;
  }

  private async dealCards(): Promise<void> {
    if (!this.scene) return;

    // Deal player cards (left side)
    for (let i = 0; i < this.playerCards.length; i++) {
      const card = this.createCard(
        `playerCard${i}`,
        new BABYLON.Vector3(-3, 2, 0)
      );

      // Animate to final position
      await this.moveCard(
        card,
        new BABYLON.Vector3(-3, 2, 0),
        new BABYLON.Vector3(-4 + i * 1.5, 0, 0),
        400
      );

      // Flip card
      await this.flipCard(card, 300);

      // Display card name
      this.displayCardName(this.playerCards[i], new BABYLON.Vector3(-4 + i * 1.5, 1, 0));

      await this.sleep(200);
    }

    // Deal banker cards (right side)
    for (let i = 0; i < this.bankerCards.length; i++) {
      const card = this.createCard(
        `bankerCard${i}`,
        new BABYLON.Vector3(3, 2, 0)
      );

      // Animate to final position
      await this.moveCard(
        card,
        new BABYLON.Vector3(3, 2, 0),
        new BABYLON.Vector3(3 + i * 1.5, 0, 0),
        400
      );

      // Flip card
      await this.flipCard(card, 300);

      // Display card name
      this.displayCardName(this.bankerCards[i], new BABYLON.Vector3(3 + i * 1.5, 1, 0));

      await this.sleep(200);
    }
  }

  private evaluateResult(): void {
    const prediction = this.state.prediction as BaccaratPrediction;
    let result = 'lose';
    let multiplier = 0;

    if (this.outcome === 'draw' && prediction === 'tie') {
      result = 'win';
      multiplier = 8; // 8:1 on tie
    } else if (this.outcome === prediction) {
      result = 'win';
      multiplier = prediction === 'banker' ? 0.95 : 1; // 5% commission on banker
    } else {
      result = 'lose';
      multiplier = 0;
    }

    const playerValue = this.getHandValue(this.playerCards);
    const bankerValue = this.getHandValue(this.bankerCards);

    this.state.result = `${result.toUpperCase()} - Player: ${playerValue}, Banker: ${bankerValue}`;
    this.state.payout =
      result === 'win' ? this.state.betAmount * multiplier : 0;
  }

  private getHandValue = (cards: string[]): number => {
    let value = 0;

    for (const card of cards) {
      const rank = card.charAt(0);
      let cardValue = 0;

      if (['J', 'Q', 'K'].includes(rank)) {
        cardValue = 0;
      } else if (rank === 'A') {
        cardValue = 1;
      } else if (rank === '10') {
        cardValue = 0;
      } else {
        cardValue = parseInt(rank);
      }

      value += cardValue;
    }

    return value % 10;
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

    this.playerCards = [];
    this.bankerCards = [];
    this.outcome = 'draw';
  }
}
