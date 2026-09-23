'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, Check, CheckCheck, Loader2, MessageSquare, Paperclip, Search, Send, UserPlus } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { getUser, type SessionUser } from '@/lib/auth';
import {
  createDirectConversation,
  getConversations,
  getMessages,
  markConversationRead,
  sendMessage,
  type ChatMessage,
  type Conversation,
  type ConversationMember,
  type ReadReceiptEvent,
  type TypingEvent,
} from '@/lib/communicationService';
import { getStaffMembers, type StaffMember } from '@/lib/schoolService';
import {
  connectSocket,
  disconnectSocket,
  getSocketStatus,
  onSocketStatusChange,
  publishChatMessage,
  publishReadReceipt,
  publishTyping,
  subscribeToConversation,
  type SocketStatus,
} from '@/lib/socket';
import SetPageTitle from '@/components/dashboard/SetPageTitle';

const formatRoleLabel = (role: string) =>
  role
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const initialsOf = (name: string) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

function getOtherMember(conversation: Conversation, currentUserId?: number | null): ConversationMember | undefined {
  return conversation.members.find((m) => m.userId !== currentUserId) ?? conversation.members[0];
}

function conversationSubtitle(conversation: Conversation, currentUserId?: number | null): string {
  if (conversation.type === 'GROUP') {
    return `${conversation.members.length} members`;
  }
  const other = getOtherMember(conversation, currentUserId);
  return other ? formatRoleLabel(other.role) : '';
}

// GET /v1/conversations doesn't expose a per-user unread count, so "read" is
// tracked client-side: the timestamp of the newest message seen in each
// conversation, per logged-in user, persisted to localStorage so it survives
// a reload (but is local to this browser/device only — the PUT .../read
// call still tells the backend too, for whenever it does track this).
const LAST_READ_STORAGE_KEY = 'sqr.communication.lastRead';

function loadLastReadMap(userId: number): Record<number, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(`${LAST_READ_STORAGE_KEY}.${userId}`);
    return raw ? (JSON.parse(raw) as Record<number, string>) : {};
  } catch {
    return {};
  }
}

