'use client';

import { ReactNode, useState } from 'react';

interface FlipCardProps {
  front: ReactNode;
  back: ReactNode;
  className?: string;
  /** Delay (ms) for the entrance animation of the card itself. */
  style?: React.CSSProperties;
}

/**
 * A 3D flip card: hovers to reveal the back face on desktop, and toggles
 * on tap on touch devices (CSS-only :hover is unreliable on touch, so
 * flip state is tracked in React and mirrored via a class).
 */
export default function FlipCard({ front, back, className = '', style }: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={`flip-card cursor-pointer ${className}`}
      style={style}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped((v) => !v)}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setFlipped((v) => !v);
        }
      }}
    >
      <div className={`flip-card-inner ${flipped ? 'is-flipped' : ''}`}>
        <div className="flip-card-face flip-card-face-front">{front}</div>
        <div className="flip-card-face flip-card-face-back">{back}</div>
      </div>
    </div>
  );
}
