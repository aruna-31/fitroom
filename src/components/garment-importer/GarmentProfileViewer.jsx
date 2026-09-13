import React from 'react';
import { 
  Shirt, 
  ExternalLink, 
  Check, 
  CheckCircle2, 
  Sparkles, 
  Ruler, 
  ArrowRight, 
  Tag, 
  Layers 
} from 'lucide-react';
import { useGarmentProfile } from '../../context/GarmentProfileContext';

export const GarmentProfileViewer = ({ onContinue }) => {
  const { activeGarment, setSelectedSize, wardrobe, setActiveGarmentId } = useGarmentProfile();

  if (!activeGarment) {
    return (
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
        <Shirt size={32} color="var(--gold-primary)" style={{ margin: '0 auto 12px' }} />
        <h4>No Garment Selected</h4>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
          Import a clothing item via URL or upload an image to inspect its normalized Garment Profile.
        </p>
      </div>
    );
  }

  const sizes = activeGarment.availableSizes || ['S', 'M', 'L', 'XL'];
  const sizeChart = activeGarment.sizeChart || [
    { size: 'S', chest: 38 },
    { size: 'M', chest: 40 },
    { size: 'L', chest: 42 },
    { size: 'XL', chest: 44 }
  ];

  return (
    <div className="glass-panel" style={{ padding: '28px', border: '1px solid var(--border-accent)', boxShadow: 'var(--shadow-gold)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            GARMENT PROFILE
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Normalized e-commerce specification & verified sizing dimensions
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="status-badge verified">
            <CheckCircle2 size={13} />
            <span>Verified Spec</span>
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '28px' }} className="garment-profile-layout">
        {/* Left: Garment Image Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div
            style={{
              width: '100%',
              height: '320px',
              background: '#0d0d12',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
          >
            {activeGarment.image ? (
              <img
                src={activeGarment.image}
                alt={activeGarment.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Shirt size={48} color="var(--gold-primary)" style={{ opacity: 0.6, marginBottom: '8px' }} />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GARMENT IMAGE</div>
              </div>
            )}

            {activeGarment.brand && (
              <div 
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  padding: '4px 8px',
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--gold-primary)'
                }}
              >
                {activeGarment.brand}
              </div>
            )}
          </div>

          {activeGarment.sourceUrl && (
            <a
              href={activeGarment.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.74rem',
                color: 'var(--text-muted)',
                textDecoration: 'none'
              }}
            >
              <ExternalLink size={12} />
              <span>Source URL: {activeGarment.domain || 'External Product'}</span>
            </a>
          )}
        </div>

        {/* Right: Metadata, Sizing, and Size Chart Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Metadata Block */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Garment: <span style={{ color: 'var(--gold-primary)' }}>{activeGarment.name}</span>
            </div>
            <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
              Type: <strong style={{ color: 'var(--text-primary)' }}>{activeGarment.category || 'Top'}</strong>
              <span style={{ color: 'var(--text-dim)', margin: '0 8px' }}>•</span>
              Silhouette: <strong style={{ color: 'var(--text-primary)' }}>{activeGarment.garmentType || 'T-Shirt'}</strong>
              {activeGarment.price && (
                <>
                  <span style={{ color: 'var(--text-dim)', margin: '0 8px' }}>•</span>
                  Price: <strong style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-mono)' }}>{activeGarment.price}</strong>
                </>
              )}
            </div>
          </div>

          {/* Available Sizes Box Row (ASCII-style Box UI) */}
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Available Sizes
            </div>
            
            <div 
              style={{
                display: 'inline-flex',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                background: 'var(--bg-tertiary)'
              }}
            >
              {sizes.map((sz, idx) => {
                const isSelected = (activeGarment.selectedSize || sizes[0]) === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    style={{
                      padding: '10px 22px',
                      background: isSelected ? 'var(--gold-primary)' : 'transparent',
                      color: isSelected ? '#09090c' : 'var(--text-primary)',
                      border: 'none',
                      borderRight: idx < sizes.length - 1 ? '1px solid var(--border-medium)' : 'none',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.95rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Chart Table */}
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Size Chart
            </div>

            <div 
              style={{
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.25)',
                maxWidth: '420px'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '8px 14px', fontWeight: 600 }}>Size</th>
                    <th style={{ padding: '8px 14px', fontWeight: 600 }}>Chest</th>
                    {sizeChart[0]?.waist !== undefined && <th style={{ padding: '8px 14px', fontWeight: 600 }}>Waist</th>}
                    {sizeChart[0]?.length !== undefined && <th style={{ padding: '8px 14px', fontWeight: 600 }}>Length</th>}
                  </tr>
                </thead>
                <tbody>
                  {sizeChart.map((row, idx) => {
                    const isSelected = (activeGarment.selectedSize || sizes[0]) === row.size;
                    return (
                      <tr 
                        key={idx}
                        style={{
                          borderBottom: idx < sizeChart.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                          background: isSelected ? 'rgba(224, 192, 151, 0.08)' : 'transparent',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        <td style={{ padding: '8px 14px', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
                          {row.size} {isSelected && '•'}
                        </td>
                        <td style={{ padding: '8px 14px', color: isSelected ? 'var(--gold-primary)' : 'var(--text-secondary)' }}>
                          {row.chest ? `${row.chest}″` : '—'}
                        </td>
                        {sizeChart[0]?.waist !== undefined && (
                          <td style={{ padding: '8px 14px', color: 'var(--text-secondary)' }}>
                            {row.waist ? `${row.waist}″` : '—'}
                          </td>
                        )}
                        {sizeChart[0]?.length !== undefined && (
                          <td style={{ padding: '8px 14px', color: 'var(--text-secondary)' }}>
                            {row.length ? `${row.length}″` : '—'}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              className="btn btn-primary"
              style={{ padding: '10px 28px', fontSize: '0.95rem', letterSpacing: '0.04em' }}
              onClick={() => onContinue && onContinue(activeGarment)}
            >
              <span>CONTINUE →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
