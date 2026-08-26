'use client';

import { useState } from 'react';
import { Share2, Pencil, Trash2 } from 'lucide-react';
import { deleteWebsiteSocialLink, getWebsiteSocialLinks, type WebsiteSocialLink } from '@/lib/websiteSettingService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { EntityToolbar, ErrorBanner, useEntityList } from './shared';
import WebsiteSocialLinkFormModal from './WebsiteSocialLinkFormModal';

export default function WebsiteSocialLinkTab() {
  const { items, loading, error, deletingId, remove, reload } = useEntityList(
    getWebsiteSocialLinks,
    deleteWebsiteSocialLink,
    (i) => i.id,
    'Could not load social links from the server.',
    'Could not delete that social link.',
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebsiteSocialLink | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (item: WebsiteSocialLink) => {
    setEditing(item);
    setFormOpen(true);
  };
  const handleSaved = async () => {
    setFormOpen(false);
    setEditing(null);
    await reload();
  };

  const columns: DataTableColumn<WebsiteSocialLink>[] = [
    {
      key: 'platform',
      header: 'Platform',
      sortable: true,
      accessor: (item) => item.platform,
      render: (item) => (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{item.platform}</span>
      ),
    },
    {
      key: 'url',
      header: 'URL',
      render: (item) => <span className="line-clamp-1 text-slate-600">{item.url}</span>,
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
        icon={Share2}
        title="Social links"
        description="Social media links shown in the site footer/header."
        addLabel="Add link"
        onAdd={openCreate}
      />
      <ErrorBanner message={error} />
      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No social links yet"
        emptyDescription="Add the first link to get started."
      />
      {formOpen && (
        <WebsiteSocialLinkFormModal
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
