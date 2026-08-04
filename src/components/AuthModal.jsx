import React, { useState } from 'react';
import { User, Lock, LogIn, UserPlus, AlertCircle, ShieldCheck } from 'lucide-react';
import { loginUserAPI, registerUserAPI } from '../utils/api';
import { saveUsers, getUsers } from '../utils/storage';

export default function AuthModal({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // Login State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginUsername.trim() || !loginPassword) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await loginUserAPI(loginUsername, loginPassword);
      if (res && res.success) {
        // Cache user in localStorage for active session
        localStorage.setItem('cashtracker_active_user', res.user.id);
        const currentUsers = getUsers();
        if (!currentUsers.some((u) => u.id === res.user.id)) {
          currentUsers.push(res.user);
          saveUsers(currentUsers);
        }
        onAuthSuccess(res.user);
      } else {
        setError(res ? res.error : 'Invalid login credentials.');
      }
    } catch (err) {
      setError('Failed to log in. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!regName.trim() || !regUsername.trim() || !regPassword) {
      setError('Please complete all required fields.');
      return;
    }
    if (regPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await registerUserAPI({
        name: regName,
        username: regUsername,
        password: regPassword,
      });
      if (res && res.success) {
        // Cache user in localStorage for active session
        localStorage.setItem('cashtracker_active_user', res.user.id);
        const currentUsers = getUsers();
        if (!currentUsers.some((u) => u.id === res.user.id)) {
          currentUsers.push(res.user);
          saveUsers(currentUsers);
        }
        onAuthSuccess(res.user);
      } else {
        setError(res ? res.error : 'Registration failed.');
      }
    } catch (err) {
      setError('Failed to register. Please check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000 }}>
      <div className="modal-content glass-card" style={{ maxWidth: '440px', width: '92%', padding: '1.75rem' }}>
        
        {/* Header Icon */}
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          margin: '0 auto 1rem auto',
          boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
        }}>
          <ShieldCheck size={28} />
        </div>

        <h2 style={{ fontSize: '1.35rem', fontWeight: '700', textAlign: 'center', marginBottom: '0.25rem' }}>
          {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
        </h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.25rem' }}>
          {mode === 'login'
            ? 'Sign in to access your financial records across devices'
            : 'Register your account to sync cash tracker data with MongoDB Atlas'}
        </p>

        {/* Auth Mode Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-input)',
          borderRadius: '10px',
          padding: '0.25rem',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => { setMode('login'); setError(''); }}
            className={`btn btn-sm ${mode === 'login' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, borderRadius: '8px', padding: '0.5rem' }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); }}
            className={`btn btn-sm ${mode === 'register' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1, borderRadius: '8px', padding: '0.5rem' }}
          >
            <UserPlus size={15} />
            <span>Register</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 0.875rem',
            borderRadius: '8px',
            background: 'var(--accent-dr-bg)',
            border: '1px solid var(--accent-dr-border)',
            color: 'var(--accent-dr)',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <User size={14} />
                <span>Username</span>
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="form-control"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Lock size={14} />
                <span>Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Signing In...' : 'Sign In to Dashboard'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Varun Akshay"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Desired Username</label>
              <input
                type="text"
                placeholder="e.g. varunakshay"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                className="form-control"
                required
              />
            </div>

            <div className="grid-2" style={{ gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="form-control"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="form-control"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-success"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9375rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Creating Account...' : 'Create Account & Login'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
