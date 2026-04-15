'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthButton() {
  const { user, loading, signInWithEmail } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (loading) {
    return <div className="skeleton" style={{ width: 120, height: 36 }} />;
  }

  if (user) {
    return null; // User menu handles signed-in state
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMsg('');

    const result = await signInWithEmail(email.trim().toLowerCase());

    if (result.error) {
      setStatus('error');
      setErrorMsg(result.error);
    } else {
      setStatus('sent');
    }
  };

  if (status === 'sent') {
    return (
      <div className="auth-sent-panel" id="auth-sent-panel">
        <div className="auth-sent-badge" id="auth-sent-badge">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M1 4l7 4 7-4M1 4v8a1 1 0 001 1h12a1 1 0 001-1V4M1 4a1 1 0 011-1h12a1 1 0 011 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Magic link sent to <strong>{email}</strong></span>
        </div>
        <p className="auth-sent-hint">
          ⚠️ Open the link in <strong>this same browser</strong> to complete sign-in.
        </p>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={() => { setStatus('idle'); setShowForm(false); setEmail(''); }}
          style={{ fontSize: 'var(--font-size-xs)' }}
        >
          Didn&apos;t get it? Resend
        </button>
      </div>
    );
  }

  if (!showForm) {
    return (
      <button
        className="btn btn-microsoft"
        onClick={() => setShowForm(true)}
        id="sign-in-button"
      >
        <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
          <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
          <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
          <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
          <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
        </svg>
        Sign in with KLU Email
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-email-form" id="auth-email-form">
      <input
        type="email"
        placeholder="yourname@kluniversity.in"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="auth-email-input"
        autoFocus
        required
        id="auth-email-input"
      />
      <button
        type="submit"
        className="btn btn-microsoft btn-sm"
        disabled={status === 'loading' || !email.trim()}
      >
        {status === 'loading' ? (
          <><span className="spinner" style={{ width: 14, height: 14 }} /> Sending...</>
        ) : (
          'Send Link'
        )}
      </button>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => { setShowForm(false); setEmail(''); setStatus('idle'); setErrorMsg(''); }}
        style={{ padding: 'var(--space-2)' }}
      >
        ✕
      </button>
      {status === 'error' && (
        <div className="auth-email-error">{errorMsg}</div>
      )}
    </form>
  );
}
