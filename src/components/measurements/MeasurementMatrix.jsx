import React from 'react';
import { 
  Ruler, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  CheckCheck, 
  Sliders, 
  UserCheck, 
  ArrowUpCircle, 
  ShieldCheck 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useBodyProfile } from '../../context/BodyProfileContext';
import { MeasurementFieldCard } from './MeasurementFieldCard';
import { formatHeight, cmToInches } from '../../services/estimationEngine';

// Icons for anatomical body regions
import { 
  Maximize, 
  CircleDot, 
  StretchHorizontal, 
  MoveHorizontal, 
  GitCommit, 
  Compass 
} from 'lucide-react';

export const MeasurementMatrix = ({ onSavedSuccess, onContinue }) => {
  const {
    activeProfile,
    updateHeight,
    updateBuild,
    updateFitPreference,
    verifyAllMeasurements,
    resetToAiEstimates,
    unit,
    getDisplayValue
  } = useBodyProfile();

  const currentHeightCm = activeProfile.height || 178;
  const displayHeight = unit === 'in' ? cmToInches(currentHeightCm) : currentHeightCm;

  const verifiedCount = Object.values(activeProfile.status || {}).filter(s => s === 'user_verified').length;
  const totalFields = 6;
  const isFullyVerified = verifiedCount === totalFields;

  const handleVerifyAll = () => {
    verifyAllMeasurements();
    // Trigger confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#e0c097', '#34d399', '#38bdf8', '#ffffff']
      });
    } catch (e) {
      // ignore
    }
    if (onSavedSuccess) onSavedSuccess('All measurements verified & locked into Body Profile!');
  };

  const handleHeightSliderChange = (e) => {
    updateHeight(Number(e.target.value));
  };

  const buildOptions = [
    { id: 'slim', label: 'Slim / Slender' },
    { id: 'regular', label: 'Balanced / Regular' },
    { id: 'athletic', label: 'Athletic / V-Taper' },
    { id: 'curvy', label: 'Curvy / Hourglass' },
    { id: 'broad', label: 'Broad / Robust' }
  ];

  const fitPreferences = [
    { id: 'slim', label: 'Slim Cut' },
    { id: 'tailored', label: 'Tailored Bespoke' },
    { id: 'relaxed', label: 'Relaxed Fluid' },
    { id: 'oversized', label: 'Oversized Drape' }
  ];

  return (
    <div className="matrix-container">
      {/* Matrix Header & Quick Actions */}
      <div className="matrix-header">
        <div className="matrix-title-group">
          <h3>
            <Ruler size={20} color="var(--gold-primary)" />
            Anthropometric Calibration Matrix
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            Review AI estimated body dimensions. Fine-tune any measurement to lock into your Body Profile.
          </p>
        </div>

        <div className="matrix-actions">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={resetToAiEstimates}
            title="Discard manual edits and recalculate raw AI estimates"
          >
            <RotateCcw size={14} />
            <span>Reset to AI Scan</span>
          </button>

          <button 
            className={`btn ${isFullyVerified ? 'btn-verified' : 'btn-primary'} btn-sm`}
            onClick={handleVerifyAll}
          >
            {isFullyVerified ? (
              <>
                <ShieldCheck size={14} />
                <span>Profile Verified (6/6)</span>
              </>
            ) : (
              <>
                <CheckCheck size={14} />
                <span>Verify All AI Estimates ({verifiedCount}/6)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Master Height Control Card */}
      <div className="master-height-card">
        <div className="height-flex">
          <div className="height-info">
            <h4>
              <ArrowUpCircle size={18} color="var(--gold-primary)" />
              Standing Stature & Height Reference
            </h4>
            <p>
              Height anchors the anthropometric ratio solver and camera focal plane calibration.
            </p>
          </div>

          <div className="height-control-box">
            <div className="height-value-display">
              {formatHeight(currentHeightCm, unit)}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <input
            type="range"
            className="custom-range"
            min={unit === 'in' ? 55 : 140}
            max={unit === 'in' ? 85 : 215}
            step={unit === 'in' ? 0.5 : 1}
            value={displayHeight}
            onChange={handleHeightSliderChange}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
            <span>{unit === 'in' ? '4′ 7″ (140cm)' : '140 cm'}</span>
            <span>Current: {formatHeight(currentHeightCm, unit)}</span>
            <span>{unit === 'in' ? '7′ 1″ (215cm)' : '215 cm'}</span>
          </div>
        </div>
      </div>

      {/* Silhouette & Build Archetype Selector */}
      <div className="fit-preferences-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Body Build Archetype (AI Baseline Tuning)
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--gold-primary)', fontFamily: 'var(--font-mono)' }}>
            {activeProfile.build.toUpperCase()}
          </span>
        </div>
        <div className="tag-options">
          {buildOptions.map(opt => (
            <button
              key={opt.id}
              className={`tag-btn ${activeProfile.build === opt.id ? 'active' : ''}`}
              onClick={() => updateBuild(opt.id)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 6 Anatomical Measurement Cards */}
      <div className="measurements-grid">
        {/* 1. Chest / Bust */}
        <MeasurementFieldCard
          fieldKey="chest"
          label="Chest / Bust"
          subtitle="Circumference at fullest point"
          icon={CircleDot}
          minVal={65}
          maxVal={150}
          step={0.5}
          description="Measured horizontally around the fullest part of the chest."
        />

        {/* 2. Natural Waist */}
        <MeasurementFieldCard
          fieldKey="waist"
          label="Natural Waist"
          subtitle="Narrowest torso circumference"
          icon={StretchHorizontal}
          minVal={50}
          maxVal={140}
          step={0.5}
          description="Measured around the natural crease line above navel."
        />

        {/* 3. Hip Line */}
        <MeasurementFieldCard
          fieldKey="hip"
          label="Hip Circumference"
          subtitle="Fullest point over seat"
          icon={Maximize}
          minVal={65}
          maxVal={155}
          step={0.5}
          description="Measured around the widest part of the buttocks and hips."
        />

        {/* 4. Shoulder Width */}
        <MeasurementFieldCard
          fieldKey="shoulder"
          label="Shoulder Width"
          subtitle="Biacromial bone-to-bone span"
          icon={MoveHorizontal}
          minVal={30}
          maxVal={65}
          step={0.5}
          description="Measured straight across the back from shoulder tip to shoulder tip."
        />

        {/* 5. Arm Length */}
        <MeasurementFieldCard
          fieldKey="armLength"
          label="Sleeve / Arm Length"
          subtitle="Shoulder joint to wrist bone"
          icon={GitCommit}
          minVal={45}
          maxVal={85}
          step={0.5}
          description="Measured from shoulder apex down over elbow to wrist."
        />

        {/* 6. Inseam */}
        <MeasurementFieldCard
          fieldKey="inseam"
          label="Inseam Length"
          subtitle="Crotch point down to ankle floor"
          icon={Compass}
          minVal={60}
          maxVal={105}
          step={0.5}
          description="Measured from inner leg fork straight down to hem."
        />
      </div>

      {/* Drape / Fit Preference Selection */}
      <div className="fit-preferences-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Garment Drape & Fit Preference
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--state-verified-text)', fontFamily: 'var(--font-mono)' }}>
            Layer 1 Styling Anchor
          </span>
        </div>
        <div className="tag-options">
          {fitPreferences.map(pref => (
            <button
              key={pref.id}
              className={`tag-btn ${activeProfile.fitPreference === pref.id ? 'active' : ''}`}
              onClick={() => updateFitPreference(pref.id)}
            >
              {pref.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Workflow Action Bar matching layout: Review Profile & Continue */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(31, 31, 43, 0.9), rgba(20, 20, 28, 0.9))',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-accent)',
          marginTop: '8px',
          boxShadow: 'var(--shadow-gold)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: isFullyVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(224, 192, 151, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isFullyVerified ? 'var(--state-verified-text)' : 'var(--gold-primary)'
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.94rem' }}>
              {isFullyVerified ? '✓ Body Profile Fully Verified' : `${verifiedCount}/6 Dimensions Verified`}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Ready for high-precision virtual draping
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              handleVerifyAll();
            }}
          >
            <CheckCircle2 size={14} />
            <span>✓ Review & Verify All</span>
          </button>

          <button 
            type="button"
            className="btn btn-primary"
            style={{ padding: '8px 22px', fontSize: '0.9rem', letterSpacing: '0.04em' }}
            onClick={() => {
              handleVerifyAll();
              if (onContinue) onContinue();
            }}
          >
            <span>CONTINUE →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
