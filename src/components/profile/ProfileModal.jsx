import React, { useState } from 'react';
import { 
  X, 
  User, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Check, 
  CheckCircle2, 
  HardDrive 
} from 'lucide-react';
import { useBodyProfile } from '../../context/BodyProfileContext';

export const ProfileModal = ({ isOpen, onClose }) => {
  const { 
    profiles, 
    activeProfileId, 
    setActiveProfileId, 
    createNewProfile, 
    deleteProfile, 
    exportProfileJson, 
    importProfileJson 
  } = useBodyProfile();

  const [newProfileName, setNewProfileName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (newProfileName.trim()) {
      createNewProfile(newProfileName.trim());
      setNewProfileName('');
      setShowAddForm(false);
    }
  };

  const handleFileImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const ok = importProfileJson(content);
        if (ok) {
          alert('Profile successfully imported!');
        } else {
          alert('Invalid JSON profile format.');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="field-icon" style={{ background: 'rgba(224, 192, 151, 0.15)', color: 'var(--gold-primary)' }}>
              <User size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>Body Profiles Manager</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Locally stored anthropometric records
              </p>
            </div>
          </div>

          <button 
            className="stepper-btn" 
            onClick={onClose}
            style={{ borderRadius: '50%', width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Profile List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {profiles.map(p => {
              const isActive = p.id === activeProfileId;
              const verifiedNum = Object.values(p.status || {}).filter(s => s === 'user_verified').length;

              return (
                <div
                  key={p.id}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: isActive ? 'rgba(224, 192, 151, 0.08)' : 'var(--bg-tertiary)',
                    border: `1px solid ${isActive ? 'var(--gold-primary)' : 'var(--border-subtle)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  onClick={() => setActiveProfileId(p.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div 
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: '#1a1a24'
                      }}
                    >
                      {p.image ? (
                        <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={20} style={{ margin: '8px' }} />
                      )}
                    </div>

                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.94rem', color: isActive ? 'var(--gold-primary)' : 'var(--text-primary)' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Height: {p.height}cm • {verifiedNum}/6 Verified
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                    {isActive ? (
                      <span className="status-badge verified" style={{ fontSize: '0.7rem' }}>
                        <Check size={12} /> Active
                      </span>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setActiveProfileId(p.id)}
                      >
                        Select
                      </button>
                    )}

                    {profiles.length > 1 && (
                      <button
                        className="stepper-btn"
                        style={{ color: '#ef4444' }}
                        onClick={() => deleteProfile(p.id)}
                        title="Delete profile"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Profile Section */}
          {showAddForm ? (
            <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                className="stepper-input"
                placeholder="Profile Name (e.g. Bespoke Tailoring)"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                style={{
                  flex: 1,
                  textAlign: 'left',
                  padding: '8px 14px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.88rem'
                }}
                autoFocus
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Save
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginBottom: '16px', justifyContent: 'center' }}
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={16} />
              <span>Create New Body Profile</span>
            </button>
          )}

          {/* Storage & Backup Notice */}
          <div 
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.76rem',
              color: 'var(--text-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HardDrive size={14} color="var(--gold-primary)" />
              <span>Profiles persist across browser sessions.</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-secondary btn-sm" 
                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                onClick={exportProfileJson}
              >
                <Download size={12} /> Export
              </button>

              <label 
                className="btn btn-secondary btn-sm" 
                style={{ padding: '4px 8px', fontSize: '0.72rem', cursor: 'pointer' }}
              >
                <Upload size={12} /> Import
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileImport} 
                  style={{ display: 'none' }} 
                />
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
