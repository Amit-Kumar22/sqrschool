'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { AlertCircle, ArrowUp, Loader2, RotateCcw, Sparkles, SquarePen } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { aiSearch, type AiSearchResult, type AiSearchRow } from '@/lib/aiSearchService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import Button from '@/components/ui/Button';

// Mirrors the backend's AiSearchRequest.question limit.
const MAX_QUESTION_LENGTH = 500;
// Rows rendered per answer before the "show all" toggle — keeps a huge result
// set from stalling the thread.
const ROW_PREVIEW_LIMIT = 50;

const SUGGESTIONS = [
  'Give me a report of this month due and paid fee of class 1-A',
  'How many students are there in each class?',
  'List the students with pending fees this month',
  'How many teachers are currently active?',
];

type ChatMessage =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; result: AiSearchResult }
  | { id: number; role: 'error'; text: string; question: string };

/** "total_due_fee" → "Total Due Fee" */
function formatColumnLabel(column: string): string {
  return column
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function AssistantAvatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow-brand ring-1 ring-white/25">
      <Sparkles size={15} />
    </span>
  );
}

function ResultTable({ columns, data }: { columns: string[]; data: AiSearchRow[] }) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? data : data.slice(0, ROW_PREVIEW_LIMIT);

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
      <div className="scrollbar-thin max-h-96 overflow-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-[1] bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="border-b border-slate-200 px-3.5 py-2.5 text-[11px] font-semibold tracking-wide whitespace-nowrap text-slate-500 uppercase"
                >
                  {formatColumnLabel(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-slate-100 last:border-b-0 hover:bg-brand-50/40">
                {columns.map((column) => (
                  <td key={column} className="px-3.5 py-2.5 whitespace-nowrap text-slate-700 tabular-nums">
                    {formatCell(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > ROW_PREVIEW_LIMIT && (
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-500">
          <span>
            Showing {rows.length} of {data.length} rows
          </span>
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="font-semibold text-brand-700 hover:underline"
          >
            {showAll ? 'Show less' : 'Show all'}
          </button>
        </div>
      )}
    </div>
  );
}

function AssistantAnswer({ result }: { result: AiSearchResult }) {
  const data = Array.isArray(result.data) ? result.data : [];
  const columns = result.columns?.length ? result.columns : Object.keys(data[0] ?? {});

  return (
    <div className="card-premium min-w-0 flex-1 px-4 py-3.5">
      <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
        {result.summary || 'Here is what I found.'}
      </p>
      {columns.length > 0 && data.length > 0 && <ResultTable columns={columns} data={data} />}
    </div>
  );
}

export default function AiSearchPageContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);

  const nextIdRef = useRef(1);
  // Bumped by "New chat" so an answer still in flight for the old thread is dropped.
  const threadRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, thinking]);

  const resizeInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const ask = async (question: string, appendUserMessage = true) => {
    const text = question.trim();
    if (!text || thinking) return;
    const thread = threadRef.current;

    if (appendUserMessage) {
      setMessages((prev) => [...prev, { id: nextIdRef.current++, role: 'user', text }]);
    }
    setThinking(true);
    try {
      const result = await aiSearch({ question: text });
      if (thread !== threadRef.current) return;
      setMessages((prev) => [...prev, { id: nextIdRef.current++, role: 'assistant', result }]);
    } catch (err) {
      if (thread !== threadRef.current) return;
      setMessages((prev) => [
        ...prev,
        {
          id: nextIdRef.current++,
          role: 'error',
          text: apiErrorMessage(err, 'Could not get an answer right now. Please try again.'),
          question: text,
        },
      ]);
    } finally {
      if (thread === threadRef.current) setThinking(false);
    }
  };

  const submitInput = () => {
    if (!input.trim() || thinking) return;
    ask(input);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submitInput();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter adds a line. Skip while an IME is composing.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submitInput();
    }
  };

  const retry = (message: Extract<ChatMessage, { role: 'error' }>) => {
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
    ask(message.question, false);
  };

  const startNewChat = () => {
    threadRef.current += 1;
    setMessages([]);
    setThinking(false);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    inputRef.current?.focus();
  };

  const isEmpty = messages.length === 0 && !thinking;

  return (
    <div className="mx-auto flex h-full min-h-[420px] w-full max-w-4xl flex-col">
      <SetPageTitle title="AI Assistant" />

      {!isEmpty && (
        <div className="flex shrink-0 items-center justify-end pb-2">
          <Button variant="secondary" size="sm" icon={SquarePen} onClick={startNewChat}>
            New chat
          </Button>
        </div>
      )}

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex min-h-full flex-col items-center justify-center px-2 py-8 text-center">
            <span className="animate-pop-in flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-glow-brand-lg ring-1 ring-white/25">
              <Sparkles size={26} />
            </span>
            <h2 className="animate-fade-in-up mt-5 text-2xl font-bold tracking-tight text-slate-900">
              Ask anything about your school
            </h2>
            <p className="animate-fade-in-up mt-2 max-w-md text-sm text-slate-500">
              Ask in plain language about fees, students, classes or staff and get a summary with the matching records.
            </p>

            <div className="mt-8 grid w-full max-w-2xl gap-2.5 sm:grid-cols-2">
              {SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => ask(suggestion)}
                  style={{ animationDelay: `${120 + idx * 60}ms` }}
                  className="card-premium animate-fade-in-up px-4 py-3 text-left text-sm text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:text-brand-800"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5 px-1 py-2">
            {messages.map((message) => {
              if (message.role === 'user') {
                return (
                  <div key={message.id} className="animate-fade-in-up flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-brand-500 to-brand-700 px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-white shadow-premium-sm">
                      {message.text}
                    </p>
                  </div>
                );
              }

              if (message.role === 'error') {
                return (
                  <div key={message.id} className="animate-fade-in-up flex items-start gap-3">
                    <AssistantAvatar />
                    <div className="min-w-0 flex-1 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                      <p className="flex items-start gap-2 text-sm text-red-700">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        {message.text}
                      </p>
                      <button
                        type="button"
                        onClick={() => retry(message)}
                        disabled={thinking}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 hover:underline disabled:opacity-50"
                      >
                        <RotateCcw size={12} />
                        Try again
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={message.id} className="animate-fade-in-up flex items-start gap-3">
                  <AssistantAvatar />
                  <AssistantAnswer result={message.result} />
                </div>
              );
            })}

            {thinking && (
              <div className="animate-fade-in flex items-center gap-3">
                <AssistantAvatar />
                <div className="card-premium flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                  <Loader2 size={14} className="animate-spin text-brand-600" />
                  Analysing your school data…
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="shrink-0 pt-3">
        <div className="card-premium flex items-end gap-2 p-2 pl-4 transition-shadow focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/20">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              resizeInput();
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={MAX_QUESTION_LENGTH}
            placeholder="Ask about fees, students, classes…"
            aria-label="Ask the AI assistant"
            className="scrollbar-thin max-h-40 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            title="Send"
            aria-label="Send"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow-brand transition-all duration-200 hover:from-brand-600 hover:to-brand-800 active:scale-95 disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
          >
            {thinking ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={17} />}
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-slate-400">
          Answers are generated by AI from your school data — verify important figures before acting on them.
        </p>
      </form>
    </div>
  );
}
