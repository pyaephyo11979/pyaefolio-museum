import {
  Color3,
  DirectionalLight,
  GlowLayer,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3
} from '@babylonjs/core';
import {
  EXPERIENCE_ITEMS,
  ExperienceItem,
  HELP_BOT_CONFIG,
  HELP_BOT_TOUR_WAYPOINTS,
  PROFILE_DATA,
  PROJECT_EXHIBITS,
  ProjectExhibit,
  SKILL_PILLARS,
  SkillPillar
} from '../data/portfolioData';
import { ArticulatedCharacterRig, CharacterBuilder } from '../entities/CharacterBuilder';
import { CollisionSystem } from './CollisionSystem';
import { DioramaBuilder } from './DioramaBuilder';
import { EnvironmentBuilder } from './EnvironmentBuilder';
import { TextureFactory } from './TextureFactory';

export type InteractableKind =
  | 'profile'
  | 'project'
  | 'skill'
  | 'experience'
  | 'contact'
  | 'guestbook'
  | 'helpbot';

export interface InteractableTarget {
  id: string;
  kind: InteractableKind;
  title: string;
  subtitle: string;
  accentColor: string;
  position: Vector3;
  radius: number;
  floorRingMesh?: Mesh;
  ringMaterial?: StandardMaterial;
  projectData?: ProjectExhibit;
  skillData?: SkillPillar;
  experienceData?: ExperienceItem;
  contactAction?: {
    label: string;
    url: string;
  };
}

export class MuseumBuilder {
  public interactables: InteractableTarget[] = [];
  public walkableFloorMeshes: Mesh[] = [];
  public helpBotRig?: ArticulatedCharacterRig;
  public helpBotPosition = new Vector3(
    HELP_BOT_TOUR_WAYPOINTS[0].x,
    0,
    HELP_BOT_TOUR_WAYPOINTS[0].z
  );
  public getPlayerPosition?: () => Vector3;
  private helpBotCustomSpeechTimer = 0;
  private hemiLight!: HemisphericLight;
  private dirLight!: DirectionalLight;
  private atriumLight!: PointLight;
  private envBuilder!: EnvironmentBuilder;
  private isNightTheme = false;

  constructor(
    private scene: Scene,
    private collisionSystem?: CollisionSystem
  ) {}

  public updateHelpBotSpeech(thought: string): void {
    if (!this.helpBotRig) return;
    this.helpBotCustomSpeechTimer = 14;
    this.helpBotRig.updateLabel(HELP_BOT_CONFIG.displayName, thought);
  }

  public build(): void {
    this.setupLightingAndAtmosphere();
    this.envBuilder = new EnvironmentBuilder(this.scene);
    const parkGround = this.envBuilder.build();
    this.walkableFloorMeshes.push(parkGround);

    this.buildArchitecturalShell();
    this.buildGrandRotunda();
    this.buildNorthProjectGallery();
    this.buildEastSkillWing();
    this.buildWestExperienceWing();
    this.buildSouthContactLounge();
  }

  private setupLightingAndAtmosphere(): void {
    this.scene.clearColor.set(0.53, 0.81, 0.92, 1.0);

    this.hemiLight = new HemisphericLight('hemiLight', new Vector3(0, 1, 0), this.scene);
    this.hemiLight.intensity = 0.78;
    this.hemiLight.diffuse = new Color3(0.96, 0.97, 0.98);
    this.hemiLight.groundColor = new Color3(0.2, 0.3, 0.24);

    this.dirLight = new DirectionalLight('dirLight', new Vector3(-0.45, -1, -0.35), this.scene);
    this.dirLight.position = new Vector3(30, 50, 30);
    this.dirLight.intensity = 0.52;
    this.dirLight.diffuse = new Color3(0.98, 0.95, 0.88);

    this.atriumLight = new PointLight('atriumLight', new Vector3(0, 11, 0), this.scene);
    this.atriumLight.intensity = 0.45;
    this.atriumLight.diffuse = Color3.FromHexString('#38BDF8');

    const glow = new GlowLayer('museumGlow', this.scene, {
      mainTextureSamples: 2,
      blurKernelSize: 32
    });
    glow.intensity = 0.32;
  }

  public toggleLightingTheme(): boolean {
    this.isNightTheme = !this.isNightTheme;
    this.envBuilder.setNightMode(this.isNightTheme);

    if (this.isNightTheme) {
      this.scene.clearColor.set(0.03, 0.06, 0.14, 1);
      this.hemiLight.intensity = 0.44;
      this.hemiLight.groundColor = new Color3(0.1, 0.16, 0.14);
      this.dirLight.intensity = 0.22;
      this.atriumLight.intensity = 0.95;
    } else {
      this.scene.clearColor.set(0.53, 0.81, 0.92, 1);
      this.hemiLight.intensity = 0.78;
      this.hemiLight.groundColor = new Color3(0.2, 0.3, 0.24);
      this.dirLight.intensity = 0.52;
      this.atriumLight.intensity = 0.45;
    }
    return this.isNightTheme;
  }

