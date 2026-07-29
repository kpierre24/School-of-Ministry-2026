import React, { useState } from 'react';
import hteimLogoAsset from '../assets/hteim_logo.jpg';

interface LogoImageProps {
  className?: string;
  alt?: string;
  onClick?: () => void;
}

export const LogoImage: React.FC<LogoImageProps> = ({
  className = "w-16 h-16 rounded-2xl border-2 border-amber-400 shadow-xl object-contain bg-white p-1",
  alt = "HTEIM School of Ministry Logo",
  onClick
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div 
        onClick={onClick}
        className={`${className} flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-indigo-950 text-amber-400 font-extrabold text-center select-none cursor-pointer p-1 overflow-hidden`}
        title={alt}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="55" r="30" fill="#0284c7" stroke="#10b981" strokeWidth="4" />
          <path d="M 35,45 Q 50,30 65,45" fill="none" stroke="#10b981" strokeWidth="6" />
          <path d="M 20,25 Q 50,5 80,25 Q 60,35 50,20" fill="none" stroke="#f59e0b" strokeWidth="4" />
          <text x="50" y="92" textAnchor="middle" fill="#f59e0b" fontSize="12" fontWeight="900" fontFamily="sans-serif">HTEIM</text>
        </svg>
      </div>
    );
  }

  return (
    <img
      src={hteimLogoAsset}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      onClick={onClick}
    />
  );
};

export default LogoImage;
