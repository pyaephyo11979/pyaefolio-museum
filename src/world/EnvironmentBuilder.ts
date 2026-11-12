import {
  Color3,
  DynamicTexture,
  Mesh,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3
} from '@babylonjs/core';

export class EnvironmentBuilder {
  private skyDome!: Mesh;
  private skyMat!: StandardMaterial;
  private daySkyTex!: DynamicTexture;
  private nightSkyTex!: DynamicTexture;
  private sunOrb!: Mesh;
  private moonOrb!: Mesh;
  private starFieldRoot!: TransformNode;
  private twinklingStars: Mesh[] = [];
  private cloudMat!: StandardMaterial;
  private clouds: TransformNode[] = [];
  private rippleRings: Mesh[] = [];
  private treeCanopies: TransformNode[] = [];
  private lanternGlowMats: StandardMaterial[] = [];

  constructor(private scene: Scene) {}

  public build(): Mesh {
    this.buildSkyDomeAndClouds();
    const grassGround = this.buildParkTerrainAndHills();
    this.buildReflectingPonds();
    this.buildBotanicalGardensAndTrees();
    this.buildIndoorAndPlazaPlanters();
    this.setupNatureAnimation();
    return grassGround;
  }

  public setNightMode(isNight: boolean): void {
    if (this.skyMat) {
      const targetTex = isNight ? this.nightSkyTex : this.daySkyTex;
      this.skyMat.diffuseTexture = targetTex;
      this.skyMat.emissiveTexture = targetTex;
      this.skyMat.emissiveColor = Color3.White();
      this.skyMat.alpha = 1.0;
    }

    if (this.sunOrb) {
      this.sunOrb.setEnabled(!isNight);
    }
    if (this.moonOrb) {
      this.moonOrb.setEnabled(isNight);
    }
    if (this.starFieldRoot) {
      this.starFieldRoot.setEnabled(isNight);
    }

    if (this.cloudMat) {
      if (isNight) {
        this.cloudMat.diffuseColor = new Color3(0.16, 0.22, 0.36);
        this.cloudMat.emissiveColor = new Color3(0.06, 0.09, 0.18);
        this.cloudMat.alpha = 0.65;
      } else {
        this.cloudMat.diffuseColor = new Color3(0.98, 0.99, 1.0);
        this.cloudMat.emissiveColor = new Color3(0.68, 0.76, 0.86);
        this.cloudMat.alpha = 0.96;
      }
    }

    for (const mat of this.lanternGlowMats) {
      mat.emissiveColor = isNight
        ? Color3.FromHexString('#FBBF24')
        : Color3.FromHexString('#FEF08A').scale(0.55);
    }
  }

  private createCloudyBlueDayTexture(): DynamicTexture {
    const w = 1024;
    const h = 512;
    const tex = new DynamicTexture('daySkyTex', { width: w, height: h }, this.scene, true);
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;

    // Vivid Cerulean-to-Sky-Blue Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, '#1e3a8a');
    grad.addColorStop(0.22, '#2563eb');
    grad.addColorStop(0.45, '#38bdf8');
    grad.addColorStop(0.62, '#93c5fd');
    grad.addColorStop(0.78, '#dbeafe');
    grad.addColorStop(1.0, '#bbf7d0');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Painted wispy cirrus & cumulus clouds in upper hemisphere (y: 60..280)
    for (let i = 0; i < 55; i++) {
      const cx = (i * 97) % w;
      const cy = 75 + ((i * 53) % 190);
      const rx = 38 + (i % 5) * 18;
      const ry = 12 + (i % 4) * 6;
      const cGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, rx);
      cGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      cGrad.addColorStop(0.6, 'rgba(241, 245, 249, 0.25)');
      cGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    tex.update();
    return tex;
  }

