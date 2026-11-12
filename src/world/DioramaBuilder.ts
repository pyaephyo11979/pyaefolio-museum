import {
  Color3,
  MeshBuilder,
  Scene,
  StandardMaterial,
  TransformNode
} from '@babylonjs/core';
import { ProjectExhibit } from '../data/portfolioData';

export class DioramaBuilder {
  public static createProjectDiorama(
    scene: Scene,
    project: ProjectExhibit,
    parentPedestalPos: { x: number; y: number; z: number }
  ): TransformNode {
    const root = new TransformNode(`diorama-${project.id}`, scene);
    root.position.set(parentPedestalPos.x, parentPedestalPos.y, parentPedestalPos.z);

    const accentMat = new StandardMaterial(`dioAccent-${project.id}`, scene);
    accentMat.diffuseColor = Color3.FromHexString(project.accentColor);
    accentMat.emissiveColor = Color3.FromHexString(project.accentColor).scale(0.5);
    accentMat.specularColor = new Color3(0.8, 0.8, 0.8);

    const secMat = new StandardMaterial(`dioSec-${project.id}`, scene);
    secMat.diffuseColor = Color3.FromHexString(project.secondaryColor);
    secMat.emissiveColor = Color3.FromHexString(project.secondaryColor).scale(0.65);

    const darkMat = new StandardMaterial(`dioDark-${project.id}`, scene);
    darkMat.diffuseColor = new Color3(0.1, 0.14, 0.22);
    darkMat.specularColor = new Color3(0.5, 0.5, 0.5);

    // Outer holographic ring shared across exhibits
    const outerRing = MeshBuilder.CreateTorus(
      `outerRing-${project.id}`,
      { diameter: 1.55, thickness: 0.04, tessellation: 36 },
      scene
    );
    outerRing.rotation.x = Math.PI / 3;
    outerRing.material = secMat;
    outerRing.isPickable = false;
    outerRing.parent = root;

    switch (project.dioramaType) {
      case 'careerhub': {
        // 3D Executive Briefcase + Connecting Candidate/Employer Orbs
        const caseBody = MeshBuilder.CreateBox(
          `case-${project.id}`,
          { width: 0.82, height: 0.58, depth: 0.24 },
          scene
        );
        caseBody.material = accentMat;
        caseBody.isPickable = false;
        caseBody.parent = root;

        const handle = MeshBuilder.CreateTorus(
          `handle-${project.id}`,
          { diameter: 0.28, thickness: 0.05, tessellation: 18 },
          scene
        );
        handle.rotation.x = Math.PI / 2;
        handle.position.y = 0.32;
        handle.material = secMat;
        handle.isPickable = false;
        handle.parent = root;

        const orb1 = MeshBuilder.CreateSphere(`orb1-${project.id}`, { diameter: 0.22 }, scene);
        orb1.position.set(0.65, 0.25, 0);
        orb1.material = secMat;
        orb1.isPickable = false;
        orb1.parent = root;

        const orb2 = orb1.clone(`orb2-${project.id}`);
        orb2.position.set(-0.65, -0.25, 0);
        orb2.parent = root;
        break;
      }

      case 'openpath-api': {
        // 3-Tier Server Stack + Pulsing JWT Ring
        for (let i = -1; i <= 1; i++) {
          const blade = MeshBuilder.CreateBox(
            `blade-${project.id}-${i}`,
            { width: 0.78, height: 0.2, depth: 0.58 },
            scene
          );
          blade.position.y = i * 0.3;
          blade.material = i === 0 ? accentMat : darkMat;
          blade.isPickable = false;
          blade.parent = root;

          const led = MeshBuilder.CreateBox(
            `led-${project.id}-${i}`,
            { width: 0.55, height: 0.06, depth: 0.62 },
            scene
          );
          led.position.y = i * 0.3;
          led.material = secMat;
          led.isPickable = false;
          led.parent = root;
        }
        break;
      }

      case 'openpath-mobile': {
        // 3D Smartphone with Floating Video Play Crystal
        const phone = MeshBuilder.CreateBox(
          `phone-${project.id}`,
          { width: 0.56, height: 1.05, depth: 0.09 },
          scene
        );
        phone.material = darkMat;
        phone.isPickable = false;
        phone.parent = root;

        const screen = MeshBuilder.CreateBox(
          `screen-${project.id}`,
          { width: 0.48, height: 0.9, depth: 0.11 },
          scene
        );
        screen.material = accentMat;
        screen.isPickable = false;
        screen.parent = root;

        const playIcon = MeshBuilder.CreateCylinder(
          `play-${project.id}`,
          { height: 0.16, diameter: 0.34, tessellation: 3 },
          scene
        );
        playIcon.rotation.x = Math.PI / 2;
        playIcon.position.z = 0.14;
        playIcon.material = secMat;
        playIcon.isPickable = false;
        playIcon.parent = root;
        break;
      }

      case 'careercraft': {
        // MongoDB Document Cluster + Auth Shield Octahedron
        const core = MeshBuilder.CreatePolyhedron(
          `core-${project.id}`,
          { type: 1, size: 0.42 },
          scene
        );
        core.material = accentMat;
        core.isPickable = false;
        core.parent = root;

        for (let i = 0; i < 3; i++) {
          const angle = (i * Math.PI * 2) / 3;
          const node = MeshBuilder.CreateCylinder(
            `dbNode-${project.id}-${i}`,
            { height: 0.36, diameter: 0.28, tessellation: 16 },
            scene
          );
          node.position.set(Math.cos(angle) * 0.55, Math.sin(angle) * 0.25, Math.sin(angle) * 0.45);
          node.material = secMat;
          node.isPickable = false;
          node.parent = root;
        }
        break;
      }

      case 'weather': {
        // Radiant Sun Core + Fluffy Orbiting Cloud Spheres
        const sun = MeshBuilder.CreateSphere(
          `sun-${project.id}`,
          { diameter: 0.62, segments: 20 },
          scene
        );
        sun.material = accentMat;
        sun.isPickable = false;
        sun.parent = root;

        const cloudPositions = [
          [0.42, -0.18, 0.25],
          [0.24, -0.22, 0.32],
          [0.56, -0.24, 0.18]
        ];
        cloudPositions.forEach(([cx, cy, cz], idx) => {
          const puff = MeshBuilder.CreateSphere(
            `puff-${project.id}-${idx}`,
            { diameter: idx === 0 ? 0.34 : 0.25 },
            scene
          );
          puff.position.set(cx, cy, cz);
          puff.material = secMat;
          puff.isPickable = false;
          puff.parent = root;
        });
        break;
      }

      case 'readers-choice': {
        // Levitating Open 3D Book
        const leftPage = MeshBuilder.CreateBox(
          `leftPage-${project.id}`,
          { width: 0.52, height: 0.68, depth: 0.08 },
          scene
        );
        leftPage.position.x = -0.24;
        leftPage.rotation.y = 0.28;
        leftPage.material = accentMat;
        leftPage.isPickable = false;
        leftPage.parent = root;

        const rightPage = MeshBuilder.CreateBox(
          `rightPage-${project.id}`,
          { width: 0.52, height: 0.68, depth: 0.08 },
          scene
        );
        rightPage.position.x = 0.24;
        rightPage.rotation.y = -0.28;
        rightPage.material = secMat;
        rightPage.isPickable = false;
        rightPage.parent = root;
        break;
      }

      case 'travel-relax': {
        // 3D Globe + Orbiting Jet Plane
        const globe = MeshBuilder.CreateSphere(
          `globe-${project.id}`,
          { diameter: 0.68, segments: 20 },
          scene
        );
        globe.material = accentMat;
        globe.isPickable = false;
        globe.parent = root;

        const planeFuselage = MeshBuilder.CreateCylinder(
          `plane-${project.id}`,
          { height: 0.42, diameterTop: 0.02, diameterBottom: 0.12, tessellation: 12 },
          scene
        );
        planeFuselage.position.set(0.58, 0.22, 0);
        planeFuselage.rotation.z = -Math.PI / 4;
        planeFuselage.material = secMat;
        planeFuselage.isPickable = false;
        planeFuselage.parent = root;
        break;
      }

      case 'voting-system': {
        // 3D Live Bar Chart Columns + Ballot Cube
        const heights = [0.38, 0.64, 0.88, 0.52];
        heights.forEach((h, i) => {
          const bar = MeshBuilder.CreateBox(
            `bar-${project.id}-${i}`,
            { width: 0.16, height: h, depth: 0.16 },
            scene
          );
          bar.position.set((i - 1.5) * 0.24, (h - 0.5) / 2, 0);
          bar.material = i % 2 === 0 ? accentMat : secMat;
          bar.isPickable = false;
          bar.parent = root;
        });
        break;
      }
    }

    let t = Math.random() * 10;
    scene.onBeforeRenderObservable.add(() => {
      const dt = scene.getEngine().getDeltaTime() / 1000;
      t += dt;
      root.rotation.y += dt * 0.85;
      root.position.y = parentPedestalPos.y + Math.sin(t * 2.1) * 0.1;
      outerRing.rotation.z += dt * 0.6;
    });

    return root;
  }
}
