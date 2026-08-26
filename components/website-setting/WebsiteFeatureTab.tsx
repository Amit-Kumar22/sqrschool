'use client';

import { useState } from 'react';
import { Sparkles, Pencil, Trash2 } from 'lucide-react';
import { deleteWebsiteFeature, getWebsiteFeatures, type WebsiteFeature } from '@/lib/websiteSettingService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { EntityToolbar, ErrorBanner, truncate, useEntityList } from './shared';
import WebsiteFeatureFormModal from './WebsiteFeatureFormModal';

export default function WebsiteFeatureTab() {
  const { items, loading, error, deletingId, remove, reload } = useEntityList(
    getWebsiteFeatures,
    deleteWebsiteFeature,
    (i) => i.id,
    'Could not load features from the server.',
    'Could not delete that feature.',
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebsiteFeature | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (item: WebsiteFeature) => {
    setEditing(item);
    setFormOpen(true);
  };
  const handleSaved = async () => {
    setFormOpen(false);
    setEditing(null);
    await reload();
  };

  const columns: DataTableColumn<WebsiteFeature>[] = [
    {
      key: 'title',
      header: 'Feature',
      sortable: true,
      accessor: (item) => item.title,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-500">{truncate(item.description, 70) || '—'}</p>
        </div>
      ),
    },
    {
      key: 'icon',
      header: 'Icon',
      render: (item) => <span className="text-slate-600">{item.icon || '—'}</span>,
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
        icon={Sparkles}
        title="Features"
        description="Highlighted features shown on the homepage."
        addLabel="Add feature"
        onAdd={openCreate}
      />
      <ErrorBanner message={error} />
      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No features yet"
        emptyDescription="Add the first feature to get started."
      />
      {formOpen && (
        <WebsiteFeatureFormModal
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
