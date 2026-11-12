import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin } from 'vite';

interface LiveVisitorPayload {
  peerId: string;
  x: number;
  z: number;
  jumpOffset: number;
  rotationY: number;
  isMoving: boolean;
  isSprinting: boolean;
  config: Record<string, unknown>;
  configSig: string;
  thoughtBubble: string;
  zone: string;
  lastSeen: number;
}

interface ChatBroadcastPayload {
  id: string;
  peerId: string;
  author: string;
  badgeText: string;
  primaryColor: string;
  message: string;
  timestamp: number;
}

interface BlameBroadcastPayload {
  id: string;
  fromPeerId: string;
  fromName: string;
  targetPeerId: string;
  targetName: string;
  reason: string;
  timestamp: number;
}

function createMultiplayerRelayPlugin(): Plugin {
  const visitors = new Map<string, LiveVisitorPayload>();
  const clients = new Map<string, ServerResponse>();
  const recentChats: ChatBroadcastPayload[] = [];
  const recentBlames: BlameBroadcastPayload[] = [];

  const broadcast = (event: string, data: unknown, excludePeerId?: string) => {
    const packet = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [peerId, res] of clients.entries()) {
      if (excludePeerId && peerId === excludePeerId) continue;
      try {
        res.write(packet);
      } catch {
        clients.delete(peerId);
      }
    }
  };

  // Prune stale visitors every 10s
  const pruneInterval = setInterval(() => {
    const now = Date.now();
    for (const [peerId, v] of visitors.entries()) {
      if (now - v.lastSeen > 18000 && !clients.has(peerId)) {
        visitors.delete(peerId);
        broadcast('leave', { peerId });
      }
    }
  }, 10000);
  pruneInterval.unref?.();

  const attachMiddleware = (middlewares: {
    use: (route: string, fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void;
  }) => {
    middlewares.use('/api/multiplayer', (req, res, next) => {
      const url = new URL(req.url || '/', 'http://localhost');

      // 1. SSE Live Stream: GET /api/multiplayer/stream?peerId=...
      if (req.method === 'GET' && url.pathname === '/stream') {
        const peerId = url.searchParams.get('peerId') || `anon-${Date.now()}`;

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });

        clients.set(peerId, res);

        // Immediately send current snapshot of all active visitors, recent chat, & recent blames
        const snapshot = Array.from(visitors.values()).filter((v) => v.peerId !== peerId);
        res.write(
          `event: snapshot\ndata: ${JSON.stringify({ visitors: snapshot, chats: recentChats, blames: recentBlames })}\n\n`
        );

        const keepAlive = setInterval(() => {
          try {
            res.write(': keepalive\n\n');
          } catch {
            clearInterval(keepAlive);
          }
        }, 15000);

        req.on('close', () => {
          clearInterval(keepAlive);
          clients.delete(peerId);
          if (visitors.has(peerId)) {
            visitors.delete(peerId);
            broadcast('leave', { peerId }, peerId);
          }
        });
        return;
      }

      // 2. Publish State / Chat / Leave: POST /api/multiplayer/event
      if (req.method === 'POST' && url.pathname === '/event') {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            const { type, state, peerId, chat, blame } = parsed;

            if (type === 'update' && state?.peerId) {
              const updated: LiveVisitorPayload = {
                ...state,
                lastSeen: Date.now()
              };
              visitors.set(state.peerId, updated);
              broadcast('update', updated, state.peerId);
            } else if (type === 'chat' && chat?.peerId) {
              const chatEntry: ChatBroadcastPayload = {
                ...chat,
                timestamp: Date.now()
              };
              recentChats.push(chatEntry);
              if (recentChats.length > 25) recentChats.shift();
              broadcast('chat', chatEntry, chat.peerId);
            } else if (type === 'blame' && blame?.fromPeerId) {
              const blameEntry: BlameBroadcastPayload = {
                ...blame,
                timestamp: Date.now()
              };
              recentBlames.push(blameEntry);
              if (recentBlames.length > 20) recentBlames.shift();
              broadcast('blame', blameEntry, blame.fromPeerId);
            } else if (type === 'leave' && peerId) {
              visitors.delete(peerId);
              clients.delete(peerId);
              broadcast('leave', { peerId }, peerId);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end('{"ok":true}');
          } catch {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end('{"ok":false}');
          }
        });
        return;
      }

      next();
    });
  };

  return {
    name: 'pyaefolio-multiplayer-relay',
    configureServer(server) {
      attachMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares);
    }
  };
}

export default defineConfig({
  plugins: [createMultiplayerRelayPlugin()],
  envPrefix: ['VITE_', 'GEMINI_', 'GOOGLE_'],
  server: {
    port: 5173,
    host: true
  },
  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 5000
  }
});
