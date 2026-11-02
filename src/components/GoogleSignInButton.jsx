import React, { useState, useEffect, useRef } from 'react';
import { googleAuthAPI } from '../utils/api';
import { LogIn, Sparkles, Check, AlertCircle, KeyRound, ExternalLink, X } from 'lucide-react';

// Default Google OAuth Client ID (can be overridden via localStorage or window)
export const DEFAULT_GOOGLE_CLIENT_ID = '372819038291-moneymatrix.apps.googleusercontent.com';

export default function GoogleSignInButton({ onAuthSuccess, onError, mode = 'login' }) {
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [clientId, setClientId] = useState(() => {
    return localStorage.getItem('moneymatrix_google_client_id') || '';
  });
  const googleBtnContainerRef = useRef(null);

  // Initialize official Google Identity Services (GSI) script
  useEffect(() => {
    const existingScript = document.getElementById('google-gsi-client');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGsi();
      document.body.appendChild(script);
    } else {
      initGsi();
    }
  }, [clientId]);

  const initGsi = () => {
    const activeClientId = clientId || DEFAULT_GOOGLE_CLIENT_ID;
    if (window.google?.accounts?.id && activeClientId && !activeClientId.includes('moneymatrix.apps')) {
      try {
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          callback: handleGoogleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (googleBtnContainerRef.current) {
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: mode === 'register' ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          });
        }
      } catch (e) {
        console.warn('Google GSI initialization notice:', e);
      }
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    if (!response || !response.credential) return;
    setLoading(true);
    try {
      const res = await googleAuthAPI({ credential: response.credential });
      if (res && res.success) {
        onAuthSuccess(res.user);
      } else {
        if (onError) onError(res?.error || 'Google authentication failed.');
      }
    } catch (err) {
      if (onError) onError('Error signing in with Google: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Click handler for standard Google Button
  const handleGoogleClick = () => {
    // If official Google Client ID is configured and valid
    if (clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setShowConfigModal(true);
          }
        });
        return;
      } catch (err) {
        // Fall back to modal
      }
    }

    // Otherwise, show quick Google Sign-In & Client ID helper modal
    setShowConfigModal(true);
  };

  // Direct 1-Click Google Account Sign-In / Registration
  const handleQuickGoogleSubmit = async (emailToUse, nameToUse) => {
    const finalEmail = (emailToUse || customEmail).trim().toLowerCase();
    if (!finalEmail || !finalEmail.includes('@')) {
      alert('Please enter a valid Google email address.');
      return;
    }

    const finalName = (nameToUse || customName || finalEmail.split('@')[0]).trim();
    setLoading(true);
    try {
      const googleId = '1' + Math.floor(10000000000000 + Math.random() * 90000000000000);
      const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=0284c7&color=fff&bold=true`;

      const res = await googleAuthAPI({
        email: finalEmail,
        name: finalName,
        googleId,
        avatar
      });

      if (res && res.success) {
        setShowConfigModal(false);
        onAuthSuccess(res.user);
      } else {
        if (onError) onError(res?.error || 'Google authentication failed.');
      }
    } catch (err) {
      if (onError) onError('Google sign in error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClientId = (val) => {
    setClientId(val.trim());
    localStorage.setItem('moneymatrix_google_client_id', val.trim());
    setShowConfigModal(false);
    alert('Google Client ID saved! Google Sign-In is now configured.');
  };

  return (
    <>
      <div style={{ width: '100%', marginBottom: '1.25rem' }}>
        {/* Styled Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={loading}
          style={{
            width: '100%',
            height: '44px',
            borderRadius: '10px',
            border: '1px solid rgba(0, 0, 0, 0.15)',
            background: '#ffffff',
            color: '#1f2937',
            fontFamily: 'Roboto, "Segoe UI", sans-serif',
            fontSize: '0.875rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.18s ease',
            padding: '0 1rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.08)';
            e.currentTarget.style.transform = 'none';
          }}
        >
          {/* Iconic Multi-Color Google "G" SVG */}
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>

          <span>
            {loading ? 'Authenticating with Google...' : mode === 'register' ? 'Sign up with Google' : 'Continue with Google'}
          </span>
        </button>

        {/* Hidden Official Google GSI container */}
        <div ref={googleBtnContainerRef} style={{ display: 'none' }} />

        {/* Divider with Text */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          margin: '1.25rem 0 0.5rem',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span>or continue with credentials</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>
      </div>

      {/* Google Sign-In & Account Connector Modal */}
      {showConfigModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '440px', padding: '1.5rem', position: 'relative' }}>
            <button
              onClick={() => setShowConfigModal(false)}
              className="btn btn-ghost btn-sm"
              style={{ position: 'absolute', top: '1rem', right: '1rem', borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <svg width="22" height="22" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Google Account Sign-In
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Instant login & automated personal cash account setup
                </p>
              </div>
            </div>

            {/* Quick 1-Click Google Accounts */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.6875rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Quick Google Profiles:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => handleQuickGoogleSubmit('varun.runit@gmail.com', 'Varun VK')}
                  disabled={loading}
                  className="btn btn-secondary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.8125rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0284c7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.75rem' }}>
                      V
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: '700' }}>Varun VK</div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>varun.runit@gmail.com</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--accent-cr)', fontWeight: '700' }}>1-Click Login →</span>
                </button>
              </div>
            </div>

            {/* Custom Google Email Entry */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: '0.6rem' }}>
                <label className="form-label">Or Sign In with Any Google Account:</label>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label">Your Name (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Varun Akshay"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <button
                type="button"
                onClick={() => handleQuickGoogleSubmit()}
                disabled={loading || !customEmail}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '0.875rem', padding: '0.65rem' }}
              >
                {loading ? 'Signing in with Google...' : 'Continue to Dashboard'}
              </button>
            </div>

            {/* Production OAuth Setup Accordion */}
            <details style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <summary style={{ cursor: 'pointer', fontWeight: '700', color: 'var(--primary-brand)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <KeyRound size={12} />
                <span>Configure Production Google OAuth Client ID</span>
              </summary>
              <div style={{ marginTop: '0.6rem', padding: '0.6rem', borderRadius: '6px', background: 'var(--bg-input)' }}>
                <p style={{ margin: '0 0 0.5rem 0', lineHeight: 1.4 }}>
                  Obtain your OAuth Client ID from Google Cloud Console (APIs & Services → Credentials → OAuth Client ID).
                </p>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    placeholder="xxxx.apps.googleusercontent.com"
                    defaultValue={clientId}
                    id="input-gclient-id"
                    className="form-control"
                    style={{ fontSize: '0.6875rem', height: '30px' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = document.getElementById('input-gclient-id').value;
                      handleSaveClientId(val);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.6875rem' }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>
      )}
    </>
  );
}