  private buildArchitecturalShell(): void {
    // Matte Slate-Stone Tile Floor Material (eliminates floor glare & makes exhibits pop)
    const floorTileTex = TextureFactory.createMuseumFloorTileTexture(this.scene);
    floorTileTex.uScale = 12;
    floorTileTex.vScale = 28;

    const plazaStoneMat = new StandardMaterial('plazaStoneMat', this.scene);
    plazaStoneMat.diffuseTexture = floorTileTex;
    plazaStoneMat.diffuseColor = Color3.FromHexString('#CBD5E1');
    plazaStoneMat.specularColor = new Color3(0.03, 0.04, 0.06);
    plazaStoneMat.specularPower = 64;

    const columnMat = new StandardMaterial('columnMat', this.scene);
    columnMat.diffuseColor = Color3.FromHexString('#CBD5E1');
    columnMat.specularColor = new Color3(0.08, 0.08, 0.1);

    // Crystal Glass Wall Material so visitors see the greenery outside!
    const glassWallMat = new StandardMaterial('glassWallMat', this.scene);
    glassWallMat.diffuseColor = Color3.FromHexString('#BAE6FD');
    glassWallMat.emissiveColor = Color3.FromHexString('#38BDF8').scale(0.15);
    glassWallMat.specularColor = Color3.White();
    glassWallMat.alpha = 0.2;

    const trimGlowMat = new StandardMaterial('trimGlowMat', this.scene);
    trimGlowMat.diffuseColor = Color3.FromHexString('#0066FF');
    trimGlowMat.emissiveColor = Color3.FromHexString('#0066FF').scale(0.55);

    const goldTrimMat = new StandardMaterial('goldTrimMat', this.scene);
    goldTrimMat.diffuseColor = Color3.FromHexString('#10B981');
    goldTrimMat.emissiveColor = Color3.FromHexString('#10B981').scale(0.45);

    // 1. North-South Main Museum Pavilion Stone Terrace (Width 37, Length 106)
    const mainPavilionFloor = MeshBuilder.CreateGround(
      'mainPavilionFloor',
      { width: 37, height: 106 },
      this.scene
    );
    mainPavilionFloor.position.set(0, 0.01, 18);
    mainPavilionFloor.material = plazaStoneMat;
    mainPavilionFloor.isPickable = true;
    mainPavilionFloor.metadata = { isWalkableFloor: true };
    this.walkableFloorMeshes.push(mainPavilionFloor);

    // 2. East-West Garden Promenade Stone Terrace (Width 94, Depth 26)
    const eastWestPromenade = MeshBuilder.CreateGround(
      'eastWestPromenade',
      { width: 94, height: 26 },
      this.scene
    );
    eastWestPromenade.position.set(0, 0.008, 0);
    eastWestPromenade.material = plazaStoneMat;
    eastWestPromenade.isPickable = true;
    eastWestPromenade.metadata = { isWalkableFloor: true };
    this.walkableFloorMeshes.push(eastWestPromenade);

    // Glowing Royal Blue & Emerald Guide Carpet along North Gallery
    const northCarpet = MeshBuilder.CreateGround(
      'northCarpet',
      { width: 5.2, height: 56 },
      this.scene
    );
    northCarpet.position.set(0, 0.02, 38);
    const carpetMat = new StandardMaterial('carpetMat', this.scene);
    carpetMat.diffuseColor = Color3.FromHexString('#1E3A8A');
    carpetMat.emissiveColor = Color3.FromHexString('#1D4ED8').scale(0.22);
    northCarpet.material = carpetMat;
    northCarpet.isPickable = true;
    northCarpet.metadata = { isWalkableFloor: true };
    this.walkableFloorMeshes.push(northCarpet);

    [-2.7, 2.7].forEach((xOffset, idx) => {
      const strip = MeshBuilder.CreateBox(
        `northStrip-${idx}`,
        { width: 0.12, height: 0.03, depth: 56 },
        this.scene
      );
      strip.position.set(xOffset, 0.025, 38);
      strip.material = trimGlowMat;
      strip.isPickable = false;
    });

    // North Gallery White Marble Columns & Open-Air Skylight Arches
    for (let z = 18; z <= 66; z += 12) {
      [-17.5, 17.5].forEach((x, sideIdx) => {
        const col = MeshBuilder.CreateCylinder(
          `col-${z}-${sideIdx}`,
          { height: 11, diameter: 1.05, tessellation: 20 },
          this.scene
        );
        col.position.set(x, 5.5, z);
        col.material = columnMat;
        col.isPickable = false;

        const colRing = MeshBuilder.CreateTorus(
          `colRing-${z}-${sideIdx}`,
          { diameter: 1.25, thickness: 0.08, tessellation: 24 },
          this.scene
        );
        colRing.position.set(x, 9.2, z);
        colRing.material = goldTrimMat;
        colRing.isPickable = false;
      });

      const beam = MeshBuilder.CreateBox(
        `skylightBeam-${z}`,
        { width: 36, height: 0.42, depth: 0.55 },
        this.scene
      );
      beam.position.set(0, 11, z);
      beam.material = columnMat;
      beam.isPickable = false;
    }

    // Transparent Glass Side Walls looking out onto the Pond & Sakura/Oak Trees!
    const leftGlassWall = MeshBuilder.CreateBox(
      'leftGlassWall',
      { width: 0.25, height: 10.5, depth: 54 },
      this.scene
    );
    leftGlassWall.position.set(-18.1, 5.25, 42);
    leftGlassWall.material = glassWallMat;
    leftGlassWall.isPickable = false;

    const rightGlassWall = MeshBuilder.CreateBox(
      'rightGlassWall',
      { width: 0.25, height: 10.5, depth: 54 },
      this.scene
    );
    rightGlassWall.position.set(18.1, 5.25, 42);
    rightGlassWall.material = glassWallMat;
    rightGlassWall.isPickable = false;

    // Far North Glass Archway & Grand Banner
    const farNorthGlass = MeshBuilder.CreateBox(
      'farNorthGlass',
      { width: 36, height: 10.5, depth: 0.25 },
      this.scene
    );
    farNorthGlass.position.set(0, 5.25, 70);
    farNorthGlass.material = glassWallMat;
    farNorthGlass.isPickable = false;

    const northBannerPlane = MeshBuilder.CreatePlane(
      'northBannerPlane',
      { width: 14, height: 3.5 },
      this.scene
    );
    northBannerPlane.position.set(0, 6.8, 69.5);
    const northBannerTex = TextureFactory.createSignBannerTexture(
      this.scene,
      'PYAEFOLIO EXHIBITION HALL',
      '8 FULL-STACK, BACKEND, MOBILE & FRONTEND ENGINEERING WORKS',
      '#10B981'
    );
    const bannerMat = new StandardMaterial('northBannerMat', this.scene);
    bannerMat.diffuseTexture = northBannerTex;
    bannerMat.emissiveTexture = northBannerTex;
    bannerMat.disableLighting = true;
    northBannerPlane.material = bannerMat;
    northBannerPlane.isPickable = false;
  }

