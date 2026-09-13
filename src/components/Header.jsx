import React, { useState } from 'react';
import { 
  Sparkles, 
  User, 
  Download, 
  Upload, 
  Layers, 
  ChevronDown, 
  CheckCircle2, 
  SlidersHorizontal,
  LogOut 
} from 'lucide-react';
import { useBodyProfile } from '../context/BodyProfileContext';
import { useAuth } from '../context/AuthContext';

export const Header = ({ onOpenProfileModal, activeLayer = 1, onSelectLayer }) => {
  const { 
    activeProfile, 
    profiles, 
    setActiveProfileId, 
    unit, 
    setUnit, 
    exportProfileJson, 
    importProfileJson 
  } = useBodyProfile();

  const { user, userProfile, logout, isAuthenticated } = useAuth();

  const [showDropdown, setShowDropdown] = useState(false);

  const verifiedCount = Object.values(activeProfile.status || {}).filter(s => s === 'user_verified').length;
  const totalCount = 6;
  const isFullyVerified = verifiedCount === totalCount;

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const success = importProfileJson(content);
        if (success) {
          alert('Profile successfully imported!');
        } else {
          alert('Could not parse profile JSON file.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="fitroom-header">
      <div className="header-container">
        {/* Brand Identity */}
        <div className="brand-group">
          <div className="brand-logo-icon">
            <Layers size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-title">FitRoom</span>
              <span className="brand-badge">Layer {activeLayer}</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
              AI Virtual Try-On Platform
            </p>
          </div>
        </div>

        {/* Layer 1 vs Layer 2 Navigation Switcher */}
        <div 
          style={{
            display: 'flex',
            background: 'var(--bg-tertiary)',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <button
            type="button"
            onClick={() => onSelectLayer && onSelectLayer(1)}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: activeLayer === 1 ? 'rgba(224, 192, 151, 0.18)' : 'transparent',
              color: activeLayer === 1 ? 'var(--gold-primary)' : 'var(--text-secondary)',
              fontWeight: activeLayer === 1 ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all var(--transition-fast)'
            }}
          >
            <span>Layer 1: Body Profile</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectLayer && onSelectLayer(2)}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: activeLayer === 2 ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
              color: activeLayer === 2 ? 'var(--cyan-accent)' : 'var(--text-secondary)',
              fontWeight: activeLayer === 2 ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all var(--transition-fast)'
            }}
          >
            <span>Layer 2: Choose Garment</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectLayer && onSelectLayer(3)}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: activeLayer === 3 ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
              color: activeLayer === 3 ? 'var(--state-verified-text)' : 'var(--text-secondary)',
              fontWeight: activeLayer === 3 ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all var(--transition-fast)'
            }}
          >
            <span>Layer 3: Fit Engine</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectLayer && onSelectLayer(4)}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: activeLayer === 4 ? 'rgba(224, 192, 151, 0.22)' : 'transparent',
              color: activeLayer === 4 ? 'var(--gold-primary)' : 'var(--text-secondary)',
              fontWeight: activeLayer === 4 ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all var(--transition-fast)'
            }}
          >
            <span>Layer 4: Virtual Try-On</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectLayer && onSelectLayer(5)}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              background: activeLayer === 5 ? 'rgba(56, 189, 248, 0.22)' : 'transparent',
              color: activeLayer === 5 ? 'var(--cyan-accent)' : 'var(--text-secondary)',
              fontWeight: activeLayer === 5 ? 700 : 500,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all var(--transition-fast)'
            }}
          >
            <span>Layer 5: Lookbook Dossier</span>
          </button>
        </div>

        {/* Header Right Actions */}
        <div className="header-actions">
          {/* Unit Toggle Switch */}
          <div className="unit-toggle" title="Switch measurement units">
            <button
              className={`unit-btn ${unit === 'cm' ? 'active' : ''}`}
              onClick={() => setUnit('cm')}
            >
              CM
            </button>
            <button
              className={`unit-btn ${unit === 'in' ? 'active' : ''}`}
              onClick={() => setUnit('in')}
            >
              IN
            </button>
          </div>

          {/* Verification Status Pill */}
          <div 
            className={`status-badge ${isFullyVerified ? 'verified' : 'ai'}`}
            style={{ padding: '6px 12px', cursor: 'pointer' }}
            onClick={onOpenProfileModal}
            title={`${verifiedCount} of ${totalCount} measurements verified`}
          >
            {isFullyVerified ? (
              <>
                <CheckCircle2 size={14} />
                <span>All {totalCount} Dimensions Verified</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>{verifiedCount}/{totalCount} Verified</span>
              </>
            )}
          </div>

          {/* Profile Switcher Menu */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ gap: '6px' }}
            >
              <User size={15} color="var(--gold-primary)" />
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeProfile.name}
              </span>
              <ChevronDown size={14} />
            </button>

            {showDropdown && (
              <div 
                className="glass-panel"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '8px',
                  width: '240px',
                  zIndex: 200,
                  padding: '8px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-medium)'
                }}
              >
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '6px 8px' }}>
                  Saved Profiles ({profiles.length})
                </div>
                {profiles.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveProfileId(p.id);
                      setShowDropdown(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: p.id === activeProfile.id ? 'rgba(224, 192, 151, 0.12)' : 'transparent',
                      color: p.id === activeProfile.id ? 'var(--gold-primary)' : 'var(--text-primary)'
                    }}
                  >
                    <span>{p.name}</span>
                    {p.id === activeProfile.id && <CheckCircle2 size={14} />}
                  </div>
                ))}

                <hr style={{ borderColor: 'var(--border-subtle)', margin: '6px 0' }} />

                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', justifyContent: 'flex-start', border: 'none' }}
                  onClick={() => {
                    setShowDropdown(false);
                    onOpenProfileModal();
                  }}
                >
                  <SlidersHorizontal size={14} />
                  <span>Manage Profiles...</span>
                </button>

                {isAuthenticated && (
                  <>
                    <hr style={{ borderColor: 'var(--border-subtle)', margin: '6px 0' }} />
                    <div style={{ padding: '4px 8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Authenticated: {user?.phone_number}
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', justifyContent: 'flex-start', border: 'none', color: '#f87171' }}
                      onClick={() => {
                        setShowDropdown(false);
                        logout();
                      }}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Export / Import */}
          <button 
            className="btn btn-secondary btn-sm"
            onClick={exportProfileJson}
            title="Export verified profile as JSON"
          >
            <Download size={14} />
            <span style={{ display: 'none' }}>Export</span>
          </button>

          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }} title="Import profile from JSON">
            <Upload size={14} />
            <input 
              type="file" 
              accept=".json" 
              onChange={handleFileImport} 
              style={{ display: 'none' }} 
            />
          </label>
        </div>
      </div>
    </header>
  );
};
