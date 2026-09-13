import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('fitroom_token'));
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Validate active session token on startup
  const checkSession = async (currentToken) => {
    if (!currentToken) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          setHasProfile(data.has_profile);
          setUserProfile(data.profile);
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch (err) {
      console.error('Session check failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSession(token);
  }, []);

  const sendOtp = async (phoneNumber) => {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.error || 'Failed to dispatch verification code.');
    }
    return data;
  };

  const resendOtp = async (phoneNumber) => {
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.error || 'Could not resend code.');
    }
    return data;
  };

  const verifyOtp = async (phoneNumber, otpCode, fullName = null) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone_number: phoneNumber, 
        otp_code: otpCode,
        name: fullName 
      })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.error || 'Invalid verification code.');
    }

    if (data.token) {
      localStorage.setItem('fitroom_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setHasProfile(data.has_profile || true);
      setUserProfile(data.profile);
    }
    return data;
  };

  const register = async ({ name, email, password }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.error || 'Registration failed.');
    }

    if (data.token) {
      localStorage.setItem('fitroom_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setHasProfile(data.has_profile || true);
      setUserProfile(data.profile);
    }
    return data;
  };

  const login = async ({ email, password }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.error || 'Invalid email or password.');
    }

    if (data.token) {
      localStorage.setItem('fitroom_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setHasProfile(data.has_profile || true);
      setUserProfile(data.profile);
    }
    return data;
  };

  const saveProfile = async (profileData) => {
    if (!token) throw new Error('Not authenticated.');
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profileData)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.error || 'Failed to save profile.');
    }

    if (data.profile) {
      setUserProfile(data.profile);
      setHasProfile(true);
    }
    return data;
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('fitroom_token');
      setToken(null);
      setUser(null);
      setUserProfile(null);
      setHasProfile(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        userProfile,
        hasProfile,
        isAuthenticated: !!token && !!user,
        isLoading,
        register,
        login,
        saveProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
