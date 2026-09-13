import React from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';

export const Toast = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="toast-container">
      <div className="toast" style={{ borderColor: 'var(--border-accent)' }}>
        <CheckCircle2 size={18} color="var(--state-verified-text)" />
        <span>{message}</span>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '8px' }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
