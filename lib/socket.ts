import { BACKEND_API_BASE_URL } from './config';
import { getAuthToken } from './auth';
import type { ChatMessage } from './communicationService';
import type { Client as StompClient, IMessage, StompSubscription } from '@stomp/stompjs';

// Spring Boot's STOMP endpoint is conventionally mounted at the app root, not
// under the /api REST prefix (registry.addEndpoint("/ws").withSockJS()) — not
// confirmed against this backend. Override with NEXT_PUBLIC_WS_BASE_URL once
// the real mount point is known; otherwise this strips the /api suffix off
// BACKEND_API_BASE_URL as a best guess.
const SOCKET_BASE_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL || BACKEND_API_BASE_URL.replace(/\/api\/?$/, '');
const SOCKET_ENDPOINT = `${SOCKET_BASE_URL}/ws`;

let client: StompClient | null = null;
let connectPromise: Promise<StompClient> | null = null;

// @stomp/stompjs and sockjs-client both touch `window`/WebSocket at module
// scope — dynamically imported here (rather than statically at the top of
// this file) so this module stays safe to import from a component that Next
// still evaluates during the server render pass.
async function getConnectedClient(): Promise<StompClient> {
  if (client?.connected) return client;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    const [{ Client }, sockjsModule] = await Promise.all([import('@stomp/stompjs'), import('sockjs-client')]);
    const SockJS = sockjsModule.default;

    const token = getAuthToken();
    const c = new Client({
      webSocketFactory: () => new SockJS(SOCKET_ENDPOINT) as unknown as WebSocket,
      // 0 = no auto-reconnect loop. SOCKET_ENDPOINT is an unconfirmed guess
      // (see note above) — until it's verified against the real backend,
      // auto-retrying would just hammer a 404'ing /info endpoint every few
      // seconds forever. Bump this back up once the endpoint is confirmed.
      reconnectDelay: 0,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    });

    try {
      await new Promise<void>((resolve, reject) => {
        c.onConnect = () => resolve();
        c.onStompError = (frame) => reject(new Error(frame.headers?.message || 'STOMP connection error'));
        c.onWebSocketError = () => reject(new Error('WebSocket connection failed'));
        c.activate();
      });
    } catch (err) {
      c.deactivate();
      throw err;
    }

    client = c;
    return c;
  })();

  try {
    return await connectPromise;
  } finally {
    connectPromise = null;
  }
}

/**
 * Subscribes to a conversation's live message topic. Assumed destination
 * `/topic/conversations/{id}` — not confirmed against the backend; adjust
 * here if the real broker destination differs. Returns an unsubscribe fn.
 */
export async function subscribeToConversation(
  conversationId: number,
  onMessage: (message: ChatMessage) => void,
): Promise<() => void> {
  const stompClient = await getConnectedClient();
  const subscription: StompSubscription = stompClient.subscribe(
    `/topic/conversations/${conversationId}`,
    (frame: IMessage) => {
      try {
        onMessage(JSON.parse(frame.body) as ChatMessage);
      } catch {
        // Ignore malformed frames rather than crash the subscription.
      }
    },
  );
  return () => subscription.unsubscribe();
}

export function disconnectSocket(): void {
  client?.deactivate();
  client = null;
  connectPromise = null;
}
