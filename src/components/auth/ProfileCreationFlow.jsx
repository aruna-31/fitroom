import React, { useState } from 'react';
import { User, Camera, Upload, Ruler, ArrowRight, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBodyProfile } from '../../context/BodyProfileContext';

export const ProfileCreationFlow = ({ onComplete, onShowToast }) => {
  const { user, saveProfile } = useAuth();
  const { updateMeasurement, setUnit: setContextUnit } = useBodyProfile();

  const [name, setName] = useState('');
  const [height, setHeight] = useState(175);
  const [unit, setUnit] = useState('cm');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfilePhoto(event.target?.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const measurementsObj = {};
    if (chest) measurementsObj.chest = parseFloat(chest);
    if (waist) measurementsObj.waist = parseFloat(waist);
    if (hip) measurementsObj.hip = parseFloat(hip);

    try {
      const payload = {
        name: name.trim(),
        height: parseFloat(height) || 175,
        profile_photo: profilePhoto,
        measurements: measurementsObj,
        unit: unit
      };

      await saveProfile(payload);

      // Sync into BodyProfileContext
      setContextUnit(unit);
      if (chest) updateMeasurement('chest', parseFloat(chest));
      if (waist) updateMeasurement('waist', parseFloat(waist));
      if (hip) updateMeasurement('hip', parseFloat(hip));

      if (onShowToast) {
        onShowToast('Profile created and saved to PostgreSQL!');
      }

      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-gateway-container">
      <div className="auth-card" style={{ maxWidth: '540px' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div className="brand-badge" style={{ borderColor: 'var(--gold-primary)', color: 'var(--gold-primary)' }}>
            <Sparkles size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
            New User Setup
          </div>
          <h2 className="shimmer-gold-text" style={{ fontFamily: 'var(--font-display)', fontSize: '1.7rem', margin: 0 }}>
            Create Your Haute-Couture Profile
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Configure your bespoke identity for real virtual try-on and fitting.
          </p>
        </div>

        {errorMessage && (
          <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '0.8rem' }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Profile Photo Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', padding: '14px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
            <label className="profile-avatar-upload" title="Upload profile photo">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Avatar" className="profile-avatar-img" />
              ) : (
                <Camera size={26} color="var(--gold-primary)" />
              )}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
            </label>

            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Profile Silhouette / Avatar
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Tap to select or take a photo
              </div>
              <span className="status-badge" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
                {profilePhoto ? 'Photo Uploaded' : 'Optional'}
              </span>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Julian Vance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Stature / Height & Unit Toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                Height ({unit.toUpperCase()}) *
              </label>
              <input
                type="number"
                required
                min="100"
                max="250"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                Unit
              </label>
              <div className="unit-toggle" style={{ height: '45px' }}>
                <button
                  type="button"
                  className={`unit-btn ${unit === 'cm' ? 'active' : ''}`}
                  onClick={() => setUnit('cm')}
                  style={{ flex: 1 }}
                >
                  CM
                </button>
                <button
                  type="button"
                  className={`unit-btn ${unit === 'in' ? 'active' : ''}`}
                  onClick={() => setUnit('in')}
                  style={{ flex: 1 }}
                >
                  IN
                </button>
              </div>
            </div>
          </div>

          {/* Optional Baseline Measurements */}
          <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>
              Optional Baseline Dimensions (Can be calibrated in Layer 1)
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Chest ({unit})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 96"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Waist ({unit})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 80"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                  Hips ({unit})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 98"
                  value={hip}
                  onChange={(e) => setHip(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="btn btn-primary"
            style={{ padding: '14px', justifyContent: 'center', fontSize: '0.94rem' }}
          >
            {isLoading ? 'Saving to Database...' : 'Complete Profile & Enter FitRoom'}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
