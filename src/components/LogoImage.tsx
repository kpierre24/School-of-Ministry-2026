import React, { useState } from 'react';
import hteimLogoAsset from '../assets/hteim_logo.png';

/**
 * Canonical logo sizes used across the app.
 * - xs  : 24px  — inline footer / watermark
 * - sm  : 40px  — nav bar header
 * - md  : 56px  — cards, list headers
 * - lg  : 64px  — modals, settings panel
 * - xl  : 80px  — hero / splash screen
 * - 2xl : 96px  — large feature cards
 */
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Shape of the logo container */
export type LogoShape = 'circle' | 'rounded' | 'square';

interface LogoImageProps {
  /** Predefined size variant — overridden by className if both supplied */
  size?: LogoSize;
  /** Container shape */
  shape?: LogoShape;
  /** Tailwind classes that fully override the default container classes */
  className?: string;
  alt?: string;
  onClick?: () => void;
  /** Extra wrapper classes (flex-shrink-0, shadow, etc.) added on top of base */
  wrapperClassName?: string;
}

const SIZE_MAP: Record<LogoSize, string> = {
  xs:  'w-6  h-6',
  sm:  'w-10 h-10',
  md:  'w-14 h-14',
  lg:  'w-16 h-16',
  xl:  'w-20 h-20',
  '2xl': 'w-24 h-24',
};

const SHAPE_MAP: Record<LogoShape, string> = {
  circle:  'rounded-full',
  rounded: 'rounded-2xl',
  square:  'rounded-md',
};

/** Fallback SVG rendered when the image fails to load */
const FallbackLogo: React.FC<{ className?: string; onClick?: () => void }> = ({ className, onClick }) => (
  <div
    onClick={onClick}
    className={`${className} flex items-center justify-center bg-gradient-to-b from-slate-900 to-indigo-950 select-none cursor-pointer overflow-hidden`}
    title="HTEIM School of Ministry"
  >
    <svg viewBox="0 0 100 100" className="w-full h-full p-1">
      {/* Globe */}
      <circle cx="50" cy="58" r="28" fill="#0284c7" stroke="#10b981" strokeWidth="3" />
      {/* Africa continent shape simplified */}
      <path d="M44,38 Q50,30 56,38 L58,55 Q55,68 50,72 Q45,68 42,55 Z" fill="#16a34a" stroke="#fff" strokeWidth="1.5" />
      {/* Gold ring */}
      <circle cx="50" cy="58" r="34" fill="none" stroke="#d97706" strokeWidth="6" />
      {/* Hand hint */}
      <path d="M38,24 Q50,14 62,24" fill="none" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
      {/* Label */}
      <text x="50" y="97" textAnchor="middle" fill="#d97706" fontSize="9" fontWeight="900" fontFamily="sans-serif">HTEIM</text>
    </svg>
  </div>
);

export const LogoImage: React.FC<LogoImageProps> = ({
  size = 'lg',
  shape = 'rounded',
  className,
  alt = 'HTEIM School of Ministry Logo',
  onClick,
  wrapperClassName = '',
}) => {
  const [hasError, setHasError] = useState(false);

  // If className is fully supplied, use it as-is (backward compat).
  // Otherwise compose from size + shape presets.
  const resolvedClass = className ?? [
    SIZE_MAP[size],
    SHAPE_MAP[shape],
    'border-2 border-amber-400 shadow-md object-contain bg-white p-0.5',
    wrapperClassName,
  ].join(' ');

  if (hasError) {
    return <FallbackLogo className={resolvedClass} onClick={onClick} />;
  }

  return (
    <img
      src={hteimLogoAsset}
      alt={alt}
      className={resolvedClass}
      onError={() => setHasError(true)}
      onClick={onClick}
      draggable={false}
      referrerPolicy="no-referrer"
    />
  );
};

export default LogoImage;
