import React from 'react';
import { 
  Shirt, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  ShoppingBag, 
  Trash2 
} from 'lucide-react';
import { useGarmentProfile } from '../../context/GarmentProfileContext';
import { GarmentImportStudio } from './GarmentImportStudio';
import { GarmentProfileViewer } from './GarmentProfileViewer';

export const Layer2GarmentView = ({ onProceedToTryOn, onShowToast }) => {
  const { wardrobe, activeGarmentId, setActiveGarmentId, removeGarment } = useGarmentProfile();

  const handleImportSuccess = (newGarment) => {
    if (onShowToast) {
      onShowToast(`Imported "${newGarment.name}" successfully!`);
    }
  };

  const handleContinue = (garment) => {
    if (onShowToast) {
      onShowToast(`Garment profile for "${garment.name}" (Size ${garment.selectedSize}) ready!`);
    }
    if (onProceedToTryOn) {
      onProceedToTryOn(garment);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
      {/* Section Header: CHOOSE YOUR GARMENT */}
      <section className="hero-banner" style={{ marginBottom: '0' }}>
        <div className="hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="brand-badge" style={{ borderColor: 'var(--cyan-accent)', color: 'var(--cyan-accent)', background: 'rgba(56, 189, 248, 0.12)' }}>
              <ShoppingBag size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
              Layer 2 Clothing Ingestion
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• Real E-Commerce & Size-Chart Scanner</span>
          </div>
          <h2>CHOOSE YOUR GARMENT</h2>
          <p className="hero-subtitle">
            Import real clothing products via e-commerce URL or direct image upload with optional Size-Chart OCR. 
            All sizes and dimensions are normalized with zero hallucinated data.
          </p>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-value" style={{ color: 'var(--cyan-accent)' }}>{wardrobe.length}</span>
            <span className="stat-label">Wardrobe Items</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{ color: 'var(--state-verified-text)' }}>100%</span>
            <span className="stat-label">Verified Data</span>
          </div>
        </div>
      </section>

      {/* Two Clear Options: Product URL OR Upload Garment */}
      <section>
        <GarmentImportStudio onImportComplete={handleImportSuccess} />
      </section>

      {/* Wardrobe Quick Selector Bar */}
      {wardrobe.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
              Your Wardrobe Collection ({wardrobe.length})
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--cyan-accent)' }}>
              Select Active Garment
            </span>
          </div>

          <div className="preset-selector">
            {wardrobe.map(item => {
              const isActive = item.id === activeGarmentId;
              return (
                <div
                  key={item.id}
                  className={`preset-chip ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveGarmentId(item.id)}
                  style={{
                    borderColor: isActive ? 'var(--cyan-accent)' : 'var(--border-subtle)',
                    color: isActive ? 'var(--cyan-accent)' : 'var(--text-primary)'
                  }}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="preset-thumb" />
                  ) : (
                    <Shirt size={16} />
                  )}
                  <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                    ({item.garmentType || item.category})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Normalized Garment Profile Viewer */}
      <section>
        <GarmentProfileViewer onContinue={handleContinue} />
      </section>
    </div>
  );
};