function saveLastReadMap(userId: number, map: Record<number, string>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${LAST_READ_STORAGE_KEY}.${userId}`, JSON.stringify(map));
  } catch {
    // Storage can throw (private mode, quota) — unread badges just won't persist across reloads.
  }
}

function countUnread(messages: ChatMessage[], currentUserId?: number | null, lastRead?: string): number {
  const lastReadTime = lastRead ? new Date(lastRead).getTime() : 0;
  return messages.filter(
    (m) => m.senderId !== currentUserId && m.status !== 'DELETED' && new Date(m.createdAt).getTime() > lastReadTime,
  ).length;
}

const sortByCreatedAt = (messages: ChatMessage[]) =>
  [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

// Inserts or updates a message pushed over the socket. An existing id is
// updated in place (e.g. a DELETED status change); otherwise it replaces the
// matching optimistic "SENDING" bubble, if any, or is appended.
function upsertMessage(existing: ChatMessage[], message: ChatMessage): ChatMessage[] {
  const index = existing.findIndex((m) => m.id === message.id);
  if (index !== -1) return existing.map((m, i) => (i === index ? { ...m, ...message } : m));

  const optimisticIndex = existing.findIndex(
    (m) => m.status === 'SENDING' && m.senderId === message.senderId && m.content === message.content,
  );
  const next =
    optimisticIndex === -1 ? [...existing, message] : existing.map((m, i) => (i === optimisticIndex ? message : m));
  return sortByCreatedAt(next);
}

/** "Kavita is typing…" / "Kavita and Rahul are typing…" / "3 people are typing…" */
function typingLabel(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return `${names[0].split(' ')[0]} is typing…`;
  if (names.length === 2) return `${names[0].split(' ')[0]} and ${names[1].split(' ')[0]} are typing…`;
  return `${names.length} people are typing…`;
}

// Re-send "typing: true" at most this often while the user keeps typing, and
// send "typing: false" after this long without a keystroke.
const TYPING_THROTTLE_MS = 2500;
const TYPING_IDLE_MS = 3000;
// Drop someone's typing indicator if no refresh or "stopped" event arrives —
// covers a peer who closes the tab mid-sentence.
const REMOTE_TYPING_TIMEOUT_MS = 6000;
// How long a socket-sent message may stay "SENDING" before the thread is
// re-fetched over REST to find out whether it actually went through.
const SEND_ACK_TIMEOUT_MS = 8000;
// The backend currently accepts STOMP SENDs to /app/chat.send but silently
// drops them (not saved, not broadcast — verified against the dev server),
// while the REST send saves *and* broadcasts on the socket topic. So sends go
// over REST for now; flip this once /app/chat.send works server-side.
const SEND_VIA_SOCKET = false;

/** Communication — conversation list + message thread, two-pane chat UI. */
export default function CommunicationPageContent() {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<number, ChatMessage[]>>({});
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [conversationsError, setConversationsError] = useState('');

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [lastReadMap, setLastReadMap] = useState<Record<number, string>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [directoryResults, setDirectoryResults] = useState<StaffMember[]>([]);
  const [searchingDirectory, setSearchingDirectory] = useState(false);
  const [startingUserId, setStartingUserId] = useState<number | null>(null);
  const [directoryError, setDirectoryError] = useState('');

  const [messageDraft, setMessageDraft] = useState('');
  const [messageError, setMessageError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [socketStatus, setSocketStatus] = useState<SocketStatus>(getSocketStatus);
  // conversationId -> (userId -> display name) of people currently typing.
  const [typingByConversation, setTypingByConversation] = useState<Record<number, Record<number, string>>>({});
  // conversationId -> highest message id someone else has read (from read receipts).
  const [readUpToByConversation, setReadUpToByConversation] = useState<Record<number, number>>({});

  const selectedIdRef = useRef<number | null>(null);
  const currentUserRef = useRef<SessionUser | null>(null);
  const messagesRef = useRef<Record<number, ChatMessage[]>>({});
  const subscriptionsRef = useRef<Map<number, () => void>>(new Map());
  const remoteTypingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const localTypingRef = useRef<{
    conversationId: number | null;
    lastSentAt: number;
    idleTimer: ReturnType<typeof setTimeout> | null;
  }>({ conversationId: null, lastSentAt: 0, idleTimer: null });
  // Last message id a read receipt was sent for, per conversation — avoids
  // re-sending the same receipt on every re-render/selection.
  const lastReceiptSentRef = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    setCurrentUser(getUser());
  }, []);

  useEffect(() => {
    currentUserRef.current = currentUser;
    if (currentUser) setLastReadMap(loadLastReadMap(currentUser.id));
  }, [currentUser]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    messagesRef.current = messagesByConversation;
  }, [messagesByConversation]);

  // Marks a conversation read both locally (drives the unread badge,
  // persisted per-user so it survives a reload) and on the backend — via a
  // live read receipt when the socket is up (which also notifies the other
  // members), falling back to the REST PUT otherwise.
  const markRead = (conversationId: number, upToTimestamp?: string, lastMessageId?: number) => {
    const user = currentUserRef.current;
    if (!user) return;
    const timestamp = upToTimestamp ?? new Date().toISOString();
    setLastReadMap((prev) => {
      if (prev[conversationId] && new Date(prev[conversationId]).getTime() >= new Date(timestamp).getTime()) {
        return prev;
      }
      const next = { ...prev, [conversationId]: timestamp };
      saveLastReadMap(user.id, next);
      return next;
    });

    if (lastMessageId != null && lastMessageId > 0) {
      if (lastReceiptSentRef.current.get(conversationId) === lastMessageId) return;
      lastReceiptSentRef.current.set(conversationId, lastMessageId);
      // Live receipt for the other members. Like chat.send, the backend
      // doesn't act on /app/* destinations yet, so the REST PUT below still
      // runs to persist read state.
      publishReadReceipt(conversationId, lastMessageId);
    }
    markConversationRead(conversationId).catch(() => {
      // Non-critical — read state failing to sync shouldn't block viewing the thread.
    });
  };

  // ─── Live socket handlers ────────────────────────────────────────────────
  // Subscriptions are created once per conversation and outlive many
  // renders, so they call through this ref to always reach the latest
  // closures (current user, markRead) instead of the ones from subscribe time.

  const clearRemoteTyping = (conversationId: number, userId: number) => {
    const key = `${conversationId}:${userId}`;
    const timer = remoteTypingTimersRef.current.get(key);
    if (timer) clearTimeout(timer);
    remoteTypingTimersRef.current.delete(key);
    setTypingByConversation((prev) => {
      if (!prev[conversationId]?.[userId]) return prev;
      const rest = { ...prev[conversationId] };
      delete rest[userId];
      return { ...prev, [conversationId]: rest };
    });
  };

  const handleIncomingMessage = (message: ChatMessage) => {
    setMessagesByConversation((prev) => ({
      ...prev,
      [message.conversationId]: upsertMessage(prev[message.conversationId] ?? [], message),
    }));

    const me = currentUserRef.current?.id;
    if (message.senderId !== me) {
      clearRemoteTyping(message.conversationId, message.senderId);
      if (message.conversationId === selectedIdRef.current && message.status !== 'DELETED') {
        markRead(message.conversationId, message.createdAt, message.id);
      }
    }
  };

  const handleTypingEvent = (event: TypingEvent) => {
    if (event.userId === currentUserRef.current?.id) return;
    if (!event.typing) {
      clearRemoteTyping(event.conversationId, event.userId);
      return;
    }
    const key = `${event.conversationId}:${event.userId}`;
    const existingTimer = remoteTypingTimersRef.current.get(key);
    if (existingTimer) clearTimeout(existingTimer);
    remoteTypingTimersRef.current.set(
      key,
      setTimeout(() => clearRemoteTyping(event.conversationId, event.userId), REMOTE_TYPING_TIMEOUT_MS),
    );
    setTypingByConversation((prev) => ({
      ...prev,
      [event.conversationId]: { ...prev[event.conversationId], [event.userId]: event.userName },
    }));
  };

  const handleReadReceipt = (event: ReadReceiptEvent) => {
    if (event.userId === currentUserRef.current?.id) return;
    setReadUpToByConversation((prev) =>
      (prev[event.conversationId] ?? 0) >= event.lastReadMessageId
        ? prev
        : { ...prev, [event.conversationId]: event.lastReadMessageId },
    );
  };

  const socketHandlersRef = useRef({ handleIncomingMessage, handleTypingEvent, handleReadReceipt });
  useEffect(() => {
    socketHandlersRef.current = { handleIncomingMessage, handleTypingEvent, handleReadReceipt };
  });

  // ─── Local typing indicator (outgoing) ───────────────────────────────────

  const stopLocalTyping = () => {
    const state = localTypingRef.current;
    if (state.idleTimer) clearTimeout(state.idleTimer);
    state.idleTimer = null;
    if (state.conversationId != null) publishTyping(state.conversationId, false);
    state.conversationId = null;
    state.lastSentAt = 0;
  };

  const notifyTyping = (conversationId: number) => {
    const state = localTypingRef.current;
    if (state.conversationId != null && state.conversationId !== conversationId) stopLocalTyping();
    const now = Date.now();
    if (state.conversationId !== conversationId || now - state.lastSentAt > TYPING_THROTTLE_MS) {
      if (publishTyping(conversationId, true)) {
        state.conversationId = conversationId;
        state.lastSentAt = now;
      }
    }
    if (state.idleTimer) clearTimeout(state.idleTimer);
    state.idleTimer = setTimeout(stopLocalTyping, TYPING_IDLE_MS);
  };

  // GET /v1/conversations doesn't return a last-message preview or unread
  // count, so each conversation's messages are fetched once here to derive
  // both the list preview and the thread itself — avoids a second round trip
  // when a conversation is opened.
  const loadConversations = async () => {
    setLoadingConversations(true);
    setConversationsError('');
    try {
      const list = await getConversations();
      const entries = await Promise.all(
        list.map(async (conversation) => {
          try {
            const msgs = await getMessages(conversation.id);
            const sorted = [...msgs].sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            );
            return [conversation.id, sorted] as const;
          } catch {
            return [conversation.id, [] as ChatMessage[]] as const;
          }
        }),
      );
      setConversations(list);
      setMessagesByConversation(Object.fromEntries(entries));
      setSelectedId((prev) => prev ?? list[0]?.id ?? null);
    } catch (err) {
      setConversationsError(apiErrorMessage(err, 'Could not load conversations from the server.'));
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Switching threads (or leaving one) ends any "typing…" state there.
    stopLocalTyping();
    if (selectedId == null) return;
    const msgs = messagesByConversation[selectedId];
    const last = msgs?.[msgs.length - 1];
    markRead(selectedId, last?.createdAt, last?.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId, messagesByConversation]);

  // Live delivery — subscribed once per conversation (not just the open one)
  // so the list preview, unread badges and typing hints stay current even
  // for threads you're not viewing. The socket layer queues these until it's
  // connected and re-applies them after every reconnect.
  useEffect(() => {
    conversations.forEach((conversation) => {
      if (subscriptionsRef.current.has(conversation.id)) return;
      const unsubscribe = subscribeToConversation(conversation.id, {
        onMessage: (message) => socketHandlersRef.current.handleIncomingMessage(message),
        onTyping: (event) => socketHandlersRef.current.handleTypingEvent(event),
        onRead: (event) => socketHandlersRef.current.handleReadReceipt(event),
      });
      subscriptionsRef.current.set(conversation.id, unsubscribe);
    });
  }, [conversations]);

  // Anything broadcast while the socket was down is lost, so after a
  // reconnect each thread is re-fetched over REST and merged back in
  // (keeping any still-pending optimistic bubbles).
  const resyncMessages = async () => {
    const ids = Object.keys(messagesRef.current).map(Number);
    const entries = await Promise.all(
      ids.map(async (id) => {
        try {
          return [id, await getMessages(id)] as const;
        } catch {
          return null;
        }
      }),
    );
    setMessagesByConversation((prev) => {
      const next = { ...prev };
      entries.forEach((entry) => {
        if (!entry) return;
        const [id, fresh] = entry;
        const pending = (prev[id] ?? []).filter(
          (m) => m.status === 'SENDING' && !fresh.some((f) => f.senderId === m.senderId && f.content === m.content),
        );
        next[id] = sortByCreatedAt([...fresh, ...pending]);
      });
      return next;
    });
  };

  const resyncRef = useRef(resyncMessages);
  useEffect(() => {
    resyncRef.current = resyncMessages;
  });

  useEffect(() => {
    connectSocket();
    let wasDisconnected = false;
    const unsubscribeStatus = onSocketStatusChange((next) => {
      setSocketStatus(next);
      if (next === 'disconnected') wasDisconnected = true;
      if (next === 'connected' && wasDisconnected) {
        wasDisconnected = false;
        resyncRef.current();
      }
    });

    const subscriptions = subscriptionsRef.current;
    const remoteTypingTimers = remoteTypingTimersRef.current;
    const localTyping = localTypingRef.current;
    return () => {
      unsubscribeStatus();
      if (localTyping.idleTimer) clearTimeout(localTyping.idleTimer);
      if (localTyping.conversationId != null) publishTyping(localTyping.conversationId, false);
      remoteTypingTimers.forEach(clearTimeout);
      remoteTypingTimers.clear();
      subscriptions.forEach((unsubscribe) => unsubscribe());
      subscriptions.clear();
      disconnectSocket();
    };
  }, []);

  // Directory search — "Search conversations..." also surfaces staff who
  // don't have a conversation yet, so typing a name doubles as starting a
  // new direct chat.
  useEffect(() => {
    const term = searchQuery.trim();
    if (term.length < 2) {
      setDirectoryResults([]);
      return;
    }
    setSearchingDirectory(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const page = await getStaffMembers({ search: term, size: 200 });
        if (!cancelled) setDirectoryResults(page.content);
      } catch {
        if (!cancelled) setDirectoryResults([]);
      } finally {
        if (!cancelled) setSearchingDirectory(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const aMsgs = messagesByConversation[a.id] ?? [];
      const bMsgs = messagesByConversation[b.id] ?? [];
      const aTime = new Date(aMsgs[aMsgs.length - 1]?.createdAt ?? a.updatedAt).getTime();
      const bTime = new Date(bMsgs[bMsgs.length - 1]?.createdAt ?? b.updatedAt).getTime();
      return bTime - aTime;
    });
  }, [conversations, messagesByConversation]);

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sortedConversations;
    return sortedConversations.filter((c) => c.name.toLowerCase().includes(q));
  }, [sortedConversations, searchQuery]);

  const existingDirectUserIds = useMemo(() => {
    const ids = new Set<number>();
    conversations.forEach((c) => {
      if (c.type === 'DIRECT') {
        const other = getOtherMember(c, currentUser?.id);
        if (other) ids.add(other.userId);
      }
    });
    return ids;
  }, [conversations, currentUser]);

  const newChatSuggestions = useMemo(
    () => directoryResults.filter((staff) => staff.id !== currentUser?.id && !existingDirectUserIds.has(staff.id)),
    [directoryResults, currentUser, existingDirectUserIds],
  );

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;
  const selectedMessages = selectedId != null ? (messagesByConversation[selectedId] ?? []) : [];

  const handleStartDirectChat = async (staff: StaffMember) => {
    setStartingUserId(staff.id);
    setDirectoryError('');
    try {
      const conversation = await createDirectConversation(staff.id);
      setConversations((prev) => (prev.some((c) => c.id === conversation.id) ? prev : [conversation, ...prev]));
      setMessagesByConversation((prev) => ({ ...prev, [conversation.id]: prev[conversation.id] ?? [] }));
      setSelectedId(conversation.id);
      setSearchQuery('');
      setDirectoryResults([]);
    } catch (err) {
      setDirectoryError(apiErrorMessage(err, 'Could not start a conversation with that person.'));
    } finally {
      setStartingUserId(null);
    }
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = messageDraft.trim();
    const conversationId = selectedId;
    if (!trimmed || conversationId == null || !currentUser) return;

    // Optimistic bubble so the send feels instant; reconciled with the
    // server's copy (or rolled back) once the request settles.
    // crypto.randomUUID() is only defined in secure contexts (HTTPS or
    // localhost) — this app is also served over plain HTTP in production, so
    // a manual id is used instead of a Web Crypto call that would throw there.
    const clientMessageId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const optimisticMessage: ChatMessage = {
      id: -Date.now(),
      clientMessageId,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      content: trimmed,
      status: 'SENDING',
      createdAt: new Date().toISOString(),
    };

    setMessagesByConversation((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] ?? []), optimisticMessage],
    }));
    setMessageDraft('');
    setMessageError('');
    stopLocalTyping();

    const dropOptimistic = (list: ChatMessage[]) => list.filter((m) => m.clientMessageId !== clientMessageId);
    const failSend = (message: string) => {
      setMessagesByConversation((prev) => ({ ...prev, [conversationId]: dropOptimistic(prev[conversationId] ?? []) }));
      setMessageDraft((draft) => draft || trimmed);
      setMessageError(message);
    };

    // Socket path: the server broadcasts the saved message back on
    // /topic/conversation/{id}, which replaces the optimistic bubble in
    // handleIncomingMessage. If that echo never comes (server-side
    // rejection, dropped connection), the thread is re-fetched to find out
    // whether the message was actually stored.
    if (SEND_VIA_SOCKET && publishChatMessage(conversationId, trimmed)) {
      setTimeout(async () => {
        const stillPending = (messagesRef.current[conversationId] ?? []).some(
          (m) => m.clientMessageId === clientMessageId,
        );
        if (!stillPending) return;
        try {
          const fresh = await getMessages(conversationId);
          // REST returns newest-first — check the newest few, whichever end they're on.
          const delivered = sortByCreatedAt(fresh)
            .slice(-10)
            .some((m) => m.senderId === currentUser.id && m.content === trimmed);
          if (delivered) {
            setMessagesByConversation((prev) => {
              const pending = dropOptimistic(prev[conversationId] ?? []).filter((m) => m.status === 'SENDING');
              return { ...prev, [conversationId]: sortByCreatedAt([...fresh, ...pending]) };
            });
          } else {
            failSend('That message could not be delivered. Please try again.');
          }
        } catch (err) {
          failSend(apiErrorMessage(err, 'Could not confirm that message was sent.'));
        }
      }, SEND_ACK_TIMEOUT_MS);
      return;
    }

    // REST path. The backend also broadcasts REST-sent messages on
    // /topic/conversation/{id}, so other members still get it live — and
    // the socket echo may even replace the optimistic bubble before this resolves.
    try {
      const saved = await sendMessage({ conversationId, content: trimmed });
      if (saved?.id != null) {
        setMessagesByConversation((prev) => {
          const list = dropOptimistic(prev[conversationId] ?? []);
          const next = list.some((m) => m.id === saved.id) ? list : [...list, saved];
          return { ...prev, [conversationId]: sortByCreatedAt(next) };
        });
        return;
      }
      // The endpoint currently answers 200 with an empty body, so when the
      // socket echo hasn't already landed, re-fetch the thread to pick it up.
      const stillPending = (messagesRef.current[conversationId] ?? []).some(
        (m) => m.clientMessageId === clientMessageId,
      );
      if (!stillPending) return;
      const fresh = await getMessages(conversationId);
      setMessagesByConversation((prev) => {
        const pending = dropOptimistic(prev[conversationId] ?? []).filter((m) => m.status === 'SENDING');
        return { ...prev, [conversationId]: sortByCreatedAt([...fresh, ...pending]) };
      });
    } catch (err) {
      failSend(apiErrorMessage(err, 'Could not send that message.'));
    }
  };

  const selectedTypingNames = selectedId != null ? Object.values(typingByConversation[selectedId] ?? {}) : [];
  const selectedReadUpTo = selectedId != null ? (readUpToByConversation[selectedId] ?? 0) : 0;

  return (
    <div className="flex h-full min-h-[420px] flex-col gap-3">
      <SetPageTitle title="Communication" />
      {/* <PageHeader icon={MessageSquare} title="Communication" description="Chat with teachers, students, and admins." /> */}

      {conversationsError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {conversationsError}
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-3">
        {/* Conversation list — full width on mobile; hides once a thread is
            open there, since only one pane fits at a time below md. */}
        <div
          className={`card-premium w-full shrink-0 flex-col overflow-hidden md:flex md:w-[300px] lg:w-[340px] ${
            selectedId != null ? 'hidden' : 'flex'
          }`}
        >
          <div className="border-b border-slate-100 p-3">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-sm text-slate-700 shadow-premium-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 focus:outline-none"
              />
            </div>
          </div>

          <div className="scrollbar-thin flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="space-y-1 p-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={`conv-skeleton-${i}`} className="flex items-center gap-2.5 px-1 py-2">
                    <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
                    <div className="flex-1">
                      <div className="skeleton h-3.5 w-2/3 rounded-md" />
                      <div className="skeleton mt-1.5 h-3 w-1/2 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 && newChatSuggestions.length === 0 ? (
              <div className="flex flex-col items-center gap-1.5 px-4 py-14 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <MessageSquare size={17} />
                </span>
                <p className="text-sm font-semibold text-slate-900">
                  {searchQuery ? 'No matches found' : 'No conversations yet'}
                </p>
                <p className="text-xs text-slate-500">
                  {searchQuery ? `Nothing matches "${searchQuery}".` : 'Conversations you’re part of will show up here.'}
                </p>
              </div>
            ) : (
              <>
                {filteredConversations.map((conversation) => {
                  const msgs = messagesByConversation[conversation.id] ?? [];
                  const last = msgs[msgs.length - 1];
                  const isSelected = conversation.id === selectedId;
                  const unread = isSelected ? 0 : countUnread(msgs, currentUser?.id, lastReadMap[conversation.id]);
                  const typing = typingLabel(Object.values(typingByConversation[conversation.id] ?? {}));
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedId(conversation.id)}
                      className={`relative flex w-full items-center gap-2.5 border-b border-slate-50 px-3.5 py-2.5 text-left transition-colors ${
                        isSelected ? 'bg-brand-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && <span className="absolute inset-y-0 left-0 w-1 bg-brand-600" />}
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white">
                        {initialsOf(conversation.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">{conversation.name}</p>
                          {last && <span className="shrink-0 text-[11px] text-slate-400">{formatTime(last.createdAt)}</span>}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          {typing ? (
                            <p className="truncate text-xs font-medium text-brand-600 italic">{typing}</p>
                          ) : (
                            <p
                              className={`truncate text-xs ${unread > 0 ? 'font-medium text-slate-700' : 'text-slate-500'}`}
                            >
                              {last
                                ? last.status === 'DELETED'
                                  ? 'Message deleted'
                                  : last.content
                                : conversationSubtitle(conversation, currentUser?.id)}
                            </p>
                          )}
                          {unread > 0 && (
                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold text-white">
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {newChatSuggestions.length > 0 && (
                  <div>
                    <p className="px-3.5 pt-3 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                      Start a new chat
                    </p>
                    {newChatSuggestions.map((staff) => (
                      <button
                        key={staff.id}
                        type="button"
                        disabled={startingUserId === staff.id}
                        onClick={() => handleStartDirectChat(staff)}
                        className="flex w-full items-center gap-2.5 border-b border-slate-50 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-50 disabled:opacity-60"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                          {initialsOf(staff.fullName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">{staff.fullName}</p>
                          <p className="truncate text-xs text-slate-500">{formatRoleLabel(staff.role)}</p>
                        </div>
                        <UserPlus size={14} className="shrink-0 text-brand-600" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {searchingDirectory && <p className="px-3.5 py-2 text-[11px] text-slate-400">Searching people…</p>}
            {directoryError && (
              <p className="border-t border-slate-100 px-3.5 py-2 text-xs text-red-600">{directoryError}</p>
            )}
          </div>
        </div>

        {/* Message thread — hidden on mobile until a conversation is open,
            since the list pane above takes the full width until then. */}
        <div
          className={`card-premium min-w-0 flex-1 flex-col overflow-hidden md:flex ${
            selectedId != null ? 'flex' : 'hidden'
          }`}
        >
          {selectedConversation ? (
            <>
              <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  title="Back to conversations"
                  className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 md:hidden"
                >
                  <ArrowLeft size={17} />
                </button>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white">
                  {initialsOf(selectedConversation.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900">{selectedConversation.name}</p>
                  {selectedTypingNames.length > 0 ? (
                    <p className="truncate text-xs font-medium text-brand-600 italic">
                      {typingLabel(selectedTypingNames)}
                    </p>
                  ) : (
                    <p className="truncate text-xs text-slate-500">
                      {conversationSubtitle(selectedConversation, currentUser?.id)}
                    </p>
                  )}
                </div>
                <span
                  title={
                    socketStatus === 'connected'
                      ? 'Messages arrive in real time'
                      : 'Live connection unavailable — messages are sent over HTTP'
                  }
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    socketStatus === 'connected' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      socketStatus === 'connected' ? 'bg-emerald-500' : 'animate-pulse bg-amber-500'
                    }`}
                  />
                  {socketStatus === 'connected' ? 'Live' : socketStatus === 'disconnected' ? 'Reconnecting…' : 'Connecting…'}
                </span>
              </div>

              <div className="scrollbar-thin flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
                {selectedMessages.map((message) => {
                  const isMine = message.senderId === currentUser?.id;
                  const isDeleted = message.status === 'DELETED';
                  const isRead = message.status === 'READ' || (message.id > 0 && message.id <= selectedReadUpTo);
                  const showGroupSender = selectedConversation.type === 'GROUP' && !isMine;
                  return (
                    <div key={message.clientMessageId ?? message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-premium-sm ${
                          isDeleted
                            ? 'border border-dashed border-slate-200 bg-white text-slate-400'
                            : isMine
                              ? 'rounded-br-sm bg-gradient-to-br from-brand-500 to-brand-700 text-white'
                              : 'rounded-bl-sm bg-slate-100 text-slate-800'
                        }`}
                      >
                        {showGroupSender && (
                          <p className="mb-0.5 text-[11px] font-semibold text-brand-700">{message.senderName}</p>
                        )}
                        {isDeleted ? (
                          <p className="italic">This message was deleted</p>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        )}
                        <span
                          className={`mt-1 flex items-center justify-end gap-0.5 text-[10px] ${
                            isMine && !isDeleted ? 'text-white/75' : 'text-slate-400'
                          }`}
                        >
                          {formatTime(message.createdAt)}
                          {isMine && !isDeleted &&
                            (message.status === 'SENDING' ? (
                              <Loader2 size={11} className="animate-spin" />
                            ) : isRead ? (
                              <CheckCheck size={12} className="text-sky-200" aria-label="Read" />
                            ) : message.status === 'DELIVERED' ? (
                              <CheckCheck size={12} aria-label="Delivered" />
                            ) : (
                              <Check size={11} aria-label="Sent" />
                            ))}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {messageError && (
                <p className="border-t border-red-100 bg-red-50 px-4 py-1.5 text-xs text-red-700">{messageError}</p>
              )}

              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 p-3">
                <button
                  type="button"
                  disabled
                  title="Attachments aren't available yet"
                  className="flex h-9 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded-lg text-slate-400 opacity-50"
                >
                  <Paperclip size={16} />
                </button>
                <input
                  type="text"
                  value={messageDraft}
                  onChange={(e) => {
                    setMessageDraft(e.target.value);
                    if (e.target.value.trim()) notifyTyping(selectedConversation.id);
                    else stopLocalTyping();
                  }}
                  onBlur={stopLocalTyping}
                  placeholder="Type a message..."
                  className="h-10 flex-1 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-premium-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!messageDraft.trim()}
                  title="Send"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white shadow-glow-brand transition-all hover:-translate-y-0.5 hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <MessageSquare size={20} />
              </span>
              <p className="text-sm font-semibold text-slate-900">Select a conversation</p>
              <p className="text-xs text-slate-500">Choose someone from the list to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
