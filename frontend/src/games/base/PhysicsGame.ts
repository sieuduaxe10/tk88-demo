import * as BABYLON from '@babylonjs/core';
import { GameBase } from './GameBase';

/**
 * Base class for physics-based games (Tài xỉu, Xóc đĩa, Roulette)
 */
export abstract class PhysicsGame extends GameBase {
  protected physics: BABYLON.PhysicsEngine | null = null;
  protected ammo: any = null;
  protected ground: BABYLON.Mesh | null = null;

  /**
   * Physics disabled - games use manual tumble/spin animations instead.
   * Kept as no-op so subclasses calling it continue to work.
   */
  protected async initializePhysics(): Promise<void> {
    this.physics = null;
  }

  /**
   * Create ground with physics
   */
  protected createGround = (
    width: number = 20,
    depth: number = 20
  ): BABYLON.Mesh => {
    if (!this.scene) throw new Error('Scene not initialized');

    const ground = BABYLON.MeshBuilder.CreateGround(
      'ground',
      { width, height: depth },
      this.scene
    );

    const groundMaterial = new BABYLON.StandardMaterial('groundMat', this.scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.3); // Green felt
    ground.material = groundMaterial;

    // Physics body - only add if physics engine is available
    if (this.physics && this.scene) {
      ground.physicsImpostor = new BABYLON.PhysicsImpostor(
        ground,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0, restitution: 0.3, friction: 0.8 },
        this.scene
      );
    }

    this.ground = ground;
    return ground;
  };

  /**
   * Create dice
   */
  protected createDice = (
    name: string,
    position: BABYLON.Vector3
  ): BABYLON.Mesh => {
    if (!this.scene) throw new Error('Scene not initialized');

    const dice = BABYLON.MeshBuilder.CreateBox(name, { size: 1 }, this.scene);
    dice.position = position;

    // Material
    const diceMaterial = new BABYLON.StandardMaterial(`${name}Mat`, this.scene);
    diceMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.1);
    dice.material = diceMaterial;

    // Physics - only add if physics engine is available
    if (this.physics && this.scene) {
      dice.physicsImpostor = new BABYLON.PhysicsImpostor(
        dice,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 1, restitution: 0.8, friction: 0.4 },
        this.scene
      );
    }

    return dice;
  };

  /**
   * Apply force to object
   */
  protected applyForce = (
    mesh: BABYLON.Mesh,
    force: BABYLON.Vector3
  ): void => {
    if (mesh.physicsImpostor) {
      const point = mesh.getAbsolutePosition();
      mesh.physicsImpostor.applyForce(force, point);
    }
  };

  /**
   * Apply impulse (angular velocity)
   */
  protected applyImpulse = (
    mesh: BABYLON.Mesh,
    impulse: BABYLON.Vector3
  ): void => {
    if (mesh.physicsImpostor) {
      mesh.physicsImpostor.applyImpulse(
        impulse,
        mesh.getAbsolutePosition()
      );
    }
  };

  /**
   * Get face value based on rotation
   */
  protected getDiceFace = (mesh: BABYLON.Mesh): number => {
    const rotation = mesh.rotation;

    // Normalize rotation to [0, 2π]
    const x = ((rotation.x % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const y = ((rotation.y % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

    // Map rotation to die faces (simplified)
    // This is a basic mapping; more sophisticated methods exist
    const xFace = Math.round(x / (Math.PI / 2)) % 4;
    const yFace = Math.round(y / (Math.PI / 2)) % 4;

    const faces = [1, 2, 3, 4, 5, 6];
    const index = (xFace + yFace) % 6;

    return faces[Math.abs(index)];
  };

  /**
   * Wait for physics to settle
   */
  protected async waitForPhysicsSettled(
    objects: BABYLON.Mesh[],
    threshold: number = 0.1,
    maxWait: number = 5000
  ): Promise<void> {
    const startTime = performance.now();

    return new Promise((resolve) => {
      const check = () => {
        const isSettled = objects.every((obj) => {
          if (!obj.physicsImpostor) return true;
          const velocity = obj.physicsImpostor.getLinearVelocity();
          const angularVelocity = obj.physicsImpostor.getAngularVelocity();

          if (!velocity || !angularVelocity) return true;

          const speed = velocity.length();
          const rotation = angularVelocity.length();

          return speed < threshold && rotation < threshold;
        });

        if (isSettled || performance.now() - startTime > maxWait) {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };

      check();
    });
  };

  /**
   * Cleanup physics
   */
  override dispose(): void {
    if (this.physics) {
      this.physics.dispose();
      this.physics = null;
    }

    super.dispose();
  };
}
