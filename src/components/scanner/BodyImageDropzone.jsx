import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Scan, 
  RotateCcw, 
  Check, 
  Maximize2 
} from 'lucide-react';
import { useBodyProfile } from '../../context/BodyProfileContext';

export const BodyImageDropzone = () => {
  const { 
    activeProfile, 
    setCustomImage, 
    isScanning, 
    scanStep, 
    unit, 
    getDisplayValue 
  } = useBodyProfile();

  const [isDragging, setIsDragging] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setCustomImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Landmark labels with anatomical coordinates
  const landmarkPins = [
    { 
      key: 'shoulder', 
      name: 'Shoulder', 
      pos: { x: 50, y: 23 }, 
      value: `${getDisplayValue(activeProfile.measurements.shoulder)} ${unit}` 
    },
    { 
      key: 'chest', 
      name: 'Chest / Bust', 
      pos: { x: 50, y: 32 }, 
      value: `${getDisplayValue(activeProfile.measurements.chest)} ${unit}` 
    },
    { 
      key: 'waist', 
      name: 'Natural Waist', 
      pos: { x: 50, y: 42 }, 
      value: `${getDisplayValue(activeProfile.measurements.waist)} ${unit}` 
    },
    { 
      key: 'hip', 
      name: 'Hip Line', 
      pos: { x: 50, y: 51 }, 
      value: `${getDisplayValue(activeProfile.measurements.hip)} ${unit}` 
    },
    { 
      key: 'armLength', 
      name: 'Arm Length', 
      pos: { x: 74, y: 40 }, 
      value: `${getDisplayValue(activeProfile.measurements.armLength)} ${unit}` 
    },
    { 
      key: 'inseam', 
      name: 'Inseam', 
      pos: { x: 50, y: 72 }, 
      value: `${getDisplayValue(activeProfile.measurements.inseam)} ${unit}` 
    }
  ];

  return (
    <div className="studio-container">
      {/* Studio Viewport */}
      <div 
        className={`scanner-viewport ${isDragging ? 'is-dragging' : ''} ${activeProfile.image ? 'has-image' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {activeProfile.image ? (
          <>
            {/* Full Body Image */}
            <img 
              src={activeProfile.image} 
              alt="Full Body Capture" 
              className="preview-image-canvas"
            />

            {/* Scanning Laser Beam & Mesh Overlay */}
            {isScanning && (
              <div className="scan-laser-overlay">
                <div className="scan-grid-mesh" />
                <div className="scan-laser-line" />
                <div 
                  style={{
                    position: 'absolute',
                    bottom: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.85)',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: 'var(--gold-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    zIndex: 30
                  }}
                >
                  <Sparkles size={16} className="animate-spin" />
                  <span>
                    {scanStep === 'detecting' && 'Detecting human pose skeleton...'}
                    {scanStep === 'segmenting' && 'Extracting silhouette boundaries...'}
                    {scanStep === 'extracting' && 'Computing anthropometric measurements...'}
                  </span>
                </div>
              </div>
            )}

            {/* Interactive Anatomical Landmark Pins */}
            {!isScanning && showLandmarks && landmarkPins.map((pin) => {
              const isVerified = activeProfile.status[pin.key] === 'user_verified';
              return (
                <div
                  key={pin.key}
                  className={`landmark-badge ${isVerified ? 'verified' : 'ai'}`}
                  style={{ top: `${pin.pos.y}%`, left: `${pin.pos.x}%` }}
                  title={`${pin.name}: ${pin.value} (${isVerified ? 'User Verified' : 'AI Estimated'})`}
                >
                  <span className="landmark-dot" />
                  <span>{pin.name.split(' ')[0]}: {pin.value}</span>
                </div>
              );
            })}

            {/* Controls Bar over image */}
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: 14,
                right: 14,
                display: 'flex',
                justifyContent: 'space-between',
                pointerEvents: 'auto',
                zIndex: 25
              }}
            >
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 10px', backdropFilter: 'blur(10px)', background: 'rgba(17, 17, 24, 0.7)' }}
                  onClick={() => setShowLandmarks(!showLandmarks)}
                  title={showLandmarks ? 'Hide Landmark Pins' : 'Show Landmark Pins'}
                >
                  {showLandmarks ? <Eye size={14} /> : <EyeOff size={14} />}
                  <span style={{ fontSize: '0.72rem' }}>{showLandmarks ? 'Pins On' : 'Pins Off'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 10px', backdropFilter: 'blur(10px)', background: 'rgba(17, 17, 24, 0.7)' }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload New Full Body Image"
                >
                  <Upload size={14} />
                  <span style={{ fontSize: '0.72rem' }}>Upload</span>
                </button>
              </div>
            </div>

            {/* Bottom Telemetry Status */}
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                right: 12,
                padding: '8px 12px',
                background: 'rgba(10, 10, 14, 0.85)',
                backdropFilter: 'blur(12px)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scan size={14} color="var(--gold-primary)" />
                <span style={{ color: 'var(--text-secondary)' }}>
                  {activeProfile.isCustomImage ? 'Custom User Pose' : 'Studio Calibration Reference'}
                </span>
              </div>
              <span style={{ color: 'var(--state-verified-text)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={12} /> 94% Mesh Alignment
              </span>
            </div>
          </>
        ) : (
          /* Empty Upload State */
          <div style={{ padding: '36px', textAlign: 'center', maxWidth: '320px' }}>
            <div 
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(224, 192, 151, 0.1)',
                border: '1px solid rgba(224, 192, 151, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'var(--gold-primary)'
              }}
            >
              <Camera size={26} />
            </div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Upload Full Body Photo</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Drag & drop your full-length photo to extract measurements and create your body profile.
            </p>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} /> Browse Image
            </button>
          </div>
        )}

        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          onChange={handleFileInputChange} 
          style={{ display: 'none' }} 
        />
      </div>
    </div>
  );
};