  private buildGrandRotunda(): void {
    const outerRing = MeshBuilder.CreateTorus(
      'rotundaOuterRing',
      { diameter: 16, thickness: 0.14, tessellation: 64 },
      this.scene
    );
    outerRing.position.set(0, 0.03, 0);
    const ringMat = new StandardMaterial('rotundaRingMat', this.scene);
    ringMat.diffuseColor = Color3.FromHexString('#0066FF');
    ringMat.emissiveColor = Color3.FromHexString('#0066FF').scale(0.5);
    outerRing.material = ringMat;
    outerRing.isPickable = false;

    const skyHalo = MeshBuilder.CreateTorus(
      'rotundaSkyHalo',
      { diameter: 20, thickness: 0.35, tessellation: 64 },
      this.scene
    );
    skyHalo.position.set(0, 11.5, 0);
    skyHalo.material = ringMat;
    skyHalo.isPickable = false;

    const pedestal = MeshBuilder.CreateCylinder(
      'heroPedestal',
      { height: 1.2, diameterTop: 3.4, diameterBottom: 3.8, tessellation: 32 },
      this.scene
    );
    pedestal.position.set(0, 0.6, 5.5);
    const pedMat = new StandardMaterial('heroPedMat', this.scene);
    pedMat.diffuseColor = new Color3(0.12, 0.16, 0.26);
    pedestal.material = pedMat;

    const profileBoard = MeshBuilder.CreatePlane(
      'profileBoard',
      { width: 7.4, height: 3.7 },
      this.scene
    );
    profileBoard.position.set(0, 3.5, 5.5);
    const profileTex = TextureFactory.createProfileMonumentTexture(
      this.scene,
      PROFILE_DATA.fullName,
      PROFILE_DATA.title,
      PROFILE_DATA.heroTagline,
      PROFILE_DATA.avatarUrl
    );
    const profileMat = new StandardMaterial('profileBoardMat', this.scene);
    profileMat.diffuseTexture = profileTex;
    profileMat.emissiveTexture = profileTex;
    profileMat.backFaceCulling = false;
    profileMat.disableLighting = true;
    profileBoard.material = profileMat;

    const crown = MeshBuilder.CreatePolyhedron(
      'rotundaCrown',
      { type: 1, size: 0.65 },
      this.scene
    );
    crown.position.set(0, 6.2, 5.5);
    crown.material = ringMat;
    crown.isPickable = false;

    this.scene.onBeforeRenderObservable.add(() => {
      const dt = this.scene.getEngine().getDeltaTime() / 1000;
      crown.rotation.y += dt * 1.1;
      crown.rotation.x += dt * 0.5;
    });

    const { ringMesh, mat } = this.createInteractiveFloorRing(
      'ring-profile',
      0,
      2.2,
      '#0066FF',
      2.4
    );

    const target: InteractableTarget = {
      id: 'hero-profile',
      kind: 'profile',
      title: `${PROFILE_DATA.fullName} — ${PROFILE_DATA.title}`,
      subtitle: 'Curator Bio, Education & Resume Download',
      accentColor: '#0066FF',
      position: new Vector3(0, 0, 3.8),
      radius: 5.5,
      floorRingMesh: ringMesh,
      ringMaterial: mat
    };
    profileBoard.metadata = { interactableId: target.id };
    pedestal.metadata = { interactableId: target.id };
    this.interactables.push(target);

    this.createWayfinderSign('NORTH WING ↑', '8 Project Exhibits', 0, 12.5, 0, '#0066FF');
    this.createWayfinderSign(
      'EAST GARDEN →',
      'Skills & Tech Stack',
      14.5,
      0,
      Math.PI / 2,
      '#10B981'
    );
    this.createWayfinderSign(
      '← WEST GARDEN',
      'Experience & Education',
      -14.5,
      0,
      -Math.PI / 2,
      '#7C3AED'
    );
    this.createWayfinderSign(
      'SOUTH TERRACE ↓',
      'Contact & Guestbook',
      0,
      -12.5,
      Math.PI,
      '#06B6D4'
    );

    this.buildHelpBotConcierge();
  }

