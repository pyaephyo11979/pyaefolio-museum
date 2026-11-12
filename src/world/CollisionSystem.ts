import { Vector3 } from '@babylonjs/core';
import {
  EXPERIENCE_ITEMS,
  PROJECT_EXHIBITS,
  SKILL_PILLARS
} from '../data/portfolioData';

export interface CircleObstacle {
  x: number;
  z: number;
  radius: number;
  label?: string;
}

export interface BoxObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  label?: string;
}

export class CollisionSystem {
  public circles: CircleObstacle[] = [];
  public boxes: BoxObstacle[] = [];

  constructor() {
    this.registerMuseumObstacles();
    this.registerGardenAndNatureObstacles();
  }

  public addCircle(x: number, z: number, radius: number, label?: string): void {
    this.circles.push({ x, z, radius, label });
  }

  public addBox(centerX: number, centerZ: number, width: number, depth: number, label?: string): void {
    const hw = width / 2;
    const hd = depth / 2;
    this.boxes.push({
      minX: centerX - hw,
      maxX: centerX + hw,
      minZ: centerZ - hd,
      maxZ: centerZ + hd,
      label
    });
  }

  private registerMuseumObstacles(): void {
    // 1. Grand Rotunda Central Hero Pedestal & Profile Monument
    this.addCircle(0, 5.5, 2.05, 'Hero Profile Pedestal');

    // 2. Wayfinder Signposts around Rotunda & Wings
    this.addCircle(0, 12.5, 0.55, 'North Signpost');
    this.addCircle(14.5, 0, 0.55, 'East Signpost');
    this.addCircle(-14.5, 0, 0.55, 'West Signpost');
    this.addCircle(0, -12.5, 0.55, 'South Signpost');
    this.addCircle(33, -15, 0.65, 'East Wing Banner');
    this.addCircle(-31, -15, 0.65, 'West Wing Banner');

    // 3. North Gallery Glass Side Walls & Far North Wall
    // Left glass wall at x = -18.1, z from 15 to 70
    this.addBox(-18.1, 42.5, 0.9, 55.5, 'Left Gallery Glass Wall');
    // Right glass wall at x = 18.1, z from 15 to 70
    this.addBox(18.1, 42.5, 0.9, 55.5, 'Right Gallery Glass Wall');
    // Far North glass wall at z = 70, x from -18.5 to 18.5
    this.addBox(0, 70, 37.2, 0.9, 'Far North Glass Wall');

    // 4. North Gallery Architectural Columns
    for (let z = 18; z <= 66; z += 12) {
      this.addCircle(-17.5, z, 0.72, `Left Column z=${z}`);
      this.addCircle(17.5, z, 0.72, `Right Column z=${z}`);
    }

    // 5. All 8 Project Pedestals & Backing Art Frames
    for (const proj of PROJECT_EXHIBITS) {
      const { x, z } = proj.position;
      // Pedestal is shifted 1.5 units toward center of gallery
      const pedX = x + (x < 0 ? 1.5 : -1.5);
      this.addCircle(pedX, z, 1.05, `Pedestal ${proj.title}`);

      // Backing Art Frame is shifted 2.2 units toward the outer wall
      const frameX = x + (x < 0 ? -2.2 : 2.2);
      this.addBox(frameX, z, 1.1, 6.8, `Art Frame ${proj.title}`);
    }

    // 6. East Wing: 5 Skill Pillars
    for (const pillar of SKILL_PILLARS) {
      this.addCircle(pillar.position.x, pillar.position.z, 1.65, `Skill Pillar ${pillar.category}`);
    }

    // 7. West Wing: 3 Experience Timeline Frames
    for (const exp of EXPERIENCE_ITEMS) {
      this.addCircle(exp.position.x, exp.position.z, 2.2, `Experience ${exp.organization}`);
    }

    // 8. South Wing: 4 Contact Portals
    const portalCoords = [
      { x: -10, z: -26 },
      { x: -3.5, z: -28 },
      { x: 3.5, z: -28 },
      { x: 10, z: -26 }
    ];
    for (const p of portalCoords) {
      this.addCircle(p.x, p.z, 1.35, 'Contact Portal');
    }
  }

