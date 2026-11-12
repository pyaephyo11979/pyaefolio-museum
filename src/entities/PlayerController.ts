import {
  ArcRotateCamera,
  Color3,
  Mesh,
  MeshBuilder,
  PointerEventTypes,
  Scene,
  StandardMaterial,
  Vector3
} from '@babylonjs/core';
import {
  CharacterCustomizationConfig,
  VisitorCharacterType
} from '../data/portfolioData';
import { CollisionSystem } from '../world/CollisionSystem';
import { InteractableTarget } from '../world/MuseumBuilder';
import { ArticulatedCharacterRig, CharacterBuilder } from './CharacterBuilder';

export class PlayerController {
  public camera: ArcRotateCamera;
  public rig: ArticulatedCharacterRig;
  public position = new Vector3(
    (Math.random() - 0.5) * 3.0,
    0,
    -4 + (Math.random() - 0.5) * 1.4
  );
  public rotationY = 0;
  public isMoving = false;
  public isSprinting = false;
  public jumpOffset = 0;
  public currentThought = 'Exploring PyaeFolio 3D Museum';

  private keys = new Set<string>();
  private touchMoveX = 0;
  private touchMoveY = 0;
  private dpadMoveX = 0;
  private dpadMoveY = 0;
  private touchOrbitDir = 0;
  private touchSprinting = false;

  private walkDestination: Vector3 | null = null;
  private pendingInteractableOnArrival: InteractableTarget | null = null;
  private destMarker: Mesh;
  private stuckTimer = 0;
  private jumpVelocity = 0;
  private isGrounded = true;

  public activeInteractable: InteractableTarget | null = null;
  private onProximityChange?: (target: InteractableTarget | null) => void;
  private onTriggerInteractable?: (target: InteractableTarget) => void;
  private getNPCPositions?: () => Vector3[];
  private onRemotePeerClicked?: (peerId: string) => void;

  constructor(
    private scene: Scene,
    canvas: HTMLCanvasElement,
    initialCharConfig: VisitorCharacterType['id'] | CharacterCustomizationConfig,
    initialVisitorName: string,
    private interactables: InteractableTarget[],
    private collisionSystem: CollisionSystem
  ) {
    this.rig = CharacterBuilder.buildCharacter(
      scene,
      initialCharConfig,
      initialVisitorName,
      'Exploring PyaeFolio 3D Museum'
    );
    this.rig.root.position.copyFrom(this.position);

    const isPortraitMobile = window.innerWidth < 680;
    this.camera = new ArcRotateCamera(
      'playerCamera',
      -Math.PI / 2,
      isPortraitMobile ? 1.1 : 1.16,
      isPortraitMobile ? 11.8 : 9.8,
      new Vector3(0, 1.9, -4),
      scene
    );
    this.camera.lowerBetaLimit = 0.52;
    this.camera.upperBetaLimit = 1.44;
    this.camera.lowerRadiusLimit = 4.5;
    this.camera.upperRadiusLimit = 21.0;
    this.camera.wheelPrecision = 24;
    this.camera.panningSensibility = 0;
    this.camera.attachControl(canvas, true);

    this.destMarker = MeshBuilder.CreateTorus(
      'destMarker',
      { diameter: 1.15, thickness: 0.07, tessellation: 28 },
      scene
    );
    this.destMarker.isPickable = false;
    this.destMarker.setEnabled(false);
    const destMat = new StandardMaterial('destMarkerMat', scene);
    destMat.diffuseColor = Color3.FromHexString('#38BDF8');
    destMat.emissiveColor = Color3.FromHexString('#38BDF8');
    this.destMarker.material = destMat;

    this.setupInputs();
    this.scene.onBeforeRenderObservable.add(() => this.update());
  }

  public setCallbacks(
    onProximityChange: (target: InteractableTarget | null) => void,
    onTriggerInteractable: (target: InteractableTarget) => void,
    getNPCPositions?: () => Vector3[],
    onRemotePeerClicked?: (peerId: string) => void
  ): void {
    this.onProximityChange = onProximityChange;
    this.onTriggerInteractable = onTriggerInteractable;
    this.getNPCPositions = getNPCPositions;
    this.onRemotePeerClicked = onRemotePeerClicked;
  }

  public applyCharacterCustomization(
    config: CharacterCustomizationConfig,
    thoughtBubble?: string
  ): void {
    if (thoughtBubble) {
      this.currentThought = thoughtBubble;
    }
    const currentPos = this.position.clone();
    const currentRot = this.rotationY;
    this.rig.dispose();
    this.rig = CharacterBuilder.buildCharacter(
      this.scene,
      config,
      config.displayName,
      this.currentThought
    );
    this.position.copyFrom(currentPos);
    this.rotationY = currentRot;
    this.rig.root.position.copyFrom(this.position);
    this.rig.root.rotation.y = this.rotationY;
  }

  public setThoughtBubble(thought: string): void {
    this.currentThought = thought;
    this.rig.updateLabel(this.rig.displayName, thought);
  }

