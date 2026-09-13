import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, RefreshCw, AlertCircle, Layers, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthGateway = ({ onLoginSuccess, onShowToast }) => {
  const { register, login } = useAuth();

  const [mode, setMode] = useState('register'); // 'register' | 'login'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage(null);

    if (mode === 'register') {
      if (!name || name.trim().length < 2) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!email || !email.includes('@')) {
        setErrorMessage('Please enter a valid email address (e.g. name@gmail.com).');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }

      setIsLoading(true);
      try {
        const data = await register({ name: name.trim(), email: email.trim(), password });
        if (onShowToast) {
          onShowToast(`Welcome, ${name.trim()}! Account created successfully.`);
        }
        if (onLoginSuccess) {
          onLoginSuccess(data);
        }
      } catch (err) {
        setErrorMessage(err.message || 'Registration failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Login mode
      if (!email || !email.includes('@')) {
        setErrorMessage('Please enter your email address.');
        return;
      }
      if (!password) {
        setErrorMessage('Please enter your password.');
        return;
      }

      setIsLoading(true);
      try {
        const data = await login({ email: email.trim(), password });
        if (onShowToast) {
          onShowToast(`Welcome back, ${data.profile?.name || data.user?.email}!`);
        }
        if (onLoginSuccess) {
          onLoginSuccess(data);
        }
      } catch (err) {
        setErrorMessage(err.message || 'Invalid email or password.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="auth-gateway-container">
      <div className="auth-card" style={{ maxWidth: '440px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <div 
            style={{ 
              width: 52, 
              height: 52, 
              borderRadius: '50%', 
              background: 'rgba(224, 192, 151, 0.12)', 
              border: '1px solid var(--gold-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--gold-primary)',
              boxShadow: '0 0 18px rgba(224, 192, 151, 0.25)'
            }}
          >
            <Layers size={26} />
          </div>

          <h2 className="shimmer-gold-text" style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', margin: 0 }}>
            FITROOM
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {mode === 'register' ? 'Register New Account' : 'Member Sign In'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div 
          style={{ 
            display: 'flex', 
            background: 'var(--bg-tertiary)', 
            borderRadius: 'var(--radius-md)', 
            padding: '4px',
            border: '1px solid var(--border-medium)',
            gap: '4px'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: mode === 'register' ? 'var(--gold-primary)' : 'transparent',
              color: mode === 'register' ? '#000000' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.82rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              background: mode === 'login' ? 'var(--gold-primary)' : 'transparent',
              color: mode === 'login' ? '#000000' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.82rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Sign In
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div 
            style={{ 
              padding: '10px 14px', 
              borderRadius: 'var(--radius-md)', 
              background: 'rgba(239, 68, 68, 0.12)', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Full Name Field (Register Mode Only) */}
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Your Name *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="e.g. Aruna"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus={mode === 'register'}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-medium)',
                    color: 'var(--text-primary)',
                    fontSize: '0.94rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          {/* Email / Gmail Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Email / Gmail Address *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus={mode === 'login'}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.94rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Password *
              </label>
              {mode === 'register' && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Min 6 characters</span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '0.94rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password.trim() || (mode === 'register' && !name.trim())}
            className="btn btn-primary"
            style={{ padding: '14px', justifyContent: 'center', fontSize: '0.94rem', marginTop: '4px' }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>{mode === 'register' ? 'Creating Account...' : 'Signing In...'}</span>
              </>
            ) : (
              <>
                <span>{mode === 'register' ? 'Register & Enter FitRoom' : 'Sign In to FitRoom'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {mode === 'register' ? (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--gold-primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              New to FitRoom?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--gold-primary)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Register with Name
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