  private registerGardenAndNatureObstacles(): void {
    // 1. Rotunda 4 Diagonal Botanical Planter Beds & North Gallery Center Planters
    const planterCoords = [
      { x: -8.5, z: 8.5, w: 3.5, d: 3.5 },
      { x: 8.5, z: 8.5, w: 3.5, d: 3.5 },
      { x: -8.5, z: -8.5, w: 3.5, d: 3.5 },
      { x: 8.5, z: -8.5, w: 3.5, d: 3.5 },
      { x: 0, z: 30, w: 2.5, d: 4.9 },
      { x: 0, z: 42, w: 2.5, d: 4.9 },
      { x: 0, z: 54, w: 2.5, d: 4.9 }
    ];
    for (const p of planterCoords) {
      this.addBox(p.x, p.z, p.w, p.d, 'Botanical Planter');
    }

    // 2. Park Benches & Lantern Bollards
    const benchSpots = [
      { x: -5.5, z: 30 },
      { x: 5.5, z: 30 },
      { x: -5.5, z: 54 },
      { x: 5.5, z: 54 },
      { x: -23, z: 36 },
      { x: 23, z: 36 }
    ];
    for (const b of benchSpots) {
      this.addBox(b.x, b.z, 0.9, 2.3, 'Park Bench');
      this.addCircle(b.x, b.z + 1.6, 0.35, 'Garden Lantern');
    }

    // 3. West & East Reflecting Ponds (Prevent characters from walking on water)
    this.addCircle(-34, 36, 9.8, 'West Reflecting Pond');
    this.addCircle(34, 36, 9.8, 'East Reflecting Pond');

    // 4. All 37 Botanical Trees
    const treeCoords = [
      [-23, 20], [-24, 30], [-23, 44], [-24, 54], [-23, 64],
      [23, 20], [24, 30], [23, 44], [24, 54], [23, 64],
      [-46, 28], [-47, 42], [-36, 52],
      [46, 28], [47, 42], [36, 52],
      [50, -14], [54, 0], [50, 14], [22, -18], [22, 16],
      [-48, -14], [-52, 0], [-48, 14], [-22, -18], [-22, 16],
      [-18, -28], [18, -28], [-26, -36], [26, -36], [-12, -40], [12, -40],
      [-16, 78], [0, 82], [16, 78], [-32, 75], [32, 75]
    ];
    for (const [tx, tz] of treeCoords) {
      this.addCircle(tx, tz, 0.85, 'Garden Tree');
    }
  }

  /**
   * Resolves character movement against all registered circle & box obstacles,
   * plus optional dynamic character positions, sliding smoothly along surfaces.
   */
  public resolvePosition(
    desiredPos: Vector3,
    charRadius = 0.55,
    otherCharacters: Vector3[] = []
  ): Vector3 {
    let x = this.clamp(desiredPos.x, -62, 62);
    let z = this.clamp(desiredPos.z, -48, 86);

    // Run 2 relaxation iterations so corner intersections resolve cleanly
    for (let iter = 0; iter < 2; iter++) {
      // 1. Resolve against Box Obstacles (AABB vs Circle)
      for (const box of this.boxes) {
        const closestX = this.clamp(x, box.minX, box.maxX);
        const closestZ = this.clamp(z, box.minZ, box.maxZ);
        const dx = x - closestX;
        const dz = z - closestZ;
        const distSq = dx * dx + dz * dz;

        if (distSq < charRadius * charRadius) {
          const dist = Math.sqrt(distSq);
          if (dist > 0.0001) {
            const push = charRadius - dist;
            x += (dx / dist) * push;
            z += (dz / dist) * push;
          } else {
            // Center is inside the box: push out toward nearest edge
            const leftPen = Math.abs(x - box.minX);
            const rightPen = Math.abs(box.maxX - x);
            const topPen = Math.abs(z - box.minZ);
            const bottomPen = Math.abs(box.maxZ - z);
            const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);
            if (minPen === leftPen) x = box.minX - charRadius;
            else if (minPen === rightPen) x = box.maxX + charRadius;
            else if (minPen === topPen) z = box.minZ - charRadius;
            else z = box.maxZ + charRadius;
          }
        }
      }

      // 2. Resolve against Circle Obstacles
      for (const c of this.circles) {
        const dx = x - c.x;
        const dz = z - c.z;
        const minDist = charRadius + c.radius;
        const distSq = dx * dx + dz * dz;
        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq) || 0.001;
          const overlap = minDist - dist;
          x += (dx / dist) * overlap;
          z += (dz / dist) * overlap;
        }
      }

      // 3. Resolve against other Characters (Player vs NPCs)
      for (const other of otherCharacters) {
        const dx = x - other.x;
        const dz = z - other.z;
        const minDist = charRadius * 2.05;
        const distSq = dx * dx + dz * dz;
        if (distSq > 0.0001 && distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          const overlap = minDist - dist;
          x += (dx / dist) * overlap;
          z += (dz / dist) * overlap;
        }
      }
    }

    return new Vector3(x, 0, z);
  }

  private clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }
}
