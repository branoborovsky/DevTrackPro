
import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

/**
 * Komponent pre generovanie natívneho vektorového loga aplikácie DevTrack Pro.
 * Využíva SVG filtre pre vizuálnu hĺbku (glow) a lineárne gradienty.
 */
const Icon: React.FC<IconProps> = ({ className = "", size = 32 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Primárny modrý gradient aplikácie */}
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        {/* Filter pre jemné rozostrenie tieňa/žiary */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      
      {/* Podkladový tvar loga (zaoblený štvorec) */}
      <rect 
        x="5" y="5" width="90" height="90" 
        rx="28" 
        fill="url(#iconGradient)" 
        className="drop-shadow-lg"
      />
      
      {/* Abstraktné spojenie písmen D a T (Glyph) */}
      <path 
        d="M30 30V70H50C61.0457 70 70 61.0457 70 50C70 38.9543 61.0457 30 50 30H30Z" 
        stroke="white" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ opacity: 0.9 }}
      />
      <path 
        d="M45 30V70M30 42H60" 
        stroke="white" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Horný odlesk pre simuláciu materiálu */}
      <path 
        d="M20 20C30 15 70 15 80 20" 
        stroke="white" 
        strokeWidth="1" 
        strokeLinecap="round"
        style={{ opacity: 0.3 }}
      />
    </svg>
  );
};

export default Icon;
