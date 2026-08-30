'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Pencil, PlaySquare, Plus, Trash2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  deleteYoutubeTestimonial,
  getYoutubeTestimonials,
  type YoutubeTestimonial,
} from '@/lib/youtubeTestimonialService';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import Button, { IconButton } from '@/components/ui/Button';
import YoutubeTestimonialFormModal from '@/components/youtube-testimonial/YoutubeTestimonialFormModal';

export default function StaffYoutubeTestimonialsPage() {
  const [items, setItems] = useState<YoutubeTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<YoutubeTestimonial | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getYoutubeTestimonials();
      setItems(list);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load testimonials from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: YoutubeTestimonial) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this testimonial? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteYoutubeTestimonial(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that testimonial.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    await loadItems();
  };

  const columns: DataTableColumn<YoutubeTestimonial>[] = [
    {
      key: 'videoTitle',
      header: 'Video title',
      sortable: true,
      accessor: (item) => item.videoTitle,
      render: (item) => <p className="font-semibold text-slate-900">{item.videoTitle}</p>,
    },
    {
      key: 'videoUrl',
      header: 'URL',
      render: (item) => (
        <a
          href={item.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
        >
          <span className="max-w-56 truncate">{item.videoUrl}</span>
          <ExternalLink size={12} className="shrink-0" />
        </a>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      accessor: (item) => item.createdAt,
      render: (item) => (
        <span className="text-slate-600">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (item) => (item.isActive ? 1 : 0),
      render: (item) => <StatusBadge active={item.isActive} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: 'w-20',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Pencil}
            label="Edit"
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(item);
            }}
          />
          <IconButton
            icon={Trash2}
            label="Delete"
            variant="danger"
            loading={deletingId === item.id}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={PlaySquare}
        title="YouTube Testimonials"
        description="Manage the YouTube testimonial videos shown on the public site."
        actions={
          <Button icon={Plus} onClick={openCreateModal}>
            Add testimonial
          </Button>
        }
      />

      {error && (
        <div className="animate-fade-in-up rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No testimonials yet"
        emptyDescription="Add your first YouTube testimonial to get started."
      />

      {formModalOpen && (
        <YoutubeTestimonialFormModal
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
