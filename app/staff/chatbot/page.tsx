'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Bot, Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api';
import {
  deleteChatbotEntry,
  getChatbotEntries,
  searchChatbotEntries,
  type ChatbotEntry,
} from '@/lib/chatbotService';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import ChatbotFormModal from '@/components/chatbot/ChatbotFormModal';

export default function StaffChatbotPage() {
  const [items, setItems] = useState<ChatbotEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeSearch, setActiveSearch] = useState('');

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChatbotEntry | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadItems = async () => {
    setLoading(true);
    setError('');
    try {
      const page = await getChatbotEntries();
      setItems(page.content);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load chatbot entries from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    const keyword = searchTerm.trim();
    if (!keyword) return;
    setSearching(true);
    setError('');
    try {
      const results = await searchChatbotEntries(keyword);
      setItems(results);
      setActiveSearch(keyword);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not search chatbot entries.'));
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setActiveSearch('');
    loadItems();
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormModalOpen(true);
  };

  const openEditModal = (item: ChatbotEntry) => {
    setEditingItem(item);
    setFormModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this chatbot entry? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteChatbotEntry(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that entry.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async () => {
    setFormModalOpen(false);
    setEditingItem(null);
    if (activeSearch) {
      setSearching(true);
      try {
        setItems(await searchChatbotEntries(activeSearch));
      } finally {
        setSearching(false);
      }
    } else {
      await loadItems();
    }
  };

  const columns: DataTableColumn<ChatbotEntry>[] = [
    {
      key: 'keyword',
      header: 'Keyword',
      sortable: true,
      accessor: (item) => item.keyword,
      render: (item) => <p className="font-semibold text-slate-900">{item.keyword}</p>,
    },
    {
      key: 'answer',
      header: 'Answer',
      render: (item) => <span className="line-clamp-2 text-slate-600">{item.answer || '—'}</span>,
    },
    {
      key: 'status',
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(item);
            }}
            title="Edit"
            className="rounded-md p-1.5 text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
            disabled={deletingId === item.id}
            title="Delete"
            className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {deletingId === item.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bot}
        title="Chatbot Management"
        description="Manage keyword/answer pairs that power the site chatbot."
        actions={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-premium-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-premium"
          >
            <Plus size={16} /> Add entry
          </button>
        }
      />

      <form onSubmit={handleSearch} className="flex max-w-sm items-center gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by keyword"
            className="h-9 w-full rounded-md border border-slate-200 bg-white pr-3 pl-8 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !searchTerm.trim()}
          title="Search"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
        </button>
        {activeSearch && (
          <button
            type="button"
            onClick={clearSearch}
            title="Clear search"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100"
          >
            <X size={15} />
          </button>
        )}
      </form>

      {error && (
        <div className="animate-fade-in-up rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading}
        emptyTitle={activeSearch ? 'No matching entries' : 'No chatbot entries yet'}
        emptyDescription={
          activeSearch ? `No entries match "${activeSearch}".` : 'Add your first chatbot keyword/answer pair.'
        }
      />

      {formModalOpen && (
        <ChatbotFormModal
          item={editingItem}
          onClose={() => {
            setFormModalOpen(false);
            setEditingItem(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
