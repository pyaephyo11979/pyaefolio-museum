import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, Vector3 } from '@babylonjs/core';
import { CharacterCustomizationConfig } from '../data/portfolioData';
import { ArticulatedCharacterRig, CharacterBuilder } from '../entities/CharacterBuilder';
import { PlayerController } from '../entities/PlayerController';

export interface LiveVisitorState {
  peerId: string;
  x: number;
  z: number;
  jumpOffset: number;
  rotationY: number;
  isMoving: boolean;
  isSprinting: boolean;
  config: CharacterCustomizationConfig;
  configSig: string;
  thoughtBubble: string;
  zone: string;
  lastSeen: number;
}

export interface LiveChatEntry {
  id: string;
  peerId: string;
  author: string;
  badgeText: string;
  primaryColor: string;
  message: string;
  timestamp: number;
}

export interface BlameEventEntry {
  id: string;
  fromPeerId: string;
  fromName: string;
  targetPeerId: string;
  targetName: string;
  reason: string;
  timestamp: number;
}

interface ActiveBlame3DFX {
  ring: Mesh;
  beacon: Mesh;
  beam: Mesh;
  mat: StandardMaterial;
  elapsed: number;
  duration: number;
}

export interface RemoteVisitorPeer {
  state: LiveVisitorState;
  rig: ArticulatedCharacterRig;
  currentPos: Vector3;
  targetPos: Vector3;
  currentRotY: number;
  targetRotY: number;
}

const CHANNEL_NAME = 'pyaefolio_museum_live_v1';

export class MultiplayerManager {
  public readonly peerId: string;
  public peers = new Map<string, RemoteVisitorPeer>();
  public chatHistory: LiveChatEntry[] = [];
  public blameHistory: BlameEventEntry[] = [];

  private channel: BroadcastChannel | null = null;
  private eventSource: EventSource | null = null;
  private serverAvailable = false;
  private activeBlameFX: ActiveBlame3DFX[] = [];

  private syncAccumulator = 0;
  private heartbeatAccumulator = 0;
  private lastSentX = 0;
  private lastSentZ = 0;
  private lastSentRot = 0;
  private lastSentMoving = false;
  private lastSentConfigSig = '';
  private lastSentThought = '';

  private onVisitorsChangedCallback?: () => void;
  private onChatReceivedCallback?: (entry: LiveChatEntry) => void;
  private onBlameReceivedCallback?: (entry: BlameEventEntry) => void;

