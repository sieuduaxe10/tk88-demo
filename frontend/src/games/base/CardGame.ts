import * as BABYLON from '@babylonjs/core';
import { AdvancedDynamicTexture, TextBlock } from '@babylonjs/gui';
import { GameBase, GameState } from './GameBase';

/**
 * Base class for card games (Baccarat, Long Hổ)
 * Minimal physics, focus on card animations
 */
export abstract class CardGame extends GameBase {
  protected deckTexture: BABYLON.Texture | null = null;
  protected cardMeshes: BABYLON.Mesh[] = [];

  /**
   * Initialize card game scene
   */
  protected initializeCardScene = async (): Promise<void> => {
    if (!this.scene) return;

    // Standard setup
    this.createLighting();

    // Create simple background plane
    this.createTableBackground();
  };

  /**
   * Create table background
   */
  protected createTableBackground = (): void => {
    if (!this.scene) return;

    const table = BABYLON.MeshBuilder.CreatePlane('table', { width: 16, height: 10 }, this.scene);
    table.position.z = -5;

    const tableMaterial = new BABYLON.StandardMaterial('tableMat', this.scene);
    tableMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.5, 0.2); // Green felt
    table.material = tableMaterial;
  };

  /**
   * Create card mesh
   */
  protected createCard = (
    name: string,
    position: BABYLON.Vector3,
    cardIndex: number = 0
  ): BABYLON.Mesh => {
    if (!this.scene) return null!;

    const card = BABYLON.MeshBuilder.CreatePlane(name, { width: 0.63, height: 1 }, this.scene);
    card.position = position;

    // Simple colored material for now (replace with texture atlas later)
    const cardMaterial = new BABYLON.StandardMaterial(`${name}Mat`, this.scene);
    cardMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
    cardMaterial.emissiveColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    card.material = cardMaterial;

    this.cardMeshes.push(card);
    return card;
  };

  /**
   * Animate card flip
   */
  protected async flipCard(
    card: BABYLON.Mesh,
    duration: number = 500
  ): Promise<void> {
    const startTime = performance.now();

    return new Promise((resolve) => {
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Flip animation
        card.rotation.y = progress * Math.PI;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Animate card movement
   */
  protected async moveCard(
    card: BABYLON.Mesh,
    fromPos: BABYLON.Vector3,
    toPos: BABYLON.Vector3,
    duration: number = 400
  ): Promise<void> {
    const startTime = performance.now();
    const startPos = fromPos.clone();

    return new Promise((resolve) => {
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-in-out)
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        card.position = BABYLON.Vector3.Lerp(startPos, toPos, eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          card.position = toPos;
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Display card by name (text overlay for now)
   */
  protected displayCardName = (cardName: string, position: BABYLON.Vector3): void => {
    if (!this.scene) return;

    try {
      const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('cardUI');

      const label = new TextBlock();
      label.text = cardName;
      label.color = 'white';
      label.fontSize = 24;
      label.fontWeight = 'bold';
      label.left = position.x * 100;
      label.top = position.y * 100;

      advancedTexture.addControl(label);
    } catch (error) {
      console.warn('Failed to display card label:', error);
    }
  };

  /**
   * Cleanup cards
   */
  protected clearCards = (): void => {
    for (const card of this.cardMeshes) {
      card.dispose();
    }
    this.cardMeshes = [];
  };

  override dispose(): void {
    this.clearCards();
    if (this.deckTexture) {
      this.deckTexture.dispose();
      this.deckTexture = null;
    }
    super.dispose();
  };
}
