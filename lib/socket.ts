import { BACKEND_API_BASE_URL } from './config';
import { getAuthToken } from './auth';
import type { ChatMessage, ReadReceiptEvent, TypingEvent } from './communicationService';
import type { Client as StompClient, IMessage, StompSubscription } from '@stomp/stompjs';

// STOMP over SockJS, mounted under the same /api prefix as the REST routes
// (e.g. http://host:7979/api/ws). Override with NEXT_PUBLIC_WS_URL if the
// socket ever lives somewhere else.
const SOCKET_ENDPOINT = process.env.NEXT_PUBLIC_WS_URL || `${BACKEND_API_BASE_URL}/ws`;

const DESTINATIONS = {
  SEND: '/app/chat.send',
  TYPING: (conversationId: number) => `/app/chat.typing/${conversationId}`,
  READ: '/app/chat.read',
  MESSAGES_TOPIC: (conversationId: number) => `/topic/conversation/${conversationId}`,
  TYPING_TOPIC: (conversationId: number) => `/topic/conversation/${conversationId}/typing`,
  READ_TOPIC: (conversationId: number) => `/topic/conversation/${conversationId}/read`,
};

export type SocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

export interface ConversationHandlers {
  onMessage?: (message: ChatMessage) => void;
  onTyping?: (event: TypingEvent) => void;
  onRead?: (event: ReadReceiptEvent) => void;
}

// ─── Internal state ─────────────────────────────────────────────────────────

let client: StompClient | null = null;
let clientPromise: Promise<StompClient> | null = null;
let generation = 0;
let status: SocketStatus = 'idle';
const statusListeners = new Set<(status: SocketStatus) => void>();

// Desired subscriptions, keyed by a unique handle. Kept independently of the
// live STOMP subscriptions so they can be re-established after every
// reconnect — STOMP subscriptions don't survive a dropped connection.
interface SubscriptionEntry {
  conversationId: number;
  handlers: ConversationHandlers;
  live: StompSubscription[];
}
const subscriptions = new Map<number, SubscriptionEntry>();
let nextHandle = 1;

function setStatus(next: SocketStatus) {
  if (status === next) return;
  status = next;
  statusListeners.forEach((listener) => listener(next));
}

function parseFrame<T>(frame: IMessage, handler?: (payload: T) => void) {
  if (!handler) return;
  try {
    handler(JSON.parse(frame.body) as T);
  } catch {
    // Ignore malformed frames rather than crash the subscription.
  }
}

function attach(c: StompClient, entry: SubscriptionEntry) {
  const { conversationId, handlers } = entry;
  entry.live = [
    c.subscribe(DESTINATIONS.MESSAGES_TOPIC(conversationId), (f) => parseFrame(f, handlers.onMessage)),
    c.subscribe(DESTINATIONS.TYPING_TOPIC(conversationId), (f) => parseFrame(f, handlers.onTyping)),
    c.subscribe(DESTINATIONS.READ_TOPIC(conversationId), (f) => parseFrame(f, handlers.onRead)),
  ];
}

function detach(entry: SubscriptionEntry) {
  entry.live.forEach((sub) => {
    try {
      sub.unsubscribe();
    } catch {
      // Connection already gone — nothing to unsubscribe from.
    }
  });
  entry.live = [];
}

// @stomp/stompjs and sockjs-client both touch `window`/WebSocket at module
// scope — dynamically imported here (rather than statically at the top of
// this file) so this module stays safe to import from a component that Next
// still evaluates during the server render pass.
async function ensureClient(): Promise<StompClient> {
  if (client) return client;
  if (clientPromise) return clientPromise;

  const gen = generation;
  clientPromise = (async () => {
    const [{ Client }, sockjsModule] = await Promise.all([import('@stomp/stompjs'), import('sockjs-client')]);
    // disconnectSocket() ran while the libraries were loading — don't
    // resurrect a connection the caller already tore down.
    if (gen !== generation) throw new Error('Socket disconnected during setup');
    const SockJS = sockjsModule.default;

    const c = new Client({
      webSocketFactory: () => new SockJS(SOCKET_ENDPOINT) as unknown as WebSocket,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      // Re-read the token before every (re)connect so a reconnect after a
      // re-login doesn't keep presenting the old, expired token.
      beforeConnect: () => {
        const token = getAuthToken();
        c.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        setStatus('connecting');
      },
      onConnect: () => {
        subscriptions.forEach((entry) => attach(c, entry));
        setStatus('connected');
      },
      onWebSocketClose: () => {
        subscriptions.forEach((entry) => (entry.live = []));
        setStatus('disconnected');
      },
      onStompError: (frame) => {
        console.warn('[socket] STOMP error:', frame.headers?.message || frame.body);
      },
    });

    c.activate();
    client = c;
    return c;
  })();

  try {
    return await clientPromise;
  } finally {
    clientPromise = null;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Starts the shared connection (idempotent). Reconnects automatically on drops. */
export function connectSocket(): void {
  const gen = generation;
  ensureClient().catch((err) => {
    if (gen !== generation) return;
    console.warn('[socket] Could not initialise STOMP client:', err);
    setStatus('disconnected');
  });
}

export function getSocketStatus(): SocketStatus {
  return status;
}

/** Listens for connection status changes. Returns an unsubscribe fn. */
export function onSocketStatusChange(listener: (status: SocketStatus) => void): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

/**
 * Subscribes to a conversation's message, typing and read-receipt topics.
 * Safe to call before the socket is connected — the subscription is applied
 * as soon as it connects, and re-applied after every reconnect. Returns an
 * unsubscribe fn.
 */
export function subscribeToConversation(conversationId: number, handlers: ConversationHandlers): () => void {
  const handle = nextHandle++;
  const entry: SubscriptionEntry = { conversationId, handlers, live: [] };
  subscriptions.set(handle, entry);

  connectSocket();
  if (client?.connected) attach(client, entry);

  return () => {
    detach(entry);
    subscriptions.delete(handle);
  };
}

/**
 * Publishes to a STOMP destination. Returns false when the socket isn't
 * connected so callers can fall back to the REST equivalent.
 */
function publish(destination: string, body: unknown): boolean {
  if (!client?.connected) return false;
  try {
    client.publish({ destination, body: JSON.stringify(body) });
    return true;
  } catch {
    return false;
  }
}

export function publishChatMessage(conversationId: number, content: string): boolean {
  return publish(DESTINATIONS.SEND, { conversationId, content });
}

export function publishTyping(conversationId: number, typing: boolean): boolean {
  return publish(DESTINATIONS.TYPING(conversationId), { conversationId, typing });
}

export function publishReadReceipt(conversationId: number, lastMessageId: number): boolean {
  return publish(DESTINATIONS.READ, { conversationId, lastMessageId });
}

export function disconnectSocket(): void {
  generation++;
  subscriptions.forEach(detach);
  subscriptions.clear();
  client?.deactivate();
  client = null;
  clientPromise = null;
  setStatus('idle');
}
