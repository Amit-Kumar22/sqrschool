'use client';

interface HeroDotsProps {
  count: number;
  index: number;
  onSelect: (index: number) => void;
  className?: string;
}

/** Slide pager shared by the template heroes — inherits its inactive color from the text color around it. */
export default function HeroDots({ count, index, onSelect, className = '' }: HeroDotsProps) {
  if (count < 2) return null;

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect(idx)}
          aria-label={`Go to slide ${idx + 1}`}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            idx === index ? 'w-7 bg-button-bg' : 'w-1.5 bg-current opacity-40 hover:opacity-70'
          }`}
        />
      ))}
    </div>
  );
}
