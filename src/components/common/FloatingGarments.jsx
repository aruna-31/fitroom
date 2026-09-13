import React from 'react';

// Haute-Couture Vector Silhouettes
const BlazerIcon = () => (
  <svg width="74" height="84" viewBox="0 0 24 28" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6 L8 2 L12 7 L16 2 L20 6 L22 22 L16 24 L12 25 L8 24 L2 22 Z" />
    <path d="M8 2 L12 12 L16 2" />
    <path d="M12 12 L12 25" />
    <circle cx="10.5" cy="15" r="0.8" fill="currentColor" />
    <circle cx="10.5" cy="18" r="0.8" fill="currentColor" />
    <path d="M4 14 L8 14" />
    <path d="M16 14 L20 14" />
  </svg>
);

const DressIcon = () => (
  <svg width="68" height="92" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2 L10 7 L14 7 L16 2" />
    <path d="M10 7 C8 11, 8 13, 9 16 L5 30 L19 30 L15 16 C16 13, 16 11, 14 7 Z" />
    <path d="M9 16 C11 17, 13 17, 15 16" />
    <path d="M7 26 C11 28, 13 28, 17 26" />
  </svg>
);

const TrenchCoatIcon = () => (
  <svg width="78" height="96" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 6 L8 2 L12 6 L16 2 L19 6 L21 28 L15 29 L12 30 L9 29 L3 28 Z" />
    <path d="M8 2 L12 10 L16 2" />
    <path d="M12 10 L12 29" />
    <path d="M6 15 L18 15" strokeWidth="2" />
    <circle cx="12" cy="15" r="1.5" fill="currentColor" />
    <path d="M3 10 L5 6" />
    <path d="M21 10 L19 6" />
  </svg>
);

const ShirtIcon = () => (
  <svg width="70" height="74" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.38 3.46 L16 2 L12 4 L8 2 L3.62 3.46 C2.8 3.73 2.2 4.45 2.1 5.31 L1.1 13.8 C0.95 15.1 2.05 16.2 3.35 16 L6 15.6 L6 21 C6 21.55 6.45 22 7 22 L17 22 C17.55 22 18 21.55 18 21 L18 15.6 L20.65 16 C21.95 16.2 23.05 15.1 22.9 13.8 L21.9 5.31 C21.8 4.45 21.2 3.73 20.38 3.46 Z" />
    <path d="M8 2 L12 7 L16 2" />
    <path d="M12 7 L12 22" />
    <circle cx="12" cy="10" r="0.6" fill="currentColor" />
    <circle cx="12" cy="14" r="0.6" fill="currentColor" />
    <circle cx="12" cy="18" r="0.6" fill="currentColor" />
  </svg>
);

const TrousersIcon = () => (
  <svg width="60" height="88" viewBox="0 0 24 32" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 2 L19 2 L20 12 L18 30 L13 30 L12 14 L11 30 L6 30 L4 12 Z" />
    <path d="M5 5 L19 5" />
    <path d="M12 2 L12 8" />
  </svg>
);

const GARMENTS = [
  {
    id: 'blazer-left',
    icon: BlazerIcon,
    top: '14%',
    left: '5%',
    animation: 'floatDriftSlow 18s ease-in-out infinite',
    color: 'var(--gold-primary)',
    delay: '0s'
  },
  {
    id: 'dress-right',
    icon: DressIcon,
    top: '20%',
    right: '6%',
    animation: 'floatSwaySilk 22s ease-in-out infinite',
    color: 'var(--cyan-accent)',
    delay: '2s'
  },
  {
    id: 'trench-bottom-left',
    icon: TrenchCoatIcon,
    bottom: '18%',
    left: '8%',
    animation: 'floatDriftMedium 20s ease-in-out infinite',
    color: 'var(--gold-primary)',
    delay: '4s'
  },
  {
    id: 'shirt-top-mid',
    icon: ShirtIcon,
    top: '8%',
    left: '52%',
    animation: 'floatDriftSlow 24s ease-in-out infinite',
    color: 'rgba(255, 255, 255, 0.7)',
    delay: '1s'
  },
  {
    id: 'trousers-bottom-right',
    icon: TrousersIcon,
    bottom: '12%',
    right: '8%',
    animation: 'floatSwaySilk 19s ease-in-out infinite',
    color: 'var(--gold-primary)',
    delay: '3s'
  }
];

export const FloatingGarments = () => {
  return (
    <div className="floating-garments-canvas" aria-hidden="true">
      {GARMENTS.map((g) => {
        const IconComponent = g.icon;
        return (
          <div
            key={g.id}
            className="floating-garment-node"
            style={{
              top: g.top,
              bottom: g.bottom,
              left: g.left,
              right: g.right,
              color: g.color,
              animation: g.animation,
              animationDelay: g.delay
            }}
          >
            <IconComponent />
          </div>
        );
      })}
    </div>
  );
};
