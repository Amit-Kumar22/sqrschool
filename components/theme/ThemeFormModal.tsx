'use client';

import { FormEvent, useState } from 'react';
import { Palette } from 'lucide-react';
import { apiErrorMessage, createTheme, updateTheme, type Theme, type ThemePayload } from '@/lib/api';
import { DEFAULT_THEME } from '@/contexts/ThemeContext';
import type { ThemePreset } from '@/lib/themePresets';
import { COLOR_FIELD_GROUPS, HEX_COLOR_REGEX, type ColorFieldKey } from './themeFields';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormField';

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
    <Modal
      icon={Palette}
      title={isEditing ? `Edit "${theme!.themeName}"` : 'Create new theme'}
      subtitle={isEditing ? 'Update this theme.' : 'Design a new color theme.'}
      accent="amber"
      size="lg"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="theme-form" loading={saving}>
            {isEditing ? 'Save changes' : 'Create theme'}
          </Button>
        </>
      }
    >
      <form id="theme-form" onSubmit={handleSubmit}>
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
          <TextField
            label="Theme name"
            required
            value={form.themeName}
            onChange={(e) => setForm((f) => ({ ...f, themeName: e.target.value }))}
            placeholder="e.g. Spring Term"
          />
          <TextField
            label="Theme type"
            value={form.themeType}
            onChange={(e) => setForm((f) => ({ ...f, themeType: e.target.value }))}
            placeholder="e.g. LIGHT"
          />
          <TextField
            label="Company name"
            value={form.companyName}
            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
            placeholder="e.g. SQR School"
            wrapperClassName="sm:col-span-2"
          />
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
          <div className="mt-4 animate-fade-in-up rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
        )}
      </form>
    </Modal>
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