  private buildHelpBotConcierge(): void {
    const startWp = HELP_BOT_TOUR_WAYPOINTS[0];
    this.helpBotPosition.set(startWp.x, 0, startWp.z);

    const haloMat = new StandardMaterial('helpBotHaloMat', this.scene);
    haloMat.diffuseColor = Color3.FromHexString('#10B981');
    haloMat.emissiveColor = Color3.FromHexString('#10B981').scale(0.8);

    // 1. Build the Articulated 3D Roaming Help Bot NPC ("PyaeBot • AI Guide")
    const rig = CharacterBuilder.buildCharacter(
      this.scene,
      HELP_BOT_CONFIG,
      HELP_BOT_CONFIG.displayName,
      startWp.thought
    );
    rig.root.position.copyFrom(this.helpBotPosition);
    this.helpBotRig = rig;

    // Invisible click cylinder that follows PyaeBot so clicking anywhere on PyaeBot opens the AI Concierge
    const hitbox = MeshBuilder.CreateCylinder(
      'helpBotHitbox',
      { height: 3.2, diameter: 1.8, tessellation: 16 },
      this.scene
    );
    hitbox.position.set(startWp.x, 1.6, startWp.z);
    hitbox.visibility = 0;
    hitbox.isPickable = true;

    // Floating Overhead AI Concierge Banner that follows PyaeBot
    const signPlane = MeshBuilder.CreatePlane(
      'helpBotSignPlane',
      { width: 4.4, height: 1.1 },
      this.scene
    );
    signPlane.position.set(startWp.x, 4.25, startWp.z);
    signPlane.billboardMode = Mesh.BILLBOARDMODE_Y;
    const signTex = TextureFactory.createSignBannerTexture(
      this.scene,
      '🤖 PYAEBOT • AI TOUR GUIDE',
      'Walking Exhibition Guide • Click or Press E to Ask',
      '#10B981'
    );
    const signMat = new StandardMaterial('helpBotSignMat', this.scene);
    signMat.diffuseTexture = signTex;
    signMat.emissiveTexture = signTex;
    signMat.backFaceCulling = false;
    signMat.disableLighting = true;
    signPlane.material = signMat;

    // Floating rotating emerald AI crystal above sign
    const aiCrystal = MeshBuilder.CreatePolyhedron(
      'helpBotCrystal',
      { type: 1, size: 0.34 },
      this.scene
    );
    aiCrystal.position.set(startWp.x, 5.2, startWp.z);
    aiCrystal.material = haloMat;
    aiCrystal.isPickable = false;

    // 2. Dynamic Interactive Floor Ring moving with PyaeBot
    const { ringMesh, mat: ringMat } = this.createInteractiveFloorRing(
      'ring-helpbot',
      startWp.x,
      startWp.z,
      '#10B981',
      2.1
    );

    const target: InteractableTarget = {
      id: 'help-bot-npc',
      kind: 'helpbot',
      title: 'PyaeBot — AI Museum Guide & Q&A',
      subtitle: 'Powered by Google AI Studio (Gemini) + Instant Portfolio Q&As',
      accentColor: '#10B981',
      position: this.helpBotPosition.clone(),
      radius: 4.6,
      floorRingMesh: ringMesh,
      ringMaterial: ringMat
    };

    hitbox.metadata = { interactableId: target.id };
    signPlane.metadata = { interactableId: target.id };
    rig.labelPlane.isPickable = true;
    rig.labelPlane.metadata = { interactableId: target.id };
    for (const childMesh of rig.root.getChildMeshes()) {
      childMesh.isPickable = true;
      childMesh.metadata = { interactableId: target.id };
    }

    this.interactables.push(target);

    // 3. Autonomous Exhibition Tour Walking Loop + Player Proximity Greeting
    let wpIdx = 0;
    let pauseTimer = startWp.pauseSeconds;
    let stuckTime = 0;
    let botRotationY = 0;

    this.scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(this.scene.getEngine().getDeltaTime() / 1000, 0.1);

      if (this.helpBotCustomSpeechTimer > 0) {
        this.helpBotCustomSpeechTimer -= dt;
      }

      const playerPos = this.getPlayerPosition?.();
      const distToPlayer = playerPos
        ? Vector3.Distance(this.helpBotPosition, playerPos)
        : Infinity;
      const isDialogOpen = Boolean(document.getElementById('helpbot-dialog')?.hasAttribute('open'));

      // Pause and face the visitor when they approach PyaeBot or open the AI chat
      if ((distToPlayer <= 4.3 || isDialogOpen) && playerPos) {
        const dx = playerPos.x - this.helpBotPosition.x;
        const dz = playerPos.z - this.helpBotPosition.z;
        botRotationY = Math.atan2(dx, dz);
        rig.root.rotation.y = botRotationY;
        rig.animate(dt, false, false, 0);

        // Friendly greeting wave while talking to visitor
        rig.rightArmPivot.rotation.z = -0.35 - Math.sin(performance.now() * 0.005) * 0.22;
        rig.rightArmPivot.rotation.x = -0.45;
      } else {
        const wp = HELP_BOT_TOUR_WAYPOINTS[wpIdx];
        const targetPos = new Vector3(wp.x, 0, wp.z);
        const toWp = targetPos.subtract(this.helpBotPosition);
        toWp.y = 0;
        const dist = toWp.length();

        if (dist > 0.55) {
          const dir = toWp.normalize();
          const speed = 3.9;
          const prevPos = this.helpBotPosition.clone();
          const desired = this.helpBotPosition.add(dir.scale(speed * dt));

          const others = playerPos ? [playerPos] : [];
          const resolved = this.collisionSystem
            ? this.collisionSystem.resolvePosition(desired, 0.55, others)
            : desired;
          this.helpBotPosition.copyFrom(resolved);

          // Lateral sidestep if an obstacle blocks the straight path
          const actualMove = Vector3.Distance(prevPos, this.helpBotPosition);
          if (actualMove < speed * dt * 0.25 && this.collisionSystem) {
            stuckTime += dt;
            const tangent = new Vector3(dir.z, 0, -dir.x);
            const sideMoved = this.collisionSystem.resolvePosition(
              this.helpBotPosition.add(tangent.scale(speed * dt * 0.95)),
              0.55,
              others
            );
            this.helpBotPosition.copyFrom(sideMoved);

            if (stuckTime > 2.0) {
              stuckTime = 0;
              wpIdx = (wpIdx + 1) % HELP_BOT_TOUR_WAYPOINTS.length;
            }
          } else {
            stuckTime = 0;
          }

          botRotationY = Math.atan2(dir.x, dir.z);
          rig.root.rotation.y = botRotationY;
          rig.rightArmPivot.rotation.z = 0;
          rig.animate(dt, true, false, 0);
        } else {
          // Arrived at exhibit waypoint: pause and share commentary
          rig.rightArmPivot.rotation.z = -0.25 - Math.sin(performance.now() * 0.004) * 0.15;
          rig.animate(dt, false, false, 0);
          pauseTimer -= dt;
          if (pauseTimer <= 0) {
            wpIdx = (wpIdx + 1) % HELP_BOT_TOUR_WAYPOINTS.length;
            const nextWp = HELP_BOT_TOUR_WAYPOINTS[wpIdx];
            pauseTimer = nextWp.pauseSeconds;
            if (this.helpBotCustomSpeechTimer <= 0) {
              rig.updateLabel(HELP_BOT_CONFIG.displayName, nextWp.thought);
            }
          }
        }
      }

      // Sync all attached meshes and interactable target position with PyaeBot's live position
      rig.root.position.copyFrom(this.helpBotPosition);
      hitbox.position.set(this.helpBotPosition.x, 1.6, this.helpBotPosition.z);
      signPlane.position.set(this.helpBotPosition.x, 4.25, this.helpBotPosition.z);
      aiCrystal.position.set(this.helpBotPosition.x, 5.2, this.helpBotPosition.z);
      aiCrystal.rotation.y += dt * 1.6;
      aiCrystal.rotation.x += dt * 0.8;

      ringMesh.position.set(this.helpBotPosition.x, 0.03, this.helpBotPosition.z);
      target.position.copyFrom(this.helpBotPosition);
    });
  }

  private createWayfinderSign(
    title: string,
    subtitle: string,
    x: number,
    z: number,
    rotY: number,
    colorHex: string
  ): void {
    const post = MeshBuilder.CreateCylinder(
      `signPost-${title}`,
      { height: 2.2, diameter: 0.16 },
      this.scene
    );
    post.position.set(x, 1.1, z);
    post.isPickable = false;

    const board = MeshBuilder.CreatePlane(
      `signBoard-${title}`,
      { width: 4.2, height: 1.05 },
      this.scene
    );
    board.position.set(x, 2.4, z);
    board.rotation.y = rotY;
    const tex = TextureFactory.createSignBannerTexture(this.scene, title, subtitle, colorHex);
    const mat = new StandardMaterial(`signMat-${title}`, this.scene);
    mat.diffuseTexture = tex;
    mat.emissiveTexture = tex;
    mat.backFaceCulling = false;
    mat.disableLighting = true;
    board.material = mat;
    board.isPickable = false;
  }

  private buildNorthProjectGallery(): void {
    const pedMat = new StandardMaterial('projectPedMat', this.scene);
    pedMat.diffuseColor = new Color3(0.13, 0.17, 0.26);
    pedMat.specularColor = new Color3(0.2, 0.2, 0.25);

    for (const proj of PROJECT_EXHIBITS) {
      const { x, z } = proj.position;
      const isLeftSide = x < 0;

      // World X positions from hallway center (x=0) outward to glass wall (x=±18.1):
      // Visitor Stand Ring: ±8.8 -> Pedestal & 3D Diorama: ±11.5 -> Project Art Board: ±15.2
      const standX = isLeftSide ? -8.8 : 8.8;
      const pedX = isLeftSide ? -11.5 : 11.5;
      const frameX = isLeftSide ? -15.2 : 15.2;

      // 1. Marble Pedestal in front of the Project Art Board
      const pedestal = MeshBuilder.CreateCylinder(
        `pedestal-${proj.id}`,
        { height: 1.35, diameterTop: 1.5, diameterBottom: 1.75, tessellation: 28 },
        this.scene
      );
      pedestal.position.set(pedX, 0.675, z);
      pedestal.material = pedMat;

      const pedRim = MeshBuilder.CreateTorus(
        `pedRim-${proj.id}`,
        { diameter: 1.55, thickness: 0.06, tessellation: 28 },
        this.scene
      );
      pedRim.position.set(pedX, 1.36, z);
      const rimMat = new StandardMaterial(`rimMat-${proj.id}`, this.scene);
      rimMat.diffuseColor = Color3.FromHexString(proj.accentColor);
      rimMat.emissiveColor = Color3.FromHexString(proj.accentColor).scale(0.65);
      pedRim.material = rimMat;
      pedRim.isPickable = false;

      // 2. Animated 3D Project Diorama levitating above the Pedestal
      const worldDioramaPos = {
        x: pedX,
        y: 2.35,
        z
      };
      DioramaBuilder.createProjectDiorama(this.scene, proj, worldDioramaPos);

      // 3. Large Framed High-DPI Project Board behind the Pedestal (Double-Sided!)
      const frameOuter = MeshBuilder.CreateBox(
        `frameOuter-${proj.id}`,
        { width: 0.24, height: 4.9, depth: 6.6 },
        this.scene
      );
      frameOuter.position.set(frameX, 3.6, z);
      frameOuter.material = pedMat;

      const artTex = TextureFactory.createProjectCanvasTexture(this.scene, proj);
      const artMat = new StandardMaterial(`artMat-${proj.id}`, this.scene);
      artMat.diffuseTexture = artTex;
      artMat.emissiveTexture = artTex;
      artMat.disableLighting = true;

      // Hallway-facing front canvas
      const artPlaneFront = MeshBuilder.CreatePlane(
        `artPlaneFront-${proj.id}`,
        { width: 6.2, height: 4.65 },
        this.scene
      );
      artPlaneFront.position.set(
        isLeftSide ? frameX + 0.14 : frameX - 0.14,
        3.6,
        z
      );
      artPlaneFront.rotation.y = isLeftSide ? -Math.PI / 2 : Math.PI / 2;
      artPlaneFront.material = artMat;

      // Garden-facing back canvas (so viewing from outside the glass window also shows the project!)
      const artPlaneBack = MeshBuilder.CreatePlane(
        `artPlaneBack-${proj.id}`,
        { width: 6.2, height: 4.65 },
        this.scene
      );
      artPlaneBack.position.set(
        isLeftSide ? frameX - 0.14 : frameX + 0.14,
        3.6,
        z
      );
      artPlaneBack.rotation.y = isLeftSide ? Math.PI / 2 : -Math.PI / 2;
      artPlaneBack.material = artMat;

      // 4. Interactive Floor Ring where visitor stands
      const { ringMesh, mat } = this.createInteractiveFloorRing(
        `ring-${proj.id}`,
        standX,
        z,
        proj.accentColor,
        1.85
      );

      const target: InteractableTarget = {
        id: `project-${proj.id}`,
        kind: 'project',
        title: `#${proj.number} ${proj.title}`,
        subtitle: `${proj.category} • ${proj.techStack.slice(0, 3).join(', ')}`,
        accentColor: proj.accentColor,
        position: new Vector3(standX, 0, z),
        radius: 5.5,
        floorRingMesh: ringMesh,
        ringMaterial: mat,
        projectData: proj
      };

      pedestal.metadata = { interactableId: target.id };
      artPlaneFront.metadata = { interactableId: target.id };
      artPlaneBack.metadata = { interactableId: target.id };
      frameOuter.metadata = { interactableId: target.id };

      this.interactables.push(target);
    }
  }

  private buildEastSkillWing(): void {
    this.createWayfinderSign(
      'HALL OF SKILLS & TECH ARSENAL',
      'Frontend • Backend • Mobile • Database • Dev Tools',
      33,
      -15,
      0,
      '#10B981'
    );

    for (const pillar of SKILL_PILLARS) {
      const { x, z } = pillar.position;

      const base = MeshBuilder.CreateCylinder(
        `skillBase-${pillar.id}`,
        { height: 0.6, diameterTop: 2.6, diameterBottom: 3.0, tessellation: 24 },
        this.scene
      );
      base.position.set(x, 0.3, z);

      const board = MeshBuilder.CreatePlane(
        `skillBoard-${pillar.id}`,
        { width: 3.2, height: 4.8 },
        this.scene
      );
      board.position.set(x, 3.1, z);
      board.billboardMode = Mesh.BILLBOARDMODE_Y;

      const tex = TextureFactory.createSkillPillarTexture(this.scene, pillar);
      const mat = new StandardMaterial(`skillBoardMat-${pillar.id}`, this.scene);
      mat.diffuseTexture = tex;
      mat.emissiveTexture = tex;
      mat.backFaceCulling = false;
      mat.disableLighting = true;
      board.material = mat;

      const crystal = MeshBuilder.CreatePolyhedron(
        `skillCrystal-${pillar.id}`,
        { type: 2, size: 0.45 },
        this.scene
      );
      crystal.position.set(x, 6.2, z);
      const crysMat = new StandardMaterial(`crysMat-${pillar.id}`, this.scene);
      crysMat.diffuseColor = Color3.FromHexString(pillar.color);
      crysMat.emissiveColor = Color3.FromHexString(pillar.color).scale(0.6);
      crystal.material = crysMat;
      crystal.isPickable = false;

      this.scene.onBeforeRenderObservable.add(() => {
        const dt = this.scene.getEngine().getDeltaTime() / 1000;
        crystal.rotation.y += dt * 1.2;
      });

      const { ringMesh, mat: ringMat } = this.createInteractiveFloorRing(
        `ring-${pillar.id}`,
        x - 2.4,
        z,
        pillar.color,
        1.6
      );

      const target: InteractableTarget = {
        id: pillar.id,
        kind: 'skill',
        title: pillar.category,
        subtitle: pillar.skills.join(' • '),
        accentColor: pillar.color,
        position: new Vector3(x - 2.0, 0, z),
        radius: 4.8,
        floorRingMesh: ringMesh,
        ringMaterial: ringMat,
        skillData: pillar
      };

      board.metadata = { interactableId: target.id };
      base.metadata = { interactableId: target.id };
      this.interactables.push(target);
    }
  }

  private buildWestExperienceWing(): void {
    this.createWayfinderSign(
      'EXPERIENCE & EDUCATION GALLERY',
      'Tech Breeze Limited • Brainwave Data • UCS (Sittwe & Pathein)',
      -31,
      -15,
      0,
      '#7C3AED'
    );

    for (const exp of EXPERIENCE_ITEMS) {
      const { x, z } = exp.position;

      const frame = MeshBuilder.CreateBox(
        `expFrame-${exp.id}`,
        { width: 0.26, height: 4.6, depth: 6.2 },
        this.scene
      );
      frame.position.set(x, 2.9, z);

      const tex = TextureFactory.createExperienceTexture(this.scene, exp);
      const mat = new StandardMaterial(`expMat-${exp.id}`, this.scene);
      mat.diffuseTexture = tex;
      mat.emissiveTexture = tex;
      mat.disableLighting = true;

      // Front face (facing East toward the Rotunda / visitor approach)
      const planeFront = MeshBuilder.CreatePlane(
        `expPlaneFront-${exp.id}`,
        { width: 5.9, height: 4.35 },
        this.scene
      );
      planeFront.position.set(x + 0.15, 2.9, z);
      planeFront.rotation.y = -Math.PI / 2;
      planeFront.material = mat;

      // Back face (facing West toward the garden)
      const planeBack = MeshBuilder.CreatePlane(
        `expPlaneBack-${exp.id}`,
        { width: 5.9, height: 4.35 },
        this.scene
      );
      planeBack.position.set(x - 0.15, 2.9, z);
      planeBack.rotation.y = Math.PI / 2;
      planeBack.material = mat;

      const standX = x + 3.2;
      const { ringMesh, mat: ringMat } = this.createInteractiveFloorRing(
        `ring-${exp.id}`,
        standX,
        z,
        exp.color,
        1.8
      );

      const target: InteractableTarget = {
        id: exp.id,
        kind: 'experience',
        title: `${exp.role} @ ${exp.organization}`,
        subtitle: exp.period,
        accentColor: exp.color,
        position: new Vector3(standX, 0, z),
        radius: 5.2,
        floorRingMesh: ringMesh,
        ringMaterial: ringMat,
        experienceData: exp
      };

      frame.metadata = { interactableId: target.id };
      planeFront.metadata = { interactableId: target.id };
      planeBack.metadata = { interactableId: target.id };
      this.interactables.push(target);
    }
  }

  private buildSouthContactLounge(): void {
    const portals = [
      {
        id: 'portal-github',
        title: 'GitHub Profile',
        subtitle: 'github.com/pyaephyo11979',
        color: '#38BDF8',
        x: -10,
        z: -26,
        url: PROFILE_DATA.contact.github
      },
      {
        id: 'portal-linkedin',
        title: 'LinkedIn Network',
        subtitle: 'linkedin.com/in/pyareph',
        color: '#0066FF',
        x: -3.5,
        z: -28,
        url: PROFILE_DATA.contact.linkedin
      },
      {
        id: 'portal-resume',
        title: 'Curriculum Vitae (Resume)',
        subtitle: 'View or Download Official PDF Resume',
        color: '#10B981',
        x: 3.5,
        z: -28,
        url: PROFILE_DATA.contact.resumeView
      },
      {
        id: 'portal-guestbook',
        title: 'Museum Guestbook & Direct Contact',
        subtitle: 'Sign the Visitor Wall or Email Pyae Phyo Hlaing',
        color: '#F59E0B',
        x: 10,
        z: -26,
        url: `mailto:${PROFILE_DATA.contact.email}`
      }
    ];

    for (const p of portals) {
      const arch = MeshBuilder.CreateTorus(
        `arch-${p.id}`,
        { diameter: 3.6, thickness: 0.18, tessellation: 32 },
        this.scene
      );
      arch.position.set(p.x, 2.2, p.z);
      const archMat = new StandardMaterial(`archMat-${p.id}`, this.scene);
      archMat.diffuseColor = Color3.FromHexString(p.color);
      archMat.emissiveColor = Color3.FromHexString(p.color).scale(0.65);
      arch.material = archMat;

      const sign = MeshBuilder.CreatePlane(
        `portalSign-${p.id}`,
        { width: 4.4, height: 1.2 },
        this.scene
      );
      sign.position.set(p.x, 4.5, p.z);
      sign.billboardMode = Mesh.BILLBOARDMODE_Y;
      const signTex = TextureFactory.createSignBannerTexture(
        this.scene,
        p.title,
        p.subtitle,
        p.color
      );
      const signMat = new StandardMaterial(`portalSignMat-${p.id}`, this.scene);
      signMat.diffuseTexture = signTex;
      signMat.emissiveTexture = signTex;
      signMat.backFaceCulling = false;
      signMat.disableLighting = true;
      sign.material = signMat;

      const { ringMesh, mat: ringMat } = this.createInteractiveFloorRing(
        `ring-${p.id}`,
        p.x,
        p.z + 2.4,
        p.color,
        1.5
      );

      const isGuestbook = p.id === 'portal-guestbook';
      const target: InteractableTarget = {
        id: p.id,
        kind: isGuestbook ? 'guestbook' : 'contact',
        title: p.title,
        subtitle: p.subtitle,
        accentColor: p.color,
        position: new Vector3(p.x, 0, p.z + 2.2),
        radius: 4.2,
        floorRingMesh: ringMesh,
        ringMaterial: ringMat,
        contactAction: {
          label: p.title,
          url: p.url
        }
      };

      arch.metadata = { interactableId: target.id };
      sign.metadata = { interactableId: target.id };
      this.interactables.push(target);
    }
  }

  private createInteractiveFloorRing(
    name: string,
    x: number,
    z: number,
    hexColor: string,
    diameter: number
  ): { ringMesh: Mesh; mat: StandardMaterial } {
    const ringMesh = MeshBuilder.CreateTorus(
      name,
      { diameter, thickness: 0.08, tessellation: 36 },
      this.scene
    );
    ringMesh.position.set(x, 0.03, z);
    ringMesh.isPickable = false;

    const mat = new StandardMaterial(`${name}-mat`, this.scene);
    mat.diffuseColor = Color3.FromHexString(hexColor);
    mat.emissiveColor = Color3.FromHexString(hexColor).scale(0.45);
    ringMesh.material = mat;

    return { ringMesh, mat };
  }
}
