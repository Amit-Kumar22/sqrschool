'use client';

import { useState } from 'react';
import { SlidersHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  deleteWebsiteFloatingSetting,
  getWebsiteFloatingSettings,
  type WebsiteFloatingSetting,
} from '@/lib/websiteSettingService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/Button';
import { EntityToolbar, ErrorBanner, useEntityList } from './shared';
import WebsiteFloatingSettingFormModal from './WebsiteFloatingSettingFormModal';

export default function WebsiteFloatingSettingTab() {
  const { items, loading, error, deletingId, remove, reload } = useEntityList(
    getWebsiteFloatingSettings,
    deleteWebsiteFloatingSetting,
    (i) => i.id,
    'Could not load floating widget settings from the server.',
    'Could not delete that record.',
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebsiteFloatingSetting | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (item: WebsiteFloatingSetting) => {
    setEditing(item);
    setFormOpen(true);
  };
  const handleSaved = async () => {
    setFormOpen(false);
    setEditing(null);
    await reload();
  };

  const columns: DataTableColumn<WebsiteFloatingSetting>[] = [
    {
      key: 'backToTop',
      header: 'Back to top',
      render: (item) => <StatusBadge active={item.backToTopEnabled} activeLabel="On" inactiveLabel="Off" />,
    },
    {
      key: 'whatsapp',
      header: 'WhatsApp',
      render: (item) => (
        <div className="flex items-center gap-2">
          <StatusBadge active={item.whatsappEnabled} activeLabel="On" inactiveLabel="Off" />
          <span className="text-xs text-slate-500">{item.whatsappPhone || '—'}</span>
        </div>
      ),
    },
    {
      key: 'quickEnquiry',
      header: 'Quick enquiry',
      render: (item) => (
        <div className="flex items-center gap-2">
          <StatusBadge active={item.quickEnquiryEnabled} activeLabel="On" inactiveLabel="Off" />
          <span className="text-xs text-slate-500">{item.quickEnquiryLabel || '—'}</span>
        </div>
      ),
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
        icon={SlidersHorizontal}
        title="Floating widgets"
        description="Back-to-top, WhatsApp and quick-enquiry floating buttons."
        addLabel="Add settings"
        onAdd={openCreate}
      />
      <ErrorBanner message={error} />
      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No floating widget settings yet"
        emptyDescription="Add settings to get started."
      />
      {formOpen && (
        <WebsiteFloatingSettingFormModal
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
