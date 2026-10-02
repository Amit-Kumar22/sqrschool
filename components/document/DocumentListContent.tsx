'use client';

import { useCallback, useEffect, useState } from 'react';
import { BadgeCheck, ExternalLink, FileText, Pencil, Search, Trash2, Upload } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  deleteDocument,
  DOCUMENT_TYPES,
  documentTypeLabel,
  getDocuments,
  getMyDocuments,
  resolveDocumentUrl,
  type DocumentType,
  type UserDocument,
} from '@/lib/documentService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import Button, { IconButton } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormField';
import DocumentFormModal from './DocumentFormModal';
import VerifyDocumentModal from './VerifyDocumentModal';

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString() : '—');

type VerifiedFilter = '' | 'true' | 'false';

/**
 * Document list shared by both sides of the documents API:
 * - `mode: 'my'` — the signed-in Student/Parent's own documents (/documents/my),
 *   with upload/edit/delete.
 * - `mode: 'admin'` — one user's documents as seen from the admin panel
 *   (/documents?userId=…), with verify/edit/delete. Admins can't upload on a
 *   user's behalf: the create endpoint always files under the caller.
 */
export default function DocumentListContent(props: { mode: 'my' } | { mode: 'admin'; userId: number }) {
  const isAdmin = props.mode === 'admin';
  const userId = props.mode === 'admin' ? props.userId : undefined;

  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | ''>('');
  const [verifiedFilter, setVerifiedFilter] = useState<VerifiedFilter>('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [formItem, setFormItem] = useState<UserDocument | null | undefined>(undefined);
  const [verifyItem, setVerifyItem] = useState<UserDocument | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Debounce the free-text search so each keystroke doesn't hit the backend.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const documentType = typeFilter || undefined;
      const page = isAdmin
        ? await getDocuments({
            userId,
            documentType,
            verified: verifiedFilter === '' ? undefined : verifiedFilter === 'true',
            search: search || undefined,
          })
        : await getMyDocuments({ documentType });
      setDocuments(page.content ?? []);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load documents from the server.'));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, userId, typeFilter, verifiedFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (doc: UserDocument) => {
    if (!confirm(`Delete "${doc.documentName}"? This cannot be undone.`)) return;
    setDeletingId(doc.id);
    setError('');
    try {
      await deleteDocument(doc.id);
      setDocuments((list) => list.filter((d) => d.id !== doc.id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete this document.'));
    } finally {
      setDeletingId(null);
    }
  };

  const hasFilters = !!typeFilter || !!verifiedFilter || !!searchInput;
  const clearFilters = () => {
    setTypeFilter('');
    setVerifiedFilter('');
    setSearchInput('');
  };

  const columns: DataTableColumn<UserDocument>[] = [
    {
      key: 'documentName',
      header: 'Document',
      sortable: true,
      accessor: (d) => d.documentName,
      render: (d) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <FileText size={15} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{d.documentName}</p>
            <p className="text-xs text-slate-400">{documentTypeLabel(d.documentType)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'documentNumber',
      header: 'Number',
      accessor: (d) => d.documentNumber,
      render: (d) => <span className="text-slate-600">{d.documentNumber || '—'}</span>,
    },
    {
      key: 'verified',
      header: 'Status',
      sortable: true,
      accessor: (d) => (d.verified ? 1 : 0),
      render: (d) => (
        <div>
          <VerifiedBadge verified={d.verified} />
          {d.verified && d.verifiedAt && <p className="mt-1 text-[11px] text-slate-400">on {formatDate(d.verifiedAt)}</p>}
        </div>
      ),
    },
    {
      key: 'remarks',
      header: 'Remarks',
      render: (d) => (
        <span className="line-clamp-2 max-w-56 text-xs text-slate-500" title={d.remarks || undefined}>
          {d.remarks || '—'}
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Uploaded',
      sortable: true,
      accessor: (d) => d.created,
      render: (d) => <span className="whitespace-nowrap text-slate-600">{formatDate(d.created)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: isAdmin ? 'w-36' : 'w-28',
      render: (d) => {
        const url = resolveDocumentUrl(d.fileUrl);
        return (
          <div className="flex items-center justify-end gap-1">
            <IconButton
              icon={ExternalLink}
              label={url ? 'Open file' : 'No file attached'}
              disabled={!url}
              onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}
            />
            {isAdmin && !d.verified && (
              <IconButton icon={BadgeCheck} label="Verify" variant="primary" onClick={() => setVerifyItem(d)} />
            )}
            <IconButton icon={Pencil} label="Edit" onClick={() => setFormItem(d)} />
            <IconButton
              icon={Trash2}
              label="Delete"
              variant="danger"
              loading={deletingId === d.id}
              onClick={() => handleDelete(d)}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="card-premium flex flex-wrap items-end gap-3 px-4 py-3.5">
        {isAdmin && (
          <TextField
            label="Search"
            icon={Search}
            placeholder="Name or number"
            value={searchInput}
            wrapperClassName="w-full sm:w-56"
            onChange={(e) => setSearchInput(e.target.value)}
          />
        )}
        <SelectField
          label="Document type"
          value={typeFilter}
          wrapperClassName="w-full sm:w-56"
          onChange={(e) => setTypeFilter(e.target.value as DocumentType | '')}
        >
          <option value="">All types</option>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {documentTypeLabel(type)}
            </option>
          ))}
        </SelectField>
        {isAdmin && (
          <SelectField
            label="Verification"
            value={verifiedFilter}
            wrapperClassName="w-full sm:w-40"
            onChange={(e) => setVerifiedFilter(e.target.value as VerifiedFilter)}
          >
            <option value="">All</option>
            <option value="true">Verified</option>
            <option value="false">Pending</option>
          </SelectField>
        )}
        {hasFilters && (
          <Button variant="ghost" size="sm" className="mb-0.5" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
        {!isAdmin && (
          <Button icon={Upload} className="ml-auto" onClick={() => setFormItem(null)}>
            Upload document
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={documents}
        rowKey={(d) => d.id}
        loading={loading}
        emptyTitle="No documents yet"
        emptyDescription={
          hasFilters
            ? 'No documents match the selected filters.'
            : isAdmin
              ? 'This user hasn’t uploaded any documents yet.'
              : 'Upload your documents (Aadhaar, birth certificate, TC…) so the school has them on record.'
        }
      />

      {formItem !== undefined && (
        <DocumentFormModal
          item={formItem}
          onClose={() => setFormItem(undefined)}
          onSaved={async () => {
            setFormItem(undefined);
            await load();
          }}
        />
      )}

      {verifyItem && (
        <VerifyDocumentModal
          item={verifyItem}
          onClose={() => setVerifyItem(null)}
          onVerified={async () => {
            setVerifyItem(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
        verified ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-amber-50 text-amber-700 ring-amber-600/20'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${verified ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      {verified ? 'Verified' : 'Pending'}
    </span>
  );
}
