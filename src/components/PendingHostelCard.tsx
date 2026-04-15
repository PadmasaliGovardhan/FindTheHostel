'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

interface PendingHostelCardProps {
  hostel: {
    id: string;
    name: string;
    location: string;
    distance_from_klu_km: number;
    created_at: string;
  };
  confirmationCount: number;
  userHasConfirmed: boolean;
  onConfirm: () => void;
}

export default function PendingHostelCard({ hostel, confirmationCount, userHasConfirmed, onConfirm }: PendingHostelCardProps) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(userHasConfirmed);
  const [count, setCount] = useState(confirmationCount);
  const supabase = createClient();

  const handleConfirm = async () => {
    if (!user || confirmed) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from('hostel_confirmations')
        .insert({ hostel_id: hostel.id, user_id: user.id });

      if (error) throw error;

      setConfirmed(true);
      setCount((c) => c + 1);
      addToast('Hostel confirmed! Thank you.', 'success');
      onConfirm();
    } catch {
      addToast('Failed to confirm hostel', 'error');
    } finally {
      setLoading(false);
    }
  };

  const progress = Math.min((count / 3) * 100, 100);

  return (
    <div className="card pending-card" id={`pending-hostel-${hostel.id}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
        <div>
          <h3 className="hostel-card-name">{hostel.name}</h3>
          <div className="hostel-card-location" style={{ marginTop: 'var(--space-2)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1C4.79 1 3 2.79 3 5c0 3.5 4 8 4 8s4-4.5 4-8c0-2.21-1.79-4-4-4zm0 5.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="currentColor"/>
            </svg>
            <span>{hostel.location}</span>
            <span>•</span>
            <span>{hostel.distance_from_klu_km} km from campus</span>
          </div>
        </div>
        <span className="pending-badge">⏳ Pending</span>
      </div>

      <div className="pending-progress">
        <div className="pending-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="pending-confirmations">
          {count}/3 confirmations
        </span>
        {user && !confirmed && (
          <button
            className="btn btn-primary btn-sm"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Confirming...' : '✓ I confirm this hostel exists'}
          </button>
        )}
        {confirmed && (
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-success)', fontWeight: 500 }}>
            ✓ You confirmed
          </span>
        )}
      </div>
    </div>
  );
}
