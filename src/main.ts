import { Color4, Engine, Scene } from '@babylonjs/core';
import { SoundFX } from './audio/SoundFX';
import { PlayerController } from './entities/PlayerController';
import { MultiplayerManager } from './network/MultiplayerManager';
import { UIManager } from './ui/UIManager';
import { CollisionSystem } from './world/CollisionSystem';
import { MuseumBuilder } from './world/MuseumBuilder';

function bootstrapMuseumGame(): void {
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement | null;
  if (!canvas) {
    throw new Error('Missing #renderCanvas element');
  }

  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true
  });

  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.53, 0.81, 0.92, 1.0);

  // 1. Initialize Spatial Collision System for Walls, Pedestals, Planters, Ponds, Trees & Characters
  const collisionSystem = new CollisionSystem();

  // 2. Build 3D Museum Architecture, Botanical Park, Exhibits, Dioramas & Roaming AI Tour Guide Bot
  const museum = new MuseumBuilder(scene, collisionSystem);
  museum.build();

  // 3. Spawn Player Visitor Character & Third-Person Camera
  const player = new PlayerController(
    scene,
    canvas,
    'recruiter',
    'Alex (VIP Visitor)',
    museum.interactables,
    collisionSystem
  );
  museum.getPlayerPosition = () => player.position;

  // 4. Initialize Multi-User Live Presence & Real-Time Visitor Sync
  const multiplayer = new MultiplayerManager(scene, player);

  // 5. Initialize SoundFX & HTML/Dialog HUD Overlay
  const sfx = new SoundFX();
  const ui = new UIManager(player, museum, multiplayer, sfx);

  // Open Character Customizer modal on initial entry
  const charDialog = document.getElementById('character-dialog') as HTMLDialogElement | null;
  if (charDialog && !charDialog.open) {
    charDialog.showModal();
  }

  // Render Loop
  engine.runRenderLoop(() => {
    scene.render();
    ui.updateRadarMinimap();
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });
}

bootstrapMuseumGame();
