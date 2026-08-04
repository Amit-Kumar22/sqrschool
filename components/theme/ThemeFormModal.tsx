'use client';

import { FormEvent, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { apiErrorMessage, createTheme, updateTheme, type Theme, type ThemePayload } from '@/lib/api';
import { DEFAULT_THEME } from '@/contexts/ThemeContext';
import type { ThemePreset } from '@/lib/themePresets';
import { COLOR_FIELD_GROUPS, HEX_COLOR_REGEX, type ColorFieldKey } from './themeFields';

type FormState = Omit<ThemePayload, 'id'>;

function toFormState(theme: Theme | null, preset?: ThemePreset | null): FormState {
  if (theme) {
    const { id: _id, isActive: _isActive, ...rest } = theme;
    return rest;
  }
  const { id: _id, isActive: _isActive, themeName: _themeName, ...rest } = DEFAULT_THEME;
  if (preset) {
    return { ...rest, ...preset.colors, themeName: preset.label };
  }
  return { ...rest, themeName: '' };
}

export default function ThemeFormModal({
  theme,
  preset,
  onClose,
  onSaved,
}: {
  theme: Theme | null;
  /** Pre-fills a new theme's colors from a gallery pick (ignored when editing). */
  preset?: ThemePreset | null;
  onClose: () => void;
  onSaved: (theme: Theme) => void;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(theme, preset));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!theme;
  const setColor = (key: ColorFieldKey, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.themeName.trim()) {
      setError('Theme name is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const saved = isEditing ? await updateTheme(theme!.id, form) : await createTheme(form);
      onSaved(saved);
    } catch (err) {
      setError(apiErrorMessage(err, `Failed to ${isEditing ? 'update' : 'create'} theme.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4 py-8 backdrop-blur-sm">
      <div className="animate-scale-in w-full max-w-2xl rounded-2xl bg-white shadow-premium-lg">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            {isEditing ? `Edit "${theme!.themeName}"` : 'Create new theme'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="scrollbar-thin max-h-[75vh] overflow-y-auto px-5 py-4">
          {/* Live preview — reflects the theme colors being edited, not the admin chrome */}
          <div
            className="mb-5 overflow-hidden rounded-lg border border-slate-200"
            style={{ backgroundColor: form.backgroundColor, color: form.textColor }}
          >
            <div
              className="flex items-center justify-between px-3 py-2 text-sm font-medium"
              style={{ backgroundColor: form.navbarBgColor, color: form.navbarTextColor }}
            >
              <span>{form.companyName || 'Preview navbar'}</span>
              <span
                className="rounded px-2 py-1 text-xs font-semibold"
                style={{ backgroundColor: form.buttonBgColor, color: form.buttonTextColor }}
              >
                Button
              </span>
            </div>
            <div className="px-3 py-3 text-sm">
              <p className="font-semibold" style={{ color: form.headingColor }}>
                Heading preview
              </p>
              <p className="mt-1 text-xs">
                Body text with a <span style={{ color: form.linkColor }}>link example</span>.
              </p>
            </div>
            <div
              className="px-3 py-2 text-xs"
              style={{ backgroundColor: form.footerBgColor, color: form.footerTextColor }}
            >
              Footer preview
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-900">Theme name *</span>
              <input
                required
                value={form.themeName}
                onChange={(e) => setForm((f) => ({ ...f, themeName: e.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                placeholder="e.g. Spring Term"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-slate-900">Theme type</span>
              <input
                value={form.themeType}
                onChange={(e) => setForm((f) => ({ ...f, themeType: e.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                placeholder="e.g. LIGHT"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1.5 block font-medium text-slate-900">Company name</span>
              <input
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                placeholder="e.g. SQR School"
              />
            </label>
          </div>

          <div className="mt-5 space-y-5">
            {COLOR_FIELD_GROUPS.map((group) => (
              <div key={group.title}>
                <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">{group.title}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {group.fields.map((field) => (
                    <ColorInput
                      key={field.key}
                      label={field.label}
                      value={form[field.key]}
                      onChange={(value) => setColor(field.key, value)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-premium-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-premium disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Create theme'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const safeValue = HEX_COLOR_REGEX.test(value) ? value : '#000000';

  return (
    <label className="block text-xs">
      <span className="mb-1 block font-medium text-slate-600">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={safeValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 shrink-0 cursor-pointer rounded border border-slate-200"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-full min-w-0 rounded border border-slate-200 px-2 font-mono text-xs focus:border-indigo-500 focus:outline-none"
          placeholder="#000000"
        />
      </div>
    </label>
  );
}