  constructor(
    private scene: Scene,
    private player: PlayerController
  ) {
    this.peerId = `visitor-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

    this.setupBroadcastChannel();
    this.setupServerStream();
    this.setupUnloadCleanup();

    this.scene.onBeforeRenderObservable.add(() => this.update());

    // Initial announce after a brief tick so player config is loaded
    setTimeout(() => {
      this.broadcastLocalState(true);
      this.channel?.postMessage({ type: 'request-sync', peerId: this.peerId });
    }, 120);
  }

  public setCallbacks(
    onVisitorsChanged: () => void,
    onChatReceived: (entry: LiveChatEntry) => void,
    onBlameReceived?: (entry: BlameEventEntry) => void
  ): void {
    this.onVisitorsChangedCallback = onVisitorsChanged;
    this.onChatReceivedCallback = onChatReceived;
    this.onBlameReceivedCallback = onBlameReceived;
  }

  public getRemotePositions(): Vector3[] {
    const list: Vector3[] = [];
    for (const peer of this.peers.values()) {
      list.push(peer.currentPos);
    }
    return list;
  }

  public getOnlineCount(): number {
    return 1 + this.peers.size;
  }

  public getRemoteVisitors(): LiveVisitorState[] {
    return Array.from(this.peers.values()).map((p) => p.state);
  }

  public computeZoneName(x: number, z: number): string {
    if (z > 15) return 'North Project Wing';
    if (z < -12) return 'South Contact Lounge';
    if (x > 16) return 'East Skills Wing';
    if (x < -16) return 'West Experience Wing';
    return 'Grand Rotunda';
  }

  public broadcastLocalState(force = false): void {
    const cfg = this.player.rig.config;
    const configSig = JSON.stringify(cfg);
    const x = Number(this.player.position.x.toFixed(2));
    const z = Number(this.player.position.z.toFixed(2));
    const rot = Number(this.player.rotationY.toFixed(2));
    const moving = this.player.isMoving;
    const thought = this.player.currentThought;

    const movedEnough =
      Math.hypot(x - this.lastSentX, z - this.lastSentZ) > 0.04 ||
      Math.abs(rot - this.lastSentRot) > 0.06 ||
      moving !== this.lastSentMoving ||
      configSig !== this.lastSentConfigSig ||
      thought !== this.lastSentThought ||
      Math.abs(this.player.jumpOffset) > 0.02;

    if (!force && !movedEnough) return;

    this.lastSentX = x;
    this.lastSentZ = z;
    this.lastSentRot = rot;
    this.lastSentMoving = moving;
    this.lastSentConfigSig = configSig;
    this.lastSentThought = thought;

    const state: LiveVisitorState = {
      peerId: this.peerId,
      x,
      z,
      jumpOffset: Number(this.player.jumpOffset.toFixed(2)),
      rotationY: rot,
      isMoving: moving,
      isSprinting: this.player.isSprinting,
      config: cfg,
      configSig,
      thoughtBubble: thought,
      zone: this.computeZoneName(x, z),
      lastSeen: Date.now()
    };

    // 1. Broadcast to local browser tabs via BroadcastChannel
    this.channel?.postMessage({ type: 'update', state });

    // 2. Broadcast to all network devices via Vite multiplayer relay
    if (this.serverAvailable) {
      fetch('/api/multiplayer/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'update', state }),
        keepalive: true
      }).catch(() => {
        // Ignore network errors if static-hosted
      });
    }
  }

  public sendLiveChat(message: string): LiveChatEntry {
    const clean = message.trim().slice(0, 120);
    this.player.setThoughtBubble(clean);
    this.broadcastLocalState(true);

    const chatEntry: LiveChatEntry = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      peerId: this.peerId,
      author: this.player.rig.config.displayName,
      badgeText: this.player.rig.config.badgeText,
      primaryColor: this.player.rig.config.primaryColor,
      message: clean,
      timestamp: Date.now()
    };

    this.addChatEntry(chatEntry);
    this.channel?.postMessage({ type: 'chat', chat: chatEntry });

    if (this.serverAvailable) {
      fetch('/api/multiplayer/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat', chat: chatEntry })
      }).catch(() => {});
    }

    return chatEntry;
  }

  public sendBlame(targetPeerId: string, targetName: string, reason: string): BlameEventEntry {
    const cleanReason = reason.trim().slice(0, 120) || 'git blame spotted an unreviewed line!';
    const blameThought = `🎯 BLAMED ${targetName}: "${cleanReason}"`;
    this.player.setThoughtBubble(blameThought);
    this.broadcastLocalState(true);

    const blameEntry: BlameEventEntry = {
      id: `blame-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fromPeerId: this.peerId,
      fromName: this.player.rig.config.displayName,
      targetPeerId,
      targetName,
      reason: cleanReason,
      timestamp: Date.now()
    };

    this.addBlameEntry(blameEntry, false);
    this.channel?.postMessage({ type: 'blame', blame: blameEntry });

