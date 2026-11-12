import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode
} from '@babylonjs/core';
import {
  CharacterCustomizationConfig,
  VISITOR_CHARACTERS,
  VisitorCharacterType
} from '../data/portfolioData';
import { TextureFactory } from '../world/TextureFactory';

export interface ArticulatedCharacterRig {
  root: TransformNode;
  bodyNode: TransformNode;
  headNode: TransformNode;
  leftArmPivot: TransformNode;
  rightArmPivot: TransformNode;
  leftLegPivot: TransformNode;
  rightLegPivot: TransformNode;
  hoverRing?: Mesh;
  capeMesh?: Mesh;
  companionNode?: TransformNode;
  labelPlane: Mesh;
  labelTexture: DynamicTexture;
  config: CharacterCustomizationConfig;
  displayName: string;
  walkPhase: number;
  animate: (dt: number, isMoving: boolean, isSprinting: boolean, jumpOffset: number) => void;
  updateLabel: (newName: string, thoughtBubble?: string) => void;
  dispose: () => void;
}

export class CharacterBuilder {
  public static buildCharacter(
    scene: Scene,
    typeOrConfig: VisitorCharacterType['id'] | CharacterCustomizationConfig,
    customDisplayName?: string,
    initialThought?: string
  ): ArticulatedCharacterRig {
    let config: CharacterCustomizationConfig;

    if (typeof typeOrConfig === 'string') {
      const charDef =
        VISITOR_CHARACTERS.find((c) => c.id === typeOrConfig) || VISITOR_CHARACTERS[0];
      config = {
        ...charDef.defaultConfig,
        displayName: customDisplayName?.trim() || charDef.defaultConfig.displayName
      };
    } else {
      config = {
        ...typeOrConfig,
        displayName: customDisplayName?.trim() || typeOrConfig.displayName || 'Museum Visitor'
      };
    }

    const displayName = config.displayName;
    const uid = `${displayName}-${Math.floor(Math.random() * 100000)}`;

    const root = new TransformNode(`charRoot-${uid}`, scene);
    const bodyNode = new TransformNode(`charBody-${uid}`, scene);
    bodyNode.parent = root;

    // Materials from custom colors
    const primaryMat = new StandardMaterial(`primaryMat-${uid}`, scene);
    primaryMat.diffuseColor = Color3.FromHexString(config.primaryColor);
    primaryMat.emissiveColor = Color3.FromHexString(config.primaryColor).scale(0.24);
    primaryMat.specularColor = new Color3(0.32, 0.32, 0.32);

    const secondaryMat = new StandardMaterial(`secondaryMat-${uid}`, scene);
    secondaryMat.diffuseColor = Color3.FromHexString(config.secondaryColor);
    secondaryMat.emissiveColor = Color3.FromHexString(config.secondaryColor).scale(0.42);

    const skinMat = new StandardMaterial(`skinMat-${uid}`, scene);
    skinMat.diffuseColor = Color3.FromHexString(config.skinOrChassisColor);
    skinMat.specularColor = new Color3(0.18, 0.18, 0.18);

    const darkMat = new StandardMaterial(`darkMat-${uid}`, scene);
    darkMat.diffuseColor = new Color3(0.11, 0.14, 0.21);
    darkMat.specularColor = new Color3(0.25, 0.25, 0.25);

    const eyeGlowMat = new StandardMaterial(`eyeMat-${uid}`, scene);
    eyeGlowMat.diffuseColor = new Color3(0.05, 0.08, 0.12);
    eyeGlowMat.emissiveColor =
      config.chassis === 'hover-bot'
        ? Color3.FromHexString(config.secondaryColor)
        : new Color3(0.05, 0.05, 0.08);

    // Subtle ground shadow disc
    const shadowDisc = MeshBuilder.CreateDisc(
      `shadow-${uid}`,
      { radius: 0.6, tessellation: 24 },
      scene
    );
    shadowDisc.rotation.x = Math.PI / 2;
    shadowDisc.position.y = 0.02;
    shadowDisc.isPickable = false;
    const shadowMat = new StandardMaterial(`shadowMat-${uid}`, scene);
    shadowMat.diffuseColor = new Color3(0.02, 0.04, 0.09);
    shadowMat.alpha = 0.45;
    shadowDisc.material = shadowMat;
    shadowDisc.parent = root;

    // Torso
    const torso = MeshBuilder.CreateCylinder(
      `torso-${uid}`,
      { height: 0.88, diameterTop: 0.64, diameterBottom: 0.54, tessellation: 20 },
      scene
    );
    torso.position.y = 1.18;
    torso.material = primaryMat;
    torso.isPickable = false;
    torso.parent = bodyNode;

    // Chest emblem / core
    const chestBadge = MeshBuilder.CreateBox(
      `chestBadge-${uid}`,
      { width: 0.34, height: 0.22, depth: 0.08 },
      scene
    );
    chestBadge.position.set(0, 1.32, 0.28);
    chestBadge.material = secondaryMat;
    chestBadge.isPickable = false;
    chestBadge.parent = bodyNode;

    // Head Node
    const headNode = new TransformNode(`headNode-${uid}`, scene);
    headNode.position.set(0, 1.92, 0);
    headNode.parent = bodyNode;

    const head = MeshBuilder.CreateSphere(
      `head-${uid}`,
      { diameter: 0.64, segments: 20 },
      scene
    );
    head.scaling.set(1, 0.96, 0.96);
    head.material = skinMat;
    head.isPickable = false;
    head.parent = headNode;

    // Eyes
    const leftEye = MeshBuilder.CreateSphere(
      `leftEye-${uid}`,
      { diameter: 0.09, segments: 12 },
      scene
    );
    leftEye.position.set(-0.12, 0.04, 0.28);
    leftEye.material = eyeGlowMat;
    leftEye.isPickable = false;
    leftEye.parent = headNode;

    const rightEye = leftEye.clone(`rightEye-${uid}`);
    rightEye.position.x = 0.12;
    rightEye.parent = headNode;

    // 1. Modular Headwear
    if (config.headwear === 'slick-hair') {
      const hair = MeshBuilder.CreateSphere(
        `hair-${uid}`,
        { diameter: 0.67, segments: 16, slice: 0.55 },
        scene
      );
      hair.position.y = 0.03;
      hair.rotation.x = -0.18;
      hair.material = darkMat;
      hair.isPickable = false;
      hair.parent = headNode;
    } else if (config.headwear === 'beret') {
      const beret = MeshBuilder.CreateCylinder(
        `beret-${uid}`,
        { height: 0.14, diameterTop: 0.56, diameterBottom: 0.65, tessellation: 20 },
        scene
      );
      beret.position.set(0.05, 0.28, 0);
      beret.rotation.z = -0.18;
      beret.material = primaryMat;
      beret.isPickable = false;
      beret.parent = headNode;
    } else if (config.headwear === 'crown') {
      const crownRing = MeshBuilder.CreateTorus(
        `crown-${uid}`,
        { diameter: 0.48, thickness: 0.07, tessellation: 16 },
        scene
      );
      crownRing.position.set(0, 0.42, 0);
      crownRing.material = secondaryMat;
      crownRing.isPickable = false;
      crownRing.parent = headNode;

      const crownGem = MeshBuilder.CreatePolyhedron(
        `crownGem-${uid}`,
        { type: 1, size: 0.11 },
        scene
      );
      crownGem.position.set(0, 0.52, 0.18);
      crownGem.material = primaryMat;
      crownGem.isPickable = false;
      crownGem.parent = headNode;
    } else if (config.headwear === 'antenna') {
      const antennaRod = MeshBuilder.CreateCylinder(
        `antenna-${uid}`,
        { height: 0.28, diameter: 0.045 },
        scene
      );
      antennaRod.position.set(0, 0.39, 0);
      antennaRod.material = darkMat;
      antennaRod.isPickable = false;
      antennaRod.parent = headNode;

      const antennaOrb = MeshBuilder.CreateSphere(
        `antennaOrb-${uid}`,
        { diameter: 0.15 },
        scene
      );
      antennaOrb.position.set(0, 0.54, 0);
      antennaOrb.material = secondaryMat;
      antennaOrb.isPickable = false;
      antennaOrb.parent = headNode;
    } else if (config.headwear === 'headphones') {
      const band = MeshBuilder.CreateTorus(
        `hpBand-${uid}`,
        { diameter: 0.68, thickness: 0.06, tessellation: 24 },
        scene
      );
      band.rotation.x = Math.PI / 2;
      band.position.y = 0.04;
      band.material = secondaryMat;
      band.isPickable = false;
      band.parent = headNode;

      [-0.33, 0.33].forEach((xPos, i) => {
        const cup = MeshBuilder.CreateCylinder(
          `hpCup-${uid}-${i}`,
          { height: 0.1, diameter: 0.22, tessellation: 16 },
          scene
        );
        cup.rotation.z = Math.PI / 2;
        cup.position.set(xPos, 0.02, 0);
        cup.material = primaryMat;
        cup.isPickable = false;
        cup.parent = headNode;
      });
    }

    // 2. Modular Eyewear
    if (config.eyewear === 'glasses') {
      const glasses = MeshBuilder.CreateBox(
        `glasses-${uid}`,
        { width: 0.44, height: 0.11, depth: 0.05 },
        scene
      );
      glasses.position.set(0, 0.05, 0.3);
      glasses.material = secondaryMat;
      glasses.isPickable = false;
      glasses.parent = headNode;
    } else if (config.eyewear === 'cyber-visor') {
      const visor = MeshBuilder.CreateCylinder(
        `visor-${uid}`,
        { height: 0.15, diameter: 0.66, arc: 0.5, tessellation: 20 },
        scene
      );
      visor.rotation.y = -Math.PI / 2;
      visor.position.set(0, 0.04, 0.02);
      visor.material = secondaryMat;
      visor.isPickable = false;
      visor.parent = headNode;
    } else if (config.eyewear === 'sunglasses') {
      const shades = MeshBuilder.CreateBox(
        `shades-${uid}`,
        { width: 0.46, height: 0.13, depth: 0.06 },
        scene
      );
      shades.position.set(0, 0.05, 0.3);
      shades.material = darkMat;
      shades.isPickable = false;
      shades.parent = headNode;
    }

    // 3. Modular Backwear
    let capeMesh: Mesh | undefined;
    if (config.backwear === 'tech-pack') {
      const pack = MeshBuilder.CreateBox(
        `pack-${uid}`,
        { width: 0.44, height: 0.54, depth: 0.22 },
        scene
      );
      pack.position.set(0, 1.24, -0.32);
      pack.material = darkMat;
      pack.isPickable = false;
      pack.parent = bodyNode;

      const core = MeshBuilder.CreateSphere(`packCore-${uid}`, { diameter: 0.16 }, scene);
      core.position.set(0, 1.24, -0.43);
      core.material = secondaryMat;
      core.isPickable = false;
      core.parent = bodyNode;
    } else if (config.backwear === 'scarf') {
      const scarf = MeshBuilder.CreateTorus(
        `scarf-${uid}`,
        { diameter: 0.58, thickness: 0.14, tessellation: 20 },
        scene
      );
      scarf.position.set(0, 1.62, 0);
      scarf.material = secondaryMat;
      scarf.isPickable = false;
      scarf.parent = bodyNode;
    } else if (config.backwear === 'cape') {
      capeMesh = MeshBuilder.CreateBox(
        `cape-${uid}`,
        { width: 0.58, height: 0.95, depth: 0.04 },
        scene
      );
      capeMesh.position.set(0, 1.08, -0.32);
      capeMesh.rotation.x = 0.18;
      capeMesh.material = secondaryMat;
      capeMesh.isPickable = false;
      capeMesh.parent = bodyNode;
    } else if (config.backwear === 'wings') {
      [-1, 1].forEach((dir, idx) => {
        const wing = MeshBuilder.CreateBox(
          `wing-${uid}-${idx}`,
          { width: 0.65, height: 0.28, depth: 0.05 },
          scene
        );
        wing.position.set(dir * 0.46, 1.36, -0.28);
        wing.rotation.z = dir * 0.35;
        wing.material = secondaryMat;
        wing.isPickable = false;
        wing.parent = bodyNode;
      });
    }

    // 4. Chassis: Hover-Bot vs Humanoid Legs
    let hoverRing: Mesh | undefined;
    const leftLegPivot = new TransformNode(`leftLegPivot-${uid}`, scene);
    leftLegPivot.position.set(-0.16, 0.74, 0);
    leftLegPivot.parent = bodyNode;

    const rightLegPivot = new TransformNode(`rightLegPivot-${uid}`, scene);
    rightLegPivot.position.set(0.16, 0.74, 0);
    rightLegPivot.parent = bodyNode;

    if (config.chassis === 'hover-bot') {
      hoverRing = MeshBuilder.CreateTorus(
        `hoverRing-${uid}`,
        { diameter: 0.74, thickness: 0.1, tessellation: 28 },
        scene
      );
      hoverRing.position.y = 0.36;
      hoverRing.material = secondaryMat;
      hoverRing.isPickable = false;
      hoverRing.parent = bodyNode;

      const innerRing = MeshBuilder.CreateTorus(
        `innerHoverRing-${uid}`,
        { diameter: 0.44, thickness: 0.06, tessellation: 20 },
        scene
      );
      innerRing.position.y = 0.2;
      innerRing.material = primaryMat;
      innerRing.isPickable = false;
      innerRing.parent = bodyNode;
    } else {
      const leftLeg = MeshBuilder.CreateCylinder(
        `leftLeg-${uid}`,
        { height: 0.68, diameter: 0.21, tessellation: 14 },
        scene
      );
      leftLeg.position.y = -0.34;
      leftLeg.material = darkMat;
      leftLeg.isPickable = false;
      leftLeg.parent = leftLegPivot;

      const rightLeg = leftLeg.clone(`rightLeg-${uid}`);
      rightLeg.parent = rightLegPivot;
    }

    // Arms
    const leftArmPivot = new TransformNode(`leftArmPivot-${uid}`, scene);
    leftArmPivot.position.set(-0.4, 1.5, 0);
    leftArmPivot.parent = bodyNode;

    const leftArm = MeshBuilder.CreateCylinder(
      `leftArm-${uid}`,
      { height: 0.62, diameter: 0.18, tessellation: 14 },
      scene
    );
    leftArm.position.y = -0.26;
    leftArm.material = primaryMat;
    leftArm.isPickable = false;
    leftArm.parent = leftArmPivot;

    const rightArmPivot = new TransformNode(`rightArmPivot-${uid}`, scene);
    rightArmPivot.position.set(0.4, 1.5, 0);
    rightArmPivot.parent = bodyNode;

    const rightArm = leftArm.clone(`rightArm-${uid}`);
    rightArm.parent = rightArmPivot;

    // 5. Companion Pet (Floating Drone or Holo-Cube)
    let companionNode: TransformNode | undefined;
    if (config.companion !== 'none') {
      companionNode = new TransformNode(`companion-${uid}`, scene);
      companionNode.position.set(0.82, 2.05, -0.2);
      companionNode.parent = root;

      if (config.companion === 'mini-drone') {
        const droneCore = MeshBuilder.CreateSphere(
          `droneCore-${uid}`,
          { diameter: 0.26, segments: 14 },
          scene
        );
        droneCore.material = primaryMat;
        droneCore.isPickable = false;
        droneCore.parent = companionNode;

        const droneHalo = MeshBuilder.CreateTorus(
          `droneHalo-${uid}`,
          { diameter: 0.42, thickness: 0.04, tessellation: 20 },
          scene
        );
        droneHalo.material = secondaryMat;
        droneHalo.isPickable = false;
        droneHalo.parent = companionNode;
      } else if (config.companion === 'holo-cube') {
        const cube = MeshBuilder.CreatePolyhedron(
          `holoCube-${uid}`,
          { type: 1, size: 0.18 },
          scene
        );
        cube.material = secondaryMat;
        cube.isPickable = false;
        cube.parent = companionNode;
      }
    }

    // Floating Nameplate & Thought Bubble above character
    const labelPlane = MeshBuilder.CreatePlane(
      `labelPlane-${uid}`,
      { width: 2.35, height: 1.18 },
      scene
    );
    labelPlane.position.set(0, 2.95, 0);
    labelPlane.billboardMode = Mesh.BILLBOARDMODE_ALL;
    labelPlane.isPickable = false;
    labelPlane.parent = root;

    const labelTexture = TextureFactory.createCharacterLabelTexture(
      scene,
      displayName,
      config.badgeText,
      config.primaryColor,
      initialThought
    );
    const labelMat = new StandardMaterial(`labelMat-${uid}`, scene);
    labelMat.diffuseTexture = labelTexture;
    labelMat.emissiveTexture = labelTexture;
    labelMat.opacityTexture = labelTexture;
    labelMat.backFaceCulling = false;
    labelMat.disableLighting = true;
    labelPlane.material = labelMat;

    const rig: ArticulatedCharacterRig = {
      root,
      bodyNode,
      headNode,
      leftArmPivot,
      rightArmPivot,
      leftLegPivot,
      rightLegPivot,
      hoverRing,
      capeMesh,
      companionNode,
      labelPlane,
      labelTexture,
      config,
      displayName,
      walkPhase: Math.random() * Math.PI * 2,
      animate: (dt: number, isMoving: boolean, isSprinting: boolean, jumpOffset: number) => {
        const freq = isMoving ? (isSprinting ? 14 : 9.5) : 2.2;
        rig.walkPhase += dt * freq;

        if (isMoving) {
          const swingAmp = isSprinting ? 0.78 : 0.52;
          const s = Math.sin(rig.walkPhase) * swingAmp;
          leftLegPivot.rotation.x = s;
          rightLegPivot.rotation.x = -s;
          leftArmPivot.rotation.x = -s * 0.85;
          rightArmPivot.rotation.x = s * 0.85;
          bodyNode.position.y = Math.abs(Math.cos(rig.walkPhase)) * 0.08 + jumpOffset;
          headNode.rotation.z = Math.sin(rig.walkPhase * 0.5) * 0.04;
          if (capeMesh) {
            capeMesh.rotation.x = 0.35 + Math.abs(Math.sin(rig.walkPhase)) * 0.25;
          }
        } else {
          leftLegPivot.rotation.x *= 0.85;
          rightLegPivot.rotation.x *= 0.85;
          leftArmPivot.rotation.x = Math.sin(rig.walkPhase) * 0.05;
          rightArmPivot.rotation.x = -Math.sin(rig.walkPhase) * 0.05;
          bodyNode.position.y = Math.sin(rig.walkPhase) * 0.035 + jumpOffset;
          headNode.rotation.z = Math.sin(rig.walkPhase * 0.5) * 0.02;
          if (capeMesh) {
            capeMesh.rotation.x = 0.16 + Math.sin(rig.walkPhase) * 0.05;
          }
        }

        if (hoverRing) {
          hoverRing.scaling.setAll(1 + Math.sin(rig.walkPhase * 2) * 0.09);
        }

        if (companionNode) {
          companionNode.position.y = 2.05 + Math.sin(rig.walkPhase * 1.4) * 0.12;
          companionNode.rotation.y += dt * 1.8;
        }
      },
      updateLabel: (newName: string, thoughtBubble?: string) => {
        rig.displayName = newName.trim() || config.displayName;
        TextureFactory.updateCharacterLabelTexture(
          labelTexture,
          rig.displayName,
          rig.config.badgeText,
          rig.config.primaryColor,
          thoughtBubble
        );
      },
      dispose: () => {
        root.dispose();
      }
    };

    return rig;
  }
}
