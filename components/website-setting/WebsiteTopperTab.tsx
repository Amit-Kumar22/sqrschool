'use client';

import { useState } from 'react';
import { Trophy, Pencil, Trash2 } from 'lucide-react';
import { deleteWebsiteTopper, getWebsiteToppers, type WebsiteTopper } from '@/lib/websiteSettingService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { EntityToolbar, ErrorBanner, ThumbPreview, useEntityList } from './shared';
import WebsiteTopperFormModal from './WebsiteTopperFormModal';

export default function WebsiteTopperTab() {
  const { items, loading, error, deletingId, remove, reload } = useEntityList(
    getWebsiteToppers,
    deleteWebsiteTopper,
    (i) => i.id,
    'Could not load toppers from the server.',
    'Could not delete that topper.',
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebsiteTopper | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (item: WebsiteTopper) => {
    setEditing(item);
    setFormOpen(true);
  };
  const handleSaved = async () => {
    setFormOpen(false);
    setEditing(null);
    await reload();
  };

  const columns: DataTableColumn<WebsiteTopper>[] = [
    {
      key: 'photo',
      header: '',
      widthClassName: 'w-14',
      render: (item) => <ThumbPreview src={item.photoUrl} alt={item.name} />,
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      accessor: (item) => item.name,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.name}</p>
          <p className="text-xs text-slate-500">{item.stream || '—'}</p>
        </div>
      ),
    },
    {
      key: 'rank',
      header: 'Rank',
      sortable: true,
      align: 'center',
      accessor: (item) => item.rank,
      render: (item) => <span className="font-semibold text-slate-700">#{item.rank}</span>,
    },
    {
      key: 'percentage',
      header: 'Percentage',
      sortable: true,
      align: 'center',
      accessor: (item) => item.percentage,
      render: (item) => <span className="text-slate-600">{item.percentage}%</span>,
    },
    {
      key: 'session',
      header: 'Session',
      render: (item) => <span className="text-slate-600">{item.session || '—'}</span>,
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
        icon={Trophy}
        title="Toppers"
        description="Student results showcased on the homepage."
        addLabel="Add topper"
        onAdd={openCreate}
      />
      <ErrorBanner message={error} />
      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No toppers yet"
        emptyDescription="Add the first topper to get started."
      />
      {formOpen && (
        <WebsiteTopperFormModal
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
