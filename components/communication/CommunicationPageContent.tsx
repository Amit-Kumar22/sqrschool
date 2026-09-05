'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, Check, Loader2, MessageSquare, Paperclip, Search, Send, UserPlus } from 'lucide-react';
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
} from '@/lib/communicationService';
import { getStaffMembers, type StaffMember } from '@/lib/schoolService';
import { disconnectSocket, subscribeToConversation } from '@/lib/socket';
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
  return messages.filter((m) => m.senderId !== currentUserId && new Date(m.createdAt).getTime() > lastReadTime).length;
}

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

  const selectedIdRef = useRef<number | null>(null);
  const subscriptionsRef = useRef<Map<number, () => void>>(new Map());

  useEffect(() => {
    setCurrentUser(getUser());
  }, []);

  useEffect(() => {
    if (currentUser) setLastReadMap(loadLastReadMap(currentUser.id));
  }, [currentUser]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // Marks a conversation read both locally (drives the unread badge,
  // persisted per-user so it survives a reload) and on the backend.
  const markRead = (conversationId: number, upToTimestamp?: string) => {
    if (!currentUser) return;
    const timestamp = upToTimestamp ?? new Date().toISOString();
    setLastReadMap((prev) => {
      if (prev[conversationId] && new Date(prev[conversationId]).getTime() >= new Date(timestamp).getTime()) {
        return prev;
      }
      const next = { ...prev, [conversationId]: timestamp };
      saveLastReadMap(currentUser.id, next);
      return next;
    });
    markConversationRead(conversationId).catch(() => {
      // Non-critical — read state failing to sync shouldn't block viewing the thread.
    });
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
    if (selectedId == null) return;
    const msgs = messagesByConversation[selectedId];
    markRead(selectedId, msgs?.[msgs.length - 1]?.createdAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedId, messagesByConversation]);

  // Live delivery — subscribed once per conversation (not just the open one)
  // so the list preview stays current even for threads you're not viewing.
  // Sending still goes through the REST POST + refetch in handleSend; this
  // only handles incoming pushes (your own messages from another
  // tab/device, and messages from other people).
  useEffect(() => {
    let cancelled = false;

    conversations.forEach((conversation) => {
      if (subscriptionsRef.current.has(conversation.id)) return;

      subscribeToConversation(conversation.id, (message) => {
        setMessagesByConversation((prev) => {
          const existing = prev[message.conversationId] ?? [];
          if (existing.some((m) => m.id === message.id)) return prev;

          const optimisticIndex = existing.findIndex(
            (m) => m.status === 'SENDING' && m.senderId === message.senderId && m.content === message.content,
          );
          const next =
            optimisticIndex === -1
              ? [...existing, message]
              : existing.map((m, i) => (i === optimisticIndex ? message : m));
          next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          return { ...prev, [message.conversationId]: next };
        });

        if (message.conversationId === selectedIdRef.current) {
          markRead(message.conversationId, message.createdAt);
        }
      })
        .then((unsubscribe) => {
          if (cancelled) {
            unsubscribe();
          } else {
            subscriptionsRef.current.set(conversation.id, unsubscribe);
          }
        })
        .catch(() => {
          // Live updates are additive on top of the REST flow — a failed
          // subscription just means this thread won't live-update until the
          // socket reconnects; sending/loading still work either way.
        });
    });

    return () => {
      cancelled = true;
    };
    // Deliberately keyed only on `conversations` — subscribing again on every
    // markRead/currentUser identity change would tear down and reopen every
    // conversation's socket for no reason; the handler always reads the
    // latest markRead via closure since this effect reruns whenever the
    // conversation list itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  useEffect(() => {
    const subscriptions = subscriptionsRef.current;
    return () => {
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
    const clientMessageId = crypto.randomUUID();
    const optimisticMessage: ChatMessage = {
      id: -Date.now(),
      clientMessageId,
      conversationId,
      senderId: currentUser.id,
      senderName: currentUser.fullName,
      type: 'TEXT',
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

    try {
      await sendMessage({ conversationId, content: trimmed });
      const refreshed = await getMessages(conversationId);
      const sorted = [...refreshed].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      setMessagesByConversation((prev) => ({ ...prev, [conversationId]: sorted }));
    } catch (err) {
      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] ?? []).filter((m) => m.clientMessageId !== clientMessageId),
      }));
      setMessageDraft(trimmed);
      setMessageError(apiErrorMessage(err, 'Could not send that message.'));
    }
  };

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
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-sm text-slate-700 shadow-premium-sm transition-colors placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
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
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-700">
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
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => setSelectedId(conversation.id)}
                      className={`relative flex w-full items-center gap-2.5 border-b border-slate-50 px-3.5 py-2.5 text-left transition-colors ${
                        isSelected ? 'bg-amber-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && <span className="absolute inset-y-0 left-0 w-1 bg-amber-600" />}
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-orange-700 text-xs font-semibold text-white">
                        {initialsOf(conversation.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">{conversation.name}</p>
                          {last && <span className="shrink-0 text-[11px] text-slate-400">{formatTime(last.createdAt)}</span>}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`truncate text-xs ${unread > 0 ? 'font-medium text-slate-700' : 'text-slate-500'}`}
                          >
                            {last ? last.content : conversationSubtitle(conversation, currentUser?.id)}
                          </p>
                          {unread > 0 && (
                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-amber-600 px-1.5 text-[10px] font-semibold text-white">
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
                        <UserPlus size={14} className="shrink-0 text-amber-600" />
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
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-orange-700 text-xs font-semibold text-white">
                  {initialsOf(selectedConversation.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{selectedConversation.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {conversationSubtitle(selectedConversation, currentUser?.id)}
                  </p>
                </div>
              </div>

              <div className="scrollbar-thin flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
                {selectedMessages.map((message) => {
                  const isMine = message.senderId === currentUser?.id;
                  return (
                    <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-premium-sm ${
                          isMine
                            ? 'rounded-br-sm bg-gradient-to-br from-amber-600 to-orange-700 text-white'
                            : 'rounded-bl-sm bg-slate-100 text-slate-800'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.content}</p>
                        <span
                          className={`mt-1 flex items-center justify-end gap-0.5 text-[10px] ${
                            isMine ? 'text-white/75' : 'text-slate-400'
                          }`}
                        >
                          {formatTime(message.createdAt)}
                          {isMine && (message.status === 'SENDING' ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />)}
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
                  onChange={(e) => setMessageDraft(e.target.value)}
                  placeholder="Type a message..."
                  className="h-10 flex-1 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-premium-sm transition-colors placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/25 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!messageDraft.trim()}
                  title="Send"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-700 text-white shadow-glow-amber transition-all hover:-translate-y-0.5 hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                >
                  <Send size={15} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-1.5 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-700">
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