  private createStarryNightTexture(): DynamicTexture {
    const w = 1024;
    const h = 512;
    const tex = new DynamicTexture('nightSkyTex', { width: w, height: h }, this.scene, true);
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;

    // Deep Starry Cosmos Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, '#020617');
    grad.addColorStop(0.32, '#060d24');
    grad.addColorStop(0.58, '#0f172a');
    grad.addColorStop(0.75, '#1e1b4b');
    grad.addColorStop(1.0, '#0f172a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle Milky Way Nebula Glow Band
    ctx.save();
    ctx.translate(w / 2, h * 0.32);
    ctx.rotate(-0.28);
    const nebGrad = ctx.createRadialGradient(0, 0, 15, 0, 0, 420);
    nebGrad.addColorStop(0, 'rgba(139, 92, 246, 0.22)');
    nebGrad.addColorStop(0.45, 'rgba(56, 189, 248, 0.12)');
    nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = nebGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 440, 85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 700+ Stars across the night sky dome
    const starTints = ['#ffffff', '#e0f2fe', '#fef08a', '#ddd6fe', '#bae6fd'];
    for (let i = 0; i < 720; i++) {
      const sx = Math.random() * w;
      const sy = Math.random() * (h * 0.72);
      const isBright = i % 19 === 0;
      const radius = isBright ? 1.8 + Math.random() * 1.1 : 0.6 + Math.random() * 1.1;
      const color = starTints[i % starTints.length];

      ctx.fillStyle = color;
      ctx.globalAlpha = isBright ? 0.98 : 0.45 + Math.random() * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.fill();

      // 4-point sparkle cross on bright stars
      if (isBright) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx - radius * 3.2, sy);
        ctx.lineTo(sx + radius * 3.2, sy);
        ctx.moveTo(sx, sy - radius * 3.2);
        ctx.lineTo(sx, sy + radius * 3.2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1.0;

    tex.update();
    return tex;
  }

  private buildSkyDomeAndClouds(): void {
    // Sky Dome
    this.skyDome = MeshBuilder.CreateSphere(
      'skyDome',
      { diameter: 360, segments: 28, sideOrientation: Mesh.BACKSIDE },
      this.scene
    );
    this.skyDome.isPickable = false;

    this.daySkyTex = this.createCloudyBlueDayTexture();
    this.nightSkyTex = this.createStarryNightTexture();

    this.skyMat = new StandardMaterial('skyDomeMat', this.scene);
    this.skyMat.diffuseTexture = this.daySkyTex;
    this.skyMat.emissiveTexture = this.daySkyTex;
    this.skyMat.emissiveColor = Color3.White();
    this.skyMat.disableLighting = true;
    this.skyMat.backFaceCulling = false;
    this.skyDome.material = this.skyMat;

    // Warm Golden Sun Sphere in Light Mode
    this.sunOrb = MeshBuilder.CreateSphere('sunOrb', { diameter: 14, segments: 16 }, this.scene);
    this.sunOrb.position.set(65, 72, 95);
    this.sunOrb.isPickable = false;
    const sunMat = new StandardMaterial('sunOrbMat', this.scene);
    sunMat.emissiveColor = Color3.FromHexString('#FEF08A');
    sunMat.diffuseColor = Color3.FromHexString('#FDE047');
    sunMat.disableLighting = true;
    this.sunOrb.material = sunMat;

    // Luminous Full Moon Sphere + Halo in Dark Mode
    this.moonOrb = MeshBuilder.CreateSphere('moonOrb', { diameter: 12, segments: 20 }, this.scene);
    this.moonOrb.position.set(-58, 74, 88);
    this.moonOrb.isPickable = false;
    const moonMat = new StandardMaterial('moonOrbMat', this.scene);
    moonMat.emissiveColor = Color3.FromHexString('#E0F2FE');
    moonMat.diffuseColor = Color3.FromHexString('#BAE6FD');
    moonMat.disableLighting = true;
    this.moonOrb.material = moonMat;
    this.moonOrb.setEnabled(false);

    // 3D Twinkling Stars Node for Dark Mode
    this.starFieldRoot = new TransformNode('starFieldRoot', this.scene);
    const starOrbMat = new StandardMaterial('starOrbMat', this.scene);
    starOrbMat.emissiveColor = Color3.FromHexString('#F8FAFC');
    starOrbMat.diffuseColor = Color3.White();
    starOrbMat.disableLighting = true;

    for (let s = 0; s < 55; s++) {
      const theta = (s * 2.39996) % (Math.PI * 2);
      const elevation = 0.25 + ((s * 0.618) % 0.65);
      const r = 152;
      const sx = Math.cos(theta) * Math.cos(elevation) * r;
      const sy = Math.sin(elevation) * r;
      const sz = Math.sin(theta) * Math.cos(elevation) * r;

      const starMesh = MeshBuilder.CreateSphere(
        `twinkleStar-${s}`,
        { diameter: 0.95 + (s % 3) * 0.4, segments: 6 },
        this.scene
      );
      starMesh.position.set(sx, sy, sz);
      starMesh.material = starOrbMat;
      starMesh.isPickable = false;
      starMesh.parent = this.starFieldRoot;
      this.twinklingStars.push(starMesh);
    }
    this.starFieldRoot.setEnabled(false);

    // Fluffy Drifting 3D Clouds (12 Volumetric Cloud Clusters)
    this.cloudMat = new StandardMaterial('cloudMat', this.scene);
    this.cloudMat.diffuseColor = new Color3(0.98, 0.99, 1.0);
    this.cloudMat.emissiveColor = new Color3(0.68, 0.76, 0.86);
    this.cloudMat.specularColor = Color3.Black();
    this.cloudMat.alpha = 0.96;

    const cloudCoords = [
      [-55, 36, 55, 1.35],
      [48, 40, 68, 1.5],
      [-70, 34, -20, 1.25],
      [68, 38, -25, 1.4],
      [0, 44, 95, 1.65],
      [-35, 39, -65, 1.3],
      [42, 35, 15, 1.15],
      [-18, 42, 32, 1.25],
      [25, 45, -52, 1.4],
      [-85, 38, 20, 1.5],
      [82, 41, 35, 1.35],
      [12, 37, -18, 1.1]
    ];

    cloudCoords.forEach(([cx, cy, cz, scale], i) => {
      const cloudRoot = new TransformNode(`cloud-${i}`, this.scene);
      cloudRoot.position.set(cx, cy, cz);
      cloudRoot.scaling.setAll(scale);

      const puffs = [
        [0, 0, 0, 5.4],
        [-3.3, -0.4, 0.4, 4.0],
        [3.5, -0.4, -0.3, 4.2],
        [1.2, 1.15, 1.2, 3.8],
        [-1.4, 0.9, -1.0, 3.5]
      ];
      puffs.forEach(([px, py, pz, d], j) => {
        const puff = MeshBuilder.CreateSphere(
          `cloudPuff-${i}-${j}`,
          { diameter: d, segments: 10 },
          this.scene
        );
        puff.position.set(px, py, pz);
        puff.scaling.y = 0.62;
        puff.material = this.cloudMat;
        puff.isPickable = false;
        puff.parent = cloudRoot;
      });

      this.clouds.push(cloudRoot);
    });
  }

  private buildParkTerrainAndHills(): Mesh {
    // Rich Botanical Meadow Ground Texture
    const meadowTex = new DynamicTexture('meadowTex', { width: 512, height: 512 }, this.scene, true);
    const ctx = meadowTex.getContext() as unknown as CanvasRenderingContext2D;

    const gGrad = ctx.createRadialGradient(256, 256, 20, 256, 256, 260);
    gGrad.addColorStop(0, '#22c55e');
    gGrad.addColorStop(0.5, '#16a34a');
    gGrad.addColorStop(1, '#14532d');
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle organic grass blades / dappled sunlight spots
    for (let i = 0; i < 420; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(74, 222, 128, 0.14)' : 'rgba(20, 83, 45, 0.2)';
      ctx.beginPath();
      ctx.arc(
        Math.random() * 512,
        Math.random() * 512,
        2 + Math.random() * 8,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    meadowTex.update();

    const meadowMat = new StandardMaterial('meadowMat', this.scene);
    meadowMat.diffuseTexture = meadowTex;
    meadowMat.specularColor = new Color3(0.05, 0.08, 0.05);

    // Expansive Park Lawn beneath and around the museum
    const parkGround = MeshBuilder.CreateGround(
      'parkLawnGround',
      { width: 280, height: 280 },
      this.scene
    );
    parkGround.position.set(0, -0.04, 15);
    parkGround.material = meadowMat;
    parkGround.isPickable = true;
    parkGround.metadata = { isWalkableFloor: true };

    // Rolling Green Hills around the horizon
    const hillMat = new StandardMaterial('hillMat', this.scene);
    hillMat.diffuseColor = Color3.FromHexString('#22C55E');
    hillMat.emissiveColor = Color3.FromHexString('#14532D').scale(0.2);
    hillMat.specularColor = new Color3(0.04, 0.06, 0.04);

    const hills = [
      { x: -95, z: 45, w: 65, h: 16, d: 85 },
      { x: 95, z: 45, w: 68, h: 18, d: 85 },
      { x: 0, z: 118, w: 140, h: 20, d: 55 },
      { x: -85, z: -45, w: 65, h: 14, d: 65 },
      { x: 85, z: -45, w: 65, h: 15, d: 65 },
      { x: 0, z: -85, w: 120, h: 15, d: 50 }
    ];

    hills.forEach((h, i) => {
      const hill = MeshBuilder.CreateSphere(
        `hill-${i}`,
        { diameterX: h.w, diameterY: h.h, diameterZ: h.d, segments: 16 },
        this.scene
      );
      hill.position.set(h.x, -2.5, h.z);
      hill.material = hillMat;
      hill.isPickable = false;
    });

    return parkGround;
  }

  private buildReflectingPonds(): void {
    const waterMat = new StandardMaterial('pondWaterMat', this.scene);
    waterMat.diffuseColor = Color3.FromHexString('#0EA5E9');
    waterMat.emissiveColor = Color3.FromHexString('#0284C7').scale(0.38);
    waterMat.specularColor = new Color3(0.9, 0.95, 1.0);
    waterMat.specularPower = 96;
    waterMat.alpha = 0.88;

    const stoneRimMat = new StandardMaterial('pondStoneMat', this.scene);
    stoneRimMat.diffuseColor = Color3.FromHexString('#E2E8F0');
    stoneRimMat.specularColor = new Color3(0.2, 0.2, 0.2);

    const lilyPadMat = new StandardMaterial('lilyPadMat', this.scene);
    lilyPadMat.diffuseColor = Color3.FromHexString('#16A34A');
    lilyPadMat.emissiveColor = Color3.FromHexString('#15803D').scale(0.25);

    const lotusMat = new StandardMaterial('lotusMat', this.scene);
    lotusMat.diffuseColor = Color3.FromHexString('#F472B6');
    lotusMat.emissiveColor = Color3.FromHexString('#EC4899').scale(0.4);

    const ponds = [
      { name: 'westPond', x: -34, z: 36, radius: 9.5 },
      { name: 'eastPond', x: 34, z: 36, radius: 9.5 }
    ];

    ponds.forEach((p) => {
      const waterDisc = MeshBuilder.CreateDisc(
        p.name,
        { radius: p.radius, tessellation: 40 },
        this.scene
      );
      waterDisc.rotation.x = Math.PI / 2;
      waterDisc.position.set(p.x, 0.02, p.z);
      waterDisc.material = waterMat;
      waterDisc.isPickable = false;

      const rim = MeshBuilder.CreateTorus(
        `${p.name}-rim`,
        { diameter: p.radius * 2, thickness: 0.55, tessellation: 44 },
        this.scene
      );
      rim.position.set(p.x, 0.08, p.z);
      rim.material = stoneRimMat;
      rim.isPickable = false;

      // Animated Water Ripple Ring
      const ripple = MeshBuilder.CreateTorus(
        `${p.name}-ripple`,
        { diameter: p.radius * 0.9, thickness: 0.06, tessellation: 32 },
        this.scene
      );
      ripple.position.set(p.x, 0.04, p.z);
      const rippleMat = new StandardMaterial(`${p.name}-rippleMat`, this.scene);
      rippleMat.diffuseColor = Color3.White();
      rippleMat.emissiveColor = Color3.FromHexString('#BAE6FD');
      rippleMat.alpha = 0.55;
      ripple.material = rippleMat;
      ripple.isPickable = false;
      this.rippleRings.push(ripple);

      // Lily pads & Lotus blossoms
      const lilyOffsets = [
        [-3.2, 2.4],
        [2.8, -2.5],
        [-1.5, -3.8],
        [3.6, 1.8],
        [0.4, 3.2]
      ];
      lilyOffsets.forEach(([ox, oz], idx) => {
        const pad = MeshBuilder.CreateCylinder(
          `${p.name}-lily-${idx}`,
          { height: 0.05, diameter: 1.35, tessellation: 16 },
          this.scene
        );
        pad.position.set(p.x + ox, 0.05, p.z + oz);
        pad.material = lilyPadMat;
        pad.isPickable = false;

        if (idx % 2 === 0) {
          const lotus = MeshBuilder.CreateSphere(
            `${p.name}-lotus-${idx}`,
            { diameter: 0.42, segments: 10 },
            this.scene
          );
          lotus.position.set(p.x + ox, 0.18, p.z + oz);
          lotus.material = lotusMat;
          lotus.isPickable = false;
        }
      });
    });
  }

  private buildBotanicalGardensAndTrees(): void {
    // Materials for trunks & foliage varieties
    const trunkMat = new StandardMaterial('treeTrunkMat', this.scene);
    trunkMat.diffuseColor = Color3.FromHexString('#78350F');
    trunkMat.specularColor = new Color3(0.05, 0.05, 0.05);

    const lushGreenMat = new StandardMaterial('lushGreenMat', this.scene);
    lushGreenMat.diffuseColor = Color3.FromHexString('#16A34A');
    lushGreenMat.emissiveColor = Color3.FromHexString('#15803D').scale(0.18);
    lushGreenMat.specularColor = new Color3(0.08, 0.12, 0.08);

    const vibrantLimeMat = new StandardMaterial('vibrantLimeMat', this.scene);
    vibrantLimeMat.diffuseColor = Color3.FromHexString('#4ADE80');
    vibrantLimeMat.emissiveColor = Color3.FromHexString('#22C55E').scale(0.18);
    vibrantLimeMat.specularColor = new Color3(0.08, 0.12, 0.08);

    const sakuraPinkMat = new StandardMaterial('sakuraPinkMat', this.scene);
    sakuraPinkMat.diffuseColor = Color3.FromHexString('#F9A8D4');
    sakuraPinkMat.emissiveColor = Color3.FromHexString('#F472B6').scale(0.28);
    sakuraPinkMat.specularColor = new Color3(0.15, 0.1, 0.15);

    const cypressMat = new StandardMaterial('cypressMat', this.scene);
    cypressMat.diffuseColor = Color3.FromHexString('#15803D');
    cypressMat.emissiveColor = Color3.FromHexString('#14532D').scale(0.18);

    // Tree Placements framing all 4 wings and surrounding park
    const treePlacements: Array<{
      x: number;
      z: number;
      scale: number;
      style: 'canopy' | 'sakura' | 'cypress';
    }> = [
      // Alongside North Gallery Windows (Visible right through the glass walls!)
      { x: -23, z: 20, scale: 1.15, style: 'sakura' },
      { x: -24, z: 30, scale: 1.25, style: 'canopy' },
      { x: -23, z: 44, scale: 1.1, style: 'cypress' },
      { x: -24, z: 54, scale: 1.3, style: 'sakura' },
      { x: -23, z: 64, scale: 1.2, style: 'canopy' },

      { x: 23, z: 20, scale: 1.15, style: 'sakura' },
      { x: 24, z: 30, scale: 1.25, style: 'canopy' },
      { x: 23, z: 44, scale: 1.1, style: 'cypress' },
      { x: 24, z: 54, scale: 1.3, style: 'sakura' },
      { x: 23, z: 64, scale: 1.2, style: 'canopy' },

      // Around West & East Reflecting Ponds
      { x: -46, z: 28, scale: 1.4, style: 'canopy' },
      { x: -47, z: 42, scale: 1.35, style: 'sakura' },
      { x: -36, z: 52, scale: 1.25, style: 'cypress' },
      { x: 46, z: 28, scale: 1.4, style: 'canopy' },
      { x: 47, z: 42, scale: 1.35, style: 'sakura' },
      { x: 36, z: 52, scale: 1.25, style: 'cypress' },

      // East Skills Garden Perimeter
      { x: 50, z: -14, scale: 1.35, style: 'canopy' },
      { x: 54, z: 0, scale: 1.5, style: 'sakura' },
      { x: 50, z: 14, scale: 1.35, style: 'canopy' },
      { x: 22, z: -18, scale: 1.1, style: 'cypress' },
      { x: 22, z: 16, scale: 1.1, style: 'cypress' },

      // West Experience Courtyard Perimeter
      { x: -48, z: -14, scale: 1.35, style: 'canopy' },
      { x: -52, z: 0, scale: 1.5, style: 'sakura' },
      { x: -48, z: 14, scale: 1.35, style: 'canopy' },
      { x: -22, z: -18, scale: 1.1, style: 'cypress' },
      { x: -22, z: 16, scale: 1.1, style: 'cypress' },

      // South Connection Lounge & Entrance Avenue
      { x: -18, z: -28, scale: 1.3, style: 'sakura' },
      { x: 18, z: -28, scale: 1.3, style: 'sakura' },
      { x: -26, z: -36, scale: 1.45, style: 'canopy' },
      { x: 26, z: -36, scale: 1.45, style: 'canopy' },
      { x: -12, z: -40, scale: 1.2, style: 'cypress' },
      { x: 12, z: -40, scale: 1.2, style: 'cypress' },

      // Far North Botanical Grove behind the Museum
      { x: -16, z: 78, scale: 1.5, style: 'canopy' },
      { x: 0, z: 82, scale: 1.6, style: 'sakura' },
      { x: 16, z: 78, scale: 1.5, style: 'canopy' },
      { x: -32, z: 75, scale: 1.4, style: 'cypress' },
      { x: 32, z: 75, scale: 1.4, style: 'cypress' }
    ];

    treePlacements.forEach((tp, idx) => {
      const treeRoot = new TransformNode(`tree-${idx}`, this.scene);
      treeRoot.position.set(tp.x, 0, tp.z);
      treeRoot.scaling.setAll(tp.scale);

      const trunk = MeshBuilder.CreateCylinder(
        `trunk-${idx}`,
        { height: 2.8, diameterTop: 0.42, diameterBottom: 0.68, tessellation: 12 },
        this.scene
      );
      trunk.position.y = 1.4;
      trunk.material = trunkMat;
      trunk.isPickable = false;
      trunk.parent = treeRoot;

      const canopyNode = new TransformNode(`canopy-${idx}`, this.scene);
      canopyNode.position.y = 2.8;
      canopyNode.parent = treeRoot;

      if (tp.style === 'cypress') {
        const cone1 = MeshBuilder.CreateCylinder(
          `cyp1-${idx}`,
          { height: 3.6, diameterTop: 0.2, diameterBottom: 2.4, tessellation: 14 },
          this.scene
        );
        cone1.position.y = 1.2;
        cone1.material = cypressMat;
        cone1.isPickable = false;
        cone1.parent = canopyNode;

        const cone2 = MeshBuilder.CreateCylinder(
          `cyp2-${idx}`,
          { height: 2.8, diameterTop: 0.1, diameterBottom: 1.8, tessellation: 14 },
          this.scene
        );
        cone2.position.y = 2.7;
        cone2.material = vibrantLimeMat;
        cone2.isPickable = false;
        cone2.parent = canopyNode;
      } else {
        const mainMat =
          tp.style === 'sakura'
            ? sakuraPinkMat
            : idx % 2 === 0
              ? lushGreenMat
              : vibrantLimeMat;

        const clusters = [
          [0, 1.3, 0, 3.3],
          [-1.2, 0.8, 0.6, 2.3],
          [1.2, 0.9, -0.5, 2.4],
          [0.4, 0.7, 1.2, 2.2],
          [-0.5, 1.9, -0.6, 2.3]
        ];
        clusters.forEach(([cx, cy, cz, dia], cIdx) => {
          const leafSphere = MeshBuilder.CreateSphere(
            `leaf-${idx}-${cIdx}`,
            { diameter: dia, segments: 12 },
            this.scene
          );
          leafSphere.position.set(cx, cy, cz);
          leafSphere.material = mainMat;
          leafSphere.isPickable = false;
          leafSphere.parent = canopyNode;
        });
      }

      this.treeCanopies.push(canopyNode);
    });
  }

  private buildIndoorAndPlazaPlanters(): void {
    const planterBoxMat = new StandardMaterial('planterBoxMat', this.scene);
    planterBoxMat.diffuseColor = Color3.FromHexString('#475569');
    planterBoxMat.specularColor = new Color3(0.05, 0.05, 0.06);

    const soilMat = new StandardMaterial('soilMat', this.scene);
    soilMat.diffuseColor = Color3.FromHexString('#451A03');

    const bushMat = new StandardMaterial('bushMat', this.scene);
    bushMat.diffuseColor = Color3.FromHexString('#22C55E');
    bushMat.emissiveColor = Color3.FromHexString('#15803D').scale(0.18);

    const flowerMats = ['#38BDF8', '#F472B6', '#FACC15', '#A78BFA'].map((hex, i) => {
      const m = new StandardMaterial(`flowerMat-${i}`, this.scene);
      m.diffuseColor = Color3.FromHexString(hex);
      m.emissiveColor = Color3.FromHexString(hex).scale(0.35);
      return m;
    });

    // Botanical Planter Beds along the Central North Exhibition Hall & Rotunda Corners
    const planterCoords = [
      // Rotunda 4 Diagonal Garden Beds
      { x: -8.5, z: 8.5, w: 3.4, d: 3.4 },
      { x: 8.5, z: 8.5, w: 3.4, d: 3.4 },
      { x: -8.5, z: -8.5, w: 3.4, d: 3.4 },
      { x: 8.5, z: -8.5, w: 3.4, d: 3.4 },

      // North Gallery Center Divider Botanical Islands
      { x: 0, z: 30, w: 2.4, d: 4.8 },
      { x: 0, z: 42, w: 2.4, d: 4.8 },
      { x: 0, z: 54, w: 2.4, d: 4.8 }
    ];

    planterCoords.forEach((p, idx) => {
      const box = MeshBuilder.CreateBox(
        `planter-${idx}`,
        { width: p.w, height: 0.55, depth: p.d },
        this.scene
      );
      box.position.set(p.x, 0.275, p.z);
      box.material = planterBoxMat;
      box.isPickable = false;

      const soil = MeshBuilder.CreateBox(
        `soil-${idx}`,
        { width: p.w - 0.25, height: 0.58, depth: p.d - 0.25 },
        this.scene
      );
      soil.position.set(p.x, 0.28, p.z);
      soil.material = soilMat;
      soil.isPickable = false;

      // Shrubs & Colorful Blossoms inside each planter
      for (let b = -1; b <= 1; b++) {
        const shrub = MeshBuilder.CreateSphere(
          `shrub-${idx}-${b}`,
          { diameter: 1.25, segments: 10 },
          this.scene
        );
        shrub.position.set(p.x, 0.85, p.z + b * (p.d * 0.26));
        shrub.scaling.y = 0.78;
        shrub.material = bushMat;
        shrub.isPickable = false;

        const blossom = MeshBuilder.CreateSphere(
          `blossom-${idx}-${b}`,
          { diameter: 0.42, segments: 8 },
          this.scene
        );
        blossom.position.set(
          p.x + (b % 2 === 0 ? 0.35 : -0.35),
          1.32,
          p.z + b * (p.d * 0.26)
        );
        blossom.material = flowerMats[(idx + b + 4) % flowerMats.length];
        blossom.isPickable = false;
      }
    });

    // Warm Garden Lantern Bollards & Park Benches along Walkways
    const benchWoodMat = new StandardMaterial('benchWoodMat', this.scene);
    benchWoodMat.diffuseColor = Color3.FromHexString('#B45309');

    const lanternPostMat = new StandardMaterial('lanternPostMat', this.scene);
    lanternPostMat.diffuseColor = Color3.FromHexString('#334155');

    const lanternGlowMat = new StandardMaterial('lanternGlowMat', this.scene);
    lanternGlowMat.diffuseColor = Color3.FromHexString('#FEF08A');
    lanternGlowMat.emissiveColor = Color3.FromHexString('#FEF08A').scale(0.55);
    this.lanternGlowMats.push(lanternGlowMat);

    const benchSpots = [
      { x: -5.5, z: 30, rotY: Math.PI / 2 },
      { x: 5.5, z: 30, rotY: -Math.PI / 2 },
      { x: -5.5, z: 54, rotY: Math.PI / 2 },
      { x: 5.5, z: 54, rotY: -Math.PI / 2 },
      { x: -23, z: 36, rotY: -Math.PI / 2 },
      { x: 23, z: 36, rotY: Math.PI / 2 }
    ];

    benchSpots.forEach((b, i) => {
      const seat = MeshBuilder.CreateBox(
        `benchSeat-${i}`,
        { width: 2.2, height: 0.12, depth: 0.65 },
        this.scene
      );
      seat.position.set(b.x, 0.52, b.z);
      seat.rotation.y = b.rotY;
      seat.material = benchWoodMat;
      seat.isPickable = false;

      // Garden Lantern next to bench
      const post = MeshBuilder.CreateCylinder(
        `lanternPost-${i}`,
        { height: 1.6, diameter: 0.14 },
        this.scene
      );
      post.position.set(b.x, 0.8, b.z + 1.6);
      post.material = lanternPostMat;
      post.isPickable = false;

      const orb = MeshBuilder.CreateSphere(
        `lanternOrb-${i}`,
        { diameter: 0.36, segments: 12 },
        this.scene
      );
      orb.position.set(b.x, 1.72, b.z + 1.6);
      orb.material = lanternGlowMat;
      orb.isPickable = false;
    });
  }

  private setupNatureAnimation(): void {
    let time = 0;
    this.scene.onBeforeRenderObservable.add(() => {
      const dt = Math.min(this.scene.getEngine().getDeltaTime() / 1000, 0.1);
      time += dt;

      // Gently drift clouds across sky
      this.clouds.forEach((c, idx) => {
        c.position.x += dt * (0.45 + (idx % 3) * 0.15);
        if (c.position.x > 110) c.position.x = -110;
      });

      // Gently sway tree canopies in the breeze
      this.treeCanopies.forEach((canopy, idx) => {
        canopy.rotation.z = Math.sin(time * 1.4 + idx) * 0.032;
        canopy.rotation.x = Math.cos(time * 1.1 + idx) * 0.024;
      });

      // Pulse water pond ripples
      this.rippleRings.forEach((ring, idx) => {
        const s = 0.65 + ((time * 0.35 + idx * 0.5) % 1) * 0.85;
        ring.scaling.setAll(s);
      });

      // Twinkle 3D stars in Dark Mode
      if (this.starFieldRoot && this.starFieldRoot.isEnabled()) {
        this.twinklingStars.forEach((star, idx) => {
          const scale = 0.55 + Math.abs(Math.sin(time * 2.2 + idx * 1.7)) * 0.85;
          star.scaling.setAll(scale);
        });
      }
    });
  }
}
