import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Minus, 
  Plus, 
  Check, 
  RotateCcw, 
  Info 
} from 'lucide-react';
import { useBodyProfile } from '../../context/BodyProfileContext';
import { cmToInches } from '../../services/estimationEngine';

export const MeasurementFieldCard = ({
  fieldKey,
  label,
  subtitle,
  icon: Icon,
  minVal = 40,
  maxVal = 160,
  step = 0.5,
  description
}) => {
  const { 
    activeProfile, 
    updateMeasurement, 
    toggleVerificationStatus, 
    unit, 
    getDisplayValue 
  } = useBodyProfile();

  const currentValueInCm = activeProfile.measurements[fieldKey] || 0;
  const status = activeProfile.status[fieldKey] || 'ai_estimated';
  const confidence = activeProfile.confidences?.[fieldKey] || 90;
  const originalAiCm = activeProfile.originalAiEstimates?.[fieldKey] || currentValueInCm;

  const isVerified = status === 'user_verified';
  const displayVal = getDisplayValue(currentValueInCm);
  
  // Calculate variance from original AI estimate
  const diffInCm = Number((currentValueInCm - originalAiCm).toFixed(1));
  const hasModified = Math.abs(diffInCm) >= 0.2;

  const handleValueChange = (newDisplayVal) => {
    const clamped = Math.max(
      unit === 'in' ? cmToInches(minVal) : minVal, 
      Math.min(unit === 'in' ? cmToInches(maxVal) : maxVal, Number(newDisplayVal))
    );
    updateMeasurement(fieldKey, clamped, true); // Auto-verify upon manual edit
  };

  const increment = () => {
    const delta = unit === 'in' ? 0.5 : 1.0;
    handleValueChange(displayVal + delta);
  };

  const decrement = () => {
    const delta = unit === 'in' ? 0.5 : 1.0;
    handleValueChange(displayVal - delta);
  };

  return (
    <div className={`field-card ${isVerified ? 'is-verified' : 'is-ai'}`}>
      {/* Header with Title and AI/Verified Badge */}
      <div className="field-header">
        <div className="field-title-wrap">
          <div className="field-icon">
            <Icon size={16} />
          </div>
          <div>
            <div className="field-label">{label}</div>
            <div className="field-subtitle">{subtitle}</div>
          </div>
        </div>

        {/* State Badge */}
        {isVerified ? (
          <span className="status-badge verified" title="Verified by user">
            <CheckCircle2 size={12} />
            <span>Verified</span>
          </span>
        ) : (
          <span className="status-badge ai" title={`AI Confidence: ${confidence}%`}>
            <Sparkles size={12} />
            <span>AI Est. ({confidence}%)</span>
          </span>
        )}
      </div>

      {/* Control Stepper and Display */}
      <div className="field-control-row">
        <div className="stepper-group">
          <button 
            className="stepper-btn" 
            onClick={decrement}
            aria-label={`Decrease ${label}`}
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            className="stepper-input"
            value={displayVal}
            onChange={(e) => handleValueChange(e.target.value)}
            step={step}
            aria-label={`${label} value`}
          />
          <button 
            className="stepper-btn" 
            onClick={increment}
            aria-label={`Increase ${label}`}
          >
            <Plus size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700 }}>
            {displayVal}
          </span>
          <span className="field-unit-label">{unit}</span>
        </div>
      </div>

      {/* Fine-Tuning Range Slider */}
      <div className="field-slider-wrap">
        <input
          type="range"
          className="custom-range"
          min={unit === 'in' ? cmToInches(minVal) : minVal}
          max={unit === 'in' ? cmToInches(maxVal) : maxVal}
          step={step}
          value={displayVal}
          onChange={(e) => handleValueChange(e.target.value)}
        />
      </div>

      {/* Footer: Calibration Diff & Verify Action */}
      <div className="field-footer">
        <div>
          {hasModified ? (
            <span style={{ color: 'var(--cyan-accent)', fontFamily: 'var(--font-mono)' }}>
              {diffInCm > 0 ? `+${diffInCm}cm` : `${diffInCm}cm`} from AI
            </span>
          ) : (
            <span style={{ color: 'var(--text-dim)' }}>
              AI Baseline: {unit === 'in' ? cmToInches(originalAiCm) : originalAiCm}{unit}
            </span>
          )}
        </div>

        <button
          className={`verify-toggle-btn ${isVerified ? 'is-active' : ''}`}
          onClick={() => toggleVerificationStatus(fieldKey)}
          title={isVerified ? 'Mark as unverified AI estimate' : 'Confirm measurement is accurate'}
        >
          {isVerified ? (
            <>
              <Check size={13} />
              <span>Verified</span>
            </>
          ) : (
            <>
              <span>Verify Value</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
