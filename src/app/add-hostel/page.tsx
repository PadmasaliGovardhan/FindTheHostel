'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import Link from 'next/link';

export default function AddHostelPage() {
  const { user, loading: authLoading } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [distance, setDistance] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const dist = parseFloat(distance);
    if (isNaN(dist) || dist < 0) {
      addToast('Please enter a valid distance', 'warning');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('hostels')
        .insert({
          name: name.trim(),
          location: location.trim(),
          distance_from_klu_km: dist,
          submitted_by: user.id,
          status: 'pending',
        });

      if (error) throw error;

      setSubmitted(true);
      addToast('Hostel submitted successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to submit hostel', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="page-container page-loading">
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <span className="empty-state-icon">🔒</span>
          <h3 className="empty-state-title">Sign in Required</h3>
          <p className="empty-state-description">
            Please sign in with your @kluniversity.in Microsoft account to add a hostel.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="page-container">
        <div className="add-hostel-page" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>✅</div>
          <h1 className="add-hostel-title" style={{ textAlign: 'center' }}>Hostel Submitted!</h1>
          <p style={{
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-8)',
            fontSize: 'var(--font-size-base)',
            lineHeight: 'var(--line-height-relaxed)',
          }}>
            Your hostel has been submitted and is now in <strong>pending</strong> status.
            It will appear publicly once <strong>3 students</strong> confirm it exists.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
            <Link href="/" className="btn btn-primary">
              Back to Home
            </Link>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSubmitted(false);
                setName('');
                setLocation('');
                setDistance('');
              }}
            >
              Add Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="add-hostel-page">
        <h1 className="add-hostel-title">Add a New Hostel</h1>
        <p className="add-hostel-subtitle">
          Help fellow KL students by adding a hostel near campus. It will be visible after 3 students confirm it exists.
        </p>

        <form className="review-form" onSubmit={handleSubmit} id="add-hostel-form">
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="hostel-name">
              Hostel Name
            </label>
            <input
              id="hostel-name"
              className="form-input"
              type="text"
              placeholder="e.g., Sri Sai Boys Hostel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="hostel-location">
              Location / Address
            </label>
            <input
              id="hostel-location"
              className="form-input"
              type="text"
              placeholder="e.g., Vaddeswaram, near Green Fields Layout"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="hostel-distance">
              Distance from KL University (km)
            </label>
            <input
              id="hostel-distance"
              className="form-input"
              type="number"
              step="0.1"
              min="0"
              max="50"
              placeholder="e.g., 2.5"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              required
            />
            <span className="form-hint">Enter the approximate walking/driving distance in kilometers</span>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%' }}>
            {loading ? (
              <><span className="spinner" /> Submitting...</>
            ) : (
              'Submit Hostel for Verification'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
