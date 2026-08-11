import React, { useId } from 'react';

interface LogoImageProps {
  className?: string;
  alt?: string;
  onClick?: () => void;
}

export const LogoImage: React.FC<LogoImageProps> = ({
  className = "w-10 h-10 shrink-0",
  alt = "HTEIM School of Ministry Logo",
  onClick
}) => {
  const uid = useId().replace(/:/g, '');
  const bgGradId = `bgGrad_${uid}`;
  const goldGradId = `goldGrad_${uid}`;
  const globeGradId = `globeGrad_${uid}`;
  const beamGradId = `beamGrad_${uid}`;

  return (
    <svg
      viewBox="0 0 500 500"
      className={className}
      onClick={onClick}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={alt}
    >
      <title>{alt}</title>
      <defs>
        <linearGradient id={bgGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="50%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>

        <linearGradient id={goldGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="30%" stopColor="#F59E0B" />
          <stop offset="70%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        <radialGradient id={globeGradId} cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="70%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0369A1" />
        </radialGradient>

        <linearGradient id={beamGradId} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#FDE047" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
        </linearGradient>

        <path id={`textArcTop_${uid}`} d="M 75,250 A 175,175 0 1,1 425,250" fill="none" />
        <path id={`textArcBottom_${uid}`} d="M 425,250 A 175,175 0 0,1 75,250" fill="none" />
      </defs>

      {/* Outer Circle Background */}
      <circle cx="250" cy="250" r="235" fill={`url(#${bgGradId})`} stroke={`url(#${goldGradId})`} strokeWidth="8" />

      {/* Inner Accent Ring */}
      <circle cx="250" cy="250" r="195" fill="none" stroke={`url(#${goldGradId})`} strokeWidth="3" strokeDasharray="8 4" />
      <circle cx="250" cy="250" r="185" fill="#090D16" stroke={`url(#${goldGradId})`} strokeWidth="4" />

      {/* Circular Text */}
      <text fill={`url(#${goldGradId})`} fontFamily="Arial, sans-serif" fontWeight="900" fontSize="19" letterSpacing="3">
        <textPath href={`#textArcTop_${uid}`} startOffset="50%" textAnchor="middle">
          HEAVEN TOUCHING EARTH
        </textPath>
      </text>

      <text fill="#FFFFFF" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="15" letterSpacing="2">
        <textPath href={`#textArcBottom_${uid}`} startOffset="50%" textAnchor="middle">
          INT'L MINISTRIES • SCHOOL OF MINISTRY
        </textPath>
      </text>

      {/* Decorative Stars */}
      <polygon points="75,250 80,240 91,240 82,233 85,222 75,229 65,222 68,233 59,240 70,240" fill={`url(#${goldGradId})`} />
      <polygon points="425,250 430,240 441,240 432,233 435,222 425,229 415,222 418,233 409,240 420,240" fill={`url(#${goldGradId})`} />

      {/* Center Core (Globe & Cross) */}
      <g transform="translate(0, 5)">
        <circle cx="250" cy="250" r="135" fill={`url(#${globeGradId})`} stroke={`url(#${goldGradId})`} strokeWidth="4" />

        {/* Globe Grid */}
        <ellipse cx="250" cy="250" rx="135" ry="50" fill="none" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="2" />
        <ellipse cx="250" cy="250" rx="135" ry="90" fill="none" stroke="#FFFFFF" strokeOpacity="0.25" strokeWidth="2" />
        <ellipse cx="250" cy="250" rx="60" ry="135" fill="none" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="2" />
        <line x1="115" y1="250" x2="385" y2="250" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="2" />
        <line x1="250" y1="115" x2="250" y2="385" stroke="#FFFFFF" strokeOpacity="0.3" strokeWidth="2" />

        {/* Continents */}
        <path d="M 170,210 Q 190,190 220,205 T 240,240 Q 220,260 190,250 Z" fill="#10B981" fillOpacity="0.5" />
        <path d="M 270,220 Q 310,200 330,230 T 310,280 Q 280,290 260,250 Z" fill="#10B981" fillOpacity="0.5" />
        <path d="M 210,285 Q 240,280 250,310 T 230,350 Q 200,340 200,310 Z" fill="#10B981" fillOpacity="0.5" />

        {/* Ray of Light */}
        <polygon points="250,115 220,385 280,385" fill={`url(#${beamGradId})`} />

        {/* Open Bible */}
        <g transform="translate(250, 325)">
          <path d="M 0,10 Q -35,-5 -70,5 L -70,35 Q -35,25 0,40 Z" fill="#FFFFFF" stroke="#D97706" strokeWidth="2" />
          <path d="M 0,10 Q 35,-5 70,5 L 70,35 Q 35,25 0,40 Z" fill="#F8FAFC" stroke="#D97706" strokeWidth="2" />
          <line x1="-55" y1="18" x2="-15" y2="12" stroke="#94A3B8" strokeWidth="2" />
          <line x1="-55" y1="25" x2="-15" y2="19" stroke="#94A3B8" strokeWidth="2" />
          <line x1="15" y1="12" x2="55" y2="18" stroke="#94A3B8" strokeWidth="2" />
          <line x1="15" y1="19" x2="55" y2="25" stroke="#94A3B8" strokeWidth="2" />
        </g>

        {/* Holy Cross */}
        <g transform="translate(250, 235)">
          <rect x="-12" y="-95" width="24" height="150" rx="3" fill={`url(#${goldGradId})`} stroke="#FFFFFF" strokeWidth="1.5" />
          <rect x="-55" y="-65" width="110" height="22" rx="3" fill={`url(#${goldGradId})`} stroke="#FFFFFF" strokeWidth="1.5" />
          <rect x="-5" y="-90" width="10" height="140" fill="#FEF08A" opacity="0.6" />
          <rect x="-50" y="-60" width="100" height="12" fill="#FEF08A" opacity="0.6" />
        </g>

        {/* Dove Silhouette */}
        <path d="M 250,125 Q 235,110 220,120 Q 240,135 250,150 Q 260,135 280,120 Q 265,110 250,125 Z" fill="#FFFFFF" opacity="0.95" />
      </g>

      {/* Ribbon Banner */}
      <g transform="translate(250, 415)">
        <path d="M -160,0 L -120,-20 L 120,-20 L 160,0 L 140,25 L -140,25 Z" fill={`url(#${goldGradId})`} stroke="#78350F" strokeWidth="2" />
        <text x="0" y="8" fontFamily="'Times New Roman', serif" fontWeight="900" fontSize="22" fill="#451A03" textAnchor="middle" letterSpacing="4">
          HTEIM • SOM
        </text>
      </g>
    </svg>
  );
};

export default LogoImage;
