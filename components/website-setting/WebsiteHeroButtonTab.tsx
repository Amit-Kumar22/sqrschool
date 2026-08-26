'use client';

import { useEffect, useState } from 'react';
import { MousePointerClick, Pencil, Trash2 } from 'lucide-react';
import {
  deleteWebsiteHeroButton,
  getWebsiteHeroButtons,
  getWebsiteHeroSlides,
  type WebsitePage,
  type WebsiteHeroButton,
  type WebsiteHeroSlide,
} from '@/lib/websiteSettingService';
import DataTable, { type DataTableColumn } from '@/components/ui/DataTable';
import { IconButton } from '@/components/ui/Button';
import { SelectField } from '@/components/ui/FormField';
import { EntityToolbar, ErrorBanner, useEntityList } from './shared';
import WebsiteHeroButtonFormModal from './WebsiteHeroButtonFormModal';

const EMPTY_PAGE: WebsitePage<WebsiteHeroButton> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  pageNumber: 0,
  pageSize: 0,
  last: true,
};

export default function WebsiteHeroButtonTab() {
  const [heroSlides, setHeroSlides] = useState<WebsiteHeroSlide[]>([]);
  const [heroSlidesLoading, setHeroSlidesLoading] = useState(false);
  const [slideFilter, setSlideFilter] = useState<number | ''>('');

  useEffect(() => {
    const loadHeroSlides = async () => {
      setHeroSlidesLoading(true);
      try {
        const content = (await getWebsiteHeroSlides()).content;
        setHeroSlides(content);
        // The backend requires heroSlideId on the list endpoint — there's no
        // "all slides" view, so default to the first slide as soon as one exists.
        setSlideFilter((current) => (current === '' && content.length > 0 ? content[0].id : current));
      } catch {
        setHeroSlides([]);
      } finally {
        setHeroSlidesLoading(false);
      }
    };
    loadHeroSlides();
  }, []);

  // heroSlideId is a required query param on the backend — never call the
  // list endpoint without one, or it 400s ("Required request parameter
  // 'heroSlideId' ... is not present").
  const { items, loading, error, deletingId, remove, reload } = useEntityList(
    () => (slideFilter ? getWebsiteHeroButtons({ heroSlideId: slideFilter }) : Promise.resolve(EMPTY_PAGE)),
    deleteWebsiteHeroButton,
    (i) => i.id,
    'Could not load hero buttons from the server.',
    'Could not delete that hero button.',
  );

  // Re-fetch whenever the slide filter changes.
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideFilter]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WebsiteHeroButton | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (item: WebsiteHeroButton) => {
    setEditing(item);
    setFormOpen(true);
  };
  const handleSaved = async () => {
    setFormOpen(false);
    setEditing(null);
    await reload();
  };

  const columns: DataTableColumn<WebsiteHeroButton>[] = [
    {
      key: 'label',
      header: 'Button',
      sortable: true,
      accessor: (item) => item.label,
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-900">{item.label}</p>
          <p className="text-xs text-slate-500">{item.heroSlide?.title ?? `Slide #${item.heroSlideId}`}</p>
        </div>
      ),
    },
    {
      key: 'style',
      header: 'Style',
      render: (item) => (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{item.style}</span>
      ),
    },
    {
      key: 'url',
      header: 'URL',
      render: (item) => <span className="line-clamp-1 text-slate-600">{item.url || '—'}</span>,
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
        icon={MousePointerClick}
        title="Hero buttons"
        description="Call-to-action buttons on the hero slides."
        addLabel="Add button"
        onAdd={openCreate}
        disabled={heroSlidesLoading || heroSlides.length === 0}
      />

      <SelectField
        label="Hero slide"
        hint="Hero buttons belong to one slide — pick a slide to see its buttons."
        wrapperClassName="max-w-xs"
        disabled={heroSlides.length === 0}
        value={slideFilter}
        onChange={(e) => setSlideFilter(e.target.value ? Number(e.target.value) : '')}
      >
        {heroSlides.length === 0 && <option value="">No hero slides yet</option>}
        {heroSlides.map((slide) => (
          <option key={slide.id} value={slide.id}>
            {slide.title}
          </option>
        ))}
      </SelectField>

      <ErrorBanner message={error} />
      <DataTable
        columns={columns}
        data={items}
        rowKey={(item) => item.id}
        loading={loading || heroSlidesLoading}
        emptyTitle="No hero buttons yet"
        emptyDescription={heroSlides.length === 0 ? 'Add a hero slide before adding a button.' : 'Add the first button to get started.'}
      />
      {formOpen && (
        <WebsiteHeroButtonFormModal
          item={editing}
          heroSlides={heroSlides}
          defaultHeroSlideId={slideFilter}
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
