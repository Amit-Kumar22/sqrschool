'use client';

import { useState } from 'react';
import { PanelTop, Pencil, Trash2 } from 'lucide-react';
import { deleteWebsiteHeader, getWebsiteHeaders, type WebsiteHeader } from '@/lib/websiteSettingService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { EntityToolbar, ErrorBanner, ThumbPreview, useEntityList } from './shared';
import WebsiteHeaderFormModal from './WebsiteHeaderFormModal';

export default function WebsiteHeaderTab() {
  const { items, loading, error, deletingId, remove, reload } = useEntityList(
    getWebsiteHeaders,
    deleteWebsiteHeader,
    (i) => i.id,
    'Could not load headers from the server.',
    'Could not delete that header.',
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebsiteHeader | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (item: WebsiteHeader) => {
    setEditing(item);
    setFormOpen(true);
  };
  const handleSaved = async () => {
    setFormOpen(false);
    setEditing(null);
    await reload();
  };

  const columns: DataTableColumn<WebsiteHeader>[] = [
    {
      key: 'logo',
      header: 'Logo',
      widthClassName: 'w-16',
      render: (item) => <ThumbPreview src={item.logoUrl} alt={item.logoAlt} />,
    },
    {
      key: 'logoAlt',
      header: 'Alt text',
      sortable: true,
      accessor: (item) => item.logoAlt,
      render: (item) => <span className="font-medium text-slate-900">{item.logoAlt || '—'}</span>,
    },
    {
      key: 'cta',
      header: 'CTA',
      render: (item) => (
        <div className="text-xs">
          <p className="font-medium text-slate-700">{item.ctaLabel || '—'}</p>
          <p className="text-slate-400">{item.ctaUrl}</p>
        </div>
      ),
    },
    {
      key: 'mobileMenuEnabled',
      header: 'Mobile menu',
      render: (item) => <StatusBadge active={item.mobileMenuEnabled} activeLabel="Enabled" inactiveLabel="Disabled" />,
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
        icon={PanelTop}
        title="Header"
        description="Site logo and top navigation call-to-action."
        addLabel="Add header"
        onAdd={openCreate}
      />
      <ErrorBanner message={error} />
      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No header configured yet"
        emptyDescription="Add the site header to get started."
      />
      {formOpen && (
        <WebsiteHeaderFormModal
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
