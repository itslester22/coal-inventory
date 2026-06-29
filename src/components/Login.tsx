import React, { useState } from 'react';
import { Flame, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { loginUser, registerUser } from '../services/db';
import type { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isLoginMode) {
      if (!email.trim()) {
        setError('Email is required.');
        return;
      }
    } else {
      if (!username.trim()) {
        setError('Username is required.');
        return;
      }
      if (!email.trim()) {
        setError('Email is required.');
        return;
      }
    }
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      if (isLoginMode) {
        const user = await loginUser(email.trim(), password);
        if (user) {
          onLoginSuccess(user);
        } else {
          setError('Invalid email or password.');
        }
      } else {
        await registerUser(username.trim(), email.trim(), password);
        setSuccess('Account created. An admin must promote you in Firebase Console.');
        setIsLoginMode(true);
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      background: 'radial-gradient(circle at 50% 50%, rgba(255, 96, 151, 0.08) 0%, transparent 60%), #0a0b0e',
      padding: '1.5rem',
      boxSizing: 'border-box'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '2.5rem 2rem',
        borderRadius: 'var(--border-radius-lg)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5), var(--shadow-glow)',
        border: '1px solid rgba(255, 96, 151, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
        boxSizing: 'border-box'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 96, 151, 0.25)',
            boxShadow: '0 0 15px rgba(255, 96, 151, 0.2)'
          }}>
            <Flame size={28} className="logo-icon" fill="var(--color-primary)" />
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.75rem',
            letterSpacing: '1px',
            marginTop: '0.5rem',
            background: 'linear-gradient(135deg, #ffffff 60%, var(--color-primary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            ULING NI FE
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {isLoginMode ? 'Sign in to access the coal depot ledger' : 'Register a new admin operator account'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--color-danger)',
              fontSize: '0.85rem',
              lineHeight: '1.4'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--color-success)',
              fontSize: '0.85rem',
              lineHeight: '1.4'
            }}>
              {success}
            </div>
          )}

          {/* Email Input (Sign In) */}
          {isLoginMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  placeholder="admin@ulingnife.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 96, 151, 0.1)',
                    borderRadius: 'var(--border-radius-sm)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 96, 151, 0.1)'}
                />
              </div>
            </div>
          )}

          {/* Username Input (Register Only) */}
          {!isLoginMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Mail size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 96, 151, 0.1)',
                    borderRadius: 'var(--border-radius-sm)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 96, 151, 0.1)'}
                />
              </div>
            </div>
          )}

          {/* Email Input (Register Only) */}
          {!isLoginMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    border: '1px solid rgba(255, 96, 151, 0.1)',
                    borderRadius: 'var(--border-radius-sm)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 96, 151, 0.1)'}
                />
              </div>
            </div>
          )}

          {/* Password Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 2.5rem 0.75rem 2.5rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 96, 151, 0.1)',
                  borderRadius: 'var(--border-radius-sm)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 96, 151, 0.1)'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              padding: '0.85rem',
              fontSize: '0.95rem',
              fontWeight: 600,
              marginTop: '0.5rem',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            {loading ? (
              <div style={{
                width: '18px',
                height: '18px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
            ) : isLoginMode ? 'Access System' : 'Create Admin Account'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          marginTop: '0.5rem'
        }}>
          {isLoginMode ? (
            <span>
              Need a new operator account?{' '}
              <button
                onClick={() => {
                  setIsLoginMode(false);
                  setError(null);
                  setSuccess(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Register
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setIsLoginMode(true);
                  setError(null);
                  setSuccess(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: 0,
                  textDecoration: 'underline'
                }}
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
