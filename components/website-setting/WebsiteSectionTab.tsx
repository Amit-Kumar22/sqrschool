'use client';

import { useState } from 'react';
import { LayoutPanelTop, Pencil, Trash2 } from 'lucide-react';
import { deleteWebsiteSection, getWebsiteSections, type WebsiteSection } from '@/lib/websiteSettingService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { EntityToolbar, ErrorBanner, useEntityList } from './shared';
import WebsiteSectionFormModal from './WebsiteSectionFormModal';

export default function WebsiteSectionTab() {
  const { items, loading, error, deletingId, remove, reload } = useEntityList(
    getWebsiteSections,
    deleteWebsiteSection,
    (i) => i.id,
    'Could not load sections from the server.',
    'Could not delete that section.',
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebsiteSection | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (item: WebsiteSection) => {
    setEditing(item);
    setFormOpen(true);
  };
  const handleSaved = async () => {
    setFormOpen(false);
    setEditing(null);
    await reload();
  };

  const columns: DataTableColumn<WebsiteSection>[] = [
    {
      key: 'title',
      header: 'Section',
      sortable: true,
      accessor: (item) => item.title,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.title}</p>
          <p className="text-xs text-slate-500">{item.eyebrow || '—'}</p>
        </div>
      ),
    },
    {
      key: 'sectionType',
      header: 'Type',
      sortable: true,
      accessor: (item) => item.sectionType,
      render: (item) => (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{item.sectionType}</span>
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
      key: 'enabled',
      header: 'Status',
      sortable: true,
      accessor: (item) => (item.enabled ? 1 : 0),
      render: (item) => <StatusBadge active={item.enabled} activeLabel="Enabled" inactiveLabel="Disabled" />,
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
        icon={LayoutPanelTop}
        title="Sections"
        description="Content sections shown on the public site."
        addLabel="Add section"
        onAdd={openCreate}
      />
      <ErrorBanner message={error} />
      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No sections yet"
        emptyDescription="Add the first section to get started."
      />
      {formOpen && (
        <WebsiteSectionFormModal
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
