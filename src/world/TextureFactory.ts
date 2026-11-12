import { DynamicTexture, Scene } from '@babylonjs/core';
import { ExperienceItem, ProjectExhibit, SkillPillar } from '../data/portfolioData';

export class TextureFactory {
  private static roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  private static wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines = 4
  ): number {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    let linesCount = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        linesCount++;
        if (linesCount >= maxLines) {
          ctx.fillText(line.trim() + '...', x, currentY);
          return currentY + lineHeight;
        }
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      ctx.fillText(line.trim(), x, currentY);
      currentY += lineHeight;
    }
    return currentY;
  }

  public static createProjectCanvasTexture(scene: Scene, project: ProjectExhibit): DynamicTexture {
    const width = 1024;
    const height = 768;
    const tex = new DynamicTexture(`projTex-${project.id}`, { width, height }, scene, true);
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;

    const renderCard = (loadedImg?: HTMLImageElement) => {
      // Background gradient matching PyaeFolio clean glass aesthetic
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.55, '#1e293b');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle glowing accent border
      ctx.strokeStyle = project.accentColor;
      ctx.lineWidth = 10;
      this.roundRect(ctx, 18, 18, width - 36, height - 36, 28);
      ctx.stroke();

      // Top header bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      this.roundRect(ctx, 36, 36, width - 72, 92, 18);
      ctx.fill();

      // Exhibit number badge
      ctx.fillStyle = project.accentColor;
      this.roundRect(ctx, 56, 52, 140, 60, 14);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`#${project.number}`, 126, 92);

      // Category pill
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      this.roundRect(ctx, 216, 54, 210, 56, 28);
      ctx.fill();
      ctx.fillStyle = project.secondaryColor;
      ctx.font = 'bold 24px Inter, system-ui, sans-serif';
      ctx.fillText(project.category.toUpperCase(), 321, 90);

      // Live demo indicator if available
      if (project.liveDemoUrl) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        this.roundRect(ctx, width - 250, 54, 190, 56, 28);
        ctx.fill();
        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 22px Inter, system-ui, sans-serif';
        ctx.fillText('● LIVE DEMO', width - 155, 90);
      }

      // Left column: Screenshot preview box (or stylized graphic)
      const imgBoxX = 52;
      const imgBoxY = 152;
      const imgBoxW = 430;
      const imgBoxH = 340;

      ctx.save();
      this.roundRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 20);
      ctx.clip();

      if (loadedImg) {
        // Cover-fit image
        const scale = Math.max(imgBoxW / loadedImg.width, imgBoxH / loadedImg.height);
        const drawW = loadedImg.width * scale;
        const drawH = loadedImg.height * scale;
        const drawX = imgBoxX + (imgBoxW - drawW) / 2;
        const drawY = imgBoxY + (imgBoxH - drawH) / 2;
        ctx.drawImage(loadedImg, drawX, drawY, drawW, drawH);
      } else {
        const artGrad = ctx.createLinearGradient(imgBoxX, imgBoxY, imgBoxX + imgBoxW, imgBoxY + imgBoxH);
        artGrad.addColorStop(0, project.accentColor);
        artGrad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = artGrad;
        ctx.fillRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH);

        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 84px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('☀', imgBoxX + imgBoxW / 2, imgBoxY + imgBoxH / 2 + 28);
      }
      ctx.restore();

      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 3;
      this.roundRect(ctx, imgBoxX, imgBoxY, imgBoxW, imgBoxH, 20);
      ctx.stroke();

      // Right column: Title & Description
      const textX = 510;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px Inter, system-ui, sans-serif';
      this.wrapText(ctx, project.title, textX, 200, 460, 52, 2);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '25px Inter, system-ui, sans-serif';
      this.wrapText(ctx, project.shortDesc, textX, 305, 455, 36, 4);

      // Engineering highlight box
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      this.roundRect(ctx, textX, 420, 455, 74, 14);
      ctx.fill();
      ctx.strokeStyle = project.accentColor;
      ctx.lineWidth = 2;
      this.roundRect(ctx, textX, 420, 455, 74, 14);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px Inter, system-ui, sans-serif';
      ctx.fillText('PRESS [E] OR CLICK FOR CASE STUDY', textX + 20, 464);

      // Tech stack badges row at bottom
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 21px Inter, system-ui, sans-serif';
      ctx.fillText('TECH STACK:', 54, 550);

      let pillX = 54;
      let pillY = 572;
      ctx.font = 'bold 23px Inter, system-ui, sans-serif';

      for (const tech of project.techStack) {
        const metrics = ctx.measureText(tech);
        const pillW = metrics.width + 38;
        if (pillX + pillW > width - 54) {
          pillX = 54;
          pillY += 56;
        }
        ctx.fillStyle = 'rgba(0, 102, 255, 0.22)';
        this.roundRect(ctx, pillX, pillY, pillW, 44, 22);
        ctx.fill();
        ctx.strokeStyle = project.secondaryColor;
        ctx.lineWidth = 2;
        this.roundRect(ctx, pillX, pillY, pillW, 44, 22);
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.fillText(tech, pillX + 19, pillY + 30);
        pillX += pillW + 14;
      }

      tex.update();
    };

    renderCard();

    if (project.imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => renderCard(img);
      img.src = project.imageUrl;
    }

    return tex;
  }

  public static createProfileMonumentTexture(
    scene: Scene,
    fullName: string,
    title: string,
    tagline: string,
    avatarUrl: string
  ): DynamicTexture {
    const width = 1024;
    const height = 512;
    const tex = new DynamicTexture('profileMonumentTex', { width, height }, scene, true);
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;

    const draw = (avatar?: HTMLImageElement) => {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(0.5, '#111c35');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = '#0066FF';
      ctx.lineWidth = 8;
      this.roundRect(ctx, 16, 16, width - 32, height - 32, 28);
      ctx.stroke();

      // Avatar circle
      const cx = 185;
      const cy = height / 2;
      const radius = 115;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      if (avatar) {
        const scale = Math.max((radius * 2) / avatar.width, (radius * 2) / avatar.height);
        const w = avatar.width * scale;
        const h = avatar.height * scale;
        ctx.drawImage(avatar, cx - w / 2, cy - h / 2, w, h);
      } else {
        ctx.fillStyle = '#0066FF';
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      }
      ctx.restore();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Text info
      ctx.textAlign = 'left';
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.fillText('WELCOME TO THE INTERACTIVE 3D PORTFOLIO MUSEUM', 340, 115);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px Inter, system-ui, sans-serif';
      ctx.fillText(fullName, 340, 180);

      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 30px Inter, system-ui, sans-serif';
      ctx.fillText(`${title}  •  Yangon, Myanmar`, 340, 228);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '24px Inter, system-ui, sans-serif';
      this.wrapText(ctx, tagline, 340, 285, 620, 34, 3);

      // Pill prompt at bottom
      ctx.fillStyle = '#0066FF';
      this.roundRect(ctx, 340, 395, 520, 56, 28);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.fillText('PRESS [E] OR CLICK FOR BIO & RESUME', 376, 430);

      tex.update();
    };

    draw();
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => draw(img);
    img.src = avatarUrl;

    return tex;
  }

  public static createSkillPillarTexture(scene: Scene, pillar: SkillPillar): DynamicTexture {
    const width = 512;
    const height = 768;
    const tex = new DynamicTexture(`skillTex-${pillar.id}`, { width, height }, scene, true);
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;

    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = pillar.color;
    ctx.lineWidth = 10;
    this.roundRect(ctx, 16, 16, width - 32, height - 32, 24);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = pillar.color;
    ctx.font = 'bold 68px Inter, system-ui, sans-serif';
    ctx.fillText(pillar.iconSymbol, width / 2, 115);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px Inter, system-ui, sans-serif';
    ctx.fillText(pillar.category, width / 2, 178);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '22px Inter, system-ui, sans-serif';
    ctx.fillText(pillar.subtitle, width / 2, 216);

    let y = 275;
    for (const skill of pillar.skills) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      this.roundRect(ctx, 48, y, width - 96, 62, 16);
      ctx.fill();

      ctx.strokeStyle = pillar.color;
      ctx.lineWidth = 2;
      this.roundRect(ctx, 48, y, width - 96, 62, 16);
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 26px Inter, system-ui, sans-serif';
      ctx.fillText(skill, width / 2, y + 40);
      y += 76;
    }

    tex.update();
    return tex;
  }

  public static createExperienceTexture(scene: Scene, exp: ExperienceItem): DynamicTexture {
    const width = 800;
    const height = 600;
    const tex = new DynamicTexture(`expTex-${exp.id}`, { width, height }, scene, true);
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;

    const draw = (logo?: HTMLImageElement) => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = exp.color;
      ctx.lineWidth = 10;
      this.roundRect(ctx, 16, 16, width - 32, height - 32, 24);
      ctx.stroke();

      // Badge
      ctx.fillStyle = exp.color;
      this.roundRect(ctx, 48, 48, 240, 48, 24);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(exp.type.toUpperCase(), 168, 79);

      if (logo) {
        ctx.fillStyle = '#ffffff';
        this.roundRect(ctx, width - 140, 42, 88, 88, 18);
        ctx.fill();
        ctx.drawImage(logo, width - 130, 52, 68, 68);
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px Inter, system-ui, sans-serif';
      this.wrapText(ctx, exp.role, 48, 152, width - 190, 48, 2);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 28px Inter, system-ui, sans-serif';
      ctx.fillText(exp.organization, 48, 240);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.fillText(exp.period, 48, 278);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '24px Inter, system-ui, sans-serif';
      this.wrapText(ctx, exp.summary, 48, 336, width - 96, 36, 4);

      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      this.roundRect(ctx, 48, 495, width - 96, 56, 14);
      ctx.fill();
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 22px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS [E] OR CLICK FOR FULL TIMELINE DETAILS', width / 2, 531);

      tex.update();
    };

    draw();
    if (exp.logoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => draw(img);
      img.src = exp.logoUrl;
    }

    return tex;
  }

  public static createSignBannerTexture(
    scene: Scene,
    title: string,
    subtitle: string,
    accentHex: string
  ): DynamicTexture {
    const width = 1024;
    const height = 256;
    const tex = new DynamicTexture(`banner-${title}`, { width, height }, scene, true);
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 8;
    this.roundRect(ctx, 12, 12, width - 24, height - 24, 24);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px Inter, system-ui, sans-serif';
    ctx.fillText(title, width / 2, 118);

    ctx.fillStyle = accentHex;
    ctx.font = 'bold 28px Inter, system-ui, sans-serif';
    ctx.fillText(subtitle, width / 2, 178);

    tex.update();
    return tex;
  }

  public static createCharacterLabelTexture(
    scene: Scene,
    displayName: string,
    badgeText: string,
    accentColor: string,
    thoughtBubble?: string
  ): DynamicTexture {
    const width = 512;
    const height = 256;
    const tex = new DynamicTexture(`charLabel-${displayName}-${Math.random()}`, { width, height }, scene, true);
    tex.hasAlpha = true;

    this.updateCharacterLabelTexture(tex, displayName, badgeText, accentColor, thoughtBubble);
    return tex;
  }

  public static updateCharacterLabelTexture(
    tex: DynamicTexture,
    displayName: string,
    badgeText: string,
    accentColor: string,
    thoughtBubble?: string
  ): void {
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;
    const width = 512;
    const height = 256;
    ctx.clearRect(0, 0, width, height);

    // Optional thought bubble on top
    if (thoughtBubble) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      this.roundRect(ctx, 16, 12, width - 32, 92, 22);
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 4;
      this.roundRect(ctx, 16, 12, width - 32, 92, 22);
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      this.wrapText(ctx, `"${thoughtBubble}"`, width / 2, 48, width - 64, 26, 2);
    }

    // Name pill
    const pillY = 124;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    this.roundRect(ctx, 56, pillY, width - 112, 98, 24);
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    this.roundRect(ctx, 56, pillY, width - 112, 98, 24);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 19px Inter, system-ui, sans-serif';
    ctx.fillText(badgeText.toUpperCase(), width / 2, pillY + 34);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Inter, system-ui, sans-serif';
    ctx.fillText(displayName, width / 2, pillY + 74);

    tex.update();
  }

  public static createMuseumFloorTileTexture(scene: Scene): DynamicTexture {
    const size = 512;
    const tex = new DynamicTexture('museumFloorTiles', { width: size, height: size }, scene, true);
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D;

    // Soft matte architectural slate stone base (comfortable on the eyes, zero glare)
    ctx.fillStyle = '#243044';
    ctx.fillRect(0, 0, size, size);

    // Subtle checkerboard stone tile tone variation
    const tileSize = 128;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#273449' : '#212c3f';
        ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);

        // Tile grout border
        ctx.strokeStyle = '#182232';
        ctx.lineWidth = 3;
        ctx.strokeRect(col * tileSize, row * tileSize, tileSize, tileSize);

        // Subtle inner stone bevel highlight
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(col * tileSize + 4, row * tileSize + 4, tileSize - 8, tileSize - 8);
      }
    }

    tex.wrapU = DynamicTexture.WRAP_ADDRESSMODE;
    tex.wrapV = DynamicTexture.WRAP_ADDRESSMODE;
    tex.update();
    return tex;
  }
}
