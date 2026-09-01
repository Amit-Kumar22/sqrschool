'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Plus } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import Button from '@/components/ui/Button';
import type { WebsitePage } from '@/lib/websiteSettingService';

/**
 * Shared list/delete state for a website-setting tab. Every tab fetches a
 * page of records, deletes by id with a confirm prompt, and re-fetches after
 * a create/update — this hook is that boilerplate factored out once instead
 * of repeated across the 12 near-identical tabs.
 */
export function useEntityList<T>(
  fetchPage: () => Promise<WebsitePage<T>>,
  removeItem: (id: number) => Promise<void>,
  getId: (item: T) => number,
  loadErrorMessage: string,
  deleteErrorMessage: string,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Kept in a ref (rather than a useCallback dep) so `load` stays referentially
  // stable while always calling the latest `fetchPage` — callers like the hero
  // button tab pass a new closure each render (it captures the slide filter),
  // and a stale closure here would silently ignore filter changes on reload.
  const fetchPageRef = useRef(fetchPage);
  useEffect(() => {
    fetchPageRef.current = fetchPage;
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const content = (await fetchPageRef.current()).content;
      setItems(content);
    } catch (err) {
      setError(apiErrorMessage(err, loadErrorMessage));
    } finally {
      setLoading(false);
    }
  }, [loadErrorMessage]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (id: number) => {
    if (!confirm('Delete this record? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await removeItem(id);
      setItems((prev) => prev.filter((item) => getId(item) !== id));
    } catch (err) {
      setError(apiErrorMessage(err, deleteErrorMessage));
    } finally {
      setDeletingId(null);
    }
  };

  return { items, loading, error, deletingId, remove, reload: load };
}

/** Compact title + description + "Add" button row, used at the top of every tab panel. */
export function EntityToolbar({
  icon: Icon,
  title,
  description,
  addLabel,
  onAdd,
  disabled,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  addLabel: string;
  onAdd: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
          <Icon size={15} />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
      <Button icon={Plus} size="sm" onClick={onAdd} disabled={disabled}>
        {addLabel}
      </Button>
    </div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</div>;
}

/** Small square image preview for URL fields (logo/photo/background/gallery) — falls back silently on a bad URL. */
export function ThumbPreview({ src, alt }: { src: string; alt: string }) {
  if (!src) return <span className="text-slate-300">—</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-9 w-9 shrink-0 rounded-md border border-slate-200 object-cover"
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
      }}
    />
  );
}

export const truncate = (value: string, max = 60) =>
  !value ? '' : value.length > max ? `${value.slice(0, max)}…` : value;
