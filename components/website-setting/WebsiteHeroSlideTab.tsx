'use client';

import { useState } from 'react';
import { GalleryHorizontal, Pencil, Trash2 } from 'lucide-react';
import { deleteWebsiteHeroSlide, getWebsiteHeroSlides, type WebsiteHeroSlide } from '@/lib/websiteSettingService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { EntityToolbar, ErrorBanner, ThumbPreview, useEntityList } from './shared';
import WebsiteHeroSlideFormModal from './WebsiteHeroSlideFormModal';

export default function WebsiteHeroSlideTab() {
  const { items, loading, error, deletingId, remove, reload } = useEntityList(
    getWebsiteHeroSlides,
    deleteWebsiteHeroSlide,
    (i) => i.id,
    'Could not load hero slides from the server.',
    'Could not delete that hero slide.',
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebsiteHeroSlide | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (item: WebsiteHeroSlide) => {
    setEditing(item);
    setFormOpen(true);
  };
  const handleSaved = async () => {
    setFormOpen(false);
    setEditing(null);
    await reload();
  };

  const columns: DataTableColumn<WebsiteHeroSlide>[] = [
    {
      key: 'image',
      header: '',
      widthClassName: 'w-16',
      render: (item) => <ThumbPreview src={item.backgroundImageUrl} alt={item.title} />,
    },
    {
      key: 'title',
      header: 'Slide',
      sortable: true,
      accessor: (item) => item.title,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-500">{item.subtitle || '—'}</p>
        </div>
      ),
    },
    {
      key: 'badge',
      header: 'Badge',
      render: (item) => <span className="text-slate-600">{item.badge || '—'}</span>,
    },
    {
      key: 'displayOrder',
      header: 'Order',
      sortable: true,
      align: 'center',
      accessor: (item) => item.displayOrder,
      render: (item) => <span className="text-slate-600">{item.displayOrder}</span>,
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      accessor: (item) => (item.active ? 1 : 0),
      render: (item) => <StatusBadge active={item.active} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: 'w-20',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton icon={Pencil} label="Edit" variant="primary" onClick={() => openEdit(item)} />
          <IconButton
            icon={Trash2}
            label="Delete"
            variant="danger"
            loading={deletingId === item.id}
            onClick={() => remove(item.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <EntityToolbar
        icon={GalleryHorizontal}
        title="Hero slides"
        description="Slides shown in the homepage hero carousel."
        addLabel="Add slide"
        onAdd={openCreate}
      />
      <ErrorBanner message={error} />
      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No hero slides yet"
        emptyDescription="Add the first slide to get started."
      />
      {formOpen && (
        <WebsiteHeroSlideFormModal
          item={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
