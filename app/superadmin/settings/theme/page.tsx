'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Palette, Pencil, Plus, Trash2 } from 'lucide-react';
import { activateTheme, apiErrorMessage, deleteTheme, getThemes, type Theme } from '@/lib/api';
import { useTheme as useActiveTheme } from '@/contexts/ThemeContext';
import type { ThemePreset } from '@/lib/themePresets';
import PageHeader from '@/components/ui/PageHeader';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/Badge';
import ThemePresetGallery from '@/components/theme/ThemePresetGallery';
import ThemeFormModal from '@/components/theme/ThemeFormModal';

const SWATCH_KEYS: (keyof Theme)[] = ['secondaryColor', 'buttonBgColor', 'navbarBgColor', 'footerBgColor'];

export default function ThemeSettingsPage() {
  const { refresh: refreshActiveTheme } = useActiveTheme();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [presetSeed, setPresetSeed] = useState<ThemePreset | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadThemes = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getThemes();
      setThemes(list);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load themes from the server.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThemes();
  }, []);

  const handleSetDefault = async (id: number) => {
    setActivatingId(id);
    setError('');
    try {
      await activateTheme(id);
      await Promise.all([loadThemes(), refreshActiveTheme()]);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not set that theme as default.'));
    } finally {
      setActivatingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this theme? This cannot be undone.')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteTheme(id);
      setThemes((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete that theme.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = async (saved?: Theme | null) => {
    setModalOpen(false);
    setEditingTheme(null);
    setPresetSeed(null);
    await loadThemes();
    if (saved?.isActive) await refreshActiveTheme();
  };

  const openCreateModal = () => {
    setEditingTheme(null);
    setPresetSeed(null);
    setModalOpen(true);
  };

  const columns: DataTableColumn<Theme>[] = [
    {
      key: 'themeName',
      header: 'Theme',
      sortable: true,
      accessor: (theme) => theme.themeName,
      render: (theme) => <p className="font-semibold text-slate-900">{theme.themeName}</p>,
    },
    {
      key: 'companyName',
      header: 'Company Name',
      sortable: true,
      accessor: (theme) => theme.companyName,
      render: (theme) => <span className="text-slate-600">{theme.companyName || '—'}</span>,
    },
    {
      key: 'preview',
      header: 'Color Preview',
      widthClassName: 'w-32',
      render: (theme) => (
        <div className="flex gap-1">
          {SWATCH_KEYS.map((key) => (
            <span
              key={key}
              title={key}
              className="h-6 w-6 rounded-md border border-slate-200 shadow-premium-sm"
              style={{ backgroundColor: (theme[key] as string) || '#e5e7eb' }}
            />
          ))}
        </div>
      ),
    },
    {
      key: 'primaryColor',
      header: 'Primary Color',
      sortable: true,
      accessor: (theme) => theme.primaryColor,
      render: (theme) => (
        <div className="flex items-center gap-2">
          <span
            className="h-4 w-4 shrink-0 rounded-full border border-slate-200 shadow-premium-sm"
            style={{ backgroundColor: theme.primaryColor || '#e5e7eb' }}
          />
          <span className="font-mono text-xs text-slate-500">{theme.primaryColor}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      accessor: (theme) => (theme.isActive ? 1 : 0),
      render: (theme) => <StatusBadge active={theme.isActive} activeLabel="Active" inactiveLabel="Inactive" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      widthClassName: 'w-28',
      render: (theme) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSetDefault(theme.id);
            }}
            title="Set as default theme"
            className="rounded-md p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50"
          >
            {activatingId === theme.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditingTheme(theme);
              setPresetSeed(null);
              setModalOpen(true);
            }}
            title="Edit theme"
            className="rounded-md p-1.5 text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(theme.id);
            }}
            disabled={deletingId === theme.id}
            title="Delete theme"
            className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {deletingId === theme.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Palette}
        title="Theme & Branding"
        description="Control the color palette and background used across the whole site — pick a preset or design your own."
        actions={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-premium-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-premium"
          >
            <Plus size={16} /> New theme
          </button>
        }
      />

      {error && (
        <div className="animate-fade-in-up rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Your themes</h2>
        <DataTable
          columns={columns}
          data={themes}
          rowKey={(theme) => theme.id}
          loading={loading}
          emptyTitle="No themes yet"
          emptyDescription="Pick a preset below or create your first theme to customize the site's look."
        />
      </div>

      <ThemePresetGallery
        onUse={(preset) => {
          setEditingTheme(null);
          setPresetSeed(preset);
          setModalOpen(true);
        }}
      />

      {modalOpen && (
        <ThemeFormModal
          theme={editingTheme}
          preset={presetSeed}
          onClose={() => {
            setModalOpen(false);
            setEditingTheme(null);
            setPresetSeed(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
