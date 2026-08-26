'use client';

import { useState } from 'react';
import { Phone, Pencil, Trash2 } from 'lucide-react';
import { deleteWebsiteContact, getWebsiteContacts, type WebsiteContact } from '@/lib/websiteSettingService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { IconButton } from '@/components/ui/Button';
import { EntityToolbar, ErrorBanner, useEntityList } from './shared';
import WebsiteContactFormModal from './WebsiteContactFormModal';

export default function WebsiteContactTab() {
  const { items, loading, error, deletingId, remove, reload } = useEntityList(
    getWebsiteContacts,
    deleteWebsiteContact,
    (i) => i.id,
    'Could not load contact details from the server.',
    'Could not delete that contact record.',
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebsiteContact | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (item: WebsiteContact) => {
    setEditing(item);
    setFormOpen(true);
  };
  const handleSaved = async () => {
    setFormOpen(false);
    setEditing(null);
    await reload();
  };

  const columns: DataTableColumn<WebsiteContact>[] = [
    {
      key: 'contact',
      header: 'Phone / Email',
      render: (item) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-900">{item.phone || '—'}</p>
          <p className="text-slate-500">{item.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (item) => (
        <span className="line-clamp-1 text-slate-600">
          {[item.addressLine1, item.city, item.state, item.pincode].filter(Boolean).join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'hours',
      header: 'Working hours',
      render: (item) => (
        <div className="text-xs text-slate-600">
          <p>{item.workingDays || '—'}</p>
          <p className="text-slate-400">{item.workingTime || '—'}</p>
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
        icon={Phone}
        title="Contact details"
        description="Contact information shown on the public site."
        addLabel="Add contact"
        onAdd={openCreate}
      />
      <ErrorBanner message={error} />
      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle="No contact details yet"
        emptyDescription="Add contact details to get started."
      />
      {formOpen && (
        <WebsiteContactFormModal
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
