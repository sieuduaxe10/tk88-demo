import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';
import '@babylonjs/materials';
import {
  AdvancedDynamicTexture,
  StackPanel,
  Rectangle,
  TextBlock,
  Control,
} from '@babylonjs/gui';

/**
 * Initialize Babylon.js scene with standard settings
 */
export const createScene = (engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene => {
  const scene = new BABYLON.Scene(engine);
  scene.collisionsEnabled = true;
  scene.useRightHandedSystem = true;

  // Lighting
  const light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1, 1, 1), scene);
  light1.intensity = 0.8;

  const light2 = new BABYLON.PointLight('light2', new BABYLON.Vector3(0, 10, 0), scene);
  light2.intensity = 0.7;

  // Background
  scene.clearColor = new BABYLON.Color4(0.1, 0.15, 0.2, 1.0);

  return scene;
};

/**
 * Setup camera for game view
 */
export const createCamera = (
  scene: BABYLON.Scene,
  position: BABYLON.Vector3,
  target: BABYLON.Vector3
): BABYLON.Camera => {
  const camera = new BABYLON.UniversalCamera('camera', position, scene);
  camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
  camera.setTarget(target);
  camera.inertia = 0.7;
  camera.angularSensibility = 1000;
  return camera;
};

/**
 * Load glTF model with Draco compression
 */
export const loadGLTFModel = async (
  scene: BABYLON.Scene,
  modelPath: string
): Promise<BABYLON.AssetContainer> => {
  const result = await BABYLON.SceneLoader.LoadAssetContainerAsync(
    '',
    modelPath,
    scene.getEngine(),
    (progress) => {
      // Progress callback
      const percentComplete = (progress.loaded / progress.total) * 100;
      console.log(`Loading: ${percentComplete.toFixed(2)}%`);
    },
    '.gltf'
  );

  return result;
};

/**
 * Create ground/table surface with physics
 */
export const createGround = (
  scene: BABYLON.Scene,
  physics: BABYLON.PhysicsEngine,
  width: number = 20,
  depth: number = 20
): BABYLON.Mesh => {
  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width, height: depth }, scene);
  const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
  groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.3); // Green felt
  ground.material = groundMaterial;

  // Physics body
  ground.physicsImpostor = new BABYLON.PhysicsImpostor(
    ground,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { mass: 0, restitution: 0.3, friction: 0.8 },
    physics
  );

  return ground;
};

/**
 * Create 3D dice
 */
export const createDice = (
  scene: BABYLON.Scene,
  physics: BABYLON.PhysicsEngine,
  position: BABYLON.Vector3 = BABYLON.Vector3.Zero()
): BABYLON.Mesh => {
  const dice = BABYLON.MeshBuilder.CreateBox('dice', { size: 1 }, scene);
  dice.position = position;

  // Material
  const diceMaterial = new BABYLON.StandardMaterial('diceMat', scene);
  diceMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.1, 0.1);
  dice.material = diceMaterial;

  // Physics
  dice.physicsImpostor = new BABYLON.PhysicsImpostor(
    dice,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { mass: 1, restitution: 0.8, friction: 0.4 },
    physics
  );

  return dice;
};

/**
 * Apply force to object
 */
export const applyForce = (
  mesh: BABYLON.Mesh,
  force: BABYLON.Vector3,
  point: BABYLON.Vector3
): void => {
  if (mesh.physicsImpostor) {
    mesh.physicsImpostor.applyForce(force, point);
  }
};

/**
 * Apply impulse for rotation
 */
export const applyImpulse = (
  mesh: BABYLON.Mesh,
  impulse: BABYLON.Vector3
): void => {
  if (mesh.physicsImpostor) {
    mesh.physicsImpostor.applyImpulse(
      impulse,
      mesh.getAbsolutePosition().add(mesh.getDirection(BABYLON.Axis.Z))
    );
  }
};

/**
 * Detect which face is on top (for dice)
 */
export const getDiceFace = (mesh: BABYLON.Mesh): number => {
  const rotation = mesh.rotation;
  const x = Math.round((rotation.x / Math.PI) * 2) % 4;
  const y = Math.round((rotation.y / Math.PI) * 2) % 4;
  const z = Math.round((rotation.z / Math.PI) * 2) % 4;

  // Simplified mapping (can be improved with raycast)
  const faces = [1, 6, 2, 5, 3, 4];
  const index = ((x + y + z) % 6);
  return faces[Math.abs(index)];
};

/**
 * Create particle system for win animation
 */
export const createWinParticles = (
  scene: BABYLON.Scene,
  position: BABYLON.Vector3
): BABYLON.ParticleSystem => {
  const particleSystem = new BABYLON.ParticleSystem('particles', 2000, scene);

  particleSystem.particleTexture = new BABYLON.DynamicTexture('dynamic texture', 64);
  particleSystem.emitter = position;
  particleSystem.minEmitBox = new BABYLON.Vector3(-1, 0, -1);
  particleSystem.maxEmitBox = new BABYLON.Vector3(1, 2, 1);

  particleSystem.minLifeTime = 0.5;
  particleSystem.maxLifeTime = 1.5;

  particleSystem.minEmitPower = 2;
  particleSystem.maxEmitPower = 5;
  particleSystem.updateSpeed = 0.01;

  particleSystem.start();

  return particleSystem;
};

/**
 * Create loading bar UI
 */
export const createLoadingUI = (scene: BABYLON.Scene): StackPanel => {
  try {
    const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');

    const panel = new StackPanel();
    panel.width = '300px';
    panel.height = '50px';
    panel.top = '-100px';
    panel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    panel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;

    const progressBar = new Rectangle('progressBar');
    progressBar.width = '300px';
    progressBar.height = '20px';
    progressBar.background = '#444';
    progressBar.thickness = 2;
    panel.addControl(progressBar);

    const progress = new Rectangle('progress');
    progress.width = '0px';
    progress.height = '20px';
    progress.background = '#00ff00';
    progress.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    progress.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    progressBar.addControl(progress);

    const text = new TextBlock('loadingText');
    text.text = 'Loading: 0%';
    text.color = 'white';
    text.height = '30px';
    text.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    panel.addControl(text);

    advancedTexture.addControl(panel);

    return panel;
  } catch (error) {
    console.warn('Failed to create loading UI:', error);
    throw error;
  }
};

/**
 * Dispose scene and engine safely
 */
export const disposeScene = (scene: BABYLON.Scene | null): void => {
  if (scene) {
    scene.dispose();
  }
};