  public setTouchInput(moveX: number, moveY: number, isSprinting: boolean): void {
    this.touchMoveX = moveX;
    this.touchMoveY = moveY;
    this.touchSprinting = isSprinting;
  }

  public setDpadInput(moveX: number, moveY: number): void {
    this.dpadMoveX = moveX;
    this.dpadMoveY = moveY;
  }

  public setTouchSprinting(sprinting: boolean): void {
    this.touchSprinting = sprinting;
  }

  public setTouchOrbit(dir: number): void {
    this.touchOrbitDir = dir;
  }

  public snapCameraBehindPlayer(): void {
    this.camera.alpha = -this.rotationY - Math.PI / 2;
    this.camera.beta = 1.14;
  }

  public triggerJump(): void {
    if (this.isGrounded) {
      this.isGrounded = false;
      this.jumpVelocity = 6.2;
    }
  }

  public teleportTo(x: number, z: number, lookAtX: number, lookAtZ: number): void {
    this.walkDestination = null;
    this.pendingInteractableOnArrival = null;
    this.destMarker.setEnabled(false);

    const safePos = this.collisionSystem.resolvePosition(new Vector3(x, 0, z), 0.58);
    this.position.copyFrom(safePos);
    this.rig.root.position.copyFrom(this.position);

    const dx = lookAtX - this.position.x;
    const dz = lookAtZ - this.position.z;
    this.rotationY = Math.atan2(dx, dz);
    this.rig.root.rotation.y = this.rotationY;

    this.camera.alpha = -this.rotationY - Math.PI / 2;
  }

  public walkToAndInspect(target: InteractableTarget): void {
    const dist = Vector3.Distance(this.position, target.position);
    if (dist <= target.radius + 1.5) {
      this.onTriggerInteractable?.(target);
      return;
    }
    this.walkDestination = target.position.clone();
    this.pendingInteractableOnArrival = target;
    this.stuckTimer = 0;
    this.destMarker.position.set(target.position.x, 0.05, target.position.z);
    this.destMarker.setEnabled(true);
  }

  private setupInputs(): void {
    window.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'select' ||
        document.querySelector('dialog[open]')
      ) {
        return;
      }

      const code = e.code;
      this.keys.add(code);

