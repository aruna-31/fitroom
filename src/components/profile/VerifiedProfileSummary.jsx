import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Award, 
  FileText, 
  HardDrive, 
  Calendar, 
  Scissors, 
  Tag 
} from 'lucide-react';
import { useBodyProfile } from '../../context/BodyProfileContext';
import { 
  getRecommendedSizes, 
  formatHeight, 
  cmToInches 
} from '../../services/estimationEngine';

export const VerifiedProfileSummary = ({ onContinue }) => {
  const { activeProfile, unit, getDisplayValue } = useBodyProfile();

  const measurements = activeProfile.measurements || {};
  const status = activeProfile.status || {};
  const sizing = getRecommendedSizes(measurements, unit);

  const verifiedCount = Object.values(status).filter(s => s === 'user_verified').length;
  const isAllVerified = verifiedCount === 6;

  // Calculate Drop (Chest - Waist in inches)
  const chestInches = measurements.chest ? (measurements.chest / 2.54) : 38;
  const waistInches = measurements.waist ? (measurements.waist / 2.54) : 32;
  const dropValue = Math.round(chestInches - waistInches);

  // Inseam Ratio
  const inseamRatio = measurements.inseam && activeProfile.height 
    ? ((measurements.inseam / activeProfile.height) * 100).toFixed(1)
    : '46.5';

  const formattedDate = new Date(activeProfile.updatedAt || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const specRows = [
    { key: 'height', label: 'Standing Height', val: formatHeight(activeProfile.height, unit), isVerified: true },
    { key: 'chest', label: 'Chest / Bust', val: `${getDisplayValue(measurements.chest)} ${unit}`, isVerified: status.chest === 'user_verified' },
    { key: 'waist', label: 'Natural Waist', val: `${getDisplayValue(measurements.waist)} ${unit}`, isVerified: status.waist === 'user_verified' },
    { key: 'hip', label: 'Hip Line', val: `${getDisplayValue(measurements.hip)} ${unit}`, isVerified: status.hip === 'user_verified' },
    { key: 'shoulder', label: 'Shoulder Span', val: `${getDisplayValue(measurements.shoulder)} ${unit}`, isVerified: status.shoulder === 'user_verified' },
    { key: 'armLength', label: 'Sleeve Length', val: `${getDisplayValue(measurements.armLength)} ${unit}`, isVerified: status.armLength === 'user_verified' },
    { key: 'inseam', label: 'Leg Inseam', val: `${getDisplayValue(measurements.inseam)} ${unit}`, isVerified: status.inseam === 'user_verified' }
  ];

  return (
    <div className="verified-spec-sheet">
      <div className="spec-watermark">FITROOM</div>

      {/* Header */}
      <div className="spec-header">
        <div className="spec-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3>{activeProfile.name}</h3>
            <span className={`status-badge ${isAllVerified ? 'verified' : 'ai'}`}>
              {isAllVerified ? <CheckCircle2 size={12} /> : <Sparkles size={12} />}
              <span>{isAllVerified ? 'Fully Verified' : `${verifiedCount}/6 Verified`}</span>
            </span>
          </div>
          <p>Bespoke Tailoring & Virtual Try-On Anthropometric Specification</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-mono)' }}>
            <Calendar size={13} /> {formattedDate}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--state-verified-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HardDrive size={13} /> Synced to Local Storage
          </span>
        </div>
      </div>

      {/* Anthropometric Metrics Grid */}
      <div className="spec-metrics-grid">
        {specRows.map(row => (
          <div key={row.key} className="spec-metric-cell">
            <span className="spec-metric-name">{row.label}</span>
            <span className="spec-metric-val">{row.val}</span>
            <span className={`spec-metric-status ${row.isVerified ? 'text-verified' : 'text-ai'}`} style={{ color: row.isVerified ? 'var(--state-verified-text)' : 'var(--state-ai-text)' }}>
              {row.isVerified ? '✓ User Verified' : '⚡ AI Estimated'}
            </span>
          </div>
        ))}

        {/* Proportions Card */}
        <div className="spec-metric-cell" style={{ borderLeft: '2px solid var(--gold-primary)' }}>
          <span className="spec-metric-name">Athletic Drop / Proportion</span>
          <span className="spec-metric-val" style={{ color: 'var(--gold-primary)' }}>
            Drop {dropValue > 0 ? `+${dropValue}″` : `${dropValue}″`}
          </span>
          <span className="spec-metric-status" style={{ color: 'var(--text-muted)' }}>
            {inseamRatio}% Inseam Index
          </span>
        </div>
      </div>

      {/* Sizing Recommendations */}
      <div className="sizing-recommendations">
        <div className="sizing-item">
          <Tag size={18} color="var(--gold-primary)" />
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Apparel Tops
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Size {sizing.topSize}</div>
          </div>
        </div>

        <div className="sizing-item">
          <Scissors size={18} color="var(--gold-primary)" />
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Trousers / Waist
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{sizing.bottomSize}</div>
          </div>
        </div>

        <div className="sizing-item">
          <Award size={18} color="var(--gold-primary)" />
          <div>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Tailored Jacket / Suit
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{sizing.jacketSize}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="sizing-pill">{sizing.topSize}</div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Primary Try-On Size
            </span>
          </div>

          {onContinue && (
            <button
              className="btn btn-primary btn-sm"
              onClick={onContinue}
              style={{ padding: '8px 18px', letterSpacing: '0.03em' }}
            >
              <span>CONTINUE TO UPLOAD GARMENT →</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
