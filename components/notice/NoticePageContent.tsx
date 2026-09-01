'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Calendar, Inbox, Info, Megaphone, Pencil, Plus, Trash2, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import { deleteNotice, getNotices, type Notice, type NoticeAudience, type NoticeStatus } from '@/lib/noticeService';
import SetPageTitle from '@/components/dashboard/SetPageTitle';
import PageHeader from '@/components/ui/PageHeader';
import { NoticePriorityBadge, NoticeStatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';
import NoticeFormModal from './NoticeFormModal';

const AUDIENCE_FILTER_OPTIONS: NoticeAudience[] = ['ALL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];
const STATUS_FILTER_OPTIONS: NoticeStatus[] = ['DRAFT', 'PUBLISHED', 'EXPIRED', 'ARCHIVED'];

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString() : '—');

const PRIORITY_STYLE: Record<string, { icon: LucideIcon; bar: string; badge: string }> = {
  HIGH: { icon: AlertTriangle, bar: 'bg-red-500', badge: 'bg-red-50 text-red-600' },
  MEDIUM: { icon: Info, bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-600' },
  LOW: { icon: Info, bar: 'bg-slate-300', badge: 'bg-slate-100 text-slate-500' },
};

/** Notice Board — CRUD list of announcements, filterable by audience/status. */
export default function NoticePageContent() {
  const [items, setItems] = useState<Notice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [audienceFilter, setAudienceFilter] = useState<NoticeAudience | ''>('');
  const [statusFilter, setStatusFilter] = useState<NoticeStatus | ''>('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Notice | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getNotices({ audience: audienceFilter || undefined, status: statusFilter || undefined });
      setItems(result.content);
      setTotal(result.totalElements);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load notices from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audienceFilter, statusFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: Notice) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this notice? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteNotice(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that notice.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await loadItems();
  };

  return (
    <div className="space-y-3">
      <SetPageTitle title="Notice Board" />

      <div className="flex flex-wrap items-end gap-2">
        <SelectField
          label="Audience"
          value={audienceFilter}
          onChange={(e) => setAudienceFilter(e.target.value as NoticeAudience | '')}
          wrapperClassName="w-40"
        >
          <option value="">All audiences</option>
          {AUDIENCE_FILTER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {formatEnumLabel(option)}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as NoticeStatus | '')}
          wrapperClassName="w-40"
        >
          <option value="">All statuses</option>
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {formatEnumLabel(option)}
            </option>
          ))}
        </SelectField>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="card-premium p-3.5">
              <div className="flex items-start gap-2.5">
                <div className="skeleton h-8 w-8 shrink-0 rounded-lg" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-1/3 rounded-md" />
                  <div className="skeleton mt-2.5 h-3 w-full rounded-md" />
                  <div className="skeleton mt-1.5 h-3 w-2/3 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card-premium flex flex-col items-center gap-2 px-4 py-16 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <Inbox size={20} />
          </span>
          <p className="text-sm font-semibold text-slate-900">No notices yet</p>
          <p className="text-xs text-slate-500">Post the first announcement to get started.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => {
            const priority = PRIORITY_STYLE[item.priority] ?? PRIORITY_STYLE.LOW;
            const PriorityIcon = priority.icon;
            return (
              <div
                key={item.id}
                className="card-premium group relative overflow-hidden p-3.5 pl-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-premium"
              >
                <span className={`absolute inset-y-0 left-0 w-1 ${priority.bar}`} />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 ${priority.badge}`}>
                      <PriorityIcon size={15} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <NoticePriorityBadge priority={item.priority} />
                        {item.status !== 'PUBLISHED' && <NoticeStatusBadge status={item.status} />}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600">{item.content}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={11} /> {formatDate(item.publishDate)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <User size={11} /> By {item.author?.fullName || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <IconButton icon={Pencil} label="Edit" variant="primary" size="sm" onClick={() => openEditModal(item)} />
                    <IconButton
                      icon={Trash2}
                      label="Delete"
                      variant="danger"
                      size="sm"
                      loading={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formModalOpen && (
        <NoticeFormModal
          item={editingItem}
          onClose={() => {
            setFormModalOpen(false);
            setEditingItem(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