      if (code === 'KeyE' || code === 'Enter') {
        if (this.activeInteractable) {
          e.preventDefault();
          this.onTriggerInteractable?.(this.activeInteractable);
        }
      } else if (code === 'Space') {
        e.preventDefault();
        this.triggerJump();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.touchMoveX = 0;
      this.touchMoveY = 0;
      this.dpadMoveX = 0;
      this.dpadMoveY = 0;
      this.touchOrbitDir = 0;
    });

    let pointerDownPos = { x: 0, y: 0 };
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (document.querySelector('dialog[open]')) return;

      if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
        pointerDownPos = {
          x: this.scene.pointerX,
          y: this.scene.pointerY
        };
      } else if (pointerInfo.type === PointerEventTypes.POINTERUP) {
        const dragDist = Math.hypot(
          this.scene.pointerX - pointerDownPos.x,
          this.scene.pointerY - pointerDownPos.y
        );
        if (dragDist > 9) return;

        const pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY);
        if (!pick?.hit || !pick.pickedMesh || !pick.pickedPoint) return;

        let meshCursor: any = pick.pickedMesh;
        while (meshCursor) {
          const remotePeerId = meshCursor.metadata?.remotePeerId;
          if (remotePeerId) {
            this.onRemotePeerClicked?.(remotePeerId);
            return;
          }
          const interactableId = meshCursor.metadata?.interactableId;
          if (interactableId) {
            const found = this.interactables.find((it) => it.id === interactableId);
            if (found) {
              this.walkToAndInspect(found);
              return;
            }
          }
          meshCursor = meshCursor.parent;
        }

        if (pick.pickedMesh.metadata?.isWalkableFloor) {
          const rawTarget = new Vector3(
            this.clamp(pick.pickedPoint.x, -58, 58),
            0,
            this.clamp(pick.pickedPoint.z, -44, 82)
          );
          const safeTarget = this.collisionSystem.resolvePosition(rawTarget, 0.58);
          this.walkDestination = safeTarget;
          this.pendingInteractableOnArrival = null;
          this.stuckTimer = 0;
          this.destMarker.position.set(safeTarget.x, 0.05, safeTarget.z);
          this.destMarker.setEnabled(true);
        }
      }
    });
  }

  private update(): void {
    const dt = Math.min(this.scene.getEngine().getDeltaTime() / 1000, 0.1);

    if (this.keys.has('KeyQ') || this.touchOrbitDir < 0) {
      this.camera.alpha += dt * 2.1;
    }
    if (this.keys.has('KeyR') || this.touchOrbitDir > 0) {
      this.camera.alpha -= dt * 2.1;
    }

    if (!this.isGrounded) {
      this.jumpOffset += this.jumpVelocity * dt;
      this.jumpVelocity -= 16.5 * dt;
      if (this.jumpOffset <= 0) {
        this.jumpOffset = 0;
        this.jumpVelocity = 0;
        this.isGrounded = true;
      }
    }

    let moveForward = 0;
    let moveRight = 0;

    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) moveForward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) moveForward -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) moveRight += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) moveRight -= 1;

    moveRight += this.dpadMoveX;
    moveForward += this.dpadMoveY;

    if (Math.hypot(this.touchMoveX, this.touchMoveY) > 0.08) {
      moveRight += this.touchMoveX;
      moveForward += this.touchMoveY;
    }

    const isSprinting =
      this.keys.has('ShiftLeft') ||
      this.keys.has('ShiftRight') ||
      this.touchSprinting;
    const baseSpeed = 8.4 * this.rig.config.speedMultiplier;
    const moveSpeed = isSprinting ? baseSpeed * 1.55 : baseSpeed;

    let velocity = Vector3.Zero();
    let isMoving = false;

    if (Math.abs(moveForward) > 0.01 || Math.abs(moveRight) > 0.01) {
      this.walkDestination = null;
      this.pendingInteractableOnArrival = null;
      this.destMarker.setEnabled(false);

      const camPos = this.camera.position;
      const forward = new Vector3(
        this.position.x - camPos.x,
        0,
        this.position.z - camPos.z
      ).normalize();
      const right = new Vector3(forward.z, 0, -forward.x);

      velocity = forward.scale(moveForward).add(right.scale(moveRight)).normalize();
      isMoving = true;
    } else if (this.walkDestination) {
      const toDest = this.walkDestination.subtract(this.position);
      toDest.y = 0;
      const dist = toDest.length();

      if (dist < 0.55) {
        this.walkDestination = null;
        this.destMarker.setEnabled(false);
        if (this.pendingInteractableOnArrival) {
          const target = this.pendingInteractableOnArrival;
          this.pendingInteractableOnArrival = null;
          this.onTriggerInteractable?.(target);
        }
      } else {
        velocity = toDest.normalize();
        isMoving = true;
        this.destMarker.scaling.setAll(1 + Math.sin(performance.now() * 0.008) * 0.15);
      }
    }

    if (isMoving) {
      const prevPos = this.position.clone();
      const desiredPos = this.position.add(velocity.scale(moveSpeed * dt));
      const npcPositions = this.getNPCPositions ? this.getNPCPositions() : [];

      const resolvedPos = this.collisionSystem.resolvePosition(
        desiredPos,
        0.58,
        npcPositions
      );
      this.position.copyFrom(resolvedPos);

      // If click-to-move is blocked by an obstacle and barely advancing, cancel walk gracefully
      if (this.walkDestination) {
        const movedDist = Vector3.Distance(prevPos, this.position);
        if (movedDist < moveSpeed * dt * 0.18) {
          this.stuckTimer += dt;
          if (this.stuckTimer > 0.45) {
            this.walkDestination = null;
            this.destMarker.setEnabled(false);
            this.stuckTimer = 0;
          }
        } else {
          this.stuckTimer = 0;
        }
      }

      const targetYaw = Math.atan2(velocity.x, velocity.z);
      this.rotationY = this.lerpAngle(this.rotationY, targetYaw, dt * 12);
    }

    this.rig.root.position.copyFrom(this.position);
    this.rig.root.rotation.y = this.rotationY;
    this.isMoving = isMoving;
    this.isSprinting = isSprinting;
    this.rig.animate(dt, isMoving, isSprinting, this.jumpOffset);

    const desiredCamTarget = new Vector3(
      this.position.x,
      this.position.y + 1.85,
      this.position.z
    );
    Vector3.LerpToRef(
      this.camera.target,
      desiredCamTarget,
      Math.min(1, dt * 12),
      this.camera.target
    );

    this.checkInteractableProximity();
  }

  private checkInteractableProximity(): void {
    let closest: InteractableTarget | null = null;
    let closestDist = Infinity;

    const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.09;

    for (const item of this.interactables) {
      const d = Vector3.Distance(this.position, item.position);
      const inRange = d <= item.radius;

      if (item.floorRingMesh && item.ringMaterial) {
        if (inRange) {
          item.floorRingMesh.scaling.setAll(pulse * 1.12);
          item.ringMaterial.emissiveColor = Color3.FromHexString(item.accentColor).scale(0.95);
        } else {
          item.floorRingMesh.scaling.setAll(1);
          item.ringMaterial.emissiveColor = Color3.FromHexString(item.accentColor).scale(0.35);
        }
      }

      if (inRange && d < closestDist) {
        closestDist = d;
        closest = item;
      }
    }

    if (closest?.id !== this.activeInteractable?.id) {
      this.activeInteractable = closest;
      this.onProximityChange?.(closest);
    }
  }

  private clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }

  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * Math.min(1, t);
  }
}
