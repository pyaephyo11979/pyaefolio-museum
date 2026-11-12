import { HelpBotReply, HelpBotService } from '../ai/HelpBotService';
import { SoundFX } from '../audio/SoundFX';
import {
  BackwearType,
  BLAME_PRESET_REASONS,
  CharacterCustomizationConfig,
  ChassisType,
  CompanionType,
  CUSTOMIZATION_SWATCHES,
  EyewearType,
  HeadwearType,
  LIVE_CHAT_EMOTES,
  MUSEUM_WINGS,
  PRESERVED_QAS,
  PreservedQAAction,
  PROFILE_DATA,
  PROJECT_EXHIBITS,
  PROJECT_GIT_BLAME_MAP,
  PYAEBOT_BLAME_COMEBACKS,
  VISITOR_CHARACTERS
} from '../data/portfolioData';
import { PlayerController } from '../entities/PlayerController';
import { BlameEventEntry, MultiplayerManager } from '../network/MultiplayerManager';
import { InteractableTarget, MuseumBuilder } from '../world/MuseumBuilder';

interface GuestbookEntry {
  author: string;
  roleBadge: string;
  message: string;
  timeLabel: string;
}

export class UIManager {
  private characterDialog = document.getElementById('character-dialog') as HTMLDialogElement;
  private exhibitDialog = document.getElementById('exhibit-dialog') as HTMLDialogElement;
  private passportDialog = document.getElementById('passport-dialog') as HTMLDialogElement;
  private helpBotDialog = document.getElementById('helpbot-dialog') as HTMLDialogElement;
  private liveVisitorsDialog = document.getElementById('live-visitors-dialog') as HTMLDialogElement;
  private helpBotService = new HelpBotService();

  private customConfig: CharacterCustomizationConfig = {
    ...VISITOR_CHARACTERS[0].defaultConfig
  };

  private stampedProjects = new Set<string>();
  private currentTourIndex = 0;

  private guestbookEntries: GuestbookEntry[] = [];

  private minimapCtx: CanvasRenderingContext2D | null = null;
  private previewCtx: CanvasRenderingContext2D | null = null;
  private previewAnimPhase = 0;
  private blameToastTimeout: number | null = null;

  constructor(
    private player: PlayerController,
    private museum: MuseumBuilder,
    private multiplayer: MultiplayerManager,
    private sfx: SoundFX
  ) {
    this.loadSavedState();
    this.setupDialogLightDismissFallback();

    const minimapCanvas = document.getElementById('minimapCanvas') as HTMLCanvasElement | null;
    if (minimapCanvas) {
      this.minimapCtx = minimapCanvas.getContext('2d');
    }

    const previewCanvas = document.getElementById('avatarPreviewCanvas') as HTMLCanvasElement | null;
    if (previewCanvas) {
      this.previewCtx = previewCanvas.getContext('2d');
    }

    // Auto-collapse radar minimap on compact phone screens to maximize 3D viewport
    const radarPanel = document.getElementById('radar-minimap-panel');
    if (window.innerWidth < 680 && radarPanel) {
      radarPanel.classList.add('collapsed');
    }

    this.initCustomizerUI();
    this.initHelpBotUI();
    this.initLiveVisitorsUI();
    this.bindHUDControls();
    this.setupVirtualTouchControls();
    this.updatePassportUI();
    this.renderGuestbook();

    // Apply loaded custom character config immediately
    this.applyConfigToPlayer(false);

    this.player.setCallbacks(
      (target) => this.updateProximityPrompt(target),
      (target) => this.openInteractableModal(target),
      () => [...this.multiplayer.getRemotePositions(), this.museum.helpBotPosition],
      (remotePeerId) => {
        const peer = this.multiplayer.peers.get(remotePeerId);
        if (peer) {
          this.triggerBlameOnTarget(peer.state.peerId, peer.state.config.displayName);
        }
      }
    );
  }

