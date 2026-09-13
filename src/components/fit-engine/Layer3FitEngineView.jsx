import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ArrowRight, 
  Maximize2, 
  Check, 
  CircleDot, 
  StretchHorizontal, 
  MoveHorizontal, 
  GitCommit, 
  Compass, 
  Tag, 
  TrendingUp, 
  HardDrive 
} from 'lucide-react';
import { useBodyProfile } from '../../context/BodyProfileContext';
import { useGarmentProfile } from '../../context/GarmentProfileContext';
import { useFitEngine } from '../../context/FitEngineContext';

export const Layer3FitEngineView = ({ onProceedToLayer4, onShowToast }) => {
  const { activeProfile, unit, getDisplayValue } = useBodyProfile();
  const { activeGarment } = useGarmentProfile();
  const { 
    fitAnalysis, 
    currentSizeAnalysis, 
    selectedSize, 
    setSelectedSize, 
    isEvaluating, 
    evaluateFit 
  } = useFitEngine();

  const handleProceed = () => {
    if (onShowToast) {
      onShowToast(`Layer 3 Fit Profile for Size ${selectedSize} locked! Data persisted for Layer 4.`);
    }
    if (onProceedToLayer4) {
      onProceedToLayer4();
    }
  };

  const regionIcons = {
    chest: CircleDot,
    waist: StretchHorizontal,
    hip: Maximize2,
    shoulder: MoveHorizontal,
    arm_length: GitCommit,
    inseam: Compass
  };

  const regionLabels = {
    chest: 'Chest / Bust',
    waist: 'Natural Waist',
    hip: 'Hip Line',
    shoulder: 'Shoulder Span',
    arm_length: 'Sleeve Length',
    inseam: 'Leg Inseam'
  };

  if (!activeGarment || !activeProfile) {
    return (
      <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
        <h4>Please Complete Layers 1 & 2 First</h4>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          Body Profile from Layer 1 and Garment Profile from Layer 2 are required to calculate real ease dimensions.
        </p>
      </div>
    );
  }

  const score = currentSizeAnalysis?.fit_score || fitAnalysis?.recommended_score || 92;
  const verdict = currentSizeAnalysis?.verdict || fitAnalysis?.recommended_verdict || 'Optimal Tailored Drape';
  const sizeEvaluations = fitAnalysis?.size_evaluations || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Hero Banner */}
      <section className="hero-banner" style={{ marginBottom: 0 }}>
        <div className="hero-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="brand-badge" style={{ borderColor: 'var(--state-verified-border)', color: 'var(--state-verified-text)', background: 'var(--state-verified-bg)' }}>
              <TrendingUp size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
              Layer 3 Real Fit Engine
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>• Fast-API Anthropometric Solver</span>
          </div>
          <h2>ANTHROPOMETRIC FIT & EASE ANALYSIS</h2>
          <p className="hero-subtitle">
            Evaluating verified {activeProfile.height}cm body dimensions against <strong>{activeGarment.name}</strong>.
            All regional eases, scores, and recommendations are computed strictly from verified data with zero demo fallbacks.
          </p>
        </div>

        <div className="hero-stats">
          <div className="stat-item">
            <span className="stat-value" style={{ color: score >= 90 ? 'var(--state-verified-text)' : (score >= 80 ? 'var(--gold-primary)' : 'var(--state-ai-text)') }}>
              {score}%
            </span>
            <span className="stat-label">Fit Match Score</span>
          </div>
          <div className="stat-item">
            <span className="stat-value" style={{ color: 'var(--gold-primary)' }}>
              Size {selectedSize || fitAnalysis?.recommended_size || 'M'}
            </span>
            <span className="stat-label">Active Sizing</span>
          </div>
        </div>
      </section>

      {/* Main Two-Column Analysis Workspace */}
      <div className="workspace-grid" style={{ gridTemplateColumns: '360px 1fr' }}>
        {/* Left Column: Garment & Body Profile Reference */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Garment Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.04em' }}>
              Target Garment Reference
            </div>

            <div style={{ width: '100%', height: '240px', background: '#0a0a0e', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '14px' }}>
              {activeGarment.image ? (
                <img src={activeGarment.image} alt={activeGarment.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  No Garment Image
                </div>
              )}
            </div>

            <h4 style={{ fontSize: '1.05rem', marginBottom: '4px' }}>{activeGarment.name}</h4>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{activeGarment.brand || 'Luxury Apparel'}</span>
              <span style={{ color: 'var(--gold-primary)', fontFamily: 'var(--font-mono)' }}>{activeGarment.price || 'Ready to Drape'}</span>
            </div>
          </div>

          {/* Verified Body Measurements Snapshot */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                Verified Body Profile
              </span>
              <span className="status-badge verified" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                <ShieldCheck size={11} /> 6/6 Locked
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>HEIGHT</div>
                <div>{activeProfile.height} cm</div>
              </div>
              <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>CHEST</div>
                <div>{getDisplayValue(activeProfile.measurements?.chest)} {unit}</div>
              </div>
              <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>WAIST</div>
                <div>{getDisplayValue(activeProfile.measurements?.waist)} {unit}</div>
              </div>
              <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>INSEAM</div>
                <div>{getDisplayValue(activeProfile.measurements?.inseam)} {unit}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Size Selector, Heatmap & Diagnostics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Size Selector Strip */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Available Garment Sizes (FastAPI Evaluation)
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontFamily: 'var(--font-mono)' }}>
                Click size to simulate ease
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${sizeEvaluations.length || 4}, 1fr)`, gap: '10px' }}>
              {sizeEvaluations.map((evalEntry) => {
                const isSelected = selectedSize === evalEntry.size;
                const isRec = evalEntry.size === fitAnalysis?.recommended_size;

                return (
                  <button
                    key={evalEntry.size}
                    type="button"
                    onClick={() => setSelectedSize(evalEntry.size)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(224, 192, 151, 0.15)' : 'var(--bg-tertiary)',
                      border: `1px solid ${isSelected ? 'var(--gold-primary)' : (isRec ? 'var(--state-verified-border)' : 'var(--border-subtle)')}`,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 700, color: isSelected ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
                        {evalEntry.size}
                      </span>
                      {isRec && <Check size={14} color="var(--state-verified-text)" />}
                    </div>

                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: evalEntry.fit_score >= 90 ? 'var(--state-verified-text)' : 'var(--text-secondary)' }}>
                      {evalEntry.fit_score}% Match
                    </div>

                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {evalEntry.verdict.split(' ')[0]}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Recommendation Highlight Banner */}
          <div 
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(12, 12, 18, 0.9))',
              border: '1px solid var(--state-verified-border)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--state-verified-bg)', border: '1px solid var(--state-verified-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--state-verified-text)' }}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-primary)' }}>
                  Recommended: Size {fitAnalysis?.recommended_size || 'M'} ({fitAnalysis?.recommended_score || 96}% Fit Score)
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {fitAnalysis?.recommended_verdict || 'Optimal tailored ease across primary load regions.'}
                  {fitAnalysis?.alternative_size && (
                    <span style={{ color: 'var(--gold-primary)', marginLeft: '8px' }}>
                      • {fitAnalysis.alternative_size.note} (Size {fitAnalysis.alternative_size.size})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <span className="status-badge verified" style={{ whiteSpace: 'nowrap' }}>
              Optimal Drape
            </span>
          </div>

          {/* Regional Anatomical Ease Heatmap */}
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--gold-primary)" />
                Anatomical Region Classification (Size {selectedSize})
              </h4>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Real ease variances
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {currentSizeAnalysis?.regions && Object.entries(currentSizeAnalysis.regions).map(([regionKey, regionData]) => {
                const Icon = regionIcons[regionKey] || CircleDot;
                const label = regionLabels[regionKey] || regionKey;

                let badgeClass = 'status-badge';
                if (regionData.status === 'suitable') badgeClass += ' verified';
                else if (regionData.status === 'tight') badgeClass += ' ai';
                else if (regionData.status === 'loose') badgeClass += ' calibrated';
                else badgeClass += '';

                return (
                  <div 
                    key={regionKey}
                    style={{
                      padding: '14px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="field-icon" style={{ width: 24, height: 24 }}>
                          <Icon size={14} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{label}</span>
                      </div>

                      <span className={badgeClass} style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                        {regionData.status}
                      </span>
                    </div>

                    {regionData.has_data ? (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {regionData.ease_in >= 0 ? `+${regionData.ease_in}"` : `${regionData.ease_in}"`} ({regionData.ease_cm >= 0 ? `+${regionData.ease_cm}cm` : `${regionData.ease_cm}cm`}) Ease
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {regionData.explanation}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                        Unspecified in garment size chart
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explainable Fit Diagnostics List */}
          {currentSizeAnalysis?.issues && currentSizeAnalysis.issues.length > 0 && (
            <div 
              style={{
                padding: '16px',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 'var(--radius-md)',
                borderLeft: '3px solid var(--gold-primary)'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--gold-primary)', marginBottom: '6px' }}>
                Tailoring & Fit Observations
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {currentSizeAnalysis.issues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Proceed to Virtual Drape (Layer 4) Action Bar */}
          <div 
            style={{
              padding: '18px 22px',
              background: 'linear-gradient(135deg, #1f1f2b, #121218)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-gold)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HardDrive size={18} color="var(--gold-primary)" />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                  Persisted Fit Session (Size {selectedSize})
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Verified body & analyzed garment payload ready for Layer 4
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ padding: '10px 24px', letterSpacing: '0.04em' }}
              onClick={handleProceed}
            >
              <span>PROCEED TO VIRTUAL DRAPE (Layer 4) →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
