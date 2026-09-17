import React from 'react';

interface MinistryEmblemProps {
  size?: number;
  className?: string;
}

export const MinistryEmblem: React.FC<MinistryEmblemProps> = ({ size = 64, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="شعار وزارة التربية والتعليم والتعليم الفني"
    >
      {/* Outer border rings */}
      <circle cx="100" cy="100" r="96" stroke="#000000" strokeWidth="3" fill="#ffffff" />
      <circle cx="100" cy="100" r="91" stroke="#000000" strokeWidth="1" strokeDasharray="3 2" fill="none" />
      <circle cx="100" cy="100" r="68" stroke="#000000" strokeWidth="1.5" fill="none" />

      {/* Curved Text Paths */}
      <defs>
        <path id="top-curve" d="M 28 100 A 72 72 0 0 1 172 100" />
        <path id="bottom-curve" d="M 172 100 A 72 72 0 0 1 28 100" />
      </defs>

      {/* Top text: جمهورية مصر العربية */}
      <text fill="#000000" fontSize="13" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
        <textPath href="#top-curve" startOffset="50%">
          جمهورية مصر العربية
        </textPath>
      </text>

      {/* Bottom text: وزارة التربية والتعليم */}
      <text fill="#000000" fontSize="11.5" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">
        <textPath href="#bottom-curve" startOffset="50%">
          وزارة التربية والتعليم
        </textPath>
      </text>

      {/* Side Stars */}
      <polygon points="26,100 29,93 36,93 30,88 32,81 26,86 20,81 22,88 16,93 23,93" fill="#000000" transform="scale(0.7) translate(8, 42)" />
      <polygon points="174,100 177,93 184,93 178,88 180,81 174,86 168,81 170,88 164,93 171,93" fill="#000000" transform="scale(0.7) translate(70, 42)" />

      {/* Central Eagle of Saladin (نسر صلاح الدين) */}
      <g transform="translate(68, 62) scale(0.64)">
        {/* Eagle Head & Crown */}
        <path
          d="M 50 10 C 46 10, 44 14, 42 18 C 40 18, 36 21, 37 25 C 41 24, 45 22, 49 22 C 49 26, 52 28, 56 28 C 55 24, 54 20, 56 16 C 54 12, 52 10, 50 10 Z"
          fill="#111111"
        />
        {/* Beak facing right */}
        <polygon points="56,20 63,22 56,25" fill="#111111" />

        {/* Wings Outspread */}
        {/* Right Wing */}
        <path
          d="M 55 28 C 65 24, 82 22, 92 35 C 88 45, 82 58, 80 72 C 76 68, 73 60, 68 55 C 68 45, 62 38, 55 28 Z"
          fill="#222222"
        />
        {/* Left Wing */}
        <path
          d="M 45 28 C 35 24, 18 22, 8 35 C 12 45, 18 58, 20 72 C 24 68, 27 60, 32 55 C 32 45, 38 38, 45 28 Z"
          fill="#222222"
        />

        {/* Central Shield */}
        <path
          d="M 36 38 L 64 38 L 64 68 C 64 78, 50 86, 50 86 C 50 86, 36 78, 36 68 Z"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="2"
        />
        {/* Shield Tri-colors */}
        {/* Red Top / Right Stripe */}
        <rect x="37" y="39" width="9" height="30" fill="#cc0000" />
        {/* White Center Stripe */}
        <rect x="46" y="39" width="8" height="36" fill="#ffffff" stroke="#e5e5e5" strokeWidth="0.5" />
        {/* Black Bottom / Left Stripe */}
        <rect x="54" y="39" width="9" height="30" fill="#111111" />

        {/* Eagle Talons / Base Scroll */}
        <path
          d="M 30 84 C 38 82, 62 82, 70 84 C 68 89, 58 91, 50 91 C 42 91, 32 89, 30 84 Z"
          fill="#333333"
        />
        {/* Scroll Bar */}
        <rect x="24" y="89" width="52" height="7" rx="2" fill="#ffffff" stroke="#000000" strokeWidth="1" />
        <line x1="28" y1="92.5" x2="72" y2="92.5" stroke="#000000" strokeWidth="0.8" />
      </g>
    </svg>
  );
};
