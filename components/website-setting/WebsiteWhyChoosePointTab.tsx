'use client';

import { useState } from 'react';
import { ListChecks, Pencil, Trash2 } from 'lucide-react';
import {
  deleteWebsiteWhyChoosePoint,
  getWebsiteWhyChoosePoints,
  type WebsiteWhyChoosePoint,
} from '@/lib/websiteSettingService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { EntityToolbar, ErrorBanner, useEntityList } from './shared';
import WebsiteWhyChoosePointFormModal from './WebsiteWhyChoosePointFormModal';

export default function WebsiteWhyChoosePointTab() {
  const { items, loading, error, deletingId, remove, reload } = useEntityList(
    getWebsiteWhyChoosePoints,
    deleteWebsiteWhyChoosePoint,
    (i) => i.id,
    'Could not load points from the server.',
    'Could not delete that point.',
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebsiteWhyChoosePoint | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (item: WebsiteWhyChoosePoint) => {
    setEditing(item);
    setFormOpen(true);
  };
  const handleSaved = async () => {
    setFormOpen(false);
    setEditing(null);
    await reload();
  };

  const columns: DataTableColumn<WebsiteWhyChoosePoint>[] = [
    {
      key: 'point',
      header: 'Point',
      sortable: true,
      accessor: (item) => item.point,
      render: (item) => <span className="font-medium text-slate-900">{item.point}</span>,
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
        icon={ListChecks}
        title="Why choose us"
        description="Reasons shown in the 'Why choose us' section."
        addLabel="Add point"
        onAdd={openCreate}
      />
      <ErrorBanner message={error} />
      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No points yet"
        emptyDescription="Add the first point to get started."
      />
      {formOpen && (
        <WebsiteWhyChoosePointFormModal
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
