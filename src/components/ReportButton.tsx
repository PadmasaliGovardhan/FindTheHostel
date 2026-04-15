'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

interface ReportButtonProps {
  reviewId: string;
  hasReported: boolean;
}

export default function ReportButton({ reviewId, hasReported }: ReportButtonProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [reported, setReported] = useState(hasReported);
  const supabase = createClient();

  const handleReport = async () => {
    if (!user || reason.length < 5) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('review_reports')
        .insert({ review_id: reviewId, user_id: user.id, reason });

      if (error) {
        if (error.code === '23505') {
          addToast('You have already reported this review', 'warning');
        } else {
          throw error;
        }
      } else {
        addToast('Review reported. Thank you for helping the community.', 'success');
        setReported(true);
      }
      setShowModal(false);
      setReason('');
    } catch {
      addToast('Failed to report review', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => setShowModal(true)}
        disabled={reported}
        style={{ color: reported ? 'var(--color-text-muted)' : undefined }}
      >
        {reported ? '✓ Reported' : '🚩 Report'}
      </button>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Report Review</h3>
            <p className="modal-message">
              Help us keep the community safe. Why is this review fake or inappropriate?
            </p>
            <textarea
              className="report-textarea"
              placeholder="Describe the issue (minimum 5 characters)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="modal-actions" style={{ marginTop: 'var(--space-4)' }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleReport}
                disabled={reason.length < 5 || loading}
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