    if (this.serverAvailable) {
      fetch('/api/multiplayer/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'blame', blame: blameEntry })
      }).catch(() => {});
    }

    return blameEntry;
  }

  public spawn3DBlameEffect(fromPos: Vector3, targetPos: Vector3, colorHex = '#ef4444'): void {
    const mat = new StandardMaterial(`blameFXMat_${Date.now()}`, this.scene);
    mat.diffuseColor = Color3.Black();
    mat.specularColor = Color3.Black();
    mat.emissiveColor = Color3.FromHexString(colorHex);
    mat.alpha = 0.85;
    mat.backFaceCulling = false;

    // 1. Expanding target torus ring on the floor around the blamed character
    const ring = MeshBuilder.CreateTorus(
      `blameRing_${Date.now()}`,
      { diameter: 1.6, thickness: 0.11, tessellation: 32 },
      this.scene
    );
    ring.position.set(targetPos.x, 0.12, targetPos.z);
    ring.material = mat;
    ring.isPickable = false;

    // 2. Vertical warning laser pillar over the blamed character
    const beacon = MeshBuilder.CreateCylinder(
      `blameBeacon_${Date.now()}`,
      { height: 4.8, diameterTop: 0.15, diameterBottom: 1.25, tessellation: 20 },
      this.scene
    );
    beacon.position.set(targetPos.x, 2.4, targetPos.z);
    const beaconMat = mat.clone(`blameBeaconMat_${Date.now()}`);
    beaconMat.alpha = 0.28;
    beacon.material = beaconMat;
    beacon.isPickable = false;

    // 3. Laser line connecting the blamer to the blamed character
    const start = new Vector3(fromPos.x, 1.35, fromPos.z);
    const end = new Vector3(targetPos.x, 1.35, targetPos.z);
    const dist = Math.max(0.2, Vector3.Distance(start, end));
    const mid = Vector3.Center(start, end);

    const beam = MeshBuilder.CreateCylinder(
      `blameBeam_${Date.now()}`,
      { height: dist, diameter: 0.08, tessellation: 12 },
      this.scene
    );
    beam.position.copyFrom(mid);
    beam.lookAt(end);
    beam.rotate(Vector3.Right(), Math.PI / 2);
    beam.material = mat;
    beam.isPickable = false;

    this.activeBlameFX.push({
      ring,
      beacon,
      beam,
      mat,
      elapsed: 0,
      duration: 3.0
    });
  }

  private setupBroadcastChannel(): void {
    if (typeof BroadcastChannel === 'undefined') return;
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (ev) => {
        const data = ev.data;
        if (!data) return;

        if (data.type === 'update' && data.state?.peerId && data.state.peerId !== this.peerId) {
          this.upsertRemotePeer(data.state);
        } else if (data.type === 'request-sync' && data.peerId !== this.peerId) {
          this.broadcastLocalState(true);
        } else if (data.type === 'chat' && data.chat?.peerId && data.chat.peerId !== this.peerId) {
          this.addChatEntry(data.chat);
        } else if (data.type === 'blame' && data.blame?.id && data.blame.fromPeerId !== this.peerId) {
          this.addBlameEntry(data.blame, true);
        } else if (data.type === 'leave' && data.peerId) {
          this.removeRemotePeer(data.peerId);
        }
      };
    } catch {
      // BroadcastChannel unavailable
    }
  }

  private setupServerStream(): void {
    if (typeof EventSource === 'undefined') return;
    try {
      const es = new EventSource(`/api/multiplayer/stream?peerId=${encodeURIComponent(this.peerId)}`);
      this.eventSource = es;

      es.onopen = () => {
        this.serverAvailable = true;
        this.broadcastLocalState(true);
      };

      es.addEventListener('snapshot', (ev: MessageEvent) => {
        try {
          const parsed = JSON.parse(ev.data) as {
            visitors?: LiveVisitorState[];
            chats?: LiveChatEntry[];
            blames?: BlameEventEntry[];
          };
          this.serverAvailable = true;
          if (Array.isArray(parsed.visitors)) {
            for (const v of parsed.visitors) {
              if (v.peerId && v.peerId !== this.peerId) {
                this.upsertRemotePeer(v);
              }
            }
          }
          if (Array.isArray(parsed.chats)) {
            for (const c of parsed.chats) {
              this.addChatEntry(c, false);
            }
          }
          if (Array.isArray(parsed.blames)) {
            for (const b of parsed.blames) {
              this.addBlameEntry(b, false);
            }
          }
          this.onVisitorsChangedCallback?.();
        } catch {
          // ignore parse error
        }
      });

      es.addEventListener('update', (ev: MessageEvent) => {
        try {
          const state = JSON.parse(ev.data) as LiveVisitorState;
          if (state?.peerId && state.peerId !== this.peerId) {
            this.upsertRemotePeer(state);
          }
        } catch {
          // ignore
        }
      });

      es.addEventListener('chat', (ev: MessageEvent) => {
        try {
          const chat = JSON.parse(ev.data) as LiveChatEntry;
          if (chat?.peerId && chat.peerId !== this.peerId) {
            this.addChatEntry(chat);
          }
        } catch {
          // ignore
        }
      });

      es.addEventListener('blame', (ev: MessageEvent) => {
        try {
          const blame = JSON.parse(ev.data) as BlameEventEntry;
          if (blame?.id && blame.fromPeerId !== this.peerId) {
            this.addBlameEntry(blame, true);
          }
        } catch {
          // ignore
        }
      });

      es.addEventListener('leave', (ev: MessageEvent) => {
        try {
          const { peerId } = JSON.parse(ev.data) as { peerId: string };
          if (peerId) {
            this.removeRemotePeer(peerId);
          }
        } catch {
          // ignore
        }
      });

      es.onerror = () => {
        // Fallback to BroadcastChannel if static host has no /api/multiplayer endpoint
      };
    } catch {
      // EventSource not supported
    }
  }

  private setupUnloadCleanup(): void {
    const handleLeave = () => {
      this.channel?.postMessage({ type: 'leave', peerId: this.peerId });
      if (this.serverAvailable && navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify({ type: 'leave', peerId: this.peerId })], {
          type: 'application/json'
        });
        navigator.sendBeacon('/api/multiplayer/event', blob);
      }
      this.eventSource?.close();
    };

    window.addEventListener('beforeunload', handleLeave);
    window.addEventListener('pagehide', handleLeave);
  }

  private addChatEntry(entry: LiveChatEntry, notify = true): void {
    if (this.chatHistory.some((c) => c.id === entry.id)) return;
    this.chatHistory.push(entry);
    if (this.chatHistory.length > 30) {
      this.chatHistory.shift();
    }
    if (notify) {
      this.onChatReceivedCallback?.(entry);
    }
  }

  private addBlameEntry(entry: BlameEventEntry, notify = true): void {
    if (this.blameHistory.some((b) => b.id === entry.id)) return;
    this.blameHistory.push(entry);
    if (this.blameHistory.length > 25) {
      this.blameHistory.shift();
    }
    if (notify) {
      this.onBlameReceivedCallback?.(entry);
    }
  }

  private tagRemoteRigMeshes(rig: ArticulatedCharacterRig, peerId: string): void {
    for (const m of rig.root.getChildMeshes()) {
      m.isPickable = true;
      m.metadata = { remotePeerId: peerId };
    }
  }

  private upsertRemotePeer(state: LiveVisitorState): void {
    state.lastSeen = Date.now();
    const existing = this.peers.get(state.peerId);

    if (!existing) {
      const rig = CharacterBuilder.buildCharacter(
        this.scene,
        state.config,
        state.config.displayName,
        state.thoughtBubble
      );
      this.tagRemoteRigMeshes(rig, state.peerId);
      const pos = new Vector3(state.x, 0, state.z);
      rig.root.position.copyFrom(pos);
      rig.root.rotation.y = state.rotationY;

      this.peers.set(state.peerId, {
        state,
        rig,
        currentPos: pos.clone(),
        targetPos: pos.clone(),
        currentRotY: state.rotationY,
        targetRotY: state.rotationY
      });
      this.onVisitorsChangedCallback?.();
      return;
    }

    const configChanged = existing.state.configSig !== state.configSig;
    const thoughtChanged = existing.state.thoughtBubble !== state.thoughtBubble;

    existing.state = state;
    existing.targetPos.set(state.x, 0, state.z);
    existing.targetRotY = state.rotationY;

    if (configChanged) {
      existing.rig.dispose();
      existing.rig = CharacterBuilder.buildCharacter(
        this.scene,
        state.config,
        state.config.displayName,
        state.thoughtBubble
      );
      this.tagRemoteRigMeshes(existing.rig, state.peerId);
      existing.rig.root.position.copyFrom(existing.currentPos);
      existing.rig.root.rotation.y = existing.currentRotY;
      this.onVisitorsChangedCallback?.();
    } else if (thoughtChanged) {
      existing.rig.updateLabel(state.config.displayName, state.thoughtBubble);
      this.onVisitorsChangedCallback?.();
    }
  }

  private removeRemotePeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    peer.rig.dispose();
    this.peers.delete(peerId);
    this.onVisitorsChangedCallback?.();
  }

  private update(): void {
    const dt = Math.min(this.scene.getEngine().getDeltaTime() / 1000, 0.1);

    // 1. Broadcast local player state at ~15Hz when moving, and heartbeat every 2.5s
    this.syncAccumulator += dt;
    this.heartbeatAccumulator += dt;

    if (this.syncAccumulator >= 0.065) {
      this.syncAccumulator = 0;
      this.broadcastLocalState(false);
    }
    if (this.heartbeatAccumulator >= 2.5) {
      this.heartbeatAccumulator = 0;
      this.broadcastLocalState(true);
    }

    // 2. Smoothly interpolate & animate all live remote visitors
    const now = Date.now();
    for (const [peerId, peer] of this.peers.entries()) {
      if (now - peer.state.lastSeen > 18000) {
        this.removeRemotePeer(peerId);
        continue;
      }

      const dist = Vector3.Distance(peer.currentPos, peer.targetPos);
      if (dist > 12) {
        // Instant snap if remote visitor teleported across wings
        peer.currentPos.copyFrom(peer.targetPos);
      } else {
        Vector3.LerpToRef(
          peer.currentPos,
          peer.targetPos,
          Math.min(1, dt * 12),
          peer.currentPos
        );
      }

      peer.currentRotY = this.lerpAngle(peer.currentRotY, peer.targetRotY, dt * 12);
      peer.rig.root.position.copyFrom(peer.currentPos);
      peer.rig.root.rotation.y = peer.currentRotY;

      const effectivelyMoving = peer.state.isMoving || dist > 0.08;
      peer.rig.animate(
        dt,
        effectivelyMoving,
        peer.state.isSprinting,
        peer.state.jumpOffset || 0
      );
    }

    // 3. Animate active 3D Blame laser/ring effects
    for (let i = this.activeBlameFX.length - 1; i >= 0; i--) {
      const fx = this.activeBlameFX[i];
      fx.elapsed += dt;
      if (fx.elapsed >= fx.duration) {
        fx.ring.dispose();
        fx.beacon.material?.dispose();
        fx.beacon.dispose();
        fx.beam.dispose();
        fx.mat.dispose();
        this.activeBlameFX.splice(i, 1);
        continue;
      }

      const progress = fx.elapsed / fx.duration;
      const pulse = 1 + Math.sin(fx.elapsed * 14) * 0.22;
      fx.ring.scaling.set(pulse + progress * 0.8, 1, pulse + progress * 0.8);
      fx.mat.alpha = Math.max(0.05, (1 - progress) * 0.88);
    }
  }

  private lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * Math.min(1, t);
  }
}
