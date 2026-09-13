import React, { useEffect, useState } from 'react';
import { Layers, Sparkles, Shirt, Scissors } from 'lucide-react';

export const BrandSplashScreen = ({ onComplete }) => {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Elegant splash timer
    const timer = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 750);
    }, 1200);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`brand-splash-overlay ${isFading ? 'splash-fade-out' : ''}`}>
      {/* Central Orbit with Fashion Icons */}
      <div className="splash-orbit-container">
        <div className="splash-orbit-ring" />
        
        {/* Central Logo Emblem */}
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(224, 192, 151, 0.2), rgba(16, 16, 24, 0.8))',
            border: '1.5px solid var(--gold-primary)',
            boxShadow: '0 0 28px rgba(224, 192, 151, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
        >
          <Layers size={38} color="var(--gold-primary)" />
        </div>

        {/* Orbiting Satellite Item 1 (Top) */}
        <div className="splash-orbit-item" style={{ transform: 'translate(0px, -92px)' }}>
          <Shirt size={18} />
        </div>

        {/* Orbiting Satellite Item 2 (Right) */}
        <div className="splash-orbit-item" style={{ transform: 'translate(92px, 0px)' }}>
          <Scissors size={18} />
        </div>

        {/* Orbiting Satellite Item 3 (Bottom) */}
        <div className="splash-orbit-item" style={{ transform: 'translate(0px, 92px)' }}>
          <Sparkles size={18} />
        </div>

        {/* Orbiting Satellite Item 4 (Left) */}
        <div className="splash-orbit-item" style={{ transform: 'translate(-92px, 0px)' }}>
          <Layers size={18} />
        </div>
      </div>

      {/* Haute Couture Brand Typography */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <h1 
          className="shimmer-gold-text" 
          style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '2.8rem', 
            letterSpacing: '0.14em', 
            fontWeight: 800,
            margin: 0
          }}
        >
          FITROOM
        </h1>
        <p style={{ fontSize: '0.84rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          AI Virtual Try-On & Body Profiling
        </p>
      </div>

      {/* Progress Track */}
      <div className="splash-progress-track">
        <div className="splash-progress-bar" />
      </div>
    </div>
  );
};
