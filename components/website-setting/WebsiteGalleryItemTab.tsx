'use client';

import { useState } from 'react';
import { Images, Pencil, Trash2 } from 'lucide-react';
import { deleteWebsiteGalleryItem, getWebsiteGalleryItems, type WebsiteGalleryItem } from '@/lib/websiteSettingService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { EntityToolbar, ErrorBanner, ThumbPreview, useEntityList } from './shared';
import WebsiteGalleryItemFormModal from './WebsiteGalleryItemFormModal';

export default function WebsiteGalleryItemTab() {
  const { items, loading, error, deletingId, remove, reload } = useEntityList(
    getWebsiteGalleryItems,
    deleteWebsiteGalleryItem,
    (i) => i.id,
    'Could not load gallery items from the server.',
    'Could not delete that gallery item.',
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebsiteGalleryItem | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (item: WebsiteGalleryItem) => {
    setEditing(item);
    setFormOpen(true);
  };
  const handleSaved = async () => {
    setFormOpen(false);
    setEditing(null);
    await reload();
  };

  const columns: DataTableColumn<WebsiteGalleryItem>[] = [
    {
      key: 'image',
      header: '',
      widthClassName: 'w-14',
      render: (item) => <ThumbPreview src={item.imageUrl} alt={item.title} />,
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      accessor: (item) => item.title,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-500">{item.category || '—'}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (item) => (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{item.type}</span>
      ),
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
        icon={Images}
        title="Gallery"
        description="Media items shown in the site gallery."
        addLabel="Add item"
        onAdd={openCreate}
      />
      <ErrorBanner message={error} />
      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No gallery items yet"
        emptyDescription="Add the first item to get started."
      />
      {formOpen && (
        <WebsiteGalleryItemFormModal
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
