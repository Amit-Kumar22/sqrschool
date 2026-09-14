'use client';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
  /** `onDark` flips the text colors for headings that sit inside a primary-filled panel. */
  tone?: 'default' | 'onDark';
  className?: string;
}

/**
 * The site's section heading — a flanked, letter-spaced title when centered,
 * or an eyebrow-over-title stack when left-aligned inside a split section.
 */
export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  tone = 'default',
  className = '',
}: SectionHeadingProps) {
  const titleColor = tone === 'onDark' ? 'text-white' : 'text-heading';
  const eyebrowColor = tone === 'onDark' ? 'text-button-bg' : 'text-primary';
  const bodyColor = tone === 'onDark' ? 'text-white/75' : 'text-ink/65';

  if (align === 'left') {
    return (
      <div className={className}>
        {eyebrow && (
          <p className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] ${eyebrowColor}`}>
            {eyebrow}
            <span className="h-px w-8 bg-current opacity-60" />
          </p>
        )}
        <h2 className={`mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-3xl ${titleColor}`}>{title}</h2>
        {description && <p className={`mt-3 text-sm leading-relaxed sm:text-[15px] ${bodyColor}`}>{description}</p>}
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      {eyebrow && (
        <p className={`text-xs font-bold uppercase tracking-[0.2em] ${eyebrowColor}`}>{eyebrow}</p>
      )}
      <div className="mt-1.5 flex items-center justify-center gap-3">
        <span className={`h-px w-8 ${tone === 'onDark' ? 'bg-white/40' : 'bg-primary/30'} sm:w-14`} />
        <h2 className={`text-xl font-bold uppercase tracking-wide sm:text-2xl ${titleColor}`}>{title}</h2>
        <span className={`h-px w-8 ${tone === 'onDark' ? 'bg-white/40' : 'bg-primary/30'} sm:w-14`} />
      </div>
      {description && (
        <p className={`mx-auto mt-3 max-w-2xl text-sm leading-relaxed ${bodyColor}`}>{description}</p>
      )}
    </div>
  );
}
