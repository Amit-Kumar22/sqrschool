'use client';

import { useState } from 'react';
import { BarChart3, Pencil, Trash2 } from 'lucide-react';
import { deleteWebsiteStatistic, getWebsiteStatistics, type WebsiteStatistic } from '@/lib/websiteSettingService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { EntityToolbar, ErrorBanner, useEntityList } from './shared';
import WebsiteStatisticFormModal from './WebsiteStatisticFormModal';

export default function WebsiteStatisticTab() {
  const { items, loading, error, deletingId, remove, reload } = useEntityList(
    getWebsiteStatistics,
    deleteWebsiteStatistic,
    (i) => i.id,
    'Could not load statistics from the server.',
    'Could not delete that statistic.',
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebsiteStatistic | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (item: WebsiteStatistic) => {
    setEditing(item);
    setFormOpen(true);
  };
  const handleSaved = async () => {
    setFormOpen(false);
    setEditing(null);
    await reload();
  };

  const columns: DataTableColumn<WebsiteStatistic>[] = [
    {
      key: 'number',
      header: 'Number',
      sortable: true,
      accessor: (item) => item.number,
      render: (item) => <p className="font-semibold text-slate-900">{item.number}</p>,
    },
    {
      key: 'label',
      header: 'Label',
      render: (item) => <span className="text-slate-600">{item.label}</span>,
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
        icon={BarChart3}
        title="Statistics"
        description="Counters shown in the homepage statistics band."
        addLabel="Add statistic"
        onAdd={openCreate}
      />
      <ErrorBanner message={error} />
      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No statistics yet"
        emptyDescription="Add the first statistic to get started."
      />
      {formOpen && (
        <WebsiteStatisticFormModal
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
