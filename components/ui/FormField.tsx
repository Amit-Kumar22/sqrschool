import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const inputBase =
  'h-10 w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-700 shadow-premium-sm transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none';

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="mb-1.5 block font-medium text-slate-700 transition-colors group-focus-within:text-indigo-600">
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </span>
  );
}

function FieldHint({ hint }: { hint?: string }) {
  if (!hint) return null;
  return <span className="mt-1 block text-xs text-slate-400">{hint}</span>;
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  icon?: LucideIcon;
  wrapperClassName?: string;
}

export function TextField({ label, hint, icon: Icon, required, wrapperClassName, className, ...rest }: TextFieldProps) {
  return (
    <label className={`group block text-sm ${wrapperClassName ?? ''}`}>
      <FieldLabel label={label} required={required} />
      <div className="relative">
        {Icon && (
          <Icon
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500"
          />
        )}
        <input
          required={required}
          {...rest}
          className={`${inputBase} ${Icon ? 'pl-9 pr-3' : 'px-3'} ${className ?? ''}`}
        />
      </div>
      <FieldHint hint={hint} />
    </label>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  wrapperClassName?: string;
  children: ReactNode;
}

export function SelectField({ label, hint, required, wrapperClassName, className, children, ...rest }: SelectFieldProps) {
  return (
    <label className={`group block text-sm ${wrapperClassName ?? ''}`}>
      <FieldLabel label={label} required={required} />
      <div className="relative">
        <select required={required} {...rest} className={`${inputBase} appearance-none px-3 pr-9 ${className ?? ''}`}>
          {children}
        </select>
        <ChevronDown
          size={15}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-500"
        />
      </div>
      <FieldHint hint={hint} />
    </label>
  );
}

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  wrapperClassName?: string;
}

export function TextareaField({ label, hint, required, wrapperClassName, className, rows = 3, ...rest }: TextareaFieldProps) {
  return (
    <label className={`group block text-sm ${wrapperClassName ?? ''}`}>
      <FieldLabel label={label} required={required} />
      <textarea required={required} rows={rows} {...rest} className={`${inputBase} h-auto resize-none px-3 py-2 ${className ?? ''}`} />
      <FieldHint hint={hint} />
    </label>
  );
}
