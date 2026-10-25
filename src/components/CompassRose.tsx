import React, { useState } from 'react';

interface CompassRoseProps {
  interactive?: boolean;
  className?: string;
  size?: number;
}

export const CompassRose: React.FC<CompassRoseProps> = ({
  interactive = true,
  className = '',
  size = 64,
}) => {
  const [rotation, setRotation] = useState(0);

  const handleNudge = () => {
    if (!interactive) return;
    setRotation((prev) => (prev + 45) % 360);
  };

  return (
    <button
      type="button"
      onClick={handleNudge}
      title="بوصلة خرائطية تفاعلية - انقر لتغيير الاتجاه"
      className={`relative inline-flex items-center justify-center transition-transform duration-500 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-full group ${className}`}
      style={{ width: size, height: size }}
      aria-label="بوصلة جغرافية تاريخية"
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full transform transition-transform duration-700 ease-in-out group-hover:rotate-12"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <defs>
          <linearGradient id="needleNorthCalm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#134e4a" />
          </linearGradient>
          <linearGradient id="needleSouthCalm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#0f2647" />
          </linearGradient>
        </defs>

        {/* Outer Degree Track Ring */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="#1e293b"
          strokeWidth="1.2"
          strokeDasharray="1.5 3"
          opacity="0.8"
        />
        <circle
          cx="50"
          cy="50"
          r="41"
          fill="none"
          stroke="#134e4a"
          strokeWidth="0.8"
          opacity="0.4"
        />

        {/* Cardinal tick marks */}
        <line x1="50" y1="4" x2="50" y2="10" stroke="#2dd4bf" strokeWidth="1.2" />
        <line x1="50" y1="90" x2="50" y2="96" stroke="#60a5fa" strokeWidth="1.2" />
        <line x1="4" y1="50" x2="10" y2="50" stroke="#64748b" strokeWidth="1" />
        <line x1="90" y1="50" x2="96" y2="50" stroke="#64748b" strokeWidth="1" />

        {/* Secondary 8-point stars */}
        <polygon points="50,18 53,47 62,38 53,50 82,50 53,53 62,62 50,53 50,82 47,53 38,62 47,50 18,50 47,47 38,38 50,47" fill="#0e2338" opacity="0.6" />

        {/* North Arrow - Calmer muted emerald */}
        <polygon points="50,8 55,50 50,46" fill="url(#needleNorthCalm)" />
        <polygon points="50,8 45,50 50,46" fill="#0f766e" />

        {/* South Arrow - Calmer navy */}
        <polygon points="50,92 55,50 50,54" fill="url(#needleSouthCalm)" />
        <polygon points="50,92 45,50 50,54" fill="#1e3a8a" />

        {/* Central Pivot Boss */}
        <circle cx="50" cy="50" r="5" fill="#0b1726" stroke="#2dd4bf" strokeWidth="1" opacity="0.8" />
        <circle cx="50" cy="50" r="1.8" fill="#5eead4" />

        {/* Arabic North Symbol "ش" */}
        <text
          x="50"
          y="20"
          textAnchor="middle"
          fill="#5eead4"
          fontSize="8"
          fontWeight="bold"
          fontFamily="Cairo, sans-serif"
          className="select-none"
        >
          ش
        </text>
      </svg>
    </button>
  );
};
