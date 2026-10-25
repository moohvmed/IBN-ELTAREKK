import React from 'react';

export const TopographicBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Calm, soothing deep navy background with matte surface to reduce eye fatigue */}
      <div 
        className="absolute inset-0 bg-[#0c1420]"
      />

      {/* Muted gentle forest sage glow (soft, peaceful, no harsh neon) */}
      <div 
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-emerald-950/20 blur-[130px]" 
      />
      <div 
        className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-[#132d25]/25 blur-[140px]" 
      />
      
      {/* Soft muted slate-blue radial wash for quiet intellectual focus */}
      <div 
        className="absolute top-1/3 left-1/3 w-[700px] h-[700px] rounded-full bg-[#0f233a]/30 blur-[150px]" 
      />

      {/* Cartographic lines in subtle, low-contrast calm tones */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07] stroke-emerald-200"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <defs>
          <pattern
            id="graticule-grid-ar"
            width="130"
            height="130"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 130 0 L 0 0 0 130"
              fill="none"
              stroke="#64748b"
              strokeWidth="0.5"
              strokeDasharray="3 7"
              opacity="0.3"
            />
            <circle cx="0" cy="0" r="1.2" fill="#64748b" opacity="0.4" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#graticule-grid-ar)" />

        {/* Soft, graceful topographic contour lines */}
        <g strokeWidth="0.9" strokeLinecap="round">
          <path
            d="M -100,200 C 150,120 300,320 600,240 C 900,160 1150,340 1500,220 C 1700,160 1900,260 2100,200"
            opacity="0.4"
          />
          <path
            d="M -100,260 C 180,180 340,380 640,300 C 940,220 1180,400 1540,280 C 1740,220 1940,320 2100,260"
            opacity="0.5"
          />
          <path
            d="M -100,330 C 210,240 370,450 680,360 C 980,280 1220,460 1580,340 C 1780,280 1970,380 2100,330"
            strokeWidth="1.1"
            opacity="0.6"
            stroke="#10b981"
          />
          <path
            d="M -100,410 C 240,310 410,520 720,430 C 1020,350 1260,530 1620,410 C 1820,350 2000,450 2100,400"
            opacity="0.4"
          />
          
          <path
            d="M 600,1100 C 800,850 1100,800 1350,920 C 1550,1020 1750,900 2000,950"
            opacity="0.4"
            stroke="#5eead4"
          />
          <path
            d="M 680,1100 C 860,910 1140,860 1380,980 C 1580,1070 1780,960 2000,1010"
            opacity="0.3"
          />
        </g>
      </svg>
    </div>
  );
};
