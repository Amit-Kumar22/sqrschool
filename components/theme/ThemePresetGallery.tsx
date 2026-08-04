'use client';

import { Sparkles, Wand2 } from 'lucide-react';
import { THEME_PRESETS, type ThemePreset } from '@/lib/themePresets';

/**
 * Visual picker for the curated palettes in lib/themePresets.ts — intentionally
 * a card grid (not a DataTable) since these are swatches to browse and pick
 * from, not records to manage. Selecting one hands its colors up to the
 * parent, which pre-fills the create-theme form. Chrome uses the fixed admin
 * palette; only the swatches themselves show each preset's real colors.
 */
export default function ThemePresetGallery({ onUse }: { onUse: (preset: ThemePreset) => void }) {
  return (
    <div className="card-premium p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-indigo-600" />
        <h2 className="text-sm font-semibold text-slate-900">Recommended presets</h2>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Professionally paired palettes — pick one to start a new theme, then fine-tune any color.
      </p>

      <div className="mt-4 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {THEME_PRESETS.map((preset, idx) => (
          <div
            key={preset.key}
            style={{ animationDelay: `${idx * 45}ms` }}
            className={`animate-fade-in-up group relative flex flex-col overflow-hidden rounded-xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-premium-lg ${
              preset.recommended ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-200'
            }`}
          >
            {preset.recommended && (
              <span className="absolute top-2 right-2 z-10 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-premium-sm">
                Recommended
              </span>
            )}

            <div
              className="flex h-16 w-full items-end gap-1 p-2"
              style={{ backgroundColor: preset.colors.navbarBgColor }}
            >
              {[preset.colors.primaryColor, preset.colors.buttonBgColor, preset.colors.linkColor, preset.colors.secondaryColor].map(
                (c, i) => (
                  <span
                    key={i}
                    className="h-6 flex-1 rounded-sm shadow-premium-sm transition-transform duration-300 group-hover:-translate-y-0.5"
                    style={{ backgroundColor: c, transitionDelay: `${i * 30}ms` }}
                  />
                ),
              )}
            </div>

            <div className="flex flex-1 flex-col p-3.5">
              <p className="text-sm font-semibold text-slate-900">{preset.label}</p>
              <p className="mt-1 line-clamp-2 flex-1 text-xs text-slate-500">{preset.description}</p>
              <button
                type="button"
                onClick={() => onUse(preset)}
                className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-600 hover:text-white"
              >
                <Wand2 size={13} /> Use this preset
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