  private loadSavedState(): void {
    try {
      const savedStamps = localStorage.getItem('pyaefolio_stamps');
      if (savedStamps) {
        const parsed: string[] = JSON.parse(savedStamps);
        parsed.forEach((id) => this.stampedProjects.add(id));
      }
      const savedGuestbook = localStorage.getItem('pyaefolio_guestbook');
      if (savedGuestbook) {
        this.guestbookEntries = JSON.parse(savedGuestbook);
      }
      const savedChar = localStorage.getItem('pyaefolio_custom_char');
      if (savedChar) {
        this.customConfig = {
          ...this.customConfig,
          ...JSON.parse(savedChar)
        };
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveState(): void {
    try {
      localStorage.setItem('pyaefolio_stamps', JSON.stringify([...this.stampedProjects]));
      localStorage.setItem('pyaefolio_guestbook', JSON.stringify(this.guestbookEntries));
      localStorage.setItem('pyaefolio_custom_char', JSON.stringify(this.customConfig));
    } catch {
      // Ignore storage errors
    }
  }

  private setupDialogLightDismissFallback(): void {
    const dialogs = document.querySelectorAll<HTMLDialogElement>('dialog[closedby="any"]');
    dialogs.forEach((dialog) => {
      dialog.addEventListener('close', () => {
        dialog.returnValue = '';
      });
    });

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e: PointerEvent, dialog: HTMLDialogElement) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      for (const dialog of dialogs) {
        let pressedOutside = false;
        dialog.addEventListener('pointerdown', (e) => {
          if (e.target === dialog) {
            pressedOutside = outside(e, dialog);
          } else {
            pressedOutside = false;
          }
        });
        dialog.addEventListener('pointerup', (e) => {
          if (pressedOutside && outside(e, dialog)) {
            dialog.close();
          }
          pressedOutside = false;
        });
      }
    }
  }

  private initCustomizerUI(): void {
    // 1. Render Quick Archetype Preset Pills
    const presetContainer = document.getElementById('character-preset-pills');
    if (presetContainer) {
      presetContainer.innerHTML = VISITOR_CHARACTERS.map(
        (char) => `
          <button
            type="button"
            class="preset-pill-btn ${this.customConfig.presetId === char.id ? 'active' : ''}"
            data-preset-id="${char.id}"
          >
            ${char.name.split(' ')[0]} (${char.badgeText})
          </button>
        `
      ).join('');

      presetContainer.querySelectorAll<HTMLButtonElement>('.preset-pill-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.presetId as typeof VISITOR_CHARACTERS[number]['id'];
          const found = VISITOR_CHARACTERS.find((c) => c.id === id);
          if (!found) return;
          this.customConfig = { ...found.defaultConfig };
          this.sfx.playChime(480, 680);
          this.syncCustomizerControls();
          this.applyConfigToPlayer(false);
        });
      });
    }

    // 2. Randomize button
    document.getElementById('btn-randomize-char')?.addEventListener('click', () => {
      const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
      const chassisList: ChassisType[] = ['humanoid', 'hover-bot'];
      const headwearList: HeadwearType[] = [
        'none',
        'slick-hair',
        'beret',
        'crown',
        'antenna',
        'headphones'
      ];
      const eyewearList: EyewearType[] = ['none', 'glasses', 'cyber-visor', 'sunglasses'];
      const backwearList: BackwearType[] = ['none', 'tech-pack', 'cape', 'scarf', 'wings'];
      const companionList: CompanionType[] = ['none', 'mini-drone', 'holo-cube'];

      this.customConfig = {
        ...this.customConfig,
        presetId: 'custom',
        badgeText: pick(CUSTOMIZATION_SWATCHES.badgePresets),
        chassis: pick(chassisList),
        headwear: pick(headwearList),
        eyewear: pick(eyewearList),
        backwear: pick(backwearList),
        companion: pick(companionList),
        primaryColor: pick(CUSTOMIZATION_SWATCHES.primaryColors),
        secondaryColor: pick(CUSTOMIZATION_SWATCHES.secondaryColors),
        skinOrChassisColor: pick(CUSTOMIZATION_SWATCHES.skinAndChassisTones).hex
      };
      this.sfx.playChime(520, 790);
      this.syncCustomizerControls();
      this.applyConfigToPlayer(false);
    });

    // 3. Name Input & Badge Select
    const nameInput = document.getElementById('visitor-name-input') as HTMLInputElement | null;
    nameInput?.addEventListener('input', () => {
      this.customConfig.displayName = nameInput.value.trim() || 'Museum Visitor';
      this.syncCustomizerControls(false);
    });

    const badgeSelect = document.getElementById('visitor-badge-select') as HTMLSelectElement | null;
    badgeSelect?.addEventListener('change', () => {
      this.customConfig.badgeText = badgeSelect.value;
      this.customConfig.presetId = 'custom';
      this.sfx.playChime(460, 640);
      this.syncCustomizerControls();
      this.applyConfigToPlayer(false);
    });

    // 4. Modular Chip Groups
    document.querySelectorAll<HTMLElement>('.chip-group').forEach((group) => {
      const partKey = group.dataset.part as
        | 'chassis'
        | 'headwear'
        | 'eyewear'
        | 'backwear'
        | 'companion';
      group.querySelectorAll<HTMLButtonElement>('.part-chip').forEach((chip) => {
        chip.addEventListener('click', () => {
          const val = chip.dataset.value as never;
          this.customConfig[partKey] = val;
          this.customConfig.presetId = 'custom';
          this.sfx.playChime(500, 700);
          this.syncCustomizerControls();
          this.applyConfigToPlayer(false);
        });
      });
    });

    // 5. Color Swatches & Native Color Pickers
    this.renderSwatches(
      'swatches-primary',
      CUSTOMIZATION_SWATCHES.primaryColors,
      () => this.customConfig.primaryColor,
      (hex) => {
        this.customConfig.primaryColor = hex;
        this.customConfig.presetId = 'custom';
      }
    );
    this.renderSwatches(
      'swatches-secondary',
      CUSTOMIZATION_SWATCHES.secondaryColors,
      () => this.customConfig.secondaryColor,
      (hex) => {
        this.customConfig.secondaryColor = hex;
        this.customConfig.presetId = 'custom';
      }
    );
    this.renderSwatches(
      'swatches-skin',
      CUSTOMIZATION_SWATCHES.skinAndChassisTones.map((t) => t.hex),
      () => this.customConfig.skinOrChassisColor,
      (hex) => {
        this.customConfig.skinOrChassisColor = hex;
        this.customConfig.presetId = 'custom';
      }
    );

    const bindColorInput = (id: string, onChange: (hex: string) => void) => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      el?.addEventListener('input', () => {
        onChange(el.value.toUpperCase());
        this.customConfig.presetId = 'custom';
        this.syncCustomizerControls();
        this.applyConfigToPlayer(false);
      });
    };

    bindColorInput('input-primary-color', (hex) => (this.customConfig.primaryColor = hex));
    bindColorInput('input-secondary-color', (hex) => (this.customConfig.secondaryColor = hex));
    bindColorInput('input-skin-color', (hex) => (this.customConfig.skinOrChassisColor = hex));

    this.syncCustomizerControls();
  }

  private renderSwatches(
    containerId: string,
    colors: string[],
    getCurrent: () => string,
    onSelect: (hex: string) => void
  ): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = colors
      .map(
        (hex) => `
        <button
          type="button"
          class="color-swatch-btn ${getCurrent().toUpperCase() === hex.toUpperCase() ? 'active' : ''}"
          style="background:${hex}"
          data-hex="${hex}"
          aria-label="Select color ${hex}"
        ></button>
      `
      )
      .join('');

    container.querySelectorAll<HTMLButtonElement>('.color-swatch-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const hex = btn.dataset.hex || '#0066FF';
        onSelect(hex);
        this.sfx.playChime(490, 690);
        this.syncCustomizerControls();
        this.applyConfigToPlayer(false);
      });
    });
  }

  private syncCustomizerControls(syncNameInput = true): void {
    const cfg = this.customConfig;

    if (syncNameInput) {
      const nameInput = document.getElementById('visitor-name-input') as HTMLInputElement | null;
      if (nameInput) nameInput.value = cfg.displayName;
    }

    const badgeSelect = document.getElementById('visitor-badge-select') as HTMLSelectElement | null;
    if (badgeSelect) badgeSelect.value = cfg.badgeText;

    // Preset active state
    document.querySelectorAll<HTMLButtonElement>('.preset-pill-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.presetId === cfg.presetId);
    });

    // Chip active states
    document.querySelectorAll<HTMLElement>('.chip-group').forEach((group) => {
      const partKey = group.dataset.part as
        | 'chassis'
        | 'headwear'
        | 'eyewear'
        | 'backwear'
        | 'companion';
      const activeVal = cfg[partKey];
      group.querySelectorAll<HTMLButtonElement>('.part-chip').forEach((chip) => {
        chip.classList.toggle('active', chip.dataset.value === activeVal);
      });
    });

    // Color inputs
    const pIn = document.getElementById('input-primary-color') as HTMLInputElement | null;
    if (pIn) pIn.value = cfg.primaryColor;
    const sIn = document.getElementById('input-secondary-color') as HTMLInputElement | null;
    if (sIn) sIn.value = cfg.secondaryColor;
    const skIn = document.getElementById('input-skin-color') as HTMLInputElement | null;
    if (skIn) skIn.value = cfg.skinOrChassisColor;

    // Swatch active states
    const updateSwatchActive = (id: string, currentHex: string) => {
      document
        .getElementById(id)
        ?.querySelectorAll<HTMLButtonElement>('.color-swatch-btn')
        .forEach((btn) => {
          btn.classList.toggle(
            'active',
            (btn.dataset.hex || '').toUpperCase() === currentHex.toUpperCase()
          );
        });
    };
    updateSwatchActive('swatches-primary', cfg.primaryColor);
    updateSwatchActive('swatches-secondary', cfg.secondaryColor);
    updateSwatchActive('swatches-skin', cfg.skinOrChassisColor);

    // Preview stage header & summary
    const previewBadge = document.getElementById('preview-badge-pill');
    if (previewBadge) {
      previewBadge.textContent = cfg.badgeText;
      previewBadge.style.background = cfg.primaryColor;
    }
    const previewName = document.getElementById('preview-name-text');
    if (previewName) {
      previewName.textContent = cfg.displayName;
    }
    const previewSummary = document.getElementById('preview-parts-summary');
    if (previewSummary) {
      const parts = [
        cfg.chassis === 'hover-bot' ? 'Hover-Bot' : 'Humanoid',
        cfg.headwear !== 'none' ? cfg.headwear : null,
        cfg.eyewear !== 'none' ? cfg.eyewear : null,
        cfg.backwear !== 'none' ? cfg.backwear : null,
        cfg.companion !== 'none' ? cfg.companion : null
      ].filter(Boolean);
      previewSummary.textContent = parts.join(' • ');
    }
  }

  private applyConfigToPlayer(playFanfare = true): void {
    const nameInput = document.getElementById('visitor-name-input') as HTMLInputElement | null;
    if (nameInput && nameInput.value.trim()) {
      this.customConfig.displayName = nameInput.value.trim();
    }

    this.player.applyCharacterCustomization(
      this.customConfig,
      'Exploring PyaeFolio 3D Museum'
    );

    const activeCharLabel = document.getElementById('active-char-label');
    if (activeCharLabel) {
      activeCharLabel.textContent = this.customConfig.displayName;
    }

    this.saveState();
    this.multiplayer.broadcastLocalState(true);
    this.renderLiveVisitorsRoster();
    if (playFanfare) {
      this.sfx.playStampCollected();
    }
  }

  /**
   * Renders a live animated avatar preview inside the Character Customizer dialog.
   */
  public renderAvatarPreview(): void {
    if (!this.characterDialog.open || !this.previewCtx) return;

    const ctx = this.previewCtx;
    const w = 280;
    const h = 300;
    this.previewAnimPhase += 0.05;

    ctx.clearRect(0, 0, w, h);

    const cfg = this.customConfig;
    const bob = Math.sin(this.previewAnimPhase) * 5;
    const cx = w / 2;
    const baseY = 175 + bob;

    // Ground platform glow
    const grad = ctx.createRadialGradient(cx, 262, 8, cx, 262, 74);
    grad.addColorStop(0, cfg.secondaryColor + '88');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(cx, 262, 70, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Backwear (drawn behind torso)
    if (cfg.backwear === 'cape') {
      ctx.fillStyle = cfg.secondaryColor;
      ctx.beginPath();
      ctx.moveTo(cx - 34, baseY - 48);
      ctx.lineTo(cx + 34, baseY - 48);
      ctx.lineTo(cx + 46 + Math.sin(this.previewAnimPhase) * 4, baseY + 56);
      ctx.lineTo(cx - 46 + Math.sin(this.previewAnimPhase) * 4, baseY + 56);
      ctx.closePath();
      ctx.fill();
    } else if (cfg.backwear === 'wings') {
      ctx.fillStyle = cfg.secondaryColor;
      [-1, 1].forEach((dir) => {
        ctx.save();
        ctx.translate(cx + dir * 32, baseY - 30);
        ctx.rotate(dir * (0.28 + Math.sin(this.previewAnimPhase * 2) * 0.06));
        ctx.fillRect(dir > 0 ? 0 : -56, -12, 56, 22);
        ctx.restore();
      });
    } else if (cfg.backwear === 'tech-pack') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 38, baseY - 44, 76, 52);
    }

    // Legs or Hover-Bot Rings
    if (cfg.chassis === 'hover-bot') {
      ctx.strokeStyle = cfg.secondaryColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(
        cx,
        baseY + 46,
        36 + Math.sin(this.previewAnimPhase * 2) * 3,
        10,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      ctx.strokeStyle = cfg.primaryColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(cx, baseY + 62, 22, 6, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 22, baseY + 22, 16, 48);
      ctx.fillRect(cx + 6, baseY + 22, 16, 48);
    }

    // Arms
    ctx.fillStyle = cfg.primaryColor;
    ctx.fillRect(cx - 48, baseY - 42, 14, 52);
    ctx.fillRect(cx + 34, baseY - 42, 14, 52);

    // Torso
    ctx.fillStyle = cfg.primaryColor;
    ctx.beginPath();
    ctx.roundRect(cx - 32, baseY - 50, 64, 76, 16);
    ctx.fill();

    // Chest Emblem
    ctx.fillStyle = cfg.secondaryColor;
    ctx.beginPath();
    ctx.roundRect(cx - 16, baseY - 34, 32, 18, 6);
    ctx.fill();

    // Scarf
    if (cfg.backwear === 'scarf') {
      ctx.fillStyle = cfg.secondaryColor;
      ctx.beginPath();
      ctx.roundRect(cx - 34, baseY - 58, 68, 16, 8);
      ctx.fill();
    }

    // Head
    const headY = baseY - 88;
    ctx.fillStyle = cfg.skinOrChassisColor;
    ctx.beginPath();
    ctx.arc(cx, headY, 32, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = cfg.chassis === 'hover-bot' ? cfg.secondaryColor : '#0f172a';
    ctx.beginPath();
    ctx.arc(cx - 11, headY - 2, 4.5, 0, Math.PI * 2);
    ctx.arc(cx + 11, headY - 2, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyewear
    if (cfg.eyewear === 'glasses') {
      ctx.strokeStyle = cfg.secondaryColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(cx - 22, headY - 10, 18, 14);
      ctx.strokeRect(cx + 4, headY - 10, 18, 14);
      ctx.beginPath();
      ctx.moveTo(cx - 4, headY - 3);
      ctx.lineTo(cx + 4, headY - 3);
      ctx.stroke();
    } else if (cfg.eyewear === 'cyber-visor') {
      ctx.fillStyle = cfg.secondaryColor;
      ctx.beginPath();
      ctx.roundRect(cx - 28, headY - 10, 56, 14, 7);
      ctx.fill();
    } else if (cfg.eyewear === 'sunglasses') {
      ctx.fillStyle = '#090d16';
      ctx.fillRect(cx - 24, headY - 10, 21, 14);
      ctx.fillRect(cx + 3, headY - 10, 21, 14);
      ctx.fillRect(cx - 3, headY - 7, 6, 3);
    }

    // Headwear
    if (cfg.headwear === 'slick-hair') {
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(cx, headY - 6, 33, Math.PI, 0);
      ctx.fill();
    } else if (cfg.headwear === 'beret') {
      ctx.fillStyle = cfg.primaryColor;
      ctx.beginPath();
      ctx.ellipse(cx + 4, headY - 28, 32, 11, -0.15, 0, Math.PI * 2);
      ctx.fill();
    } else if (cfg.headwear === 'crown') {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(cx - 20, headY - 30);
      ctx.lineTo(cx - 14, headY - 48);
      ctx.lineTo(cx, headY - 36);
      ctx.lineTo(cx + 14, headY - 48);
      ctx.lineTo(cx + 20, headY - 30);
      ctx.closePath();
      ctx.fill();
    } else if (cfg.headwear === 'antenna') {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx, headY - 32);
      ctx.lineTo(cx, headY - 54);
      ctx.stroke();
      ctx.fillStyle = cfg.secondaryColor;
      ctx.beginPath();
      ctx.arc(cx, headY - 58, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (cfg.headwear === 'headphones') {
      ctx.strokeStyle = cfg.secondaryColor;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(cx, headY, 35, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = cfg.primaryColor;
      ctx.fillRect(cx - 40, headY - 10, 10, 22);
      ctx.fillRect(cx + 30, headY - 10, 10, 22);
    }

    // Companion Pet
    if (cfg.companion !== 'none') {
      const compX = cx + 76;
      const compY = headY + Math.sin(this.previewAnimPhase * 1.6) * 8;
      if (cfg.companion === 'mini-drone') {
        ctx.strokeStyle = cfg.secondaryColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(compX, compY, 18, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = cfg.primaryColor;
        ctx.beginPath();
        ctx.arc(compX, compY, 9, 0, Math.PI * 2);
        ctx.fill();
      } else if (cfg.companion === 'holo-cube') {
        ctx.save();
        ctx.translate(compX, compY);
        ctx.rotate(this.previewAnimPhase);
        ctx.fillStyle = cfg.secondaryColor;
        ctx.fillRect(-11, -11, 22, 22);
        ctx.restore();
      }
    }
  }

  private setupVirtualTouchControls(): void {
    const base = document.getElementById('joystick-base');
    const stick = document.getElementById('joystick-stick');
    if (base && stick) {
      let activePointerId: number | null = null;
      const maxRadius = 34;

      const updateStick = (clientX: number, clientY: number) => {
        const rect = base.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let dx = clientX - centerX;
        let dy = clientY - centerY;
        const dist = Math.hypot(dx, dy);
        if (dist > maxRadius) {
          dx = (dx / dist) * maxRadius;
          dy = (dy / dist) * maxRadius;
        }
        stick.style.transform = `translate(${dx}px, ${dy}px)`;
        // Normalize to [-1..1]; up on screen is positive forward (+moveY)
        this.player.setTouchInput(dx / maxRadius, -dy / maxRadius, this.isTouchSprinting);
      };

      const resetStick = () => {
        activePointerId = null;
        stick.style.transform = 'translate(0px, 0px)';
        this.player.setTouchInput(0, 0, false);
      };

      base.addEventListener('pointerdown', (e) => {
        activePointerId = e.pointerId;
        base.setPointerCapture(e.pointerId);
        updateStick(e.clientX, e.clientY);
      });

      base.addEventListener('pointermove', (e) => {
        if (e.pointerId !== activePointerId) return;
        updateStick(e.clientX, e.clientY);
      });

      base.addEventListener('pointerup', (e) => {
        if (e.pointerId === activePointerId) resetStick();
      });

      base.addEventListener('pointercancel', (e) => {
        if (e.pointerId === activePointerId) resetStick();
      });
    }

    // 4-Way D-Pad Directional Buttons
    const dpadState = { up: false, down: false, left: false, right: false };
    const syncDpad = () => {
      const mx = (dpadState.right ? 1 : 0) - (dpadState.left ? 1 : 0);
      const my = (dpadState.up ? 1 : 0) - (dpadState.down ? 1 : 0);
      this.player.setDpadInput(mx, my);
    };

    const bindHoldBtn = (
      id: string,
      onPress: () => void,
      onRelease: () => void
    ) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const start = (e: PointerEvent) => {
        e.preventDefault();
        btn.classList.add('active');
        onPress();
      };
      const end = () => {
        btn.classList.remove('active');
        onRelease();
      };
      btn.addEventListener('pointerdown', start);
      btn.addEventListener('pointerup', end);
      btn.addEventListener('pointerleave', end);
      btn.addEventListener('pointercancel', end);
    };

    bindHoldBtn(
      'btn-dpad-up',
      () => {
        dpadState.up = true;
        syncDpad();
      },
      () => {
        dpadState.up = false;
        syncDpad();
      }
    );
    bindHoldBtn(
      'btn-dpad-down',
      () => {
        dpadState.down = true;
        syncDpad();
      },
      () => {
        dpadState.down = false;
        syncDpad();
      }
    );
    bindHoldBtn(
      'btn-dpad-left',
      () => {
        dpadState.left = true;
        syncDpad();
      },
      () => {
        dpadState.left = false;
        syncDpad();
      }
    );
    bindHoldBtn(
      'btn-dpad-right',
      () => {
        dpadState.right = true;
        syncDpad();
      },
      () => {
        dpadState.right = false;
        syncDpad();
      }
    );

    // Camera Orbit Buttons
    bindHoldBtn(
      'btn-cam-left',
      () => this.player.setTouchOrbit(-1),
      () => this.player.setTouchOrbit(0)
    );
    bindHoldBtn(
      'btn-cam-right',
      () => this.player.setTouchOrbit(1),
      () => this.player.setTouchOrbit(0)
    );
    document.getElementById('btn-cam-reset')?.addEventListener('click', () => {
      this.player.snapCameraBehindPlayer();
      this.sfx.playChime(460, 660);
    });

    const sprintBtn = document.getElementById('btn-touch-sprint');
    sprintBtn?.addEventListener('click', () => {
      this.isTouchSprinting = !this.isTouchSprinting;
      this.player.setTouchSprinting(this.isTouchSprinting);
      sprintBtn.classList.toggle('active', this.isTouchSprinting);
    });

    const jumpBtn = document.getElementById('btn-touch-jump');
    jumpBtn?.addEventListener('click', () => {
      this.player.triggerJump();
    });

    // Mobile Inspect Action Button
    document.getElementById('btn-touch-inspect')?.addEventListener('click', () => {
      if (this.player.activeInteractable) {
        this.openInteractableModal(this.player.activeInteractable);
      } else {
        // Walk to nearest exhibit if none currently in range
        let nearest: InteractableTarget | null = null;
        let minDist = Infinity;
        for (const item of this.museum.interactables) {
          const d = Math.hypot(
            item.position.x - this.player.position.x,
            item.position.z - this.player.position.z
          );
          if (d < minDist) {
            minDist = d;
            nearest = item;
          }
        }
        if (nearest) {
          this.sfx.playChime(480, 680);
          this.player.walkToAndInspect(nearest);
        }
      }
    });
  }

  private isTouchSprinting = false;

  private bindHUDControls(): void {
    const wingBtns = document.querySelectorAll<HTMLButtonElement>('.wing-btn');
    wingBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const wingId = btn.dataset.wing;
        const wing = MUSEUM_WINGS.find((w) => w.id === wingId);
        if (!wing) return;

        wingBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        this.sfx.playChime(440, 660);
        this.player.teleportTo(wing.x, wing.z, wing.lookAtX, wing.lookAtZ);
      });
    });

    document.getElementById('btn-open-profile')?.addEventListener('click', () => {
      const profileTarget = this.museum.interactables.find((i) => i.id === 'hero-profile');
      if (profileTarget) {
        this.openInteractableModal(profileTarget);
      }
    });

    document.getElementById('btn-open-character')?.addEventListener('click', () => {
      this.sfx.playChime(500, 720);
      this.syncCustomizerControls();
      this.characterDialog.showModal();
    });

    document.getElementById('btn-confirm-character')?.addEventListener('click', () => {
      this.applyConfigToPlayer(true);
      this.characterDialog.close();
    });

    document.getElementById('btn-open-passport')?.addEventListener('click', () => {
      this.sfx.playChime(540, 760);
      this.updatePassportUI();
      this.passportDialog.showModal();
    });

    const openHelpBot = () => {
      this.sfx.playChime(520, 780);
      this.syncHelpBotKeyStatus();
      this.helpBotDialog.showModal();
    };
    document.getElementById('btn-open-helpbot')?.addEventListener('click', openHelpBot);
    document.getElementById('btn-hud-helpbot')?.addEventListener('click', openHelpBot);

    document.getElementById('btn-hud-blame')?.addEventListener('click', () => {
      this.handleQuickHudBlame();
    });

    document.getElementById('btn-toggle-gamepad')?.addEventListener('click', () => {
      const layer = document.getElementById('touch-controls-layer');
      if (!layer) return;
      const isCurrentlyShown = getComputedStyle(layer).display !== 'none';
      if (isCurrentlyShown) {
        layer.classList.remove('force-visible');
        layer.classList.add('force-hidden');
      } else {
        layer.classList.remove('force-hidden');
        layer.classList.add('force-visible');
      }
      this.sfx.playChime(450, 640);
    });

    document.getElementById('btn-toggle-minimap')?.addEventListener('click', () => {
      const panel = document.getElementById('radar-minimap-panel');
      panel?.classList.toggle('collapsed');
      this.sfx.playChime(420, 580);
    });

    const themeBtn = document.getElementById('btn-toggle-theme');
    themeBtn?.addEventListener('click', () => {
      const isNight = this.museum.toggleLightingTheme();
      themeBtn.textContent = isNight ? '☀️' : '🌙';
      this.sfx.playChime(400, 600);
    });

    document.getElementById('btn-trigger-prompt')?.addEventListener('click', () => {
      if (this.player.activeInteractable) {
        this.openInteractableModal(this.player.activeInteractable);
      }
    });

    document.getElementById('btn-next-exhibit')?.addEventListener('click', () => {
      const proj = PROJECT_EXHIBITS[this.currentTourIndex % PROJECT_EXHIBITS.length];
      this.currentTourIndex = (this.currentTourIndex + 1) % PROJECT_EXHIBITS.length;

      const standX = proj.position.x < 0 ? -8.8 : 8.8;
      this.player.teleportTo(standX, proj.position.z, proj.position.x, proj.position.z);
      this.sfx.playChime(520, 820);
    });

    const gbForm = document.getElementById('guestbook-form') as HTMLFormElement | null;
    gbForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('guestbook-message-input') as HTMLInputElement | null;
      const msg = input?.value.trim();
      if (!msg) return;

      this.guestbookEntries.unshift({
        author: this.customConfig.displayName,
        roleBadge: this.customConfig.badgeText,
        message: msg,
        timeLabel: 'Just now'
      });
      if (input) input.value = '';
      this.saveState();
      this.renderGuestbook();
      this.multiplayer.sendLiveChat(msg);
      this.renderLiveChatFeed();
      this.sfx.playStampCollected();
    });
  }

  private updateProximityPrompt(target: InteractableTarget | null): void {
    const promptEl = document.getElementById('proximity-prompt');
    const dotEl = document.getElementById('prompt-dot');
    const kickerEl = document.getElementById('prompt-kicker');
    const titleEl = document.getElementById('prompt-title');
    const subEl = document.getElementById('prompt-subtitle');

    if (!promptEl || !dotEl || !kickerEl || !titleEl || !subEl) return;

    const touchInspectBtn = document.getElementById('btn-touch-inspect');
    if (touchInspectBtn) {
      touchInspectBtn.classList.toggle('ready-glow', Boolean(target));
    }

    if (!target) {
      promptEl.classList.add('hidden');
      return;
    }

    promptEl.classList.remove('hidden');
    dotEl.style.background = target.accentColor;
    dotEl.style.boxShadow = `0 0 12px ${target.accentColor}`;
    kickerEl.textContent =
      target.kind === 'project'
        ? 'PROJECT EXHIBIT IN RANGE'
        : target.kind === 'skill'
          ? 'SKILL MONUMENT IN RANGE'
          : target.kind === 'experience'
            ? 'CAREER TIMELINE EXHIBIT'
            : target.kind === 'helpbot'
              ? 'AI MUSEUM CONCIERGE IN RANGE'
              : 'INTERACTIVE KIOSK';
    titleEl.textContent = target.title;
    subEl.textContent = target.subtitle;
  }

  public openInteractableModal(target: InteractableTarget): void {
    if (target.kind === 'helpbot') {
      this.sfx.playChime(560, 820);
      this.syncHelpBotKeyStatus();
      this.helpBotDialog.showModal();
      return;
    }

    if (target.kind === 'guestbook') {
      this.sfx.playChime(540, 780);
      this.updatePassportUI();
      this.passportDialog.showModal();
      return;
    }

    const eyebrowEl = document.getElementById('exhibit-modal-eyebrow');
    const titleEl = document.getElementById('exhibit-dialog-title');
    const bodyEl = document.getElementById('exhibit-modal-body');
    if (!eyebrowEl || !titleEl || !bodyEl) return;

    if (target.kind === 'project' && target.projectData) {
      const p = target.projectData;
      const isNewStamp = !this.stampedProjects.has(p.id);
      this.stampedProjects.add(p.id);
      this.saveState();
      this.updatePassportUI();

      if (isNewStamp) {
        this.sfx.playStampCollected();
      } else {
        this.sfx.playChime(520, 740);
      }

      eyebrowEl.textContent = `EXHIBIT #${p.number} • ${p.category.toUpperCase()} • PASSPORT STAMPED ✓`;
      titleEl.textContent = p.title;

      const heroVisual = p.imageUrl
        ? `<div class="exhibit-hero-banner"><img src="${p.imageUrl}" alt="${p.title} screenshot" width="640" height="360" /></div>`
        : '';

      const techBadges = p.techStack
        .map((t) => `<span class="tech-pill">${t}</span>`)
        .join('');

      const featuresList = p.caseStudy.keyFeatures
        .map((f) => `<li>${f}</li>`)
        .join('');

      const gitBlameData = PROJECT_GIT_BLAME_MAP[p.id];
      const gitBlameHtml = gitBlameData
        ? `
          <div class="git-blame-panel">
            <div class="git-blame-header">
              <div>
                <span style="color:#94a3b8">🔍 git blame — </span>
                <span class="git-blame-filepath">${this.escapeHtml(gitBlameData.filePath)}</span>
              </div>
              <div class="git-blame-branch">
                <span>branch: <strong>${this.escapeHtml(gitBlameData.branch)}</strong></span>
                <span>•</span>
                <span>${gitBlameData.totalCommits} commits • ${this.escapeHtml(gitBlameData.ownership)}</span>
              </div>
            </div>
            <div class="git-blame-table" role="region" aria-label="Git Blame Code Inspector">
              ${gitBlameData.lines
                .map(
                  (line, idx) => `
                  <button
                    type="button"
                    class="git-blame-row ${idx === 0 ? 'active' : ''}"
                    data-line-idx="${idx}"
                    title="Click to inspect commit ${this.escapeHtml(line.hash)}"
                  >
                    <span class="blame-hash">${this.escapeHtml(line.hash)}</span>
                    <span class="blame-author">${this.escapeHtml(line.author)}</span>
                    <span class="blame-date">${this.escapeHtml(line.date)}</span>
                    <span class="blame-lineno">${line.lineNo}</span>
                    <span class="blame-code">${this.escapeHtml(line.code)}</span>
                  </button>
                `
                )
                .join('')}
            </div>
            <div class="git-blame-commit-box">
              <div class="git-blame-commit-msg" id="git-blame-commit-detail">
                Commit <strong>${this.escapeHtml(gitBlameData.lines[0].hash)}</strong> (${this.escapeHtml(gitBlameData.lines[0].date)}): "${this.escapeHtml(gitBlameData.lines[0].commitMsg)}"
              </div>
              <button
                type="button"
                class="visitor-blame-btn"
                id="btn-broadcast-exhibit-blame"
                data-commit-hash="${this.escapeHtml(gitBlameData.lines[0].hash)}"
                data-commit-msg="${this.escapeHtml(gitBlameData.lines[0].commitMsg)}"
                data-file-path="${this.escapeHtml(gitBlameData.filePath)}"
              >
                🎯 Broadcast Commit Blame in 3D
              </button>
            </div>
          </div>
        `
        : '';

      bodyEl.innerHTML = `
        ${heroVisual}
        <p class="dialog-lead">${p.shortDesc}</p>
        <div class="tech-pill-list">${techBadges}</div>

        <div class="case-study-grid">
          <div class="case-study-box">
            <h4>The Problem</h4>
            <p>${p.caseStudy.problem}</p>
          </div>
          <div class="case-study-box">
            <h4>Engineering Architecture</h4>
            <p>${p.caseStudy.engineering}</p>
          </div>
          <div class="case-study-box full-width">
            <h4>Key Features Delivered</h4>
            <ul>${featuresList}</ul>
          </div>
        </div>

        ${gitBlameHtml}

        <div class="exhibit-links-row">
          ${
            p.liveDemoUrl
              ? `<a href="${p.liveDemoUrl}" target="_blank" rel="noopener noreferrer" class="primary-action-btn">🚀 Launch Live Demo ↗</a>`
              : ''
          }
          <a href="${p.sourceCodeUrl}" target="_blank" rel="noopener noreferrer" class="secondary-action-btn">
            💻 View GitHub Source ↗
          </a>
          ${
            p.docsUrl
              ? `<a href="${p.docsUrl}" target="_blank" rel="noopener noreferrer" class="secondary-action-btn">📖 Documentation ↗</a>`
              : ''
          }
        </div>
      `;

      if (gitBlameData) {
        const detailEl = document.getElementById('git-blame-commit-detail');
        const broadcastBtn = document.getElementById(
          'btn-broadcast-exhibit-blame'
        ) as HTMLButtonElement | null;

        bodyEl.querySelectorAll<HTMLButtonElement>('.git-blame-row').forEach((rowBtn) => {
          rowBtn.addEventListener('click', () => {
            const idx = Number(rowBtn.dataset.lineIdx || 0);
            const line = gitBlameData.lines[idx];
            if (!line) return;

            bodyEl
              .querySelectorAll('.git-blame-row')
              .forEach((r) => r.classList.remove('active'));
            rowBtn.classList.add('active');
            this.sfx.playChime(500, 740);

            if (detailEl) {
              detailEl.innerHTML = `Commit <strong>${this.escapeHtml(line.hash)}</strong> (${this.escapeHtml(line.date)}): "${this.escapeHtml(line.commitMsg)}"`;
            }
            if (broadcastBtn) {
              broadcastBtn.dataset.commitHash = line.hash;
              broadcastBtn.dataset.commitMsg = line.commitMsg;
            }
          });
        });

        broadcastBtn?.addEventListener('click', () => {
          const hash = broadcastBtn.dataset.commitHash || 'a4f91c2';
          const msg = broadcastBtn.dataset.commitMsg || '';
          this.exhibitDialog.close();
          this.triggerBlameOnTarget(
            'pyaebot',
            'PyaeBot (AI Guide)',
            `[${p.title} @ ${hash}] ${msg}`
          );
        });
      }
    } else if (target.kind === 'profile') {
      this.sfx.playChime(520, 760);
      eyebrowEl.textContent = 'GRAND ROTUNDA • CURATOR PROFILE';
      titleEl.textContent = `${PROFILE_DATA.fullName} — ${PROFILE_DATA.title}`;
      bodyEl.innerHTML = `
        <p class="dialog-lead">${PROFILE_DATA.aboutBio}</p>
        <div class="case-study-grid">
          <div class="case-study-box">
            <h4>Location &amp; Focus</h4>
            <p>${PROFILE_DATA.location} • Full-Stack Web, REST APIs &amp; Flutter Mobile</p>
          </div>
          <div class="case-study-box">
            <h4>Education</h4>
            <p>${PROFILE_DATA.educationSummary}</p>
          </div>
        </div>
        <div class="exhibit-links-row">
          <a href="${PROFILE_DATA.contact.resumeDownload}" target="_blank" rel="noopener noreferrer" class="primary-action-btn">
            ⬇ Download CV / Resume
          </a>
          <a href="${PROFILE_DATA.contact.resumeView}" target="_blank" rel="noopener noreferrer" class="secondary-action-btn">
            📄 View Resume Online ↗
          </a>
          <a href="${PROFILE_DATA.contact.github}" target="_blank" rel="noopener noreferrer" class="secondary-action-btn">
            GitHub (@pyaephyo11979) ↗
          </a>
          <a href="${PROFILE_DATA.contact.linkedin}" target="_blank" rel="noopener noreferrer" class="secondary-action-btn">
            LinkedIn ↗
          </a>
          <a href="mailto:${PROFILE_DATA.contact.email}" class="secondary-action-btn">
            ✉ ${PROFILE_DATA.contact.email}
          </a>
        </div>
      `;
    } else if (target.kind === 'skill' && target.skillData) {
      const s = target.skillData;
      this.sfx.playChime(500, 740);
      eyebrowEl.textContent = `EAST WING • TECH ARSENAL MONUMENT`;
      titleEl.textContent = `${s.iconSymbol} ${s.category}`;
      bodyEl.innerHTML = `
        <p class="dialog-lead">${s.subtitle}</p>
        <div class="tech-pill-list">
          ${s.skills.map((sk) => `<span class="tech-pill">${sk}</span>`).join('')}
        </div>
      `;
    } else if (target.kind === 'experience' && target.experienceData) {
      const ex = target.experienceData;
      this.sfx.playChime(500, 740);
      eyebrowEl.textContent = `WEST WING • ${ex.type.toUpperCase()}`;
      titleEl.textContent = `${ex.role} — ${ex.organization}`;
      bodyEl.innerHTML = `
        <p class="dialog-lead"><strong>${ex.period}</strong> — ${ex.summary}</p>
        <div class="case-study-box full-width">
          <h4>Highlights &amp; Impact</h4>
          <ul>${ex.highlights.map((h) => `<li>${h}</li>`).join('')}</ul>
        </div>
        ${
          ex.website
            ? `<div class="exhibit-links-row">
                <a href="${ex.website}" target="_blank" rel="noopener noreferrer" class="primary-action-btn">Visit Organization Website ↗</a>
              </div>`
            : ''
        }
      `;
    } else if (target.kind === 'contact' && target.contactAction) {
      this.sfx.playChime(540, 820);
      eyebrowEl.textContent = 'SOUTH WING • DIRECT CONNECTION PORTAL';
      titleEl.textContent = target.title;
      bodyEl.innerHTML = `
        <p class="dialog-lead">${target.subtitle}</p>
        <div class="exhibit-links-row">
          <a href="${target.contactAction.url}" target="_blank" rel="noopener noreferrer" class="primary-action-btn">
            Open ${target.contactAction.label} ↗
          </a>
          <a href="mailto:${PROFILE_DATA.contact.email}" class="secondary-action-btn">
            Email: ${PROFILE_DATA.contact.email}
          </a>
          <a href="tel:${PROFILE_DATA.contact.phone.replace(/\s+/g, '')}" class="secondary-action-btn">
            Call: ${PROFILE_DATA.contact.phone}
          </a>
        </div>
      `;
    }

    this.exhibitDialog.showModal();
  }

  private updatePassportUI(): void {
    const count = this.stampedProjects.size;
    const total = PROJECT_EXHIBITS.length;

    const counterText = document.getElementById('passport-counter-text');
    if (counterText) {
      counterText.textContent = `${count} / ${total} Stamped`;
    }

    const summaryEl = document.getElementById('passport-progress-summary');
    if (summaryEl) {
      summaryEl.textContent =
        count === total
          ? `🎉 Congratulations! You have inspected all ${total} exhibits in Pyae Phyo Hlaing's 3D Museum!`
          : `You have collected ${count} of ${total} Exhibit Stamps. Tap any project card below to teleport directly to its 3D pedestal:`;
    }

    const grid = document.getElementById('passport-grid-container');
    if (!grid) return;

    grid.innerHTML = PROJECT_EXHIBITS.map((proj) => {
      const isStamped = this.stampedProjects.has(proj.id);
      return `
        <button
          type="button"
          class="passport-card ${isStamped ? 'stamped' : ''}"
          data-proj-id="${proj.id}"
        >
          <span class="passport-status">
            ${isStamped ? '✓ STAMPED' : `EXHIBIT #${proj.number} • TAP TO VISIT`}
          </span>
          <strong style="color:#fff;font-size:0.95rem">${proj.title}</strong>
          <span style="color:#94a3b8;font-size:0.75rem">${proj.category} • ${proj.techStack.slice(0, 2).join(', ')}</span>
        </button>
      `;
    }).join('');

    grid.querySelectorAll<HTMLButtonElement>('.passport-card').forEach((card) => {
      card.addEventListener('click', () => {
        const projId = card.dataset.projId;
        const proj = PROJECT_EXHIBITS.find((p) => p.id === projId);
        if (!proj) return;
        this.passportDialog.close();
        const standX = proj.position.x < 0 ? -8.8 : 8.8;
        this.player.teleportTo(standX, proj.position.z, proj.position.x, proj.position.z);
        this.sfx.playChime(500, 760);
      });
    });
  }

  private renderGuestbook(): void {
    const list = document.getElementById('guestbook-entries-list');
    if (!list) return;

    if (this.guestbookEntries.length === 0) {
      list.innerHTML = `
        <div class="guestbook-entry">
          <span style="color:#94a3b8">No guestbook notes yet — be the first live visitor to sign the wall!</span>
        </div>
      `;
      return;
    }

    list.innerHTML = this.guestbookEntries
      .map(
        (entry) => `
        <div class="guestbook-entry">
          <div>
            <strong style="color:#60a5fa">${entry.author}</strong>
            <span style="color:#cbd5e1"> — "${entry.message}"</span>
          </div>
          <span style="color:#64748b;font-size:0.72rem;white-space:nowrap">${entry.timeLabel}</span>
        </div>
      `
      )
      .join('');
  }

  public updateRadarMinimap(): void {
    this.renderAvatarPreview();

    const ctx = this.minimapCtx;
    if (!ctx) return;

    const w = 176;
    const h = 176;
    ctx.clearRect(0, 0, w, h);

    const toMapX = (wx: number) => ((wx + 48) / 96) * w;
    const toMapY = (wz: number) => h - ((wz + 36) / 108) * h;

    // Botanical Park Greenery Background
    ctx.fillStyle = 'rgba(21, 128, 61, 0.38)';
    ctx.fillRect(0, 0, w, h);

    // West & East Reflecting Ponds
    ctx.fillStyle = 'rgba(14, 165, 233, 0.55)';
    ctx.beginPath();
    ctx.arc(toMapX(-34), toMapY(36), 14, 0, Math.PI * 2);
    ctx.arc(toMapX(34), toMapY(36), 14, 0, Math.PI * 2);
    ctx.fill();

    // Stone Pavilion & Promenade Terraces
    ctx.fillStyle = 'rgba(226, 232, 240, 0.35)';
    ctx.fillRect(toMapX(-18), toMapY(68), (36 / 96) * w, (54 / 108) * h);
    ctx.fillRect(toMapX(-42), toMapY(12), (84 / 96) * w, (24 / 108) * h);
    ctx.fillRect(toMapX(-14), toMapY(0), (28 / 96) * w, (32 / 108) * h);

    ctx.strokeStyle = 'rgba(0, 102, 255, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(toMapX(0), toMapY(0), 14, 0, Math.PI * 2);
    ctx.stroke();

    for (const proj of PROJECT_EXHIBITS) {
      const px = toMapX(proj.position.x);
      const py = toMapY(proj.position.z);
      const isStamped = this.stampedProjects.has(proj.id);
      ctx.fillStyle = isStamped ? '#10B981' : '#38BDF8';
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Live Remote Visitors on Radar Minimap
    for (const peer of this.multiplayer.peers.values()) {
      ctx.fillStyle = peer.state.config.primaryColor || '#38BDF8';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(toMapX(peer.currentPos.x), toMapY(peer.currentPos.z), 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // PyaeBot Roaming AI Guide Marker on Radar Minimap
    ctx.fillStyle = '#10B981';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(
      toMapX(this.museum.helpBotPosition.x),
      toMapY(this.museum.helpBotPosition.z),
      4,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    const plX = toMapX(this.player.position.x);
    const plY = toMapY(this.player.position.z);

    ctx.save();
    ctx.translate(plX, plY);
    ctx.rotate(this.player.rotationY);
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4.5, 5);
    ctx.lineTo(-4.5, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    const zoneLabel = document.getElementById('player-zone-label');
    if (zoneLabel) {
      const z = this.player.position.z;
      const x = this.player.position.x;
      if (z > 15) zoneLabel.textContent = 'North Project Wing';
      else if (z < -12) zoneLabel.textContent = 'South Contact Lounge';
      else if (x > 16) zoneLabel.textContent = 'East Skills Wing';
      else if (x < -16) zoneLabel.textContent = 'West Experience Wing';
      else zoneLabel.textContent = 'Grand Rotunda';
    }
  }

  private initHelpBotUI(): void {
    const chipsContainer = document.getElementById('helpbot-qa-chips');
    if (chipsContainer) {
      chipsContainer.innerHTML = PRESERVED_QAS.map(
        (qa) => `
          <button
            type="button"
            class="qa-chip-btn"
            data-qa-id="${qa.id}"
            title="${qa.question}"
          >
            ${qa.chipLabel}
          </button>
        `
      ).join('');

      chipsContainer.querySelectorAll<HTMLButtonElement>('.qa-chip-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const qaId = btn.dataset.qaId;
          if (!qaId) return;
          const preserved = this.helpBotService.getPreservedById(qaId);
          if (!preserved) return;

          this.sfx.playChime(500, 740);
          this.appendUserMessage(preserved.qa.question);
          this.appendBotMessage(preserved.reply, preserved.qa.question);
          this.museum.updateHelpBotSpeech(preserved.reply.botThought);
        });
      });
    }

    // Teleport to 3D Help Bot NPC's current live position in the exhibition
    document.getElementById('btn-teleport-helpbot')?.addEventListener('click', () => {
      this.helpBotDialog.close();
      const botPos = this.museum.helpBotPosition;
      this.player.teleportTo(botPos.x, botPos.z - 1.9, botPos.x, botPos.z);
      this.sfx.playChime(520, 780);
    });

    // Clear / Reset Chat
    document.getElementById('btn-clear-helpbot')?.addEventListener('click', () => {
      this.helpBotService.clearConversation();
      this.renderWelcomeBotMessage();
      this.sfx.playChime(440, 620);
    });

    // Custom Question Submit (uses Google AI Studio API if key is set, else Preserved Q&A Engine)
    const chatForm = document.getElementById('helpbot-chat-form') as HTMLFormElement | null;
    const questionInput = document.getElementById('helpbot-question-input') as HTMLInputElement | null;
    const sendBtn = document.getElementById('btn-send-helpbot') as HTMLButtonElement | null;

    chatForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const query = questionInput?.value.trim();
      if (!query) return;

      if (questionInput) questionInput.value = '';
      this.appendUserMessage(query);
      this.sfx.playChime(480, 680);

      if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.textContent = 'Thinking...';
      }

      const loadingEl = this.appendLoadingMessage();
      try {
        const reply = await this.helpBotService.askQuestion(query);
        loadingEl.remove();
        this.appendBotMessage(reply, query);
        this.museum.updateHelpBotSpeech(reply.botThought);
        this.sfx.playChime(540, 800);
      } finally {
        if (sendBtn) {
          sendBtn.disabled = false;
          sendBtn.textContent = 'Ask AI →';
        }
      }
    });

    this.syncHelpBotKeyStatus();
    this.renderWelcomeBotMessage();
  }

  private syncHelpBotKeyStatus(): void {
    const statusPill = document.getElementById('helpbot-status-pill');
    const hasKey = this.helpBotService.hasApiKey();

    if (statusPill) {
      if (hasKey) {
        statusPill.textContent = '🟢 Google AI Studio (Gemini 3.8 Flash)';
        statusPill.classList.add('live-gemini');
      } else {
        statusPill.textContent = '⚡ Preserved Portfolio Q&A';
        statusPill.classList.remove('live-gemini');
      }
    }
  }

  private renderWelcomeBotMessage(): void {
    const log = document.getElementById('helpbot-chat-log');
    if (!log) return;
    log.innerHTML = '';

    this.appendBotMessage({
      answer:
        `Hello! I am PyaeBot 🤖, your 3D AI Museum Concierge in the Grand Rotunda.\n` +
        `• Tap any Preserved Q&A chip above for instant answers on Pyae Phyo Hlaing's projects, tech stack, internships, or CS education.\n` +
        `• Or type any question below to ask about Pyae's engineering work and 3D museum exhibits!`,
      source: 'preserved-qa',
      botThought: 'Hi! Ask me anything about Pyae’s projects or CV! 🤖'
    });
  }

  private appendUserMessage(text: string): void {
    const log = document.getElementById('helpbot-chat-log');
    if (!log) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg user';

    const meta = document.createElement('div');
    meta.className = 'chat-msg-meta';
    meta.textContent = `${this.customConfig.displayName} (${this.customConfig.badgeText})`;

    const body = document.createElement('div');
    body.className = 'chat-msg-text';
    body.textContent = text;

    msgDiv.append(meta, body);
    log.appendChild(msgDiv);
    log.scrollTop = log.scrollHeight;
  }

  private appendLoadingMessage(): HTMLElement {
    const log = document.getElementById('helpbot-chat-log');
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg bot';
    msgDiv.innerHTML = `
      <div class="chat-msg-meta">
        <span>🤖 PyaeBot (AI Guide)</span>
        <span class="chat-source-tag gemini">✨ Querying Google AI Studio...</span>
      </div>
      <div class="chat-msg-text">Synthesizing response from PyaeFolio knowledge base...</div>
    `;
    log?.appendChild(msgDiv);
    if (log) log.scrollTop = log.scrollHeight;
    return msgDiv;
  }

  private appendBotMessage(reply: HelpBotReply, originalQuestion?: string): void {
    const log = document.getElementById('helpbot-chat-log');
    if (!log) return;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg bot';

    const meta = document.createElement('div');
    meta.className = 'chat-msg-meta';

    const senderSpan = document.createElement('span');
    senderSpan.textContent = '🤖 PyaeBot (AI Guide)';

    const sourceSpan = document.createElement('span');
    sourceSpan.className = `chat-source-tag ${reply.source === 'gemini-api' ? 'gemini' : ''}`;
    sourceSpan.textContent =
      reply.source === 'gemini-api'
        ? reply.modelUsed === 'gemini-3.5-flash-lite'
          ? '✨ Google AI Studio • Gemini 3.5 Flash-Lite (429 Fallback)'
          : '✨ Google AI Studio • Gemini 3.8 Flash'
        : '⚡ Preserved Portfolio Q&A';

    meta.append(senderSpan, sourceSpan);
    msgDiv.appendChild(meta);

    if (reply.errorNote) {
      const errDiv = document.createElement('div');
      errDiv.className = 'chat-error-note';
      errDiv.textContent = reply.errorNote;
      msgDiv.appendChild(errDiv);
    }

    const body = document.createElement('div');
    body.className = 'chat-msg-text';
    body.textContent = reply.answer;
    msgDiv.appendChild(body);

    const actionsRow = document.createElement('div');
    actionsRow.style.display = 'flex';
    actionsRow.style.flexWrap = 'wrap';
    actionsRow.style.gap = '6px';

    if (reply.action) {
      const actBtn = document.createElement('button');
      actBtn.type = 'button';
      actBtn.className = 'chat-action-btn';
      actBtn.textContent = reply.action.label;
      actBtn.addEventListener('click', () => this.executeHelpBotAction(reply.action!));
      actionsRow.appendChild(actBtn);
    }

    // If this was an instant Preserved Q&A and the user has a Google AI Studio API Key,
    // offer a 1-click button to generate a custom Gemini 3.8 Flash deep-dive on it!
    if (reply.source === 'preserved-qa' && originalQuestion && this.helpBotService.hasApiKey()) {
      const askLiveBtn = document.createElement('button');
      askLiveBtn.type = 'button';
      askLiveBtn.className = 'chat-action-btn';
      askLiveBtn.textContent = '✨ Deep-Dive with Gemini AI';
      askLiveBtn.addEventListener('click', async () => {
        askLiveBtn.disabled = true;
        askLiveBtn.textContent = '✨ Asking Gemini...';
        const loadingEl = this.appendLoadingMessage();
        const liveReply = await this.helpBotService.askQuestion(originalQuestion);
        loadingEl.remove();
        askLiveBtn.remove();
        this.appendBotMessage(liveReply);
        this.museum.updateHelpBotSpeech(liveReply.botThought);
      });
      actionsRow.appendChild(askLiveBtn);
    }

    if (actionsRow.childElementCount > 0) {
      msgDiv.appendChild(actionsRow);
    }

    log.appendChild(msgDiv);
    log.scrollTop = log.scrollHeight;
  }

  private executeHelpBotAction(action: PreservedQAAction): void {
    if (action.type === 'external-link' && action.url) {
      window.open(action.url, '_blank', 'noopener,noreferrer');
      return;
    }

    if (action.type === 'teleport-wing' && action.targetId) {
      const wing = MUSEUM_WINGS.find((w) => w.id === action.targetId);
      if (wing) {
        this.helpBotDialog.close();
        this.player.teleportTo(wing.x, wing.z, wing.lookAtX, wing.lookAtZ);
        this.sfx.playChime(500, 760);
      }
      return;
    }

    if (action.type === 'teleport-project' && action.targetId) {
      const proj = PROJECT_EXHIBITS.find((p) => p.id === action.targetId);
      if (proj) {
        this.helpBotDialog.close();
        const standX = proj.position.x < 0 ? -8.8 : 8.8;
        this.player.teleportTo(standX, proj.position.z, proj.position.x, proj.position.z);
        this.sfx.playChime(520, 780);
      }
    }
  }

  private initLiveVisitorsUI(): void {
    document.getElementById('btn-open-live-visitors')?.addEventListener('click', () => {
      this.sfx.playChime(520, 760);
      this.renderLiveVisitorsRoster();
      this.renderLiveChatFeed();
      this.liveVisitorsDialog.showModal();
    });

    // Populate Blame Reason Select
    const blameSelect = document.getElementById('blame-reason-select') as HTMLSelectElement | null;
    if (blameSelect) {
      blameSelect.innerHTML = BLAME_PRESET_REASONS.map(
        (reason) => `<option value="${this.escapeHtml(reason)}">${this.escapeHtml(reason)}</option>`
      ).join('');
    }

    // Quick Overhead Emote Chips
    const emoteContainer = document.getElementById('live-emote-chips');
    if (emoteContainer) {
      emoteContainer.innerHTML = LIVE_CHAT_EMOTES.map(
        (emote) => `
          <button type="button" class="qa-chip-btn live-emote-btn" data-emote="${emote}">
            ${emote}
          </button>
        `
      ).join('');

      emoteContainer.querySelectorAll<HTMLButtonElement>('.live-emote-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const text = btn.dataset.emote;
          if (!text) return;
          this.multiplayer.sendLiveChat(text);
          this.renderLiveVisitorsRoster();
          this.renderLiveChatFeed();
          this.sfx.playChime(500, 740);
        });
      });
    }

    // Live Chat Broadcast Form
    const liveChatForm = document.getElementById('live-chat-form') as HTMLFormElement | null;
    const liveChatInput = document.getElementById('live-chat-input') as HTMLInputElement | null;
    liveChatForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = liveChatInput?.value.trim();
      if (!msg) return;
      if (liveChatInput) liveChatInput.value = '';
      this.multiplayer.sendLiveChat(msg);
      this.renderLiveVisitorsRoster();
      this.renderLiveChatFeed();
      this.sfx.playStampCollected();
    });

    // Subscribe to real-time peer join/leave/move, chat, & blame events
    this.multiplayer.setCallbacks(
      () => {
        this.renderLiveVisitorsRoster();
      },
      () => {
        this.renderLiveChatFeed();
        this.renderLiveVisitorsRoster();
        this.sfx.playChime(480, 680);
      },
      (blameEntry) => {
        this.handleIncomingBlameEvent(blameEntry);
      }
    );

    this.renderLiveVisitorsRoster();
    this.renderLiveChatFeed();
  }

  private getSelectedBlameReason(): string {
    const blameSelect = document.getElementById('blame-reason-select') as HTMLSelectElement | null;
    if (blameSelect && blameSelect.value) {
      return blameSelect.value;
    }
    return BLAME_PRESET_REASONS[Math.floor(Math.random() * BLAME_PRESET_REASONS.length)];
  }

  private handleQuickHudBlame(): void {
    // Find nearest remote visitor or PyaeBot
    let nearestPeerId = 'pyaebot';
    let nearestName = 'PyaeBot (AI Guide)';
    let minDist = Math.hypot(
      this.museum.helpBotPosition.x - this.player.position.x,
      this.museum.helpBotPosition.z - this.player.position.z
    );

    for (const [peerId, peer] of this.multiplayer.peers.entries()) {
      const d = Math.hypot(
        peer.currentPos.x - this.player.position.x,
        peer.currentPos.z - this.player.position.z
      );
      if (d < minDist) {
        minDist = d;
        nearestPeerId = peerId;
        nearestName = peer.state.config.displayName;
      }
    }

    const randomReason =
      BLAME_PRESET_REASONS[Math.floor(Math.random() * BLAME_PRESET_REASONS.length)];
    this.triggerBlameOnTarget(nearestPeerId, nearestName, randomReason);
  }

  public triggerBlameOnTarget(
    targetPeerId: string,
    targetName: string,
    customReason?: string
  ): void {
    const reason = customReason || this.getSelectedBlameReason();
    const blameEntry = this.multiplayer.sendBlame(targetPeerId, targetName, reason);

    // Determine 3D target position
    const targetPos =
      targetPeerId === 'pyaebot'
        ? this.museum.helpBotPosition.clone()
        : this.multiplayer.peers.get(targetPeerId)?.currentPos.clone() ||
          this.museum.helpBotPosition.clone();

    // Spawn 3D laser beam + expanding ring around blamed character
    this.multiplayer.spawn3DBlameEffect(this.player.position, targetPos, '#ef4444');
    this.sfx.playBlameAlert();

    // If PyaeBot was blamed, make PyaeBot respond with a witty comeback in 3D!
    if (targetPeerId === 'pyaebot') {
      const comeback =
        PYAEBOT_BLAME_COMEBACKS[Math.floor(Math.random() * PYAEBOT_BLAME_COMEBACKS.length)];
      this.museum.updateHelpBotSpeech(comeback);
    }

    this.showBlameToastBanner(
      `${blameEntry.fromName} blamed ${blameEntry.targetName} — "${blameEntry.reason}"`
    );
    this.renderLiveVisitorsRoster();
    this.renderLiveChatFeed();
  }

  private handleIncomingBlameEvent(blame: BlameEventEntry): void {
    const fromPeer = this.multiplayer.peers.get(blame.fromPeerId);
    const fromPos = fromPeer ? fromPeer.currentPos : this.museum.helpBotPosition;

    let targetPos = this.museum.helpBotPosition;
    if (blame.targetPeerId === this.multiplayer.peerId) {
      targetPos = this.player.position;
    } else if (blame.targetPeerId !== 'pyaebot') {
      const targetPeer = this.multiplayer.peers.get(blame.targetPeerId);
      if (targetPeer) targetPos = targetPeer.currentPos;
    }

    this.multiplayer.spawn3DBlameEffect(fromPos, targetPos, '#ef4444');
    this.sfx.playBlameAlert();

    if (blame.targetPeerId === 'pyaebot') {
      const comeback =
        PYAEBOT_BLAME_COMEBACKS[Math.floor(Math.random() * PYAEBOT_BLAME_COMEBACKS.length)];
      this.museum.updateHelpBotSpeech(comeback);
    } else if (blame.targetPeerId === this.multiplayer.peerId) {
      this.player.setThoughtBubble(`😱 Blamed by ${blame.fromName}: "${blame.reason}"`);
    }

    this.showBlameToastBanner(
      `${blame.fromName} blamed ${blame.targetName} — "${blame.reason}"`
    );
    this.renderLiveVisitorsRoster();
    this.renderLiveChatFeed();
  }

  private showBlameToastBanner(text: string): void {
    const banner = document.getElementById('blame-toast-banner');
    const textEl = document.getElementById('blame-toast-text');
    if (!banner || !textEl) return;

    textEl.textContent = text;
    banner.classList.remove('hidden');

    if (this.blameToastTimeout !== null) {
      window.clearTimeout(this.blameToastTimeout);
    }
    this.blameToastTimeout = window.setTimeout(() => {
      banner.classList.add('hidden');
    }, 4500);
  }

  private renderLiveVisitorsRoster(): void {
    const count = this.multiplayer.getOnlineCount();
    const countPill = document.getElementById('live-visitors-count');
    if (countPill) {
      countPill.textContent = `${count} Online`;
    }

    const heading = document.getElementById('live-roster-heading');
    if (heading) {
      heading.textContent = `🟢 Currently Exploring (${count} Live ${count === 1 ? 'Visitor' : 'Visitors'} + 🤖 PyaeBot)`;
    }

    const grid = document.getElementById('live-visitors-grid');
    if (!grid) return;

    const myZone = this.multiplayer.computeZoneName(
      this.player.position.x,
      this.player.position.z
    );

    const botZone = this.multiplayer.computeZoneName(
      this.museum.helpBotPosition.x,
      this.museum.helpBotPosition.z
    );

    const selfCardHtml = `
      <div class="live-visitor-card is-self">
        <div class="live-visitor-top">
          <div class="live-visitor-identity">
            <span class="visitor-color-dot" style="background:${this.customConfig.primaryColor}"></span>
            <strong style="color:#fff;font-size:0.86rem">${this.escapeHtml(this.customConfig.displayName)} (You)</strong>
          </div>
          <span class="visitor-role-tag">${this.escapeHtml(this.customConfig.badgeText)}</span>
        </div>
        <div class="visitor-thought-preview">"${this.escapeHtml(this.player.currentThought)}"</div>
        <div class="visitor-zone-row">
          <span>📍 ${myZone}</span>
          <span style="color:#38bdf8;font-weight:700">Active</span>
        </div>
      </div>
    `;

    const botCardHtml = `
      <div class="live-visitor-card">
        <div class="live-visitor-top">
          <div class="live-visitor-identity">
            <span class="visitor-color-dot" style="background:#10B981"></span>
            <strong style="color:#fff;font-size:0.86rem">🤖 PyaeBot (AI Guide)</strong>
          </div>
          <span class="visitor-role-tag">AI GUIDE BOT</span>
        </div>
        <div class="visitor-thought-preview">"Touring museum exhibits &amp; answering Q&amp;As"</div>
        <div class="visitor-zone-row">
          <span>📍 ${botZone}</span>
          <div class="visitor-card-actions">
            <button
              type="button"
              class="visitor-blame-btn btn-blame-peer"
              data-peer-id="pyaebot"
              data-peer-name="PyaeBot (AI Guide)"
            >
              🎯 Blame
            </button>
            <button
              type="button"
              class="chat-action-btn btn-teleport-peer"
              data-peer-id="pyaebot"
            >
              Teleport →
            </button>
          </div>
        </div>
      </div>
    `;

    const remoteVisitors = this.multiplayer.getRemoteVisitors();
    const remoteCardsHtml = remoteVisitors
      .map(
        (v) => `
        <div class="live-visitor-card">
          <div class="live-visitor-top">
            <div class="live-visitor-identity">
              <span class="visitor-color-dot" style="background:${v.config.primaryColor || '#38BDF8'}"></span>
              <strong style="color:#fff;font-size:0.86rem">${this.escapeHtml(v.config.displayName)}</strong>
            </div>
            <span class="visitor-role-tag">${this.escapeHtml(v.config.badgeText)}</span>
          </div>
          <div class="visitor-thought-preview">"${this.escapeHtml(v.thoughtBubble || 'Exploring museum')}"</div>
          <div class="visitor-zone-row">
            <span>📍 ${this.escapeHtml(v.zone || 'Grand Rotunda')}</span>
            <div class="visitor-card-actions">
              <button
                type="button"
                class="visitor-blame-btn btn-blame-peer"
                data-peer-id="${this.escapeHtml(v.peerId)}"
                data-peer-name="${this.escapeHtml(v.config.displayName)}"
              >
                🎯 Blame
              </button>
              <button
                type="button"
                class="chat-action-btn btn-teleport-peer"
                data-peer-id="${this.escapeHtml(v.peerId)}"
              >
                Teleport →
              </button>
            </div>
          </div>
        </div>
      `
      )
      .join('');

    grid.innerHTML = selfCardHtml + botCardHtml + remoteCardsHtml;

    grid.querySelectorAll<HTMLButtonElement>('.btn-teleport-peer').forEach((btn) => {
      btn.addEventListener('click', () => {
        const peerId = btn.dataset.peerId;
        if (!peerId) return;
        if (peerId === 'pyaebot') {
          this.liveVisitorsDialog.close();
          const botPos = this.museum.helpBotPosition;
          this.player.teleportTo(botPos.x, botPos.z - 1.9, botPos.x, botPos.z);
          this.sfx.playChime(520, 780);
          return;
        }
        const peer = this.multiplayer.peers.get(peerId);
        if (!peer) return;
        this.liveVisitorsDialog.close();
        this.player.teleportTo(
          peer.currentPos.x + 1.4,
          peer.currentPos.z - 1.4,
          peer.currentPos.x,
          peer.currentPos.z
        );
        this.sfx.playChime(520, 780);
      });
    });

    grid.querySelectorAll<HTMLButtonElement>('.btn-blame-peer').forEach((btn) => {
      btn.addEventListener('click', () => {
        const peerId = btn.dataset.peerId;
        const peerName = btn.dataset.peerName || 'Museum Visitor';
        if (!peerId) return;
        this.liveVisitorsDialog.close();
        this.triggerBlameOnTarget(peerId, peerName);
      });
    });
  }

  private renderLiveChatFeed(): void {
    const feed = document.getElementById('live-chat-feed');
    if (!feed) return;

    const chats = this.multiplayer.chatHistory.map((c) => ({
      kind: 'chat' as const,
      timestamp: c.timestamp,
      html: `
        <div class="guestbook-entry">
          <div>
            <strong style="color:${c.primaryColor || '#60a5fa'}">${this.escapeHtml(c.author)}</strong>
            <span style="color:#94a3b8;font-size:0.7rem">[${this.escapeHtml(c.badgeText)}]</span>
            <span style="color:#f1f5f9"> — "${this.escapeHtml(c.message)}"</span>
          </div>
        </div>
      `
    }));

    const blames = this.multiplayer.blameHistory.map((b) => ({
      kind: 'blame' as const,
      timestamp: b.timestamp,
      html: `
        <div class="guestbook-entry" style="border-left:3px solid #ef4444;padding-left:8px">
          <div>
            <strong style="color:#f87171">🎯 GIT BLAME:</strong>
            <strong style="color:#fbbf24">${this.escapeHtml(b.fromName)}</strong>
            <span style="color:#cbd5e1"> blamed </span>
            <strong style="color:#38bdf8">${this.escapeHtml(b.targetName)}</strong>
            <span style="color:#f1f5f9"> — "${this.escapeHtml(b.reason)}"</span>
          </div>
        </div>
      `
    }));

    const combined = [...chats, ...blames].sort((a, b) => a.timestamp - b.timestamp).slice(-30);

    if (combined.length === 0) {
      feed.innerHTML = `
        <div style="color:#94a3b8;font-size:0.78rem">
          No live broadcasts or git blames yet. Tap 🎯 Blame on a visitor/bot or broadcast a message below!
        </div>
      `;
      return;
    }

    feed.innerHTML = combined.map((item) => item.html).join('');
    feed.scrollTop = feed.scrollHeight;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
